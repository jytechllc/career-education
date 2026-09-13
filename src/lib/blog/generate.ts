import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
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
  // AWS credentials resolve from the standard chain (env vars, shared profile,
  // or IAM role). Region from AWS_REGION (fallback us-east-1).
  return new AnthropicBedrock({ awsRegion: process.env.AWS_REGION || "us-east-1" });
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

function buildPrompt(locale: Locale, category: string, brief: string) {
  if (locale === "zh") {
    return `你是「杰圆职场教育」的资深职业规划顾问，为求职者撰写一篇职场资讯博客。

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

  const message = await client().messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [SAVE_POST_TOOL],
    tool_choice: { type: "tool", name: "save_post" },
    messages: [{ role: "user", content: buildPrompt(locale, category, brief) }],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse) throw new Error("model did not return a save_post tool call");
  const gen = toolUse.input as Generated;

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
