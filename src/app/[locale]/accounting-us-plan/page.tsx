import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "@/lib/i18n";
import { zhOnlyMeta } from "@/lib/seo";
import MarkdownReport, { readReport } from "@/components/MarkdownReport";

const content = readReport("accounting-us-plan.zh.md");

const TITLE = "会计专业留美规划建议书";
const DESCRIPTION =
  "会计专业国际学生的美国就业与长期身份路径：专业组合、STEM OPT 与 H-1B 加权抽签、美国高校选校名单（顶校 / 就业强校 / 性价比），以及硕士与博士在就业和留美上的比较。";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: TITLE, description: DESCRIPTION, ...zhOnlyMeta("/accounting-us-plan") };
}

export default async function AccountingUsPlanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <MarkdownReport
      locale={locale}
      eyebrow="JYEdu 杰圆教育 · 专业方向规划 · 就业方向"
      title={TITLE}
      description={DESCRIPTION}
      content={content}
      pdfHref="/reports/accounting-us-plan.pdf"
      pdfName="会计专业方向规划建议书.pdf"
      related={{ href: "/accounting-phd-plan", label: "查看博士方向版本" }}
    />
  );
}
