import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle,
  ClipboardCheck,
  FileSignature,
  GraduationCap,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { hasLocale } from "@/lib/i18n";

type School = { name: string; rank?: number };

type SchoolGroup = {
  title: string;
  note: string;
  /** Visual weight: the Top 10 group gets large rank cards. */
  style: "top" | "ranked" | "plain";
  schools: School[];
};

type Copy = {
  meta: { title: string; description: string };
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  stats: { value: string; label: string }[];
  schoolsTitle: string;
  schoolsSource: string;
  rankPrefix: string;
  rankSuffix: string;
  groups: SchoolGroup[];
  guarantee: {
    title: string;
    subtitle: string;
    steps: { title: string; body: string }[];
  };
  services: { title: string; items: string[]; link: string };
  disclaimer: string;
  cta: { title: string; body: string; phone: string; wechat: string };
};

const zh: Copy = {
  meta: {
    title: "美国 QS 前 100 名校申请 · 保 Offer 计划 | JYEdu 杰圆教育",
    description:
      "美国 QS 前 100 名校申请计划：麻省理工、斯坦福、哈佛、加州理工等 19 所目标院校。当季未取得目标院校录取的，继续服务后续申请季，不再另收咨询服务费。",
  },
  eyebrow: "美国名校申请 · JYEdu 杰圆教育",
  title: "冲刺美国 QS 前 100，保你拿到 Offer",
  subtitle:
    "从麻省理工、斯坦福、哈佛到卡内基梅隆、杜克，19 所美国名校任你冲刺；当季未取得录取的，继续为你服务，直至下一申请季，不再另收咨询服务费。",
  primaryCta: "立即报名",
  secondaryCta: "查看目标院校",
  stats: [
    { value: "19", label: "所美国目标名校" },
    { value: "4", label: "所 QS 世界前 10" },
    { value: "0", label: "元续服务咨询费" },
  ],
  schoolsTitle: "目标院校",
  schoolsSource: "排名依据：QS 世界大学排名 2026",
  rankPrefix: "第",
  rankSuffix: "名",
  groups: [
    {
      title: "QS 世界前 10",
      note: "全球顶尖，美国共 4 所",
      style: "top",
      schools: [
        { name: "麻省理工学院", rank: 1 },
        { name: "斯坦福大学", rank: 3 },
        { name: "哈佛大学", rank: 5 },
        { name: "加州理工学院", rank: 10 },
      ],
    },
    {
      title: "其他前列名校",
      note: "QS 世界前 25",
      style: "ranked",
      schools: [
        { name: "芝加哥大学", rank: 13 },
        { name: "宾夕法尼亚大学", rank: 15 },
        { name: "康奈尔大学", rank: 16 },
        { name: "加州大学伯克利分校", rank: 17 },
        { name: "耶鲁大学", rank: 21 },
        { name: "约翰霍普金斯大学", rank: 24 },
        { name: "普林斯顿大学", rank: 25 },
      ],
    },
    {
      title: "更多可选名校",
      note: "同属 QS 世界前 100",
      style: "plain",
      schools: [
        { name: "哥伦比亚大学" },
        { name: "加州大学洛杉矶分校" },
        { name: "密歇根大学" },
        { name: "西北大学" },
        { name: "纽约大学" },
        { name: "卡内基梅隆大学" },
        { name: "杜克大学" },
        { name: "德克萨斯大学奥斯汀分校" },
      ],
    },
  ],
  guarantee: {
    title: "保 Offer 如何兑现",
    subtitle: "保障范围在签约前评估确定，并写入服务协议",
    steps: [
      {
        title: "免费背景评估",
        body: "根据成绩、标化考试与科研实习背景，评估可冲刺的院校区间。",
      },
      {
        title: "签约锁定院校清单",
        body: "双方在服务协议中确认目标院校清单与申请项目数量。",
      },
      {
        title: "未录取，继续服务",
        body: "当季未取得清单内任一院校录取的，在满足协议约定配合条件的前提下，继续服务后续申请季，不再另收咨询服务费。",
      },
    ],
  },
  services: {
    title: "服务内容",
    items: [
      "数据驱动选校定位",
      "资深文书顾问团队撰写，资深导师终审",
      "专属申请导师一对一跟进",
      "网申填写与材料递交",
      "真人模拟面试",
      "全程跟进至录取结果",
    ],
    link: "查看服务档位与价格",
  },
  disclaimer:
    "院校录取与否的最终决定权在目标院校。本计划所称「保 Offer」，是指上述「未录取则续服务、不另收咨询服务费」的承诺，具体保障范围与条件以签署的服务协议为准。院校申请费、标准化考试报名费等第三方费用由学生/家庭直接支付。",
  cta: {
    title: "预约免费背景评估",
    body: "告诉我们你的专业、成绩和目标院校，顾问为你评估可冲刺的院校区间",
    phone: "电话：17318011997",
    wechat: "微信：HELENLAN998",
  },
};

const en: Copy = {
  meta: {
    title: "US QS Top 100 Admissions · Offer Guarantee | JYEdu",
    description:
      "Admissions program for 19 US universities in the QS World Top 100, including MIT, Stanford, Harvard and Caltech. If no offer comes through that season, we keep working on later seasons at no extra counselling fee.",
  },
  eyebrow: "US Admissions · JYEdu",
  title: "Aim for the US QS Top 100 — with an offer guarantee",
  subtitle:
    "From MIT, Stanford and Harvard to Carnegie Mellon and Duke — 19 US universities to aim for. No offer that season? We keep working with you into the next one, at no extra counselling fee.",
  primaryCta: "Sign up",
  secondaryCta: "See the universities",
  stats: [
    { value: "19", label: "target US universities" },
    { value: "4", label: "in the QS World Top 10" },
    { value: "$0", label: "counselling fee for extra seasons" },
  ],
  schoolsTitle: "Target universities",
  schoolsSource: "Rankings: QS World University Rankings 2026",
  rankPrefix: "#",
  rankSuffix: "",
  groups: [
    {
      title: "QS World Top 10",
      note: "The 4 US universities in the global top 10",
      style: "top",
      schools: [
        { name: "MIT", rank: 1 },
        { name: "Stanford University", rank: 3 },
        { name: "Harvard University", rank: 5 },
        { name: "Caltech", rank: 10 },
      ],
    },
    {
      title: "Also near the top",
      note: "QS World Top 25",
      style: "ranked",
      schools: [
        { name: "University of Chicago", rank: 13 },
        { name: "University of Pennsylvania", rank: 15 },
        { name: "Cornell University", rank: 16 },
        { name: "UC Berkeley", rank: 17 },
        { name: "Yale University", rank: 21 },
        { name: "Johns Hopkins University", rank: 24 },
        { name: "Princeton University", rank: 25 },
      ],
    },
    {
      title: "More options",
      note: "Also in the QS World Top 100",
      style: "plain",
      schools: [
        { name: "Columbia University" },
        { name: "UCLA" },
        { name: "University of Michigan" },
        { name: "Northwestern University" },
        { name: "New York University" },
        { name: "Carnegie Mellon University" },
        { name: "Duke University" },
        { name: "UT Austin" },
      ],
    },
  ],
  guarantee: {
    title: "How the guarantee works",
    subtitle: "Coverage is set after an assessment and written into the service agreement",
    steps: [
      {
        title: "Free profile assessment",
        body: "We review your grades, test scores, research and internships to set a realistic range of target schools.",
      },
      {
        title: "Agree the school list",
        body: "The service agreement names the target universities and the number of programs.",
      },
      {
        title: "No offer? We keep going",
        body: "If no listed university admits you that season, we continue into later seasons at no extra counselling fee, subject to the conditions in the agreement.",
      },
    ],
  },
  services: {
    title: "What's included",
    items: [
      "Data-driven school selection",
      "Essays by senior writers, final review by a senior advisor",
      "A dedicated 1-on-1 admissions advisor",
      "Online applications and submission",
      "Live mock interviews",
      "Support through to final decisions",
    ],
    link: "See packages and pricing",
  },
  disclaimer:
    "Admission decisions rest solely with the universities. The \"offer guarantee\" means the commitment above — continued service at no extra counselling fee if no offer is secured — and its exact scope and conditions are set by the signed service agreement. Application, test and other third-party fees are paid directly by the student/family.",
  cta: {
    title: "Book a free profile assessment",
    body: "Share your field, grades and target schools and an advisor will assess which schools you can aim for",
    phone: "Phone: 17318011997",
    wechat: "WeChat: HELENLAN998",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = locale === "en" ? en : zh;

  return { title: c.meta.title, description: c.meta.description };
}

const stepIcons = [ClipboardCheck, FileSignature, RefreshCw];

function SchoolGroupBlock({ group, c }: { group: SchoolGroup; c: Copy }) {
  const rank = (n: number) => `${c.rankPrefix}${n}${c.rankSuffix}`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold text-yellow-900">{group.title}</h3>
        <p className="text-sm text-gray-500">{group.note}</p>
      </div>

      {group.style === "top" ? (
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {group.schools.map((s) => (
            <li
              key={s.name}
              className="rounded-xl bg-yellow-900 p-4 sm:p-5 text-yellow-50 shadow-lg"
            >
              <p className="text-xs font-medium text-yellow-300">QS</p>
              <p className="text-3xl sm:text-4xl font-bold tabular-nums">
                {s.rank !== undefined ? rank(s.rank) : null}
              </p>
              <p className="mt-2 text-sm sm:text-base font-semibold">{s.name}</p>
            </li>
          ))}
        </ul>
      ) : group.style === "ranked" ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {group.schools.map((s) => (
            <li
              key={s.name}
              className="flex items-center justify-between gap-3 rounded-lg border border-yellow-100 bg-white px-4 py-3 shadow-sm"
            >
              <span className="text-sm font-medium text-gray-800">{s.name}</span>
              {s.rank !== undefined ? (
                <span className="shrink-0 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 tabular-nums">
                  QS {rank(s.rank)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {group.schools.map((s) => (
            <li
              key={s.name}
              className="rounded-full border border-yellow-200 bg-white px-3.5 py-1.5 text-sm text-gray-800"
            >
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function UsTop100Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const c = locale === "en" ? en : zh;

  return (
    <div className="min-h-screen bg-yellow-50">
      <section className="bg-gradient-to-b from-yellow-900 to-yellow-800 text-yellow-50">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide text-yellow-300 mb-4">
            <GraduationCap className="h-4 w-4" />
            {c.eyebrow}
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4 sm:mb-6">{c.title}</h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-yellow-100">{c.subtitle}</p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400 px-6 py-3 text-base font-semibold text-yellow-950 hover:bg-yellow-300"
            >
              {c.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#schools"
              className="inline-flex items-center rounded-full border border-yellow-300/60 px-6 py-3 text-base font-medium text-yellow-50 hover:bg-yellow-50/10"
            >
              {c.secondaryCta}
            </a>
          </div>

          <dl className="mx-auto mt-10 sm:mt-14 grid max-w-3xl grid-cols-3 gap-3 sm:gap-6">
            {c.stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-yellow-50/10 px-2 py-4 sm:py-5">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block text-3xl sm:text-4xl font-bold text-yellow-300 tabular-nums">
                    {s.value}
                  </span>
                  <span className="mt-1 block text-xs sm:text-sm text-yellow-100">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <section id="schools" className="scroll-mt-20 mb-12 sm:mb-16">
          <div className="mb-6 sm:mb-8 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-yellow-900">{c.schoolsTitle}</h2>
            <p className="text-xs sm:text-sm text-gray-500">{c.schoolsSource}</p>
          </div>
          <div className="space-y-8 sm:space-y-10">
            {c.groups.map((g) => (
              <SchoolGroupBlock key={g.title} c={c} group={g} />
            ))}
          </div>
        </section>

        <section className="mb-12 sm:mb-16 rounded-xl bg-white p-5 sm:p-8 shadow-lg">
          <div className="mb-6 sm:mb-8">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-yellow-700">
              <ShieldCheck className="h-4 w-4" />
              Offer
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-yellow-900">
              {c.guarantee.title}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">{c.guarantee.subtitle}</p>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {c.guarantee.steps.map((step, i) => {
              const Icon = stepIcons[i];
              return (
                <li
                  key={step.title}
                  className={`rounded-lg p-5 ${
                    i === 2 ? "bg-yellow-900 text-yellow-50" : "bg-yellow-50 text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                        i === 2 ? "bg-yellow-400 text-yellow-950" : "bg-yellow-600 text-white"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Icon
                      aria-hidden
                      className={`h-5 w-5 ${i === 2 ? "text-yellow-300" : "text-yellow-600"}`}
                    />
                  </div>
                  <h3
                    className={`mt-3 text-base sm:text-lg font-bold ${
                      i === 2 ? "text-yellow-50" : "text-yellow-900"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className={`mt-1.5 text-sm leading-relaxed ${i === 2 ? "text-yellow-100" : ""}`}>
                    {step.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mb-8 sm:mb-12 rounded-xl border border-yellow-100 bg-white p-5 sm:p-8 shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold text-yellow-900 mb-5">{c.services.title}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {c.services.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm sm:text-base text-gray-800">
                <Check aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            className="mt-6 inline-flex items-center gap-1 rounded-full bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
            href={`/${locale}/graduate-admission`}
          >
            {c.services.link}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8 sm:mb-12 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{c.disclaimer}</p>
        </div>

        <section
          id="contact"
          className="scroll-mt-20 bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-yellow-900">
            {c.cta.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">{c.cta.body}</p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
            <a href="tel:17318011997" className="flex items-center space-x-2">
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              <span className="text-sm sm:text-base text-gray-700">{c.cta.phone}</span>
            </a>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              <p className="text-sm sm:text-base text-gray-700">{c.cta.wechat}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
