import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, type Post } from "@/lib/schema";
import { pickTopic, topicLabel } from "./topics";
import type { Locale } from "@/lib/i18n";

// Claude on Amazon Bedrock. Model IDs are anthropic.-prefixed; cross-region
// inference profiles (us./eu./apac.) are the on-demand-invokable form.
// Override per account/region via BEDROCK_MODEL_ID.
const MODEL =
  process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-sonnet-4-6";

function client() {
  // On Vercel, AWS_ROLE_ARN is set: the Vercel OIDC token is exchanged for
  // short-lived credentials for that role (no stored keys). Locally it is
  // unset and credentials resolve from the standard chain (AWS_PROFILE).
  // Region from AWS_REGION (fallback us-east-1).
  const roleArn = process.env.AWS_ROLE_ARN;
  return new AnthropicBedrock({
    awsRegion: process.env.AWS_REGION || "us-east-1",
    ...(roleArn && {
      providerChainResolver: async () => awsCredentialsProvider({ roleArn }),
    }),
  });
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "post"
  );
}

// The model has no clock: without today's date it frames "current" trends in
// its training-era year (a 2026 post went out titled "2024热门行业…").
function today() {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
  );
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/**
 * A past year named without this year (or the next) alongside it, i.e. a stale
 * "current" framing. Comparisons like "2024 vs 2026" are fine.
 */
function staleYear(text: string, year: number): string | null {
  const years = (text.match(/20\d{2}/g) ?? []).map(Number);
  if (years.some((y) => y >= year)) return null;
  const past = years.find((y) => y < year);
  return past ? String(past) : null;
}

function buildPrompt(locale: Locale, category: string, brief: string) {
  const { year, month, day } = today();
  if (locale === "zh") {
    return `你是「杰圆职场教育」的资深职业规划顾问，为求职者撰写一篇职场资讯博客。

今天是 ${year} 年 ${month} 月 ${day} 日。内容要反映当下（${year} 年）的求职环境；标题和摘要如出现年份，只能写 ${year} 或 ${year + 1}（展望），可以拿往年做对比，但不得只写往年、把往年当作「今年」或「最新」。

主题分类：${category}
本期角度：${brief}

要求：
- 用简体中文写作，语气专业、务实、对求职者有实际帮助。
- 内容为「常青」分析与可操作建议，不要编造具体的统计数字、百分比、日期或来源；如需提及数据，用"通常""普遍""多数情况下"等定性表述。
- 结构清晰，使用 Markdown：2-4 个 ## 小标题，含要点列表，结尾给出一段「实操建议」。
- 约 600-900 字。

通过 save_post 工具返回结果（slug 用英文 kebab-case，3-6 个词）。`;
  }
  return `You are a senior career advisor at "JY Career". Write a job-market blog post for job seekers.

Today is ${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}. Reflect the job market as of ${year}; if the title or summary names a year, it must be ${year} or ${year + 1} (outlook). Comparing with earlier years is fine, but never name only an earlier year or present it as "this year" or "latest".

Category: ${category}
Angle for this issue: ${brief}

Requirements:
- Write in English, professional, practical, genuinely useful to job seekers.
- Keep it evergreen and advisory. Do NOT fabricate specific statistics, percentages, dates or sources; use qualitative phrasing ("typically", "in most cases") instead.
- Clear structure in Markdown: 2-4 ## headings with bullet lists, ending with an "Actionable takeaway" paragraph.
- About 600-900 words.

Return the result via the save_post tool (slug in english kebab-case, 3-6 words).`;
}

type Generated = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
};

const SAVE_POST_TOOL = {
  name: "save_post",
  description: "Save the generated blog post.",
  input_schema: {
    type: "object" as const,
    properties: {
      slug: { type: "string", description: "english kebab-case, 3-6 words" },
      title: { type: "string" },
      summary: { type: "string", description: "one or two sentences" },
      content: { type: "string", description: "Markdown body" },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["slug", "title", "summary", "content", "tags"],
  },
};

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(sql`${posts.slug} = ${slug}`)
      .limit(1);
    if (existing.length === 0) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

/** Generate one blog post for `locale` and persist it. Returns the saved row. */
export async function generatePost(locale: Locale = "zh"): Promise<Post> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(sql`${posts.locale} = ${locale}`);

  const topic = pickTopic(count ?? 0);
  const { category, brief } = topicLabel(topic, locale);

  const { year } = today();
  let gen: Generated | undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const message = await client().messages.create({
      model: MODEL,
      max_tokens: 4096,
      tools: [SAVE_POST_TOOL],
      tool_choice: { type: "tool", name: "save_post" },
      messages: [{ role: "user", content: buildPrompt(locale, category, brief) }],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse) throw new Error("model did not return a save_post tool call");
    gen = toolUse.input as Generated;
    const stale = staleYear(`${gen.title ?? ""} ${gen.summary ?? ""}`, year);
    if (!stale) break;
    if (attempt === 3) throw new Error(`title/summary still names past year ${stale}: ${gen.title}`);
  }
  if (!gen) throw new Error("no post generated");

  const baseSlug = slugify(gen.slug || gen.title);
  const slug = await uniqueSlug(baseSlug);

  const [row] = await db
    .insert(posts)
    .values({
      slug,
      locale,
      title: gen.title?.trim() || category,
      summary: gen.summary?.trim() || null,
      content: gen.content?.trim() || "",
      category,
      topic: topic.key,
      tags: Array.isArray(gen.tags) ? gen.tags.slice(0, 6) : [],
      source: "bedrock",
      model: MODEL,
    })
    .returning();

  return row;
}
