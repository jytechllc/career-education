import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { buildRedactedPdf, type ProfilePdfLabels } from "@/lib/profile-pdf";
import { studentProfiles, type StudentProfile } from "@/lib/schema";
import { profileCode } from "@/lib/student-profiles";

export const dynamic = "force-dynamic";

const ageText = (zh: boolean) => (p: StudentProfile) => (p.age == null ? null : zh ? `${p.age} 岁` : String(p.age));

// Name and contact details are never part of the PDF.
function labels(lang: "zh" | "en", date: Date): ProfilePdfLabels {
  const zh = lang === "zh";

  return zh
    ? {
        title: "学生档案",
        subtitle: "已隐去姓名和联系方式",
        generated: `生成日期 ${date.toISOString().slice(0, 10)}`,
        footer: "杰圆教育 JYEdu · edu.jytech.us · 本档案已隐去姓名和联系方式，如需联系请通过杰圆教育",
        missing: "未提供",
        resumeHeading: "简历（已脱敏）",
        fields: [
          { label: "性别", value: (p) => p.gender },
          { label: "年龄", value: ageText(true) },
          { label: "硕士毕业学校", value: (p) => p.masterSchool },
          { label: "博士毕业学校", value: (p) => p.phdSchool },
          { label: "工作特长专业", value: (p) => p.specialties },
          { label: "求职 / 实习意向", value: (p) => p.targetRoles },
          { label: "目前签证", value: (p) => p.visa },
          { label: "个人兴趣爱好", value: (p) => p.hobbies },
        ],
      }
    : {
        title: "Candidate Profile",
        subtitle: "Name and contact details withheld",
        generated: `Generated ${date.toISOString().slice(0, 10)}`,
        footer: "JYEdu · edu.jytech.us · Name and contact details withheld — please reach the candidate through JYEdu",
        missing: "Not provided",
        resumeHeading: "Resume (de-identified)",
        fields: [
          { label: "Gender", value: (p) => p.gender },
          { label: "Age", value: ageText(false) },
          { label: "Master's school", value: (p) => p.masterSchool },
          { label: "PhD school", value: (p) => p.phdSchool },
          { label: "Strengths", value: (p) => p.specialties },
          { label: "Target roles", value: (p) => p.targetRoles },
          { label: "Current visa", value: (p) => p.visa },
          { label: "Interests", value: (p) => p.hobbies },
        ],
      };
}

/** /admin/profiles/<id>/pdf?lang=zh|en — staff only; the de-identified profile PDF. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth0.getSession();

  if (!session) {
    const back = `/admin/profiles/${id}/pdf?${req.nextUrl.searchParams}`;

    return NextResponse.redirect(new URL(`/auth/login?returnTo=${encodeURIComponent(back)}`, req.url));
  }
  const email = session.user.email ?? null;
  const role = session.user.email_verified ? await staffRoleOf(email) : null;

  if (!role) return new NextResponse("Not found", { status: 404 });
  const [p] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, Number(id) || 0)).limit(1);

  if (!p) return new NextResponse("Not found", { status: 404 });
  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "zh";
  const pdf = await buildRedactedPdf(p, labels(lang, new Date()));
  const code = profileCode(p.id);

  await logActivity({
    actorType: "staff",
    actor: email,
    action: "profile.download_redacted",
    targetType: "student_profile",
    targetId: p.id,
    detail: { lang },
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${code}${lang === "en" ? "-profile" : ""}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
