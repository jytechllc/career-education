import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Download } from "lucide-react";
import { hasLocale } from "@/lib/i18n";

// Authored in-repo (source: docs/student-plans/), rendered as-is so the web
// version and the downloadable PDF stay in sync.
const content = fs.readFileSync(
  path.join(process.cwd(), "content", "reports", "accounting-us-plan.zh.md"),
  "utf-8",
);

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
  return { title: TITLE, description: DESCRIPTION };
}

export default async function AccountingUsPlanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <main className="mx-auto w-full min-w-0 max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href={`/${locale}/cases`}
        className="inline-flex items-center gap-1 text-sm font-medium text-yellow-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to Case Studies" : "返回案例库"}
      </Link>

      {locale === "en" && (
        <p className="mt-6 text-sm italic text-gray-500">
          This report is currently available in Chinese only.
        </p>
      )}

      <header className="mt-6 border-b border-yellow-200 pb-8">
        <p className="text-sm font-semibold tracking-wide text-yellow-700">
          JYEdu 杰圆教育 · 专业方向规划
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
          {TITLE}
        </h1>
        <p className="mt-4 text-base text-gray-600 sm:text-lg">{DESCRIPTION}</p>
        <a
          href="/reports/accounting-us-plan.pdf"
          download="会计专业方向规划建议书.pdf"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-5 py-2.5 font-medium text-white hover:bg-yellow-700"
        >
          <Download className="h-4 w-4" />
          下载 PDF 版
        </a>
      </header>

      <article className="prose prose-yellow mt-8 min-w-0 max-w-none break-words prose-headings:font-semibold prose-a:text-yellow-700 prose-table:text-sm prose-th:bg-yellow-50">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table>{children}</table>
              </div>
            ),
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>

      <div className="mt-12 rounded-2xl bg-gradient-to-r from-yellow-600 to-yellow-700 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">需要为孩子做一份个性化规划？</h2>
        <p className="mt-3 text-sm text-yellow-100 sm:text-base">
          我们根据学生的成绩、专业与目标，提供一对一的专业方向与选校规划。
        </p>
        <Link
          href={`/${locale}#contact`}
          className="mt-6 inline-flex items-center rounded-lg bg-white px-8 py-3 font-semibold text-yellow-700 hover:bg-yellow-50"
        >
          联系我们
        </Link>
      </div>
    </main>
  );
}
