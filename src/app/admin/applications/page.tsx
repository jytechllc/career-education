import Link from "next/link";
import { and, desc, eq, ilike, inArray, isNotNull, isNull, or, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { getSignedFileUrl } from "@/lib/r2";
import { applicationFiles, collegeCoachingApplications, partners } from "@/lib/schema";
import { ApplicationCard, type AppWithFiles } from "@/components/admin/ApplicationCard";

import { RestoreButton, TrashButton } from "./TrashControls";

const TRASH_RETENTION_DAYS = 30;

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string; q?: string; trash?: string }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams(
    Object.entries(sp).filter((e): e is [string, string] => !!e[1]),
  ).toString();

  await requireStaff(`/admin/applications${qs ? `?${qs}` : ""}`);

  const { t: d } = await getAdminDict();
  const t = d.applications;
  const partnerId = Number(sp.partner) || null;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const inTrash = sp.trash === "1";

  const where: SQL[] = [
    inTrash
      ? isNotNull(collegeCoachingApplications.deletedAt)
      : isNull(collegeCoachingApplications.deletedAt),
  ];

  if (partnerId) where.push(eq(collegeCoachingApplications.partnerId, partnerId));
  if (q) {
    const like = `%${q}%`;

    where.push(
      or(
        ilike(collegeCoachingApplications.fullName, like),
        ilike(collegeCoachingApplications.email, like),
        ilike(collegeCoachingApplications.currentSchool, like),
        ilike(collegeCoachingApplications.intendedMajor, like),
      )!,
    );
  }

  const [partnerList, rows] = await Promise.all([
    db.select({ id: partners.id, name: partners.name }).from(partners),
    db
      .select({ app: collegeCoachingApplications, partner: partners.name })
      .from(collegeCoachingApplications)
      .leftJoin(partners, eq(partners.id, collegeCoachingApplications.partnerId))
      .where(and(...where))
      .orderBy(desc(collegeCoachingApplications.createdAt))
      .limit(200),
  ]);

  const ids = rows.map((r) => r.app.id);
  const files = ids.length
    ? await db.select().from(applicationFiles).where(inArray(applicationFiles.applicationId, ids))
    : [];
  const withUrls = await Promise.all(
    files.map(async (f) => ({ ...f, url: await getSignedFileUrl(f.r2Key) })),
  );
  const apps: (AppWithFiles & { partnerName: string | null })[] = rows.map((r) => ({
    ...r.app,
    partnerName: r.partner,
    files: withUrls.filter((f) => f.applicationId === r.app.id),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-yellow-900">
          {inTrash ? t.trashTitle(apps.length) : t.title(apps.length)}
        </h1>
        <Link
          className="text-sm text-yellow-700 underline"
          href={inTrash ? "/admin/applications" : "/admin/applications?trash=1"}
        >
          {inTrash ? t.backToList : t.viewTrash}
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        {inTrash ? <input name="trash" type="hidden" value="1" /> : null}
        <input
          className="h-10 rounded-md border border-yellow-200 bg-white px-3 text-sm w-64 max-w-full"
          defaultValue={q}
          name="q"
          placeholder={t.searchPlaceholder}
          type="search"
        />
        <select
          className="h-10 rounded-md border border-yellow-200 bg-white px-3 text-sm"
          defaultValue={partnerId ?? ""}
          name="partner"
        >
          <option value="">{t.allPartners}</option>
          {partnerList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          className="h-10 rounded-md bg-yellow-600 px-4 text-sm font-medium text-white hover:bg-yellow-700"
          type="submit"
        >
          {t.filter}
        </button>
      </form>

      {inTrash ? (
        <p className="text-xs text-gray-500">
          {t.trashNote}
        </p>
      ) : null}

      {apps.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">{t.empty}</div>
      ) : (
        <div className="flex flex-col gap-4">
          {apps.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              dimmed={inTrash}
              meta={`${app.partnerName ?? "—"}${app.intendedMajor ? ` · ${app.intendedMajor}` : ""}${app.currentSchool ? ` · ${app.currentSchool}` : ""}`}
            >
              {inTrash && app.deletedAt ? (
                <RestoreButton
                  id={app.id}
                  label={t.restore}
                  note={t.daysLeft(
                    TRASH_RETENTION_DAYS -
                      Math.floor((Date.now() - new Date(app.deletedAt).getTime()) / 86_400_000),
                  )}
                />
              ) : (
                <TrashButton confirmText={t.confirmTrash} id={app.id} label={t.trash} />
              )}
            </ApplicationCard>
          ))}
        </div>
      )}
    </div>
  );
}
