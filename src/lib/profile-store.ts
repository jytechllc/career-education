import "server-only";

import { randomUUID } from "crypto";
import { isNotNull, sql } from "drizzle-orm";

import { db } from "./db";
import { getObjectBytes, putObject } from "./r2";
import { candidates, studentProfiles } from "./schema";
import { BEDROCK_MODEL } from "./bedrock";
import { RESUME_TYPES, extractProfile, type ExtractedProfile } from "./student-profiles";
import { readTalentsManifest, type CachedFile } from "./talents-cache";

/** Uploaded resumes live under this prefix; actions only read keys inside it. */
export const RESUME_PREFIX = "profiles/resumes/";

export const resumeKey = (fileName: string) =>
  `${RESUME_PREFIX}${randomUUID()}-${fileName.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 100)}`;

const SITE_GENDER: Record<string, string> = { 女: "女", 男: "男", Female: "女", Male: "男" };

/** Gender the student gave on their own site profile (/profile), matched by email. */
async function siteGender(email: string | null): Promise<string | null> {
  if (!email) return null;
  const rows = await db
    .select({ gender: candidates.gender })
    .from(candidates)
    .where(sql`lower(${candidates.email}) = ${email.toLowerCase()}`)
    .limit(1);

  return SITE_GENDER[rows[0]?.gender ?? ""] ?? null;
}

const FIELD_KEYS = [
  "name",
  "gender",
  "age",
  "masterSchool",
  "phdSchool",
  "specialties",
  "targetRoles",
  "visa",
  "hobbies",
] as const satisfies readonly (keyof ExtractedProfile)[];

export class NotResumeError extends Error {}

interface ResumeMeta {
  mime: string;
  fileName: string;
  r2Key: string;
  talentFolderId?: string;
  fallbackName?: string;
}

async function insertProfile(p: ExtractedProfile, meta: ResumeMeta, actor: string): Promise<number> {
  const fields: Omit<ExtractedProfile, "isResume"> & { isResume?: boolean } = { ...p };

  delete fields.isResume;
  const sources: Record<string, string> = {};

  for (const k of FIELD_KEYS) if (fields[k] != null) sources[k] = "resume";
  if (!fields.name && meta.fallbackName) {
    fields.name = meta.fallbackName;
    sources.name = "drive_folder";
  }
  if (!fields.gender) {
    fields.gender = await siteGender(fields.email);
    if (fields.gender) sources.gender = "site_profile";
  }

  const [row] = await db
    .insert(studentProfiles)
    .values({
      ...fields,
      resumeR2Key: meta.r2Key,
      resumeFileName: meta.fileName,
      resumeMime: meta.mime,
      talentFolderId: meta.talentFolderId ?? null,
      fieldSources: sources,
      model: BEDROCK_MODEL,
      createdBy: actor,
    })
    .returning({ id: studentProfiles.id });

  return row.id;
}

/** Throws NotResumeError when the file isn't a resume (transcript, offer letter…). */
export async function createProfileFromResume(
  input: ResumeMeta & { bytes: Buffer },
  actor: string,
): Promise<number> {
  const p = await extractProfile(input.bytes, input.mime);

  if (!p.isResume) throw new NotResumeError(input.fileName);

  return insertProfile(p, input, actor);
}

/** Files in a student folder that could be the resume, likeliest first. */
function resumeCandidates(files: CachedFile[]): CachedFile[] {
  const score = (f: CachedFile) =>
    (/resum|ruseme|\bcv\b|简历|履历|profile/i.test(f.name) ? 4 : 0) +
    (/offer|contract|合同|transcript|成绩|面经|论文|internship|engineer\b/i.test(f.name) ? -4 : 0) +
    (f.cachedType === "application/pdf" ? 1 : 0);

  return files
    .filter((f) => f.r2Key && RESUME_TYPES[f.cachedType])
    .sort((a, b) => score(b) - score(a) || (b.modifiedTime ?? "").localeCompare(a.modifiedTime ?? ""));
}

/** How many files per folder the model may look at before giving up. */
const MAX_TRIES = 4;

export interface ImportResult {
  created: string[];
  existing: number;
  noResume: string[];
  failed: string[];
}

/**
 * One profile per Drive "Talents" subfolder not imported yet. Reads the R2
 * mirror (run a talents sync first for new folders); folders without a
 * resume still get a profile carrying the folder name.
 */
export async function importFromTalents(actor: string): Promise<ImportResult> {
  const manifest = await readTalentsManifest();
  const done = new Set(
    (
      await db
        .select({ id: studentProfiles.talentFolderId })
        .from(studentProfiles)
        .where(isNotNull(studentProfiles.talentFolderId))
    ).map((r) => r.id),
  );
  const todo = (manifest?.folders ?? []).filter((f) => !done.has(f.id));
  const result: ImportResult = { created: [], existing: done.size, noResume: [], failed: [] };
  let i = 0;

  const worker = async () => {
    while (i < todo.length) {
      const folder = todo[i++];

      try {
        let id: number | null = null;

        for (const file of resumeCandidates(folder.files).slice(0, MAX_TRIES)) {
          const bytes = await getObjectBytes(file.r2Key!);

          if (!bytes) continue;
          const p = await extractProfile(bytes, file.cachedType);

          if (!p.isResume) continue;
          const key = resumeKey(file.cachedName);

          await putObject(key, bytes, file.cachedType);
          id = await insertProfile(
            p,
            { mime: file.cachedType, fileName: file.cachedName, r2Key: key, talentFolderId: folder.id, fallbackName: folder.name },
            actor,
          );
          break;
        }
        if (id == null) {
          await db.insert(studentProfiles).values({
            name: folder.name,
            talentFolderId: folder.id,
            fieldSources: { name: "drive_folder" },
            createdBy: actor,
          });
          result.noResume.push(folder.name);
          continue;
        }
        result.created.push(folder.name);
      } catch (e) {
        console.error(`[profiles] import ${folder.name} failed`, e);
        result.failed.push(folder.name);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(3, todo.length) }, worker));

  return result;
}
