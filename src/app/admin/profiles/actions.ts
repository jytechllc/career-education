"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { getAdminDict } from "@/lib/admin-i18n";
import { db } from "@/lib/db";
import { getObjectBytes, getSignedPutUrl } from "@/lib/r2";
import { studentProfiles } from "@/lib/schema";
import { NotResumeError, RESUME_PREFIX, createProfileFromResume, importFromTalents, resumeKey } from "@/lib/profile-store";
import { MAX_RESUME_BYTES, RESUME_TYPES } from "@/lib/student-profiles";

/** Any staff member (counsellors are supervisors) may build and edit profiles. */
async function staffEmail(): Promise<string | null> {
  const session = await auth0.getSession();
  const email = session?.user.email ?? null;
  const role = session?.user.email_verified ? await staffRoleOf(email) : null;

  return role ? email : null;
}

type ErrorCode = "type" | "size" | "upload" | "extract" | "notResume" | "notFound";

/** Step 1: a presigned PUT so the file goes browser → R2, not through our function. */
export async function requestResumeUpload(
  fileName: string,
  type: string,
  size: number,
): Promise<{ ok: true; url: string; key: string } | { ok: false; error: ErrorCode }> {
  if (!(await staffEmail())) return { ok: false, error: "upload" };
  if (!RESUME_TYPES[type]) return { ok: false, error: "type" };
  if (size > MAX_RESUME_BYTES) return { ok: false, error: "size" };
  const key = resumeKey(fileName);

  return { ok: true, key, url: await getSignedPutUrl(key, type) };
}

/** Step 2: read the uploaded resume back from R2 and build the profile. */
export async function createProfileAction(
  key: string,
  fileName: string,
  type: string,
): Promise<{ ok: true; id: number } | { ok: false; error: ErrorCode }> {
  const email = await staffEmail();

  if (!email) return { ok: false, error: "upload" };
  if (!key.startsWith(RESUME_PREFIX) || key.includes("..") || !RESUME_TYPES[type]) {
    return { ok: false, error: "type" };
  }
  const bytes = await getObjectBytes(key);

  if (!bytes) return { ok: false, error: "upload" };
  if (bytes.byteLength > MAX_RESUME_BYTES) return { ok: false, error: "size" };

  try {
    const id = await createProfileFromResume({ bytes, mime: type, fileName, r2Key: key }, email);

    await logActivity({ actorType: "staff", actor: email, action: "profile.create", targetType: "student_profile", targetId: id });
    revalidatePath("/admin/profiles");

    return { ok: true, id };
  } catch (e) {
    if (e instanceof NotResumeError) return { ok: false, error: "notResume" };
    console.error("[profiles] extract failed", e);

    return { ok: false, error: "extract" };
  }
}

export async function importTalentsAction(): Promise<{ ok: true; message: string } | { ok: false }> {
  const email = await staffEmail();

  if (!email) return { ok: false };
  try {
    const result = await importFromTalents(email);

    await logActivity({
      actorType: "staff",
      actor: email,
      action: "profile.import_talents",
      detail: { created: result.created.length, noResume: result.noResume.length, failed: result.failed.length },
    });
    revalidatePath("/admin/profiles");
    const { t } = await getAdminDict();

    return { ok: true, message: t.profiles.imported({ ...result, created: result.created.length }) };
  } catch (e) {
    console.error("[profiles] import failed", e);

    return { ok: false };
  }
}

const EDITABLE = [
  "name",
  "gender",
  "age",
  "masterSchool",
  "phdSchool",
  "specialties",
  "targetRoles",
  "visa",
  "hobbies",
  "email",
  "phone",
] as const;

export async function updateProfileAction(
  _prev: { saved: boolean; error: string | null },
  form: FormData,
): Promise<{ saved: boolean; error: string | null }> {
  const email = await staffEmail();

  if (!email) return { saved: false, error: "notFound" };
  const id = Number(form.get("id"));
  const [cur] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, id)).limit(1);

  if (!cur) return { saved: false, error: "notFound" };

  const next: Record<string, string | number | null> = {};
  const sources = { ...(cur.fieldSources ?? {}) };
  const changed: string[] = [];

  for (const k of EDITABLE) {
    const raw = String(form.get(k) ?? "").trim();
    let v: string | number | null = raw || null;

    if (k === "age") {
      const n = Number(raw);

      v = raw && Number.isInteger(n) && n > 0 && n < 100 ? n : null;
    }
    if (v !== (cur[k] ?? null)) {
      next[k] = v;
      changed.push(k);
      if (v == null) delete sources[k];
      else sources[k] = "staff";
    }
  }

  if (changed.length) {
    await db
      .update(studentProfiles)
      .set({ ...next, fieldSources: sources, updatedBy: email, updatedAt: new Date() })
      .where(eq(studentProfiles.id, id));
    await logActivity({
      actorType: "staff",
      actor: email,
      action: "profile.update",
      targetType: "student_profile",
      targetId: id,
      detail: { fields: changed },
    });
    revalidatePath(`/admin/profiles/${id}`);
    revalidatePath("/admin/profiles");
  }

  return { saved: true, error: null };
}
