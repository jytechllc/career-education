import { notFound } from "next/navigation";
import {
  Briefcase,
  DollarSign,
  Award,
  Building,
  Phone,
  Users,
  CheckCircle,
  FileText,
  Clock,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { hasLocale } from "@/lib/i18n";

const visaTypes = [
  {
    name: "EP (Employment Pass)",
    Icon: Award,
    target: "高级专业人才、管理者",
    salary: "≥ S$5,600（金融业 ≥ S$6,200）",
    validity: "2 年，可续签",
    conditions: [
      "大学本科或专业资格",
      "COMPASS 评分系统需 ≥40 分",
      "2026 年起薪资门槛上调",
    ],
  },
  {
    name: "SP (Skilled Pass)",
    Icon: UserCheck,
    target: "中阶技术人才",
    salary: "≥ S$3,300（金融业 ≥ S$3,800）",
    validity: "2 年，可续签",
    conditions: ["有学历要求", "公司有配额限制", "服务业 10%、制造业 15% 等"],
  },
  {
    name: "ONE Pass",
    Icon: TrendingUp,
    target: "顶尖人才",
    salary: "≥ S$30,000 或有杰出成就",
    validity: "5 年，可续签",
    conditions: [
      "海外人士需 1 年工作经验",
      "不与雇主绑定",
      "适合行业领袖级人才",
    ],
  },
  {
    name: "PEP (Personalized EP)",
    Icon: FileText,
    target: "高级专业人士",
    salary: "≥ S$22,500",
    validity: "3 年，不可续签",
    conditions: [
      "最后一次领薪 6 个月内申请",
      "有身份限制（如自由职业者不可）",
      "适合高收入专业人士",
    ],
  },
  {
    name: "WP (Work Permit)",
    Icon: Briefcase,
    target: "基础劳工（特定行业）",
    salary: "无具体要求",
    validity: "2 年，可续签",
    conditions: [
      "年龄 18-50 岁",
      "限于特定行业（建筑、制造、海事等）",
      "不能申请永久居民（PR）",
    ],
  },
  {
    name: "EntrePass",
    Icon: Building,
    target: "创业者/投资者",
    salary: "需满足投资条件",
    validity: "1 年，可续签",
    conditions: [
      "满足创业/创新/投资标准",
      "如融资 SGD 100k",
      "续签需持有 30% 股权",
    ],
  },
];

const requirements = [
  {
    title: "工作签证必要性",
    content:
      "外国人不能在没有工作准证的情况下在新加坡工作。必须申请相应的工作签证（准证）才能合法工作。",
    Icon: CheckCircle,
  },
  {
    title: "雇主担保",
    content:
      "大多数工作准证需要新加坡雇主作为担保人。雇主需要为您提交申请并满足相关配额要求。",
    Icon: Users,
  },
  {
    title: "薪资门槛",
    content:
      "2026 年起，EP 准证月薪门槛已提高至至少 5600 新元，金融服务业需达到 6200 新元以上。",
    Icon: DollarSign,
  },
  {
    title: "学历要求",
    content:
      "EP 和 SP 准证都有学历要求。知名大学学位持有者在 COMPASS 评分系统中会获得更高分数。",
    Icon: Award,
  },
];

const steps = [
  { title: "找到雇主", text: "获得新加坡雇主的工作录用通知（Offer），雇主将作为您的担保人。" },
  { title: "准备材料", text: "准备学历证书、工作经历证明、薪资证明等相关文件。" },
  { title: "提交申请", text: "雇主通过 MOM（人力部）在线系统提交工作准证申请。" },
  { title: "等待审批", text: "EP 通常 3 周内出结果，SP 和 WP 可能需要更长时间。" },
  { title: "领取准证", text: "申请获批后，按规定时间领取工作准证并开始工作。" },
];

export default async function SingaporeWorkVisaGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {locale === "en" && (
          <p className="mb-6 text-sm text-gray-500 italic">
            Detailed visa content is currently in Chinese. English translation coming soon.
          </p>
        )}
        <div className="text-center mb-8 sm:mb-16">
          <h1 className="text-2xl sm:text-4xl font-bold text-yellow-900 mb-3 sm:mb-4">
            2026 新加坡工作签证申请全攻略
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-4 sm:mb-6">
            没有新加坡身份也可以合法工作
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
              <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm text-gray-600">签证类型</p>
              <p className="text-sm sm:text-lg font-bold text-yellow-900">6 种</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
              <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm text-gray-600">EP 最低薪资</p>
              <p className="text-sm sm:text-lg font-bold text-yellow-900">S$5,600</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm text-gray-600">EP 有效期</p>
              <p className="text-sm sm:text-lg font-bold text-yellow-900">2 年</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
              <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm text-gray-600">COMPASS 评分</p>
              <p className="text-sm sm:text-lg font-bold text-yellow-900">≥40 分</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-4 sm:mb-6">
            没有新加坡身份可以工作吗？
          </h2>
          <div className="text-sm sm:text-base text-gray-700">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="font-semibold text-green-800 mb-2">
                <CheckCircle className="inline-block h-5 w-5 mr-2" />
                答案：可以！
              </p>
              <p>
                外国人完全可以去新加坡工作，关键是找到愿意担保的雇主并申请相应类型的工作准证。
                <strong>EP 和 SP 是最常见的两种工作签证。</strong>
              </p>
            </div>
            <p className="mb-3 sm:mb-4">
              新加坡政府为吸引全球人才，设立了多种工作准证类型。无论您是高级管理人才、专业技术人才，还是基础劳工，都有对应的签证选择。
            </p>
          </div>
        </div>

        <div className="mb-8 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-4 sm:mb-6">
            主要工作签证类型
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {visaTypes.map((visa, index) => {
              const Icon = visa.Icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex items-center mb-4">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mr-3" />
                    <h3 className="text-lg sm:text-xl font-semibold text-yellow-900">
                      {visa.name}
                    </h3>
                  </div>
                  <div className="space-y-3 text-sm sm:text-base text-gray-700">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">适合对象</p>
                      <p className="font-medium">{visa.target}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">月薪要求</p>
                      <p className="font-medium text-yellow-700">{visa.salary}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">有效期</p>
                      <p className="font-medium">{visa.validity}</p>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-xs sm:text-sm text-gray-500 mb-2">申请条件</p>
                      <ul className="space-y-1">
                        {visa.conditions.map((condition, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-yellow-600 mr-2">•</span>
                            <span>{condition}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-4 sm:mb-6">
            主要申请条件
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {requirements.map((req, index) => {
              const Icon = req.Icon;
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-2">
                      {req.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700">{req.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg shadow-lg p-4 sm:p-8 mb-8 sm:mb-16 border-2 border-yellow-300">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-4 sm:mb-6">
            <TrendingUp className="inline-block h-6 w-6 sm:h-8 sm:w-8 mr-2" />
            2026 年新规重点
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-yellow-800 mb-3">
                薪资门槛上调
              </h3>
              <ul className="text-sm sm:text-base text-gray-700 space-y-2">
                <li>• EP 准证：≥ S$5,600（2025 年 1 月起）</li>
                <li>• 金融业 EP：≥ S$6,200</li>
                <li>• SP 准证：≥ S$3,300（2025 年 9 月起）</li>
                <li>• 金融业 SP：≥ S$3,800</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-yellow-800 mb-3">
                COMPASS 评分系统
              </h3>
              <ul className="text-sm sm:text-base text-gray-700 space-y-2">
                <li>• EP 申请者需 ≥40 分</li>
                <li>• 学历、薪资、多元化等维度评分</li>
                <li>• 知名大学学位可获额外分数</li>
                <li>• 紧缺技能岗位有加分</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-4 sm:mb-6">
            申请流程建议
          </h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-yellow-900">
            联系我们
          </h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
            获取更多新加坡工作签证咨询和职业规划服务
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              <p className="text-sm sm:text-base text-gray-700">电话：17318011997</p>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              <p className="text-sm sm:text-base text-gray-700">微信：HELENLAN998</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
