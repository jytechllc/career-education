import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { studentProfiles, type StudentProfile } from "@/lib/schema";
import { PROFILE_FIELDS, profileCode } from "@/lib/student-profiles";

import { ImportButton, UploadResume } from "./ProfileControls";

// Resume extraction and the Drive import run as server actions under this page's limits.
export const maxDuration = 300;

const missingCount = (p: StudentProfile) => PROFILE_FIELDS.filter((k) => p[k] == null).length;

export default async function AdminProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);

  await requireStaff(`/admin/profiles${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  const { t: d } = await getAdminDict();
  const t = d.profiles;
  const like = `%${q}%`;
  const rows = await db
    .select()
    .from(studentProfiles)
    .where(
      q
        ? or(
            ilike(studentProfiles.name, like),
            ilike(studentProfiles.masterSchool, like),
            ilike(studentProfiles.phdSchool, like),
            ilike(studentProfiles.specialties, like),
          )
        : undefined,
    )
    .orderBy(desc(studentProfiles.updatedAt))
    .limit(500);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-yellow-900">{t.title(rows.length)}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UploadResume
          t={{
            uploadTitle: t.uploadTitle,
            uploadHelp: t.uploadHelp,
            upload: t.upload,
            uploading: t.uploading,
            extracting: t.extracting,
            errors: t.errors,
          }}
        />
        <ImportButton
          labels={{ title: t.importTitle, help: t.importHelp, button: t.importButton, importing: t.importing, failed: t.importFailed }}
        />
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

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">{q ? t.emptySearch : t.empty}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
              <tr>
                <th className="px-4 py-2">{t.col.code}</th>
                <th className="px-4 py-2">{t.col.name}</th>
                <th className="px-4 py-2">{t.col.master}</th>
                <th className="px-4 py-2">{t.col.specialties}</th>
                <th className="px-4 py-2">{t.col.missing}</th>
                <th className="px-4 py-2">{t.col.updated}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const missing = missingCount(p);

                return (
                  <tr key={p.id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{profileCode(p.id)}</td>
                    <td className="px-4 py-2 font-medium">
                      <Link className="text-yellow-800 underline-offset-2 hover:underline" href={`/admin/profiles/${p.id}`}>
                        {p.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-700 max-w-xs">{p.masterSchool ?? "—"}</td>
                    <td className="px-4 py-2 text-gray-700 max-w-sm whitespace-pre-line line-clamp-3">
                      {p.specialties ?? "—"}
                    </td>
                    <td className={`px-4 py-2 text-xs ${missing ? "text-amber-700" : "text-green-700"}`}>
                      {t.missingCount(missing)}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">{p.updatedAt.toLocaleDateString(d.dateLocale)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
