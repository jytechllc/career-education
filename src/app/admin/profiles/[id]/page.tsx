import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { eq } from "drizzle-orm";
import { Download, FileText, FolderOpen } from "lucide-react";

import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { studentProfiles } from "@/lib/schema";
import { PROFILE_FIELDS, profileCode, scrubPii } from "@/lib/student-profiles";

import { ProfileForm } from "./ProfileForm";

export default async function AdminProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);

  await requireStaff(`/admin/profiles/${raw}`);
  if (!Number.isInteger(id)) notFound();
  const [p] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, id)).limit(1);

  if (!p) notFound();
  const { t: d } = await getAdminDict();
  const t = d.profiles;
  const sources = p.fieldSources ?? {};
  const redacted = p.redactedResumeMd ? scrubPii(p.redactedResumeMd, p) : null;
  const btn =
    "inline-flex h-9 items-center gap-1.5 rounded-md border border-yellow-300 bg-white px-3 text-sm text-yellow-800 hover:bg-yellow-50";

  return (
    <div className="flex flex-col gap-5">
      <Link className="text-sm text-yellow-700 hover:underline" href="/admin/profiles">
        ← {t.backToList}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-yellow-900">{p.name ?? profileCode(p.id)}</h1>
          <p className="text-xs text-gray-500 mt-1 font-mono">{profileCode(p.id)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className={`${btn} bg-yellow-600 border-yellow-600 text-white hover:bg-yellow-700`} href={`/admin/profiles/${p.id}/pdf?lang=zh`}>
            <Download aria-hidden className="h-4 w-4" />
            {t.downloadRedacted}
          </a>
          <a className={btn} href={`/admin/profiles/${p.id}/pdf?lang=en`}>
            <Download aria-hidden className="h-4 w-4" />
            {t.downloadRedactedEn}
          </a>
          {p.resumeR2Key ? (
            <a className={btn} href={`/admin/profiles/${p.id}/resume`} rel="noreferrer" target="_blank">
              <FileText aria-hidden className="h-4 w-4" />
              {t.viewResume}
            </a>
          ) : null}
          {p.talentFolderId ? (
            <a
              className={btn}
              href={`https://drive.google.com/drive/folders/${p.talentFolderId}`}
              rel="noreferrer"
              target="_blank"
            >
              <FolderOpen aria-hidden className="h-4 w-4" />
              {t.fromDrive}
            </a>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-gray-500 -mt-2">{t.redactedNote}</p>

      <ProfileForm
        fields={PROFILE_FIELDS.map((k) => ({
          key: k,
          label: t.fields[k],
          value: p[k] == null ? "" : String(p[k]),
          source: sources[k] ? (t.sources[sources[k]] ?? sources[k]) : null,
          multiline: ["masterSchool", "phdSchool", "specialties", "targetRoles", "hobbies"].includes(k),
        }))}
        contact={{ email: p.email ?? "", phone: p.phone ?? "" }}
        id={p.id}
        t={{
          missing: t.missing,
          contactTitle: t.contactTitle,
          email: t.email,
          phone: t.phone,
          save: t.save,
          saving: t.saving,
          saved: t.saved,
        }}
      />

      <p className="text-xs text-gray-400">
        {t.createdBy}: {p.createdBy} · {p.createdAt.toLocaleString(d.dateLocale)}
        {p.updatedBy ? ` — ${t.updatedBy}: ${p.updatedBy} · ${p.updatedAt.toLocaleString(d.dateLocale)}` : ""}
      </p>

      {redacted ? (
        <section className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-yellow-900 mb-3">{t.redactedPreview}</h2>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{redacted}</ReactMarkdown>
          </div>
        </section>
      ) : null}
    </div>
  );
}
