import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Compass } from "lucide-react";
import { hasLocale, locales, type Locale } from "@/lib/i18n";
import {
  temperaments,
  typesByTemperament,
  type TemperamentKey,
} from "@/lib/personality-careers";

const TITLE = "16 型人格职业推荐";
const DESCRIPTION =
  "按 16 型人格（MBTI 类型）整理的职业方向参考：每种类型适合的岗位、适合原因、需要谨慎的岗位，以及坚决型（A）与动荡型（T）的差异。按中国就业市场撰写。";

const ORDER: TemperamentKey[] = ["NT", "NF", "SJ", "SP"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: `${TITLE} | 杰圆职场教育`, description: DESCRIPTION };
}

export default async function PersonalityCareersIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const l = locale as Locale;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {l === "en" && (
        <p className="mb-6 text-sm italic text-gray-500">
          This guide is currently available in Chinese only.
        </p>
      )}

      <header className="mb-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-medium text-yellow-800">
          <Compass className="h-4 w-4" />
          职业规划 · 性格与岗位
        </span>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">{TITLE}</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-gray-600">
          找到你的四字母类型，看看哪些岗位更适合你的性格、为什么适合，以及哪些岗位需要谨慎。
          类型结尾的 -A（坚决型）和 -T（动荡型）不改变适合的方向，但会影响你更适合什么样的团队和节奏。
        </p>
      </header>

      <div className="flex flex-col gap-12">
        {ORDER.map((key) => {
          const group = temperaments[key];
          return (
            <section key={key} aria-labelledby={`group-${key}`}>
              <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-yellow-200 pb-3">
                <h2 id={`group-${key}`} className="text-xl font-bold text-gray-900">
                  {group.name}
                </h2>
                <span className="font-mono text-sm text-yellow-700">{group.letters}</span>
                <p className="w-full text-sm text-gray-600 sm:w-auto">{group.summary}</p>
              </div>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {typesByTemperament(key).map((t) => (
                  <li key={t.code}>
                    <Link
                      href={`/${l}/personality-careers/${t.code.toLowerCase()}`}
                      className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-yellow-400 hover:shadow-lg"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-yellow-700">
                          {t.code}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{t.name}</span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-gray-600">
                        {t.careers
                          .flatMap((c) => c.roles)
                          .slice(0, 4)
                          .join(" · ")}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-yellow-700">
                        查看职业推荐
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="mt-14 rounded-2xl bg-gradient-to-r from-yellow-600 to-yellow-800 px-6 py-10 text-center text-white">
        <h2 className="text-2xl font-bold">想把性格结果变成具体的求职方向？</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-yellow-50">
          性格只说明偏好。我们会结合你的学历、技能、城市和收入目标，给出具体岗位、简历改写和投递策略。
        </p>
        <Link
          href={`/${l}#contact`}
          className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-50"
        >
          预约职业规划
        </Link>
      </section>

      <p className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-400">
        16 型人格测试反映的是行为偏好，不是能力评估，也不能预测职业成败。本页内容仅供方向参考，具体选择应结合个人兴趣、能力与实际机会。
        涉及执业资格的岗位，请以国家主管部门当年公布的要求为准。
      </p>
    </main>
  );
}
