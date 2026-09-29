import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";

// Long-form reports authored in-repo under content/reports/ (sources and PDF
// build live in docs/student-plans/), rendered as-is so the web version and
// the downloadable PDF stay in sync.
export function readReport(file: string) {
  return fs.readFileSync(
    path.join(process.cwd(), "content", "reports", file),
    "utf-8",
  );
}

type Props = {
  locale: string;
  eyebrow: string;
  title: string;
  description: string;
  content: string;
  pdfHref: string;
  pdfName: string;
  related?: { href: string; label: string };
  cta?: { href: string; label: string };
};

export default function MarkdownReport({
  locale,
  eyebrow,
  title,
  description,
  content,
  pdfHref,
  pdfName,
  related,
  cta,
}: Props) {
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
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base text-gray-600 sm:text-lg">{description}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            href={pdfHref}
            download={pdfName}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-5 py-2.5 font-medium text-white hover:bg-yellow-700"
          >
            <Download className="h-4 w-4" />
            下载 PDF 版
          </a>
          {related && (
            <Link
              href={`/${locale}${related.href}`}
              className="inline-flex items-center gap-1 font-medium text-yellow-700 hover:underline"
            >
              {related.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
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
          href={`/${locale}${cta?.href ?? "#contact"}`}
          className="mt-6 inline-flex items-center rounded-lg bg-white px-8 py-3 font-semibold text-yellow-700 hover:bg-yellow-50"
        >
          {cta?.label ?? "联系我们"}
        </Link>
      </div>
    </main>
  );
}
