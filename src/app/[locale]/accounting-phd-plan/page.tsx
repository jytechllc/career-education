import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "@/lib/i18n";
import MarkdownReport, { readReport } from "@/components/MarkdownReport";

const content = readReport("accounting-phd-plan.zh.md");

const TITLE = "会计专业博士方向规划建议书";
const DESCRIPTION =
  "会计学博士（Accounting PhD）路线：读什么、为什么对国际学生身份确定性最高、录取门槛与风险、本科准备清单、三条申博路径、目标院校梯队，以及从大二到绿卡的时间线。";

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
