import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "@/lib/i18n";
import MarkdownReport, { readReport } from "@/components/MarkdownReport";

const content = readReport("performing-arts-funding.zh.md");

const TITLE = "舞蹈与表演专业：美国研究生全额奖学金指南";
const DESCRIPTION =
  "美国舞蹈、表演 MFA 与 PhD 的全额资助项目，奖学金之外的生活补贴，职业发展与收入数据，以及 O-1B 艺术人才签证、大学教职等留美路径与概率估算。";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: TITLE, description: DESCRIPTION };
}

export default async function PerformingArtsFundingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <MarkdownReport
      locale={locale}
      eyebrow="JYEdu 杰圆教育 · 艺术类留学指南"
      title={TITLE}
      description={DESCRIPTION}
      content={content}
      pdfHref="/reports/performing-arts-funding.pdf"
      pdfName="舞蹈表演研究生全额奖学金指南.pdf"
    />
  );
}
