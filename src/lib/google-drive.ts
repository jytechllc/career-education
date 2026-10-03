import "server-only";

import { google, type drive_v3 } from "googleapis";

let _drive: drive_v3.Drive | null = null;

/**
 * Read-only Drive client as the shared service account
 * (autoclaw-analytics@jytech.iam.gserviceaccount.com, same key as
 * lib/google-sheets.ts). It only sees folders shared with that email.
 */
function getDrive(): drive_v3.Drive {
  if (!_drive) {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(raw),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    _drive = google.drive({ version: "v3", auth });
  }

  return _drive;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  size: number | null;
  webViewLink: string | null;
}

export interface TalentFolder {
  id: string;
  name: string;
  modifiedTime: string | null;
  webViewLink: string | null;
  files: DriveFile[];
}

const FOLDER_MIME = "application/vnd.google-apps.folder";
const FIELDS = "nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, parents)";

async function listAll(q: string): Promise<(DriveFile & { parents: string[] })[]> {
  const out: (DriveFile & { parents: string[] })[] = [];
  let pageToken: string | undefined;

  do {
    const res = await getDrive().files.list({
      q,
      fields: FIELDS,
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const f of res.data.files ?? []) {
      out.push({
        id: f.id!,
        name: f.name ?? "",
        mimeType: f.mimeType ?? "",
        modifiedTime: f.modifiedTime ?? null,
        size: f.size ? Number(f.size) : null,
        webViewLink: f.webViewLink ?? null,
        parents: f.parents ?? [],
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return out;
}

/**
 * One folder per student under the root (e.g. "Talents"), with the files
 * directly inside each — two Drive queries regardless of student count.
 */
export async function listTalentFolders(rootId: string): Promise<TalentFolder[]> {
  const folders = await listAll(
    `'${rootId}' in parents and mimeType = '${FOLDER_MIME}' and trashed = false`,
  );

  if (folders.length === 0) return [];

  const parentClause = folders.map((f) => `'${f.id}' in parents`).join(" or ");
  const files = await listAll(`(${parentClause}) and trashed = false`);

  return folders
    .map((folder) => ({
      id: folder.id,
      name: folder.name,
      modifiedTime: folder.modifiedTime,
      webViewLink: folder.webViewLink,
      files: files
        .filter((f) => f.parents.includes(folder.id))
        .map(({ parents: _p, ...f }) => f)
        .sort((a, b) => (b.modifiedTime ?? "").localeCompare(a.modifiedTime ?? "")),
    }))
    .sort((a, b) => {
      const last = (t: TalentFolder) =>
        [t.modifiedTime, ...t.files.map((f) => f.modifiedTime)].filter(Boolean).sort().pop() ?? "";

      return last(b).localeCompare(last(a));
    });
}

/** Google-native types have no bytes of their own; export these as PDF. */
const EXPORTABLE = new Set([
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.google-apps.presentation",
  "application/vnd.google-apps.drawing",
]);

/**
 * File bytes for caching: binary files as-is, Google Docs/Sheets/Slides
 * exported to PDF. Returns null for types that can't be downloaded
 * (forms, shortcuts, …).
 */
export async function downloadDriveFile(
  f: DriveFile,
): Promise<{ body: Buffer; contentType: string; ext: string | null } | null> {
  const drive = getDrive();

  if (f.mimeType.startsWith("application/vnd.google-apps.")) {
    if (!EXPORTABLE.has(f.mimeType)) return null;
    const res = await drive.files.export(
      { fileId: f.id, mimeType: "application/pdf" },
      { responseType: "arraybuffer" },
    );

    return { body: Buffer.from(res.data as ArrayBuffer), contentType: "application/pdf", ext: "pdf" };
  }

  const res = await drive.files.get(
    { fileId: f.id, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" },
  );

  return { body: Buffer.from(res.data as ArrayBuffer), contentType: f.mimeType || "application/octet-stream", ext: null };
}
