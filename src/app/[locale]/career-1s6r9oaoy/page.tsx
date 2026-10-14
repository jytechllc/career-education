import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "@/lib/i18n";
import MarkdownReport, { readReport } from "@/components/MarkdownReport";
import meta from "../../../../content/reports/career-1s6r9oaoy.meta.json";

// Individual client report: shared by direct link only, so it stays out of
// the case library and search engines.
const content = readReport("career-1s6r9oaoy.zh.md");

const TITLE = meta.title;
const DESCRIPTION =
  "ISFP-T 探险家型、目前从事陌陌直播的客户转行规划：性格画像、可迁移能力、六个推荐方向，以及三个月行动计划。";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return {
    title: TITLE,
    description: DESCRIPTION,
    robots: { index: false, follow: false },
  };
}

export default async function Career1s6r9oaoyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <MarkdownReport
      locale={locale}
      eyebrow="JYCareer 杰圆求职 · 职业规划报告 · 编号 1s6r9oaoy"
      title={TITLE}
      description={DESCRIPTION}
      content={content}
      pdfHref="/reports/career-1s6r9oaoy.pdf"
      pdfName="主播转行职业规划报告.pdf"
      cta={{
        href: "#contact",
        label: "联系顾问",
        heading: "补充信息后，我们帮你细化到具体岗位",
        body: "把报告末尾的信息发给你的顾问，我们会给出目标岗位、简历改写稿和投递策略。",
      }}
    />
  );
}
