import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "@/lib/i18n";
import MarkdownReport, { readReport } from "@/components/MarkdownReport";
// Written by docs/student-plans/publish.py from the report's H1, so the
// edition year in the title follows the data (e.g. "（2025）" -> "（2026）").
import meta from "../../../../content/reports/china-us-study-market.meta.json";

const content = readReport("china-us-study-market.zh.md");

const TITLE = meta.title;
const DESCRIPTION =
  "高中、本科、硕士、博士分层统计：在美中国学生的规模与趋势、能否赴美读高中和本科、专业分布、费用与奖学金、留美情况，以及目的地竞争与签证政策环境。数据来自 Open Doors、NSF、SEVIS、College Board 等官方来源。";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: TITLE, description: DESCRIPTION };
}

export default async function ChinaUsStudyMarketPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <MarkdownReport
      locale={locale}
      eyebrow="JYEdu 杰圆教育 · 市场研究"
      title={TITLE}
      description={DESCRIPTION}
      content={content}
      pdfHref="/reports/china-us-study-market.pdf"
      pdfName="中国学生赴美留学市场研究报告.pdf"
    />
  );
}
