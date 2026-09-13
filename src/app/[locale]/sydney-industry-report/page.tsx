import { notFound } from "next/navigation";
import {
  TrendingUp,
  Briefcase,
  School,
  Phone,
  Users,
  DollarSign,
  BarChart,
  Award,
  Building,
} from "lucide-react";
import { hasLocale } from "@/lib/i18n";
import { IndustryPieChart } from "@/components/IndustryPieChart";

export default async function SydneyIndustryReportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const isZh = locale === "zh";

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="text-center mb-8 sm:mb-16">
          <h1 className="text-2xl sm:text-4xl font-bold text-yellow-900 mb-3 sm:mb-4">
            {isZh
              ? "2024 悉尼就业市场分析报告"
              : "2024 Sydney Job Market Report"}
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-4 sm:mb-6">
            {isZh
              ? "助力您在澳洲职场实现梦想"
              : "Helping you succeed in Australia's job market"}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-center sm:space-x-4">
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
              <BarChart className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm text-gray-600">
                {isZh ? "就业率" : "Employment"}
              </p>
              <p className="text-sm sm:text-lg font-bold text-yellow-900">96.3%</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
              <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm text-gray-600">
                {isZh ? "平均年薪" : "Avg Salary"}
              </p>
              <p className="text-sm sm:text-lg font-bold text-yellow-900">$89,500</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
              <Building className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm text-gray-600">
                {isZh ? "企业数量" : "Companies"}
              </p>
              <p className="text-sm sm:text-lg font-bold text-yellow-900">238,000+</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-4 sm:mb-6">
            {isZh ? "2024 年悉尼就业市场概览" : "2024 Sydney Market Overview"}
          </h2>
          <div className="text-sm sm:text-base text-gray-700">
            <p className="mb-3 sm:mb-4">
              {isZh
                ? "悉尼作为澳大利亚最大的经济中心，就业市场持续保持强劲增长。2024 年主要特点："
                : "As Australia's largest economic hub, Sydney's job market continues to grow strongly. Key 2024 trends:"}
            </p>
            <ul className="list-disc pl-5 sm:pl-6 mb-3 sm:mb-4 space-y-2">
              {(isZh
                ? [
                    "就业市场需求持续攀升，尤其在科技、金融和医疗健康领域",
                    "远程办公和混合办公模式成为新常态，提供更灵活的工作方式",
                    "数字化转型加速，带动 IT 相关岗位需求激增",
                    "绿色经济发展，可持续发展相关职位显著增加",
                  ]
                : [
                    "Continued demand growth, especially in tech, finance, and healthcare",
                    "Remote and hybrid work as the new normal",
                    "Accelerated digital transformation driving IT roles",
                    "Green-economy growth boosting sustainability roles",
                  ]
              ).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mb-8 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-4 sm:mb-6">
            {isZh ? "行业分布" : "Industry Distribution"}
          </h2>
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
            <IndustryPieChart locale={isZh ? "zh" : "en"} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-8 sm:mb-16">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
            <div className="flex items-center mb-4 sm:mb-6">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mr-2 sm:mr-3" />
              <h2 className="text-xl sm:text-2xl font-semibold text-yellow-900">
                {isZh ? "热门行业分析" : "Top Industries"}
              </h2>
            </div>
            <ul className="space-y-4">
              <li>
                <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">
                  {isZh ? "金融与保险业 (20.0%)" : "Finance & Insurance (20%)"}
                </h3>
                <p className="text-sm sm:text-base text-gray-700 pl-3 sm:pl-5 whitespace-pre-line">
                  {isZh
                    ? "• 平均年薪：$95,000 - $150,000\n• 增长率：年增长 8.5%\n• 热门岗位：金融分析师、风险管理、金融科技开发"
                    : "• Salary: $95,000 - $150,000\n• Growth: 8.5%/yr\n• Roles: Analyst, Risk, FinTech"}
                </p>
              </li>
              <li>
                <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">
                  {isZh ? "专业技术服务 (15.0%)" : "Professional & Tech (15%)"}
                </h3>
                <p className="text-sm sm:text-base text-gray-700 pl-3 sm:pl-5 whitespace-pre-line">
                  {isZh
                    ? "• 平均年薪：$85,000 - $140,000\n• 增长率：年增长 12.3%\n• 热门岗位：软件工程师、数据分析师、产品经理"
                    : "• Salary: $85,000 - $140,000\n• Growth: 12.3%/yr\n• Roles: Engineer, Data, PM"}
                </p>
              </li>
              <li>
                <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">
                  {isZh ? "医疗服务业 (12.0%)" : "Healthcare (12%)"}
                </h3>
                <p className="text-sm sm:text-base text-gray-700 pl-3 sm:pl-5 whitespace-pre-line">
                  {isZh
                    ? "• 平均年薪：$75,000 - $130,000\n• 增长率：年增长 9.8%\n• 热门岗位：护理师、医疗管理、心理咨询师"
                    : "• Salary: $75,000 - $130,000\n• Growth: 9.8%/yr\n• Roles: Nurse, Mgmt, Counselor"}
                </p>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
            <div className="flex items-center mb-4 sm:mb-6">
              <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mr-2 sm:mr-3" />
              <h2 className="text-xl sm:text-2xl font-semibold text-yellow-900">
                {isZh ? "就业趋势与机遇" : "Trends & Opportunities"}
              </h2>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">
                  {isZh ? "新兴职业机会" : "Emerging Roles"}
                </h3>
                <ul className="list-disc pl-5 sm:pl-6 text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-2">
                  {(isZh
                    ? [
                        "人工智能工程师 - 年薪范围：$120,000-$180,000",
                        "可持续发展顾问 - 年薪范围：$90,000-$140,000",
                        "数字营销专家 - 年薪范围：$75,000-$120,000",
                      ]
                    : [
                        "AI Engineer - $120,000–$180,000",
                        "Sustainability Consultant - $90,000–$140,000",
                        "Digital Marketing Specialist - $75,000–$120,000",
                      ]
                  ).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">
                  {isZh ? "技能需求变化" : "Skill Shifts"}
                </h3>
                <ul className="list-disc pl-5 sm:pl-6 text-sm sm:text-base text-gray-700 space-y-1 sm:space-y-2">
                  {(isZh
                    ? [
                        "数据分析能力日益重要",
                        "远程协作工具熟练度要求提高",
                        "跨文化沟通能力备受重视",
                      ]
                    : [
                        "Data analytics increasingly essential",
                        "Remote-collaboration fluency expected",
                        "Cross-cultural communication highly valued",
                      ]
                  ).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-12 text-yellow-900">
            <Award className="inline-block h-6 w-6 sm:h-8 sm:w-8 mr-2 mb-1" />
            {isZh ? "成功案例" : "Success Stories"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-yellow-800">
                {isZh ? "留学生 J 同学" : "International Student J"}
              </h3>
              <div className="text-sm sm:text-base text-gray-700 space-y-3 whitespace-pre-line">
                <p>
                  {isZh
                    ? "• 背景：计算机专业应届毕业生，对职业发展方向不明确"
                    : "• Background: New CS grad, unclear direction"}
                </p>
                <p>
                  {isZh
                    ? "• 挑战：缺乏实际项目经验，需要职业规划指导"
                    : "• Challenge: Lacked real-world project experience"}
                </p>
                <p>
                  {isZh
                    ? "• 解决方案：\n- 基于兴趣和时间安排制定个性化发展方向\n- 对接企业和学校合作项目\n- 提供全球顶级研究项目和科技公司机会\n- 面试培训和实践项目机会"
                    : "• Solution:\n- Tailored career path based on interests/schedule\n- Matched to corporate & school partnerships\n- Exposed to top research and big-tech opportunities\n- Interview training & internships"}
                </p>
                <p className="text-green-600 font-semibold">
                  {isZh
                    ? "• 结果：成功获得理想公司 offer 并顺利入职"
                    : "• Outcome: Landed dream-company offer"}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-yellow-800">
                {isZh ? "职场人 L 同学" : "Professional L"}
              </h3>
              <div className="text-sm sm:text-base text-gray-700 space-y-3 whitespace-pre-line">
                <p>
                  {isZh
                    ? "• 背景：金融行业从业者，面临裁员困境"
                    : "• Background: Finance professional, post-layoff"}
                </p>
                <p>
                  {isZh
                    ? "• 挑战：投递 100+ 份简历仍未获得理想 offer"
                    : "• Challenge: 100+ rejected applications"}
                </p>
                <p>
                  {isZh
                    ? "• 解决方案：\n- 全面的面试改进计划\n- 面试技巧专项训练\n- 技能提升辅导\n- 心理调适和信心重建"
                    : "• Solution:\n- Full interview overhaul\n- Targeted technique drills\n- Skills upgrades\n- Mental & confidence coaching"}
                </p>
                <p className="text-green-600 font-semibold">
                  {isZh
                    ? "• 结果：成功获得新工作机会，重返职场"
                    : "• Outcome: Returned to the workforce"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-12 text-yellow-900">
            <School className="inline-block h-6 w-6 sm:h-8 sm:w-8 mr-2 mb-1" />
            {isZh ? "专业服务" : "Our Services"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {(isZh
              ? [
                  {
                    title: "个性化职业规划",
                    items: [
                      "职业兴趣评估",
                      "能力素质分析",
                      "发展路径规划",
                      "定期跟进指导",
                    ],
                  },
                  {
                    title: "求职能力提升",
                    items: [
                      "简历优化指导",
                      "面试技巧培训",
                      "商务礼仪培训",
                      "行业洞察分享",
                    ],
                  },
                  {
                    title: "资源对接服务",
                    items: [
                      "名企内推机会",
                      "行业专家指导",
                      "实习项目对接",
                      "职场社交圈子",
                    ],
                  },
                ]
              : [
                  {
                    title: "Personalized Career Planning",
                    items: [
                      "Interest assessment",
                      "Strength analysis",
                      "Path planning",
                      "Regular check-ins",
                    ],
                  },
                  {
                    title: "Job Search Upgrades",
                    items: [
                      "Resume polishing",
                      "Interview drills",
                      "Business etiquette",
                      "Industry insights",
                    ],
                  },
                  {
                    title: "Network & Resources",
                    items: [
                      "Referral pipelines",
                      "Industry mentors",
                      "Internship matching",
                      "Pro community",
                    ],
                  },
                ]
            ).map((card, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-yellow-800">
                  {card.title}
                </h3>
                <ul className="text-sm sm:text-base text-gray-700 space-y-2">
                  {card.items.map((it, j) => (
                    <li key={j}>• {it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-yellow-900">
            {isZh ? "联系我们" : "Contact Us"}
          </h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
            {isZh
              ? "获取更多职业发展建议和服务"
              : "Get more career advice and services"}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              <p className="text-sm sm:text-base text-gray-700">
                {isZh ? "电话：" : "Phone: "}17318011997
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              <p className="text-sm sm:text-base text-gray-700">
                {isZh ? "微信：" : "WeChat: "}HELENLAN998
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
