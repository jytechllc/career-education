import "server-only";

import { BEDROCK_MODEL, bedrock } from "./bedrock";

/**
 * Resume → student profile. The model fills a field only when the resume
 * states it; anything else comes back null for the counsellor to complete.
 * Nothing is inferred (no gender from a name, no age from graduation years).
 */

export const PROFILE_FIELDS = [
  "name",
  "gender",
  "age",
  "masterSchool",
  "phdSchool",
  "specialties",
  "targetRoles",
  "visa",
  "hobbies",
] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number];

export const RESUME_TYPES: Record<string, "document" | "image"> = {
  "application/pdf": "document",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
};

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export interface ExtractedProfile {
  /** False for transcripts, offer letters, contracts, job descriptions… */
  isResume: boolean;
  name: string | null;
  gender: string | null;
  age: number | null;
  masterSchool: string | null;
  phdSchool: string | null;
  specialties: string | null;
  targetRoles: string | null;
  visa: string | null;
  hobbies: string | null;
  email: string | null;
  phone: string | null;
  redactedResumeMd: string;
}

const nullableString = (description: string) => ({
  type: ["string", "null"],
  description,
});

const SAVE_PROFILE_TOOL = {
  name: "save_profile",
  description: "Save the student profile extracted from the resume.",
  input_schema: {
    type: "object" as const,
    properties: {
      is_resume: {
        type: "boolean",
        description: "附件是不是这位学生本人的简历/CV。成绩单、offer letter、合同、岗位描述（JD）、论文、证书、面经等都不是简历，返回 false，此时其余字段一律返回 null，redacted_resume_md 返回空字符串。",
      },
      name: nullableString("简历上写的姓名，按原文。"),
      gender: nullableString("只有简历明确写了性别时才填（如「性别：女」「Gender: Male」），填「男」或「女」或原文。不得根据姓名、照片或代词推断，否则为 null。"),
      age: { type: ["integer", "null"], description: "只有简历明确写了年龄时才填。不得根据毕业年份推断。" },
      birth_date: nullableString("只有简历明确写了出生日期时才填，格式 YYYY-MM-DD 或 YYYY-MM。"),
      master_school: nullableString("硕士学校：学校、专业、起止时间或在读状态，学校名保持原文。简历没有硕士学历则为 null。"),
      phd_school: nullableString("博士学校：同上。没有博士学历则为 null。"),
      specialties: nullableString("工作特长的专业：根据简历中的经历和技能归纳 2–4 个方向，每行一个，用中文，每行后可附关键技能。方向和技能名称只能用简历原文出现过的词，不得补充简历没写的技术名词。"),
      target_roles: nullableString("只有简历写了求职意向/Objective/目标岗位时才填，按原意。否则为 null。"),
      visa: nullableString("只有简历写了签证或工作许可时才填（如 F-1、OPT、H-1B、绿卡、无需担保）。否则为 null。"),
      hobbies: nullableString("只有简历写了兴趣爱好时才填。否则为 null。"),
      email: nullableString("简历上的邮箱。"),
      phone: nullableString("简历上的电话。"),
      redacted_resume_md: {
        type: "string",
        description:
          "脱敏后的完整简历，Markdown。逐字保留原文语言和措辞，不改写、不润色、不增删经历；只去掉：姓名、电话、邮箱、住址及个人所在城市行、LinkedIn/GitHub/个人网站等所有链接、微信/QQ 等账号、出生日期、证件号、照片、推荐人姓名和联系方式。用 ## 作为栏目标题，- 作为条目，**粗体** 用于公司/学校行。",
      },
    },
    required: [
      "is_resume",
      "name",
      "gender",
      "age",
      "birth_date",
      "master_school",
      "phd_school",
      "specialties",
      "target_roles",
      "visa",
      "hobbies",
      "email",
      "phone",
      "redacted_resume_md",
    ],
  },
};

const PROMPT = `你是杰圆教育的学生档案助理。附件是一位学生的简历。请从简历中提取学生档案，并通过 save_profile 工具返回。

规则（必须遵守）：
- 只填写简历中明确写出的信息。简历没写的字段一律返回 null，不要猜测、推断或用常识补全。
- 性别不得根据姓名、照片、代词推断；年龄不得根据入学或毕业年份推断。
- 求职意向、签证、兴趣爱好只有简历明确写出时才填。
- 「工作特长的专业」是唯一允许归纳的字段，但只能基于简历中实际出现的经历和技能，技能名称照搬原文，不要添加简历里没有的术语（例如简历没写 RAG 就不要写 RAG）。
- 脱敏简历必须完整保留教育、经历、项目、技能等内容，只删除可识别个人身份的信息。`;

type ToolInput = {
  is_resume: boolean;
  name: string | null;
  gender: string | null;
  age: number | null;
  birth_date: string | null;
  master_school: string | null;
  phd_school: string | null;
  specialties: string | null;
  target_roles: string | null;
  visa: string | null;
  hobbies: string | null;
  email: string | null;
  phone: string | null;
  redacted_resume_md: string;
};

const clean = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();

  return s && !/^(null|n\/a|无|未提供|none|unknown|<unknown>|未知)$/i.test(s) ? s : null;
};

/** Whole years from a stated birth date (YYYY-MM or YYYY-MM-DD); null otherwise. */
function ageFrom(birth: string | null, now = new Date()): number | null {
  const m = birth?.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);

  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3] ?? 1)];
  let age = now.getFullYear() - y;

  if (now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d)) age--;

  return age > 0 && age < 100 ? age : null;
}

export async function extractProfile(bytes: Buffer, mime: string): Promise<ExtractedProfile> {
  const kind = RESUME_TYPES[mime];

  if (!kind) throw new Error(`unsupported resume type ${mime}`);
  const data = bytes.toString("base64");
  const attachment =
    kind === "document"
      ? ({ type: "document", source: { type: "base64", media_type: "application/pdf", data } } as const)
      : ({
          type: "image",
          source: { type: "base64", media_type: mime as "image/png" | "image/jpeg" | "image/webp", data },
        } as const);

  const message = await bedrock().messages.create({
    model: BEDROCK_MODEL,
    max_tokens: 8192,
    tools: [SAVE_PROFILE_TOOL],
    tool_choice: { type: "tool", name: "save_profile" },
    messages: [{ role: "user", content: [attachment, { type: "text", text: PROMPT }] }],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");

  if (!toolUse) throw new Error("model did not return a save_profile tool call");
  const r = toolUse.input as ToolInput;
  const stated = typeof r.age === "number" && r.age > 0 && r.age < 100 ? r.age : null;
  const profile = {
    name: clean(r.name),
    gender: clean(r.gender),
    age: stated ?? ageFrom(clean(r.birth_date)),
    masterSchool: clean(r.master_school),
    phdSchool: clean(r.phd_school),
    specialties: clean(r.specialties),
    targetRoles: clean(r.target_roles),
    visa: clean(r.visa),
    hobbies: clean(r.hobbies),
    email: clean(r.email),
    phone: clean(r.phone),
  };

  return {
    isResume: r.is_resume !== false,
    ...profile,
    redactedResumeMd: scrubPii(r.redacted_resume_md ?? "", profile),
  };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Safety net behind the model's redaction: strip anything that still looks
 * like contact details, plus the student's own name, email and phone.
 */
export function scrubPii(
  md: string,
  known: { name?: string | null; email?: string | null; phone?: string | null },
): string {
  let out = md
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "")
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "")
    .replace(/\b(?:linkedin\.com|github\.com|gitlab\.com)\/\S*/gi, "")
    // +1 (949) 231-9954, 949-231-9954, 949.231.9954, 13800138000
    .replace(/(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, "")
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, "");

  const digits = known.phone?.replace(/\D/g, "");

  if (digits && digits.length >= 7) out = out.split(digits).join("");
  if (known.email) out = out.split(known.email).join("");

  const name = known.name?.trim();

  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const variants = new Set([name, [...parts].reverse().join(" ")]);

    for (const v of variants) out = out.replace(new RegExp(escapeRe(v), "gi"), "");
    for (const p of parts) {
      if (/^[A-Za-z]{3,}$/.test(p)) out = out.replace(new RegExp(`\\b${escapeRe(p)}\\b`, "gi"), "");
    }
  }

  // Tidy separators and blank lines left behind by removed items.
  return out
    .split("\n")
    .map((l) => l.replace(/(\s*[|｜·•,，]\s*)+$/g, "").replace(/^(\s*[|｜·•,，]\s*)+/g, "").trimEnd())
    .filter((l, i, a) => l.trim() !== "" || (i > 0 && a[i - 1].trim() !== ""))
    .join("\n")
    .trim();
}

/** Public code shown in place of the student's name, e.g. JY-S0007. */
export const profileCode = (id: number) => `JY-S${String(id).padStart(4, "0")}`;
