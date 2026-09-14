import { redirect } from "next/navigation";
import { and, eq, isNull, isNotNull, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { collegeCoachingApplications, applicationFiles, type CollegeCoachingApplication } from "@/lib/schema";
import { getPartnerSession } from "@/lib/partner-session";
import { getSignedFileUrl } from "@/lib/r2";
import { LogoutButton } from "./LogoutButton";
import { TrashButton, RestoreButton } from "./ApplicationActions";

const TRASH_RETENTION_DAYS = 30;

type FileWithUrl = typeof applicationFiles.$inferSelect & { url: string };
type AppWithFiles = CollegeCoachingApplication & { files: FileWithUrl[] };

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

function ApplicationCard({
  app,
  dimmed,
  children,
}: {
  app: AppWithFiles;
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className={`bg-white rounded-lg shadow-md overflow-hidden ${dimmed ? "opacity-70" : ""}`}
    >
      <summary className="cursor-pointer px-5 py-4 flex flex-wrap items-center justify-between gap-2 hover:bg-yellow-50 transition">
        <div>
          <span className="font-semibold text-yellow-900">{app.fullName}</span>
          <span className="text-sm text-gray-500 ml-2">{app.email}</span>
        </div>
        <span className="text-xs text-gray-400">{app.createdAt.toLocaleString()}</span>
      </summary>

      <div className="px-5 pb-5 pt-1 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <Field label="Phone" value={app.phone} />
        <Field label="Date of Birth" value={app.dateOfBirth} />
        <Field label="City / State" value={[app.city, app.state].filter(Boolean).join(", ")} />
        <Field label="Country of Citizenship" value={app.countryOfCitizenship} />
        <Field label="Current School" value={app.currentSchool} />
        <Field label="Grade Level" value={app.currentGradeLevel} />
        <Field label="Expected Graduation" value={app.expectedGraduationYear} />
        <Field label="Intended Major" value={app.intendedMajor} />
        <Field label="Dream Schools" value={app.dreamSchools} full />
        <Field label="Academic Support Needed" value={app.academicSupportNeeded} full />
        <Field label="Special Accommodations" value={app.specialAccommodations} full />
        <Field label="Support Areas Requested" value={app.supportAreas?.join(", ")} full />
        <Field label="Other Support Details" value={app.otherSupportDetails} full />

        <div className="md:col-span-2 border-t border-gray-100 pt-2 mt-1">
          <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
            Parent / Guardian
          </p>
        </div>
        <Field label="Primary Guardian Email" value={app.primaryGuardianEmail} />
        <Field label="Household Status" value={app.householdStatus} />
        <Field label="Mother" value={[app.motherName, app.motherEmail, app.motherPhone].filter(Boolean).join(" · ")} full />
        <Field label="Father" value={[app.fatherName, app.fatherEmail, app.fatherPhone].filter(Boolean).join(" · ")} full />

        <div className="md:col-span-2 border-t border-gray-100 pt-2 mt-1">
          <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
            Student Background
          </p>
        </div>
        <Field label="Hobbies & Interests" value={app.hobbiesInterests} full />
        <Field label="Extracurriculars" value={app.extracurriculars} full />
        <Field label="Student Strengths" value={app.studentStrengths} full />
        <Field label="Areas for Improvement" value={app.areasForImprovement} full />
        <Field label="Personal Challenges" value={app.personalChallenges} full />
        <Field label="Motivation" value={app.studentMotivation} full />

        <div className="md:col-span-2 border-t border-gray-100 pt-2 mt-1">
          <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
            Parent Assessment
          </p>
        </div>
        <Field label="Child's Strengths (parent view)" value={app.parentViewStrengths} full />
        <Field label="Growth Areas (parent view)" value={app.parentViewGrowthAreas} full />
        <Field label="Motivation (parent view)" value={app.parentViewMotivation} full />
        <Field label="Challenges (parent view)" value={app.parentViewChallenges} full />
        <Field label="Coaching Goals" value={app.coachingGoals} full />
        <Field label="Community Impact Goals" value={app.communityImpactGoals} full />

        <div className="md:col-span-2 border-t border-gray-100 pt-2 mt-1">
          <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Source</p>
        </div>
        <Field label="Heard About Us" value={app.hearAboutUs?.join(", ")} />
        <Field label="Referral Name" value={app.referralName} />
        <Field label="Other Source" value={app.otherSource} />

        {app.files.length > 0 && (
          <div className="md:col-span-2 border-t border-gray-100 pt-3 mt-1">
            <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-2">
              Documents
            </p>
            <div className="flex flex-wrap gap-2">
              {app.files.map((f) => (
                <a
                  key={f.id}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded-full px-3 py-1.5 transition"
                >
                  {f.kind === "transcript" ? "📄 " : "📊 "}
                  {f.fileName}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="md:col-span-2 border-t border-gray-100 pt-3 mt-1 flex justify-end">
          {children}
        </div>
      </div>
    </details>
  );
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value?: string | null;
  full?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-gray-800 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
