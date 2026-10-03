import { redirect } from "next/navigation";
import { and, eq, isNull, isNotNull, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { collegeCoachingApplications, applicationFiles, type CollegeCoachingApplication } from "@/lib/schema";
import { getPartnerSession } from "@/lib/partner-session";
import { getSignedFileUrl } from "@/lib/r2";
import { LogoutButton } from "./LogoutButton";
import { TrashButton, RestoreButton } from "./ApplicationActions";
import { ApplicationCard, type AppWithFiles } from "@/components/admin/ApplicationCard";

const TRASH_RETENTION_DAYS = 30;


export default async function PartnerDashboardPage() {
  const session = await getPartnerSession();
  if (!session) redirect("/partners/login");

  const [activeApplications, trashedApplications] = await Promise.all([
    db
      .select()
      .from(collegeCoachingApplications)
      .where(
        and(
          eq(collegeCoachingApplications.partnerId, session.partnerId),
          isNull(collegeCoachingApplications.deletedAt)
        )
      )
      .orderBy(desc(collegeCoachingApplications.createdAt)),
    db
      .select()
      .from(collegeCoachingApplications)
      .where(
        and(
          eq(collegeCoachingApplications.partnerId, session.partnerId),
          isNotNull(collegeCoachingApplications.deletedAt)
        )
      )
      .orderBy(desc(collegeCoachingApplications.deletedAt)),
  ]);

  const allApplications = [...activeApplications, ...trashedApplications];
  const applicationIds = allApplications.map((a) => a.id);
  const files =
    applicationIds.length === 0
      ? []
      : await db
          .select()
          .from(applicationFiles)
          .where(inArray(applicationFiles.applicationId, applicationIds));
  const filesByApplication = new Map<number, typeof files>();
  for (const f of files) {
    const list = filesByApplication.get(f.applicationId) ?? [];
    list.push(f);
    filesByApplication.set(f.applicationId, list);
  }

  async function withFileUrls(apps: CollegeCoachingApplication[]): Promise<AppWithFiles[]> {
    return Promise.all(
      apps.map(async (app) => {
        const appFiles = filesByApplication.get(app.id) ?? [];
        const withUrls = await Promise.all(
          appFiles.map(async (f) => ({ ...f, url: await getSignedFileUrl(f.r2Key) }))
        );
        return { ...app, files: withUrls };
      })
    );
  }

  const active = await withFileUrls(activeApplications);
  const trashed = await withFileUrls(trashedApplications);

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Partner Portal</h1>
          <p className="text-xs text-yellow-100">Signed in as {session.username}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-xl font-bold text-yellow-900 mb-4">
          Student Applications ({active.length})
        </h2>

        {active.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No applications yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {active.map((app) => (
              <ApplicationCard key={app.id} app={app}>
                <TrashButton applicationId={app.id} />
              </ApplicationCard>
            ))}
          </div>
        )}

        {trashed.length > 0 && (
          <details className="mt-10 group">
            <summary className="cursor-pointer text-sm font-semibold text-gray-500 hover:text-gray-700 transition">
              Trash ({trashed.length})
            </summary>
            <div className="flex flex-col gap-4 mt-4">
              {trashed.map((app) => {
                const deletedAt = app.deletedAt ? new Date(app.deletedAt) : new Date();
                const daysElapsed = Math.floor(
                  (Date.now() - deletedAt.getTime()) / (24 * 60 * 60 * 1000)
                );
                const daysRemaining = Math.max(0, TRASH_RETENTION_DAYS - daysElapsed);
                return (
                  <ApplicationCard key={app.id} app={app} dimmed>
                    <RestoreButton applicationId={app.id} daysRemaining={daysRemaining} />
                  </ApplicationCard>
                );
              })}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
