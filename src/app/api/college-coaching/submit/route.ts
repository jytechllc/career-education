import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { collegeCoachingApplications, applicationFiles, partners } from "@/lib/schema";

const PARTNER_SLUG = "awesome-college-coaching";

function str(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function multi(form: FormData, key: string): string[] | undefined {
  const values = form.getAll(key).filter((v): v is string => typeof v === "string" && v.length > 0);
  return values.length > 0 ? values : undefined;
}

export async function POST(request: Request) {
  const form = await request.formData();

  const fullName = str(form, "fullName");
  const email = str(form, "email");
  if (!fullName || !email) {
    return NextResponse.json(
      { error: "Full name and email are required" },
      { status: 400 }
    );
  }

  const [partner] = await db
    .select()
    .from(partners)
    .where(eq(partners.slug, PARTNER_SLUG))
    .limit(1);

  if (!partner) {
    return NextResponse.json({ error: "Partner not configured" }, { status: 500 });
  }

  try {
    const [application] = await db
      .insert(collegeCoachingApplications)
      .values({
        partnerId: partner.id,
        locale: str(form, "locale") ?? "zh",

        fullName,
        email,
        phone: str(form, "phone"),
        dateOfBirth: str(form, "dateOfBirth"),
        city: str(form, "city"),
        state: str(form, "state"),
        countryOfCitizenship: str(form, "countryOfCitizenship"),

        currentSchool: str(form, "currentSchool"),
        currentGradeLevel: str(form, "currentGradeLevel"),
        expectedGraduationYear: str(form, "expectedGraduationYear"),
        intendedMajor: str(form, "intendedMajor"),
        dreamSchools: str(form, "dreamSchools"),
        academicSupportNeeded: str(form, "academicSupportNeeded"),
        specialAccommodations: str(form, "specialAccommodations"),

        supportAreas: multi(form, "supportAreas"),
        otherSupportDetails: str(form, "otherSupportDetails"),

        primaryGuardianEmail: str(form, "primaryGuardianEmail"),
        householdStatus: str(form, "householdStatus"),
        motherName: str(form, "motherName"),
        motherEmail: str(form, "motherEmail"),
        motherPhone: str(form, "motherPhone"),
        fatherName: str(form, "fatherName"),
        fatherEmail: str(form, "fatherEmail"),
        fatherPhone: str(form, "fatherPhone"),

        hobbiesInterests: str(form, "hobbiesInterests"),
        extracurriculars: str(form, "extracurriculars"),
        studentStrengths: str(form, "studentStrengths"),
        areasForImprovement: str(form, "areasForImprovement"),
        personalChallenges: str(form, "personalChallenges"),
        studentMotivation: str(form, "studentMotivation"),

        parentViewStrengths: str(form, "parentViewStrengths"),
        parentViewGrowthAreas: str(form, "parentViewGrowthAreas"),
        parentViewMotivation: str(form, "parentViewMotivation"),
        parentViewChallenges: str(form, "parentViewChallenges"),
        coachingGoals: str(form, "coachingGoals"),
        communityImpactGoals: str(form, "communityImpactGoals"),

        hearAboutUs: multi(form, "hearAboutUs"),
        referralName: str(form, "referralName"),
        otherSource: str(form, "otherSource"),
      })
      .returning();

    // Files were already uploaded straight to R2 client-side (see
    // CollegeCoachingForm's presign step) — a Vercel Serverless Function's
    // request body is capped at 4.5MB, which real phone photos exceed, so
    // we never accept raw file bytes here. Only the resulting R2 key comes
    // through as a plain form field.
    const fileFields: { kind: string }[] = [
      { kind: "transcript" },
      { kind: "test_scores" },
    ];

    for (const { kind } of fileFields) {
      const r2Key = str(form, `${kind}R2Key`);
      const fileName = str(form, `${kind}FileName`);
      const fileSizeRaw = str(form, `${kind}FileSize`);
      if (r2Key && fileName) {
        await db.insert(applicationFiles).values({
          applicationId: application.id,
          kind,
          fileName,
          r2Key,
          fileSize: fileSizeRaw ? parseInt(fileSizeRaw, 10) : null,
        });
      }
    }

    // Notify JYEdu + the partner — best-effort, doesn't block success response.
    if (process.env.REVO_API_KEY) {
      fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": process.env.REVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "杰圆职场教育", email: "helen.lan@jytech.us" },
          to: [{ email: "carrie.lan998@gmail.com", name: "Carrie" }],
          subject: `新的 College Coaching 申请: ${fullName}`,
          htmlContent: `<p>${fullName} (${email}) 提交了一份新的 College Coaching 申请，请登录 partner portal 查看详情。</p>`,
        }),
      }).catch((e) => console.error("Brevo notify failed:", e));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Application submission failed:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
