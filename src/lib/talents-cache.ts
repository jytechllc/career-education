import "server-only";

import { downloadDriveFile, listTalentFolders, type DriveFile } from "./google-drive";
import { deleteFile, getObjectText, putObject } from "./r2";

/**
 * R2 mirror of the Drive "Talents" folder. Drive stays the source of truth;
 * a sync copies new/changed files into R2 and rewrites one manifest, which is
 * all /admin/talents reads. Staff then open files from R2 through a signed
 * link, so they don't need their own Drive access.
 */

export const TALENTS_FOLDER_ID =
  process.env.TALENTS_FOLDER_ID ?? "1ssyZL0SVxOZMOjkCtzLKJeQB0jClHUb4";

const MANIFEST_KEY = "talents/manifest.json";
/** Bigger files stay Drive-only rather than stalling the sync. */
const MAX_BYTES = 50 * 1024 * 1024;

export interface CachedFile extends DriveFile {
  /** null when the file isn't cached (too large, or a non-exportable type). */
  r2Key: string | null;
  /** Name/type of the cached copy (Google Docs are cached as PDF). */
  cachedName: string;
  cachedType: string;
}

export interface CachedFolder {
  id: string;
  name: string;
  modifiedTime: string | null;
  webViewLink: string | null;
  files: CachedFile[];
}

export interface TalentsManifest {
  rootId: string;
  syncedAt: string;
  folders: CachedFolder[];
}

export interface SyncResult {
  folders: number;
  files: number;
  downloaded: number;
  unchanged: number;
  skipped: number;
  removed: number;
  failed: number;
}

export async function readTalentsManifest(): Promise<TalentsManifest | null> {
  const text = await getObjectText(MANIFEST_KEY);

  return text ? (JSON.parse(text) as TalentsManifest) : null;
}

function safeKeyPart(name: string): string {
  return name.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 120) || "file";
}

/** Run `fn` over items with at most `limit` in flight. */
async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  });

  await Promise.all(workers);
}

export async function syncTalents(): Promise<SyncResult> {
  const [folders, previous] = await Promise.all([
    listTalentFolders(TALENTS_FOLDER_ID),
    readTalentsManifest(),
  ]);
  const prevById = new Map<string, CachedFile>();

  for (const f of previous?.folders ?? []) for (const file of f.files) prevById.set(file.id, file);

  const result: SyncResult = {
    folders: folders.length,
    files: 0,
    downloaded: 0,
    unchanged: 0,
    skipped: 0,
    removed: 0,
    failed: 0,
  };
  const cached = new Map<string, CachedFile>();
  const all = folders.flatMap((folder) => folder.files);

  result.files = all.length;

  await pool(all, 4, async (f) => {
    const prev = prevById.get(f.id);

    if (prev?.r2Key && prev.modifiedTime === f.modifiedTime) {
      cached.set(f.id, { ...prev, ...f, r2Key: prev.r2Key, cachedName: prev.cachedName, cachedType: prev.cachedType });
      result.unchanged++;

      return;
    }

    const uncached: CachedFile = { ...f, r2Key: null, cachedName: f.name, cachedType: f.mimeType };

    if (f.size !== null && f.size > MAX_BYTES) {
      cached.set(f.id, uncached);
      result.skipped++;

      return;
    }

    try {
      const dl = await downloadDriveFile(f);

      if (!dl) {
        cached.set(f.id, uncached);
        result.skipped++;

        return;
      }
      const cachedName = dl.ext && !f.name.toLowerCase().endsWith(`.${dl.ext}`) ? `${f.name}.${dl.ext}` : f.name;
      const r2Key = `talents/${f.id}/${safeKeyPart(cachedName)}`;

      await putObject(r2Key, dl.body, dl.contentType);
      if (prev?.r2Key && prev.r2Key !== r2Key) await deleteFile(prev.r2Key).catch(() => {});
      cached.set(f.id, { ...f, r2Key, cachedName, cachedType: dl.contentType });
      result.downloaded++;
    } catch (e) {
      console.error(`[talents] cache ${f.id} failed`, e);
      // Keep the last good copy, if any, rather than dropping the file.
      cached.set(f.id, prev?.r2Key ? { ...prev, ...f, r2Key: prev.r2Key, cachedName: prev.cachedName, cachedType: prev.cachedType } : uncached);
      result.failed++;
    }
  });

  // Files gone from Drive leave R2 too.
  for (const [id, prev] of Array.from(prevById)) {
    if (!cached.has(id) && prev.r2Key) {
      await deleteFile(prev.r2Key).catch(() => {});
      result.removed++;
    }
  }

  const manifest: TalentsManifest = {
    rootId: TALENTS_FOLDER_ID,
    syncedAt: new Date().toISOString(),
    folders: folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      modifiedTime: folder.modifiedTime,
      webViewLink: folder.webViewLink,
      files: folder.files.map((f) => cached.get(f.id)!),
    })),
  };

  await putObject(MANIFEST_KEY, JSON.stringify(manifest), "application/json");

  return result;
}
