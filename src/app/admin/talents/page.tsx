import { ExternalLink, FileImage, FileSpreadsheet, FileText, FolderOpen } from "lucide-react";

import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { type DriveFile, type TalentFolder, listTalentFolders } from "@/lib/google-drive";

/** The shared "Talents" folder (owner jytech202307@gmail.com). */
const TALENTS_FOLDER_ID =
  process.env.TALENTS_FOLDER_ID ?? "1ssyZL0SVxOZMOjkCtzLKJeQB0jClHUb4";

type Kind = "pdf" | "doc" | "word" | "image" | "sheet" | "other";

function kindOf(f: DriveFile): Kind {
  if (f.mimeType === "application/pdf") return "pdf";
  if (f.mimeType === "application/vnd.google-apps.document") return "doc";
  if (f.mimeType.includes("wordprocessingml") || f.mimeType === "application/msword") return "word";
  if (f.mimeType.startsWith("image/")) return "image";
  if (f.mimeType.includes("spreadsheet")) return "sheet";

  return "other";
}

export default async function AdminTalentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);

  await requireStaff(`/admin/talents${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  const { t: d } = await getAdminDict();
  const t = d.talents;

  let folders: TalentFolder[] = [];
  let failed = false;

  try {
    folders = await listTalentFolders(TALENTS_FOLDER_ID);
  } catch (e) {
    console.error("[admin/talents] Drive read failed", e);
    failed = true;
  }

  const needle = q.toLowerCase();
  const shown = needle
    ? folders.filter(
        (f) =>
          f.name.toLowerCase().includes(needle) ||
          f.files.some((x) => x.name.toLowerCase().includes(needle)),
      )
    : folders;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-yellow-900">{t.title(shown.length)}</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-3xl">{t.subtitle}</p>
        </div>
        <a
          className="inline-flex items-center gap-1 text-sm text-yellow-700 underline"
          href={`https://drive.google.com/drive/folders/${TALENTS_FOLDER_ID}`}
          rel="noreferrer"
          target="_blank"
        >
          <FolderOpen className="h-4 w-4" />
          {t.openFolder}
        </a>
      </div>

      <form className="flex gap-2" method="get">
        <input
          className="h-10 rounded-md border border-yellow-200 bg-white px-3 text-sm w-64 max-w-full"
          defaultValue={q}
          name="q"
          placeholder={t.searchPlaceholder}
          type="search"
        />
        <button
          className="h-10 rounded-md bg-yellow-600 px-4 text-sm font-medium text-white hover:bg-yellow-700"
          type="submit"
        >
          {t.search}
        </button>
      </form>

      {failed ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{t.error}</div>
      ) : shown.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">{t.empty}</div>
      ) : (
        <>
          <p className="text-xs text-gray-500">{t.accessNote}</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {shown.map((folder) => (
              <section key={folder.id} className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-yellow-900">{folder.name}</h2>
                    <p className="text-xs text-gray-500">{t.files(folder.files.length)}</p>
                  </div>
                  {folder.webViewLink ? (
                    <a
                      aria-label={`${t.openFolder}: ${folder.name}`}
                      className="text-yellow-700 hover:text-yellow-900"
                      href={folder.webViewLink}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>

                {folder.files.length === 0 ? (
                  <p className="text-sm text-gray-400">{t.emptyFolder}</p>
                ) : (
                  <ul className="divide-y divide-gray-100 text-sm">
                    {folder.files.map((f) => {
                      const kind = kindOf(f);
                      const Icon =
                        kind === "image" ? FileImage : kind === "sheet" ? FileSpreadsheet : FileText;

                      return (
                        <li key={f.id} className="flex items-center justify-between gap-3 py-2">
                          <a
                            className="flex min-w-0 items-center gap-2 text-gray-800 hover:text-yellow-800 hover:underline"
                            href={f.webViewLink ?? "#"}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Icon aria-hidden className="h-4 w-4 shrink-0 text-yellow-600" />
                            <span className="truncate">{f.name}</span>
                          </a>
                          <span className="shrink-0 text-xs text-gray-400">
                            {t.kinds[kind]}
                            {f.modifiedTime
                              ? ` · ${new Date(f.modifiedTime).toLocaleDateString(d.dateLocale)}`
                              : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
