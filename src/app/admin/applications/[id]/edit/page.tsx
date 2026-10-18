import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { APPLICATION_SECTIONS, formatAppField } from "@/lib/application-fields";
import { collegeCoachingApplications } from "@/lib/schema";

import { EditApplicationForm } from "./EditApplicationForm";

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);

  await requireStaff(`/admin/applications/${raw}/edit`);
  if (!Number.isInteger(id)) notFound();
  const [app] = await db
    .select()
    .from(collegeCoachingApplications)
    .where(eq(collegeCoachingApplications.id, id))
    .limit(1);

  if (!app) notFound();
  const { lang, t: d } = await getAdminDict();
  const t = d.applications;

  return (
    <div className="flex flex-col gap-5">
      <Link className="text-sm text-yellow-700 hover:underline" href="/admin/applications">
        ← {t.backToList}
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-yellow-900">{t.editTitle(app.fullName)}</h1>
        <p className="text-xs text-gray-500 mt-1">{t.editNote}</p>
      </div>
      <EditApplicationForm
        id={app.id}
        sections={APPLICATION_SECTIONS.map((s) => ({
          title: s[lang],
          fields: s.fields.map((f) => ({
            key: f.key,
            label: f[lang],
            kind: f.kind,
            required: !!f.required,
            value: formatAppField(f, app[f.key]),
          })),
        }))}
        t={{ save: t.save, saving: t.saving, saved: t.saved, errors: t.errors }}
      />
    </div>
  );
}
