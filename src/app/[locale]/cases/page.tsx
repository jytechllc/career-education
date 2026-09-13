import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FileText,
  TrendingUp,
  ArrowRight,
  Globe,
  Briefcase,
} from "lucide-react";
import { hasLocale } from "@/lib/i18n";

interface CaseItem {
  title: string;
  description: string;
  path: string;
  Icon: typeof TrendingUp;
  tags: string[];
  color: "yellow" | "blue";
}

const colorStyles = {
  yellow: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    hoverBorder: "hover:border-yellow-400",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    tagBg: "bg-yellow-100",
    tagText: "text-yellow-800",
    buttonBg: "bg-yellow-600",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    hoverBorder: "hover:border-blue-400",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    tagBg: "bg-blue-100",
    tagText: "text-blue-800",
    buttonBg: "bg-blue-600",
  },
};

const COPY = {
  zh: {
    title: "案例研究",
    subtitle: "探索我们的专业报告和指南，助您在全球职场中获得成功",
    detail: "查看详情",
    ctaTitle: "需要个性化的职业指导？",
    ctaSubtitle: "我们的专业团队为您提供一对一的职业规划咨询服务",
    ctaButton: "立即联系我们",
  },
  en: {
    title: "Case Studies",
    subtitle: "Explore our reports and guides to succeed in the global job market.",
    detail: "Read more",
    ctaTitle: "Need 1-on-1 career guidance?",
    ctaSubtitle: "Our team offers personalized career planning consultations.",
    ctaButton: "Contact Us",
  },
} as const;

const CASES: Record<"zh" | "en", CaseItem[]> = {
  zh: [
    {
      title: "悉尼就业市场分析报告",
      description:
        "深入了解 2024 年悉尼就业市场的最新趋势，包括热门行业分析、薪资水平、就业趋势与机遇，以及成功案例分享。",
      path: "/sydney-industry-report",
      Icon: TrendingUp,
      tags: ["澳洲", "就业市场", "行业分析"],
      color: "yellow",
    },
    {
      title: "新加坡工作签证申请全攻略",
      description:
        "2026 最新新加坡工作签证指南，详解 EP、SP、ONE Pass 等 6 种签证类型的申请条件、薪资要求和完整流程。",
      path: "/singapore-work-visa-guide",
      Icon: Globe,
      tags: ["新加坡", "工作签证", "移民指南"],
      color: "blue",
    },
  ],
  en: [
    {
      title: "Sydney Job Market Report",
      description:
        "An in-depth look at the 2024 Sydney job market — top industries, salary ranges, trends, and success stories.",
      path: "/sydney-industry-report",
      Icon: TrendingUp,
      tags: ["Australia", "Job Market", "Industry"],
      color: "yellow",
    },
    {
      title: "Singapore Work Visa Guide",
      description:
        "2026 Singapore work-visa guide. Eligibility, salary thresholds, and step-by-step process for EP, SP, ONE Pass, and more.",
      path: "/singapore-work-visa-guide",
      Icon: Globe,
      tags: ["Singapore", "Work Visa", "Immigration"],
      color: "blue",
    },
  ],
};

export default async function CasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const copy = COPY[locale];
  const cases = CASES[locale];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-yellow-100 rounded-full mb-6">
            <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {copy.title}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            {copy.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {cases.map((c, index) => {
            const style = colorStyles[c.color];
            const Icon = c.Icon;
            return (
              <Link
                key={index}
                href={`/${locale}${c.path}`}
                className={`block group ${style.bg} rounded-2xl border-2 ${style.border} ${style.hoverBorder} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden`}
              >
                <div className="p-6 sm:p-8">
                  <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 ${style.iconBg} rounded-xl mb-6 ${style.iconColor}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-yellow-700 transition-colors">
                    {c.title}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
                    {c.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {c.tags.map((tag, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${style.tagBg} ${style.tagText}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className={`inline-flex items-center px-5 py-2.5 rounded-lg ${style.buttonBg} text-white font-medium transition-colors group-hover:opacity-90`}>
                    {copy.detail}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 sm:mt-24 max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-2xl shadow-xl p-8 sm:p-12 text-center text-white">
            <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-6 text-yellow-200" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{copy.ctaTitle}</h2>
            <p className="text-yellow-100 mb-8 text-sm sm:text-base">
              {copy.ctaSubtitle}
            </p>
            <Link
              href={`/${locale}#contact`}
              className="inline-flex items-center bg-white text-yellow-700 px-8 py-3.5 rounded-lg font-semibold hover:bg-yellow-50 transition-all duration-300 shadow-lg"
            >
              {copy.ctaButton}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
