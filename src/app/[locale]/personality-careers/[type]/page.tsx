import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Check, X } from "lucide-react";
import { hasLocale, locales, type Locale } from "@/lib/i18n";
import {
  getPersonalityType,
  personalityTypes,
  temperaments,
  typesByTemperament,
} from "@/lib/personality-careers";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    personalityTypes.map((t) => ({ locale, type: t.code.toLowerCase() })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}): Promise<Metadata> {
  const { locale, type } = await params;
  if (!hasLocale(locale)) return {};
  const t = getPersonalityType(type);
  if (!t) return {};
  const roles = t.careers.flatMap((c) => c.roles).slice(0, 5).join("、");
  return {
    title: `${t.code} ${t.name}适合什么工作？职业推荐 | 杰圆职场教育`,
    description: `${t.code}（${t.name}）的职业推荐：${roles}等。${t.summary}`,
  };
}

export default async function PersonalityCareerDetail({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { locale, type } = await params;
  if (!hasLocale(locale)) notFound();
  const l = locale as Locale;
  const t = getPersonalityType(type);
  if (!t) notFound();

  const group = temperaments[t.temperament];
  const siblings = typesByTemperament(t.temperament).filter((s) => s.code !== t.code);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href={`/${l}/personality-careers`}
        className="inline-flex items-center gap-1 text-sm font-medium text-yellow-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        16 型人格职业推荐
      </Link>

      {l === "en" && (
        <p className="mt-6 text-sm italic text-gray-500">
          This guide is currently available in Chinese only.
        </p>
      )}

      <header className="mt-6 border-b border-yellow-200 pb-8">
        <p className="text-sm font-semibold tracking-wide text-yellow-700">
          {group.name} · {group.letters}
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
          <span className="font-mono">{t.code}</span> {t.name}：适合的职业方向
        </h1>
        <p className="mt-4 text-base text-gray-600 sm:text-lg">{t.summary}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {t.strengths.map((s) => (
            <li
              key={s}
              className="rounded-full bg-yellow-50 px-3 py-1 text-sm text-yellow-800 ring-1 ring-yellow-200"
            >
              {s}
            </li>
          ))}
        </ul>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">什么样的岗位最适合</h2>
        <p className="mt-2 leading-relaxed text-gray-700">{t.fit}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">推荐岗位</h2>
        <div className="mt-4 flex flex-col gap-4">
          {t.careers.map((c) => (
            <div key={c.field} className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-900">{c.field}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {c.roles.map((r) => (
                  <li
                    key={r}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-sm text-gray-800"
                  >
                    <Check className="h-3.5 w-3.5 text-green-700" />
                    {r}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{c.why}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">建议谨慎考虑</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {t.avoid.map((a) => (
            <li key={a} className="flex items-start gap-2 text-gray-700">
              <X className="mt-1 h-4 w-4 shrink-0 text-red-600" />
              {a}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">坚决型（-A）与动荡型（-T）</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-5">
            <p className="font-mono text-sm font-semibold text-yellow-700">{t.code}-A 坚决型</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{t.assertive}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-5">
            <p className="font-mono text-sm font-semibold text-yellow-700">{t.code}-T 动荡型</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{t.turbulent}</p>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-xl border-l-4 border-yellow-500 bg-yellow-50 p-5">
        <h2 className="font-semibold text-gray-900">求职建议</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">{t.tip}</p>
      </section>

      <div className="mt-12 rounded-2xl bg-gradient-to-r from-yellow-600 to-yellow-700 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">把 {t.code} 的优势变成具体的工作机会</h2>
        <p className="mt-3 text-sm text-yellow-100 sm:text-base">
          结合你的学历、技能和目标城市，我们帮你收窄到两三个具体岗位，并改写简历、规划投递。
        </p>
        <Link
          href={`/${l}#contact`}
          className="mt-6 inline-flex items-center rounded-lg bg-white px-8 py-3 font-semibold text-yellow-700 hover:bg-yellow-50"
        >
          预约职业规划
        </Link>
      </div>

      <nav className="mt-12 border-t border-gray-200 pt-6" aria-label="同组类型">
        <p className="text-sm text-gray-500">同属{group.name}的其他类型</p>
        <ul className="mt-3 flex flex-wrap gap-3">
          {siblings.map((s) => (
            <li key={s.code}>
              <Link
                href={`/${l}/personality-careers/${s.code.toLowerCase()}`}
                className="inline-flex items-baseline gap-2 rounded-lg border border-gray-200 px-4 py-2 transition hover:border-yellow-400"
              >
                <span className="font-mono font-semibold text-yellow-700">{s.code}</span>
                <span className="text-sm text-gray-700">{s.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-400">
        16 型人格测试反映的是行为偏好，不是能力评估，也不能预测职业成败。本页内容仅供方向参考。涉及执业资格的岗位，请以国家主管部门当年公布的要求为准。
      </p>
    </main>
  );
}
