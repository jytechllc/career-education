import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "@/lib/i18n";
import MarkdownReport, { readReport } from "@/components/MarkdownReport";

const content = readReport("accounting-phd-plan.zh.md");

const TITLE = "会计专业博士方向规划建议书";
const DESCRIPTION =
  "会计专业学生的会计学博士（Accounting PhD）就学与就业方案：读博衔接路径、研究方向、博士目标院校推荐名单（冲刺 / 主申 / 保底）、博士毕业后的就业方向与身份路线，以及从大二到绿卡的年份时间表。";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: TITLE, description: DESCRIPTION };
}

export default async function AccountingPhdPlanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <MarkdownReport
      locale={locale}
      eyebrow="JYEdu 杰圆教育 · 专业方向规划 · 博士方向"
      title={TITLE}
      description={DESCRIPTION}
      content={content}
      pdfHref="/reports/accounting-phd-plan.pdf"
      pdfName="会计专业博士方向规划建议书.pdf"
      related={{ href: "/accounting-us-plan", label: "查看就业方向版本" }}
      cta={{ href: "/phd-admission", label: "了解 PhD 申请服务" }}
    />
  );
}
