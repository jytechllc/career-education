import type { ApplicationFile, CollegeCoachingApplication } from "@/lib/schema";

export type FileWithUrl = ApplicationFile & { url: string };
export type AppWithFiles = CollegeCoachingApplication & { files: FileWithUrl[] };

/**
 * One student application, collapsed to name/email/date and expanding to the
 * full intake. Shared by the partner portal and the staff admin; `meta` adds
 * a line under the name (e.g. the partner, for staff who see every partner).
 */
export function ApplicationCard({
  app,
  dimmed,
  meta,
  children,
}: {
  app: AppWithFiles;
  dimmed?: boolean;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <details
      className={`bg-white rounded-lg shadow-md overflow-hidden ${dimmed ? "opacity-70" : ""}`}
    >
      <summary className="cursor-pointer px-5 py-4 flex flex-wrap items-center justify-between gap-2 hover:bg-yellow-50 transition">
        <div>
          <span className="font-semibold text-yellow-900">{app.fullName}</span>
          <span className="text-sm text-gray-500 ml-2">{app.email}</span>
          {meta ? <div className="text-xs text-gray-500 mt-0.5">{meta}</div> : null}
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

        {children ? (
          <div className="md:col-span-2 border-t border-gray-100 pt-3 mt-1 flex justify-end">
            {children}
          </div>
        ) : null}
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
