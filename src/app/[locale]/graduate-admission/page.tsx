import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle,
  GraduationCap,
  MessageSquare,
  Microscope,
  Phone,
  Star,
  X,
} from "lucide-react";

import { hasLocale } from "@/lib/i18n";

type Row = {
  label: string;
  /** null renders as "not included". */
  value: string | null;
  /** Long-term-only items, tinted like a feature callout. */
  plus?: boolean;
};

type Tier = {
  name: string;
  price: string;
  tagline: string;
  badge?: string;
  featured?: boolean;
  rows: Row[];
};

type Copy = {
  meta: { title: string; description: string };
  eyebrow: string;
  title: string;
  subtitle: string;
  currency: string;
  notIncluded: string;
  tiers: Tier[];
  phd: {
    eyebrow: string;
    name: string;
    price: string;
    currency: string;
    tagline: string;
    points: string[];
    addons: string;
    link: string;
  };
  timeline: {
    title: string;
    years: { name: string; focus: string }[];
    tracks: { name: string; steps: (string | null)[] }[];
  };
  exclusion: string;
  disclaimer: string;
  cta: { title: string; body: string; phone: string; wechat: string };
};

const zh: Copy = {
  meta: {
    title: "研究生与直博留学申请服务与价格 | JYEdu 杰圆教育",
    description:
      "研究生留学申请三档服务：申请助力 ¥88,000、超级 VIP ¥128,000、长线规划 VIP ¥158,000；另有本科直博（全额资助 PhD）申请服务 ¥180,000。",
  },
  eyebrow: "研究生留学申请 · JYEdu 杰圆教育",
  title: "研究生留学申请服务",
  subtitle: "硕士申请三档服务，从申请季冲刺到大一起的四年规划；另有本科直博服务",
  currency: "人民币",
  notIncluded: "不含",
  tiers: [
    {
      name: "申请助力",
      price: "¥88,000",
      tagline: "申请季辅导 · 1 个专业 8 个项目",
      rows: [
        { label: "服务周期", value: "申请季辅导" },
        { label: "专业数量", value: "1" },
        { label: "项目数量", value: "8" },
        { label: "服务模式", value: "全程辅导" },
        { label: "选课规划", value: null },
        { label: "GPA 跟踪", value: null },
        { label: "标化辅导", value: null },
        { label: "背景提升", value: null },
        { label: "简历打磨", value: "申请季精修" },
        { label: "推荐信", value: null },
        { label: "选校指导", value: "数据驱动选校定位" },
        { label: "文书团队", value: "资深文书顾问团队" },
        { label: "申请导师", value: "专属申请导师" },
        { label: "网申辅导", value: "网申填写" },
        { label: "面试辅导", value: "面试题库与辅导" },
        { label: "结果跟进", value: "全程跟进至录取结果" },
      ],
    },
    {
      name: "超级 VIP",
      price: "¥128,000",
      tagline: "名校定向冲刺 · 资深导师全程督导 · 1 段实习",
      badge: "推荐",
      featured: true,
      rows: [
        { label: "服务周期", value: "全程辅导" },
        { label: "专业数量", value: "不限" },
        { label: "项目数量", value: "10" },
        { label: "服务模式", value: "全程辅导" },
        { label: "选课规划", value: "前置课建议" },
        { label: "GPA 跟踪", value: null },
        { label: "标化辅导", value: "标化考试备考资料" },
        { label: "背景提升", value: "实习 / 科研项目 × 1 段" },
        { label: "简历打磨", value: "申请季精修" },
        { label: "推荐信", value: "推荐信产出" },
        { label: "选校指导", value: "数据驱动选校定位" },
        { label: "文书团队", value: "资深文书顾问团队 · 资深导师终审" },
        { label: "申请导师", value: "资深申请导师 + 合伙人督导" },
        { label: "网申辅导", value: "网申填写" },
        { label: "面试辅导", value: "真人模拟面试" },
        { label: "结果跟进", value: "全程跟进至录取结果" },
      ],
    },
    {
      name: "长线规划 VIP",
      price: "¥158,000",
      tagline: "大一入学起全程规划 · 2 段实习 · 一路负责到申请",
      badge: "旗舰 · 四年全程",
      rows: [
        { label: "服务周期", value: "大一至大四全程", plus: true },
        { label: "专业数量", value: "不限" },
        { label: "项目数量", value: "10" },
        { label: "服务模式", value: "全程辅导 + 每学期 1v1 复盘", plus: true },
        { label: "选课规划", value: "四年选课框架 + 前置课衔接", plus: true },
        { label: "GPA 跟踪", value: "每学期成绩复盘与选课调整", plus: true },
        { label: "标化辅导", value: "GRE 备考规划 + 备考资料", plus: true },
        { label: "背景提升", value: "实习 / 科研项目 × 2 段", plus: true },
        { label: "简历打磨", value: "大二起持续更新 + 申请季精修", plus: true },
        { label: "推荐信", value: "推荐人提前布局 + 推荐信产出", plus: true },
        { label: "选校指导", value: "数据驱动选校定位" },
        { label: "文书团队", value: "资深文书顾问团队 · 资深导师终审" },
        { label: "申请导师", value: "资深申请导师 + 合伙人督导" },
        { label: "网申辅导", value: "网申填写" },
        { label: "面试辅导", value: "真人模拟面试" },
        { label: "结果跟进", value: "全程跟进至录取结果" },
      ],
    },
  ],
  phd: {
    eyebrow: "本科直博",
    name: "全额资助 PhD 申请",
    price: "¥180,000",
    currency: "人民币",
    tagline: "本科毕业直接申请博士，目标是全球名校全额资助录取",
    points: [
      "约 6 个月、三个阶段：明确研究方向 → 打造竞争力档案 → 全程申请支持",
      "研究导师匹配、教授与实验室定向联系、科研背景强化",
      "个人陈述、推荐信策略、奖学金与资金规划、面试辅导、行前指导",
      "当季未取得 Top 100 全额资助录取的，在满足合同约定配合条件的前提下继续服务后续申请季，不再另收咨询服务费",
    ],
    addons: "可选：GRE 备考辅导 ¥30,000；论文写作/发表协助 ¥30,000 / 篇",
    link: "查看直博服务详情",
  },
  timeline: {
    title: "服务覆盖周期",
    years: [
      { name: "大一", focus: "探索与打底" },
      { name: "大二", focus: "选择与形成" },
      { name: "大三", focus: "全面备战" },
      { name: "大四", focus: "申请执行" },
    ],
    tracks: [
      {
        name: "长线规划 VIP",
        steps: [
          "方向探索 · 选课框架",
          "定专业 · 首段实习",
          "进阶实习 · GRE",
          "选校 · 文书 · 递交 · 面试",
        ],
      },
      {
        name: "超级 VIP · 申请助力",
        steps: [null, null, "申请季启动 · 实习 · 选校", "文书 · 网申 · 面试"],
      },
    ],
  },
  exclusion:
    "以上费用不含院校申请费、标准化考试报名费、成绩寄送费等第三方费用，该等费用由学生/家庭直接支付给相关机构。具体服务内容以签署的服务协议为准。",
  disclaimer:
    "本服务提供的是升学咨询与申请支持，我们将尽最大努力（Best Efforts）为学生服务；实习与科研项目以实际匹配到的机会为准。院校录取与否的最终决定权在目标院校，不作任何保证或承诺。",
  cta: {
    title: "预约一对一咨询",
    body: "根据你的年级、专业和目标院校，推荐合适的服务档位",
    phone: "电话：17318011997",
    wechat: "微信：HELENLAN998",
  },
};

const en: Copy = {
  meta: {
    title: "Graduate & Direct-PhD Admissions Services and Pricing | JYEdu",
    description:
      "Three master's admissions packages: Application Boost ¥88,000, Super VIP ¥128,000 and Long-Term VIP ¥158,000 — plus a direct-PhD (fully funded) admissions program at ¥180,000.",
  },
  eyebrow: "Graduate Admissions · JYEdu",
  title: "Graduate Admissions Services",
  subtitle: "Three master's packages, from an application-season sprint to four-year planning — plus a direct-PhD program",
  currency: "RMB",
  notIncluded: "Not included",
  tiers: [
    {
      name: "Application Boost",
      price: "¥88,000",
      tagline: "Application season · 1 field, 8 programs",
      rows: [
        { label: "Service period", value: "Application season" },
        { label: "Fields", value: "1" },
        { label: "Programs", value: "8" },
        { label: "Service model", value: "End-to-end support" },
        { label: "Course planning", value: null },
        { label: "GPA tracking", value: null },
        { label: "Test prep", value: null },
        { label: "Profile building", value: null },
        { label: "Résumé", value: "Application-season polish" },
        { label: "Recommendations", value: null },
        { label: "School selection", value: "Data-driven school list" },
        { label: "Essay team", value: "Senior essay consultants" },
        { label: "Advisor", value: "Dedicated application advisor" },
        { label: "Online applications", value: "Form completion" },
        { label: "Interview prep", value: "Question bank & coaching" },
        { label: "Outcome follow-up", value: "Through admission decisions" },
      ],
    },
    {
      name: "Super VIP",
      price: "¥128,000",
      tagline: "Top-school sprint · senior advisor oversight · 1 internship",
      badge: "Recommended",
      featured: true,
      rows: [
        { label: "Service period", value: "End-to-end" },
        { label: "Fields", value: "Unlimited" },
        { label: "Programs", value: "10" },
        { label: "Service model", value: "End-to-end support" },
        { label: "Course planning", value: "Prerequisite advice" },
        { label: "GPA tracking", value: null },
        { label: "Test prep", value: "Test prep materials" },
        { label: "Profile building", value: "Internship / research × 1" },
        { label: "Résumé", value: "Application-season polish" },
        { label: "Recommendations", value: "Letters produced" },
        { label: "School selection", value: "Data-driven school list" },
        { label: "Essay team", value: "Senior consultants · senior advisor final review" },
        { label: "Advisor", value: "Senior advisor + partner oversight" },
        { label: "Online applications", value: "Form completion" },
        { label: "Interview prep", value: "Live mock interviews" },
        { label: "Outcome follow-up", value: "Through admission decisions" },
      ],
    },
    {
      name: "Long-Term VIP",
      price: "¥158,000",
      tagline: "Planning from freshman year · 2 internships · through applications",
      badge: "Flagship · 4 years",
      rows: [
        { label: "Service period", value: "Freshman to senior year", plus: true },
        { label: "Fields", value: "Unlimited" },
        { label: "Programs", value: "10" },
        { label: "Service model", value: "End-to-end + 1:1 review each term", plus: true },
        { label: "Course planning", value: "4-year course map + prerequisites", plus: true },
        { label: "GPA tracking", value: "Grade review & course adjustments each term", plus: true },
        { label: "Test prep", value: "GRE plan + materials", plus: true },
        { label: "Profile building", value: "Internship / research × 2", plus: true },
        { label: "Résumé", value: "Updated from sophomore year + final polish", plus: true },
        { label: "Recommendations", value: "Recommenders planned early + letters", plus: true },
        { label: "School selection", value: "Data-driven school list" },
        { label: "Essay team", value: "Senior consultants · senior advisor final review" },
        { label: "Advisor", value: "Senior advisor + partner oversight" },
        { label: "Online applications", value: "Form completion" },
        { label: "Interview prep", value: "Live mock interviews" },
        { label: "Outcome follow-up", value: "Through admission decisions" },
      ],
    },
  ],
  phd: {
    eyebrow: "Direct PhD",
    name: "Fully Funded PhD Admissions",
    price: "¥180,000",
    currency: "RMB",
    tagline: "Apply to PhD programs straight from undergrad, aiming for fully funded offers at top universities",
    points: [
      "About 6 months in three phases: research direction → competitive profile → full application support",
      "Research mentor matching, targeted outreach to professors and labs, research strengthening",
      "Statement of purpose, recommendation strategy, scholarship and funding planning, interview prep, pre-departure guidance",
      "If no Top 100 fully funded offer is secured that season, service continues into later seasons at no extra counselling fee, subject to the conditions in the agreement",
    ],
    addons: "Optional: GRE prep ¥30,000; research paper writing/publication support ¥30,000 per paper",
    link: "See the direct-PhD program",
  },
  timeline: {
    title: "Coverage by year",
    years: [
      { name: "Freshman", focus: "Explore & build basics" },
      { name: "Sophomore", focus: "Choose & take shape" },
      { name: "Junior", focus: "Full preparation" },
      { name: "Senior", focus: "Apply" },
    ],
    tracks: [
      {
        name: "Long-Term VIP",
        steps: [
          "Direction · course map",
          "Major · first internship",
          "Advanced internship · GRE",
          "Schools · essays · submit · interview",
        ],
      },
      {
        name: "Super VIP · Application Boost",
        steps: [null, null, "Kick-off · internship · schools", "Essays · applications · interviews"],
      },
    ],
  },
  exclusion:
    "Fees exclude application fees, test registration and score-report fees and other third-party costs, which the student/family pays directly. The signed service agreement governs the exact scope.",
  disclaimer:
    "We provide admissions counselling and application support on a best-efforts basis; internships and research projects depend on the opportunities actually matched. Admission decisions rest solely with the universities — no outcome is guaranteed or promised.",
  cta: {
    title: "Book a 1-on-1 Consultation",
    body: "We'll recommend a package based on your year, field and target schools",
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

function TierCard({ tier, c }: { tier: Tier; c: Copy }) {
  return (
    <div
      className={`relative flex flex-col rounded-xl bg-white shadow-lg ${
        tier.featured ? "border-2 border-yellow-500 lg:-mt-3 lg:mb-3" : "border border-yellow-100"
      }`}
    >
      {tier.badge ? (
        <span
          className={`absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
            tier.featured ? "bg-yellow-500 text-white" : "bg-yellow-900 text-yellow-50"
          }`}
        >
          <Star className="h-3 w-3" />
          {tier.badge}
        </span>
      ) : null}

      <div className="border-b border-yellow-100 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-yellow-900">{tier.name}</h2>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-bold text-yellow-900 tabular-nums">
            {tier.price}
          </span>
          <span className="text-xs font-medium text-gray-500">{c.currency}</span>
        </p>
        <p className="mt-2 text-sm text-gray-600">{tier.tagline}</p>
      </div>

      <dl className="flex-1 divide-y divide-yellow-50 px-5 sm:px-6 py-2">
        {tier.rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-start justify-between gap-4 py-2.5 text-sm ${
              row.plus ? "-mx-2 rounded-md bg-yellow-50 px-2" : ""
            }`}
          >
            <dt className="shrink-0 font-medium text-yellow-800">{row.label}</dt>
            <dd className="text-right text-gray-800">
              {row.value === null ? (
                <span className="inline-flex items-center gap-1 text-gray-400">
                  <X aria-hidden className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">{c.notIncluded}</span>
                </span>
              ) : (
                <span className="inline-flex items-start gap-1">
                  {row.plus ? (
                    <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                  ) : null}
                  {row.value}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function GraduateAdmissionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const c = locale === "en" ? en : zh;

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="text-center mb-10 sm:mb-14">
          <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide text-yellow-700 mb-3">
            <GraduationCap className="h-4 w-4" />
            {c.eyebrow}
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-yellow-900 mb-3 sm:mb-4">
            {c.title}
          </h1>
          <p className="text-base sm:text-xl text-gray-600">{c.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-16">
          {c.tiers.map((tier) => (
            <TierCard key={tier.name} c={c} tier={tier} />
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-4 sm:mb-6">
            {c.timeline.title}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-2 text-sm">
              <thead>
                <tr>
                  <th className="w-40" />
                  {c.timeline.years.map((y) => (
                    <th
                      key={y.name}
                      className="rounded-lg bg-yellow-50 px-3 py-3 text-center font-normal"
                    >
                      <div className="text-base font-bold text-yellow-900">{y.name}</div>
                      <div className="text-xs text-gray-500">{y.focus}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.timeline.tracks.map((track, ti) => (
                  <tr key={track.name}>
                    <th className="pr-2 text-left text-sm font-semibold text-yellow-800">
                      {track.name}
                    </th>
                    {track.steps.map((step, i) => (
                      <td
                        key={i}
                        className={`rounded-lg px-3 py-2.5 text-center text-xs sm:text-sm ${
                          step === null
                            ? "border border-dashed border-yellow-200 text-gray-300"
                            : ti === 0
                              ? "bg-yellow-800 font-medium text-white"
                              : "bg-yellow-400 font-medium text-yellow-950"
                        }`}
                      >
                        {step ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-yellow-100 p-5 sm:p-8 mb-8 sm:mb-12 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-yellow-700">
              <Microscope className="h-4 w-4" />
              {c.phd.eyebrow}
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-yellow-900">{c.phd.name}</h2>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-bold text-yellow-900 tabular-nums">
                {c.phd.price}
              </span>
              <span className="text-xs font-medium text-gray-500">{c.phd.currency}</span>
            </p>
            <p className="mt-2 text-sm text-gray-600">{c.phd.tagline}</p>
            <Link
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
              href={`/${locale}/phd-admission`}
            >
              {c.phd.link}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div>
            <ul className="space-y-2.5">
              {c.phd.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2 text-sm text-gray-800">
                  <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                  {pt}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-yellow-100 pt-3 text-xs sm:text-sm text-gray-600">
              {c.phd.addons}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8 sm:mb-12 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-2">
            <p>{c.exclusion}</p>
            <p>{c.disclaimer}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-yellow-900">
            {c.cta.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">{c.cta.body}</p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              <p className="text-sm sm:text-base text-gray-700">{c.cta.phone}</p>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              <p className="text-sm sm:text-base text-gray-700">{c.cta.wechat}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
