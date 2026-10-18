import type { CollegeCoachingApplication } from "./schema";

/**
 * Editable fields of a college-coaching application, grouped as on the intake
 * form. Used by the staff edit page (/admin/applications/[id]/edit) and its
 * server action, which only writes keys listed here.
 */

export type AppFieldKind = "text" | "email" | "date" | "long" | "list";

export interface AppField {
  key: keyof CollegeCoachingApplication;
  zh: string;
  en: string;
  kind: AppFieldKind;
  required?: boolean;
}

export const APPLICATION_SECTIONS: { zh: string; en: string; fields: AppField[] }[] = [
  {
    zh: "学生信息",
    en: "Applicant",
    fields: [
      { key: "fullName", zh: "姓名", en: "Full name", kind: "text", required: true },
      { key: "email", zh: "邮箱", en: "Email", kind: "email", required: true },
      { key: "phone", zh: "电话", en: "Phone", kind: "text" },
      { key: "dateOfBirth", zh: "出生日期", en: "Date of birth", kind: "date" },
      { key: "city", zh: "城市", en: "City", kind: "text" },
      { key: "state", zh: "州 / 省", en: "State", kind: "text" },
      { key: "countryOfCitizenship", zh: "国籍", en: "Country of citizenship", kind: "text" },
    ],
  },
  {
    zh: "学业情况",
    en: "Academic profile",
    fields: [
      { key: "currentSchool", zh: "当前学校", en: "Current school", kind: "text" },
      { key: "currentGradeLevel", zh: "年级", en: "Grade level", kind: "text" },
      { key: "expectedGraduationYear", zh: "预计毕业年份", en: "Expected graduation", kind: "text" },
      { key: "intendedMajor", zh: "意向专业", en: "Intended major", kind: "text" },
      { key: "dreamSchools", zh: "梦校", en: "Dream schools", kind: "long" },
      { key: "academicSupportNeeded", zh: "需要的学业支持", en: "Academic support needed", kind: "long" },
      { key: "specialAccommodations", zh: "特殊安排", en: "Special accommodations", kind: "long" },
      { key: "supportAreas", zh: "申请的服务（逗号分隔）", en: "Support areas (comma-separated)", kind: "list" },
      { key: "otherSupportDetails", zh: "其他服务说明", en: "Other support details", kind: "long" },
    ],
  },
  {
    zh: "家长 / 监护人",
    en: "Parent / guardian",
    fields: [
      { key: "primaryGuardianEmail", zh: "主要监护人邮箱", en: "Primary guardian email", kind: "email" },
      { key: "householdStatus", zh: "家庭情况", en: "Household status", kind: "text" },
      { key: "motherName", zh: "母亲姓名", en: "Mother's name", kind: "text" },
      { key: "motherEmail", zh: "母亲邮箱", en: "Mother's email", kind: "email" },
      { key: "motherPhone", zh: "母亲电话", en: "Mother's phone", kind: "text" },
      { key: "fatherName", zh: "父亲姓名", en: "Father's name", kind: "text" },
      { key: "fatherEmail", zh: "父亲邮箱", en: "Father's email", kind: "email" },
      { key: "fatherPhone", zh: "父亲电话", en: "Father's phone", kind: "text" },
    ],
  },
  {
    zh: "学生背景",
    en: "Student background",
    fields: [
      { key: "hobbiesInterests", zh: "兴趣爱好", en: "Hobbies & interests", kind: "long" },
      { key: "extracurriculars", zh: "课外活动", en: "Extracurriculars", kind: "long" },
      { key: "studentStrengths", zh: "优势", en: "Strengths", kind: "long" },
      { key: "areasForImprovement", zh: "待提升", en: "Areas for improvement", kind: "long" },
      { key: "personalChallenges", zh: "个人挑战", en: "Personal challenges", kind: "long" },
      { key: "studentMotivation", zh: "动机", en: "Motivation", kind: "long" },
    ],
  },
  {
    zh: "家长评估",
    en: "Parent assessment",
    fields: [
      { key: "parentViewStrengths", zh: "孩子的优势（家长）", en: "Strengths (parent view)", kind: "long" },
      { key: "parentViewGrowthAreas", zh: "成长空间（家长）", en: "Growth areas (parent view)", kind: "long" },
      { key: "parentViewMotivation", zh: "动机（家长）", en: "Motivation (parent view)", kind: "long" },
      { key: "parentViewChallenges", zh: "挑战（家长）", en: "Challenges (parent view)", kind: "long" },
      { key: "coachingGoals", zh: "辅导目标", en: "Coaching goals", kind: "long" },
      { key: "communityImpactGoals", zh: "社区影响目标", en: "Community impact goals", kind: "long" },
    ],
  },
  {
    zh: "来源",
    en: "Source",
    fields: [
      { key: "hearAboutUs", zh: "了解渠道（逗号分隔）", en: "Heard about us (comma-separated)", kind: "list" },
      { key: "referralName", zh: "推荐人", en: "Referral name", kind: "text" },
      { key: "otherSource", zh: "其他来源", en: "Other source", kind: "text" },
    ],
  },
];

export const APPLICATION_FIELDS = APPLICATION_SECTIONS.flatMap((s) => s.fields);

/** Form value as stored: trimmed text, null when empty, lists split on commas. */
export function parseAppField(f: AppField, raw: string): string | string[] | null {
  const v = raw.trim();

  if (f.kind === "list") {
    const items = v.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean);

    return items.length ? items : null;
  }
  if (f.kind === "date") return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;

  return v || null;
}

export function formatAppField(f: AppField, value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");

  return String(value);
}
