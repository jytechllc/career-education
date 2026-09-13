"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle } from "lucide-react";

type Copy = {
  sections: {
    applicant: string;
    academic: string;
    support: string;
    guardian: string;
    documents: string;
    background: string;
    parentAssessment: string;
    submission: string;
  };
  fields: Record<string, string>;
  supportOptions: { value: string; label: string }[];
  hearOptions: { value: string; label: string }[];
  submit: string;
  submitting: string;
  success: string;
  error: string;
};

const zh: Copy = {
  sections: {
    applicant: "1. 申请人信息",
    academic: "2. 学术背景",
    support: "3. 需要的支持方向",
    guardian: "4. 家长/监护人信息",
    documents: "5. 上传材料",
    background: "6. 学生背景",
    parentAssessment: "7. 家长评估",
    submission: "8. 其他信息",
  },
  fields: {
    fullName: "姓名",
    email: "邮箱",
    phone: "电话",
    dateOfBirth: "出生日期",
    city: "城市",
    state: "州/省",
    countryOfCitizenship: "国籍",
    currentSchool: "目前就读学校",
    currentGradeLevel: "年级",
    expectedGraduationYear: "预计毕业年份",
    intendedMajor: "意向专业方向",
    dreamSchools: "理想/目标院校",
    academicSupportNeeded: "需要的学术支持",
    specialAccommodations: "特殊需求说明",
    otherSupportDetails: "其他支持说明",
    primaryGuardianEmail: "主要监护人邮箱",
    householdStatus: "家庭情况",
    motherName: "母亲/监护人姓名",
    motherEmail: "母亲/监护人邮箱",
    motherPhone: "母亲/监护人电话",
    fatherName: "父亲/监护人姓名",
    fatherEmail: "父亲/监护人邮箱",
    fatherPhone: "父亲/监护人电话",
    transcriptFile: "成绩单 / Report Card",
    testScoresFile: "标化考试成绩 (PSAT/SAT/ACT)",
    hobbiesInterests: "兴趣爱好",
    extracurriculars: "课外活动",
    studentStrengths: "学生的优势",
    areasForImprovement: "待提升方向",
    personalChallenges: "个人面临的挑战（如有）",
    studentMotivation: "什么激励你学习/努力/追求目标？",
    parentViewStrengths: "您认为孩子最大的优势是？",
    parentViewGrowthAreas: "您希望孩子在哪些方面成长？",
    parentViewMotivation: "什么激励您的孩子？",
    parentViewChallenges: "需要我们了解的个人情况或挑战？",
    coachingGoals: "对本次辅导的主要目标或期望",
    communityImpactGoals: "希望孩子如何回馈社区或产生正向影响？",
    referralName: "推荐人姓名（如有）",
    otherSource: "其他渠道说明",
  },
  supportOptions: [
    { value: "college_coaching", label: "College Coaching" },
    { value: "grad_school", label: "研究生申请" },
    { value: "scholarship", label: "奖学金申请" },
    { value: "career_advising", label: "职业规划 / 实习" },
    { value: "college_transfer", label: "转学" },
    { value: "passion_projects", label: "个人项目 / 独立项目" },
    { value: "financial_planning", label: "财务规划 / 留学资金规划" },
    { value: "other", label: "其他" },
  ],
  hearOptions: [
    { value: "wechat", label: "微信" },
    { value: "google", label: "Google" },
    { value: "referral", label: "推荐" },
    { value: "social", label: "Facebook / Instagram" },
    { value: "event", label: "活动 / 讲座" },
    { value: "other", label: "其他" },
  ],
  submit: "提交申请",
  submitting: "提交中…",
  success: "提交成功！我们会尽快与您联系。",
  error: "提交失败，请稍后重试。",
};

const en: Copy = {
  sections: {
    applicant: "1. Applicant Information",
    academic: "2. Academic Profile",
    support: "3. Areas of Support Requested",
    guardian: "4. Parent / Guardian Information",
    documents: "5. Supporting Documents",
    background: "6. Student Background",
    parentAssessment: "7. Parent Assessment",
    submission: "8. Additional Information",
  },
  fields: {
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    dateOfBirth: "Date of Birth",
    city: "City",
    state: "State",
    countryOfCitizenship: "Country of Citizenship",
    currentSchool: "Current School",
    currentGradeLevel: "Current Grade Level",
    expectedGraduationYear: "Expected Graduation Year",
    intendedMajor: "Intended Major / Area of Study",
    dreamSchools: "Dream / Target Schools",
    academicSupportNeeded: "Academic Support Needed",
    specialAccommodations: "Special Accommodations",
    otherSupportDetails: "Other support details or priorities",
    primaryGuardianEmail: "Primary Parent / Guardian Email",
    householdStatus: "Household Status",
    motherName: "Mother / Guardian Full Name",
    motherEmail: "Mother / Guardian Email",
    motherPhone: "Mother / Guardian Phone",
    fatherName: "Father / Guardian Full Name",
    fatherEmail: "Father / Guardian Email",
    fatherPhone: "Father / Guardian Phone",
    transcriptFile: "Report Card / Transcript",
    testScoresFile: "PSAT / SAT / ACT Scores",
    hobbiesInterests: "Hobbies and Interests",
    extracurriculars: "Extracurricular Activities",
    studentStrengths: "Student Strengths",
    areasForImprovement: "Areas for Improvement",
    personalChallenges: "Personal Challenges (if any)",
    studentMotivation: "What motivates you to learn, work hard, or reach your goals?",
    parentViewStrengths: "What do you see as your child's greatest strengths?",
    parentViewGrowthAreas: "What areas would you most like your child to improve or grow in?",
    parentViewMotivation: "What motivates your child?",
    parentViewChallenges: "Any personal circumstances, family considerations, or challenges we should be aware of?",
    coachingGoals: "What are your main goals or expectations for college coaching?",
    communityImpactGoals: "How would you like your child to contribute to the community or make a positive impact?",
    referralName: "Referral Name (if applicable)",
    otherSource: "Other Source",
  },
  supportOptions: [
    { value: "college_coaching", label: "College Coaching" },
    { value: "grad_school", label: "Graduate School Application" },
    { value: "scholarship", label: "Scholarship Application" },
    { value: "career_advising", label: "Career Advising / Internship" },
    { value: "college_transfer", label: "College Transfer" },
    { value: "passion_projects", label: "Passion Projects / Independent Projects" },
    { value: "financial_planning", label: "Financial Planning / College Funding Guidance" },
    { value: "other", label: "Other" },
  ],
  hearOptions: [
    { value: "wechat", label: "WeChat" },
    { value: "google", label: "Google" },
    { value: "referral", label: "Referral" },
    { value: "social", label: "Facebook / Instagram" },
    { value: "event", label: "Event / Seminar" },
    { value: "other", label: "Other" },
  ],
  submit: "Submit Application",
  submitting: "Submitting…",
  success: "Submitted! We'll be in touch soon.",
  error: "Submission failed. Please try again.",
};

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500";
const labelClass = "block text-xs font-semibold text-gray-600 mb-1";

function TextField({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input type={type} name={name} required={required} className={inputClass} />
    </div>
  );
}

function TextArea({ name, label }: { name: string; label: string }) {
  return (
    <div className="md:col-span-2">
      <label className={labelClass}>{label}</label>
      <textarea name={name} rows={3} className={inputClass} />
    </div>
  );
}

export default function CollegeCoachingForm({ locale }: { locale: string }) {
  const c = locale === "en" ? en : zh;
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Capture the form element before the first `await` — React nulls out
    // `e.currentTarget` once the synthetic event's dispatch finishes, which
    // happens as soon as this handler yields. Reading it afterward throws,
    // and that throw was being swallowed by the catch below and silently
    // flipping a successful submission to an "error" status.
    const form = e.currentTarget;
    setStatus("submitting");
    const formData = new FormData(form);
    formData.set("locale", locale);
    try {
      const res = await fetch("/api/college-coaching/submit", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center flex flex-col items-center gap-3">
        <CheckCircle className="h-10 w-10 text-green-600" />
        <p className="text-lg font-semibold text-yellow-900">{c.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <Section title={c.sections.applicant}>
        <TextField name="fullName" label={c.fields.fullName} required />
        <TextField name="email" label={c.fields.email} type="email" required />
        <TextField name="phone" label={c.fields.phone} />
        <TextField name="dateOfBirth" label={c.fields.dateOfBirth} type="date" />
        <TextField name="city" label={c.fields.city} />
        <TextField name="state" label={c.fields.state} />
        <TextField name="countryOfCitizenship" label={c.fields.countryOfCitizenship} />
      </Section>

      <Section title={c.sections.academic}>
        <TextField name="currentSchool" label={c.fields.currentSchool} />
        <TextField name="currentGradeLevel" label={c.fields.currentGradeLevel} />
        <TextField name="expectedGraduationYear" label={c.fields.expectedGraduationYear} />
        <TextField name="intendedMajor" label={c.fields.intendedMajor} />
        <TextArea name="dreamSchools" label={c.fields.dreamSchools} />
        <TextArea name="academicSupportNeeded" label={c.fields.academicSupportNeeded} />
        <TextArea name="specialAccommodations" label={c.fields.specialAccommodations} />
      </Section>

      <Section title={c.sections.support}>
        <div className="md:col-span-2 flex flex-wrap gap-3">
          {c.supportOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-1.5 text-sm bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5"
            >
              <input type="checkbox" name="supportAreas" value={opt.value} />
              {opt.label}
            </label>
          ))}
        </div>
        <TextArea name="otherSupportDetails" label={c.fields.otherSupportDetails} />
      </Section>

      <Section title={c.sections.guardian}>
        <TextField name="primaryGuardianEmail" label={c.fields.primaryGuardianEmail} type="email" />
        <TextField name="householdStatus" label={c.fields.householdStatus} />
        <TextField name="motherName" label={c.fields.motherName} />
        <TextField name="motherEmail" label={c.fields.motherEmail} type="email" />
        <TextField name="motherPhone" label={c.fields.motherPhone} />
        <TextField name="fatherName" label={c.fields.fatherName} />
        <TextField name="fatherEmail" label={c.fields.fatherEmail} type="email" />
        <TextField name="fatherPhone" label={c.fields.fatherPhone} />
      </Section>

      <Section title={c.sections.documents}>
        <div>
          <label className={labelClass}>{c.fields.transcriptFile}</label>
          <input type="file" name="transcriptFile" className="text-sm" />
        </div>
        <div>
          <label className={labelClass}>{c.fields.testScoresFile}</label>
          <input type="file" name="testScoresFile" className="text-sm" />
        </div>
      </Section>

      <Section title={c.sections.background}>
        <TextArea name="hobbiesInterests" label={c.fields.hobbiesInterests} />
        <TextArea name="extracurriculars" label={c.fields.extracurriculars} />
        <TextArea name="studentStrengths" label={c.fields.studentStrengths} />
        <TextArea name="areasForImprovement" label={c.fields.areasForImprovement} />
        <TextArea name="personalChallenges" label={c.fields.personalChallenges} />
        <TextArea name="studentMotivation" label={c.fields.studentMotivation} />
      </Section>

      <Section title={c.sections.parentAssessment}>
        <TextArea name="parentViewStrengths" label={c.fields.parentViewStrengths} />
        <TextArea name="parentViewGrowthAreas" label={c.fields.parentViewGrowthAreas} />
        <TextArea name="parentViewMotivation" label={c.fields.parentViewMotivation} />
        <TextArea name="parentViewChallenges" label={c.fields.parentViewChallenges} />
        <TextArea name="coachingGoals" label={c.fields.coachingGoals} />
        <TextArea name="communityImpactGoals" label={c.fields.communityImpactGoals} />
      </Section>

      <Section title={c.sections.submission}>
        <div className="md:col-span-2 flex flex-wrap gap-3">
          {c.hearOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-1.5 text-sm bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5"
            >
              <input type="checkbox" name="hearAboutUs" value={opt.value} />
              {opt.label}
            </label>
          ))}
        </div>
        <TextField name="referralName" label={c.fields.referralName} />
        <TextField name="otherSource" label={c.fields.otherSource} />
      </Section>

      {status === "error" && (
        <p className="text-sm text-red-600 text-center">{c.error}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-yellow-700 hover:bg-yellow-800 disabled:opacity-60 text-white font-semibold rounded-lg px-6 py-3 text-base transition self-center"
      >
        {status === "submitting" ? c.submitting : c.submit}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-5 sm:p-6">
      <h2 className="text-lg font-bold text-yellow-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </div>
  );
}
