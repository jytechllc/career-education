import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { hasLocale, locales, type Locale } from "@/lib/i18n";

const copy = {
  zh: {
    metaTitle: "招募实习生：网站内容运营 | 杰圆教育",
    metaDesc: "杰圆教育招募网站内容运营实习生，协助维护 edu.jytech.us 的日常内容更新：职场资讯、留学与求职指南、案例与活动信息。",
    badge: "正在招募",
    title: "网站内容运营实习生",
    lead: "杰圆教育正在招募实习生，协助维护 edu.jytech.us 的日常内容更新。适合对留学、求职、教育内容感兴趣，希望积累内容运营和 AI 工具实战经验的同学。",
    dutiesTitle: "工作内容",
    duties: [
      "更新网站上的职场资讯、留学与求职指南，校对中英文内容",
      "整理并发布成功案例、活动通知和院校、岗位信息",
      "使用 AI 写作与翻译工具起草稿件，人工核对事实和措辞后发布",
      "检查页面链接、图片和排版，反馈网站问题",
      "协助制作配套的短视频和社交媒体素材",
    ],
    reqTitle: "我们希望你",
    reqs: [
      "在读本科生或研究生，专业不限",
      "中文表达清楚，能读写英文",
      "细心，对文字和数据的准确性有要求",
      "每周可稳定投入一定时间，能按时交付",
      "有内容运营、新媒体、留学申请或求职经历者优先",
    ],
    gainTitle: "你将获得",
    gains: [
      "完整的网站内容运营实战经验",
      "AI 内容工具的系统使用经验",
      "留学、求职行业的一手信息和人脉",
      "实习证明，表现优秀可获推荐信",
    ],
    applyTitle: "如何申请",
    applyText: "请把简历发到邮箱，或添加微信并注明「实习申请」。简历里可以附上你写过的文章、运营过的账号或其他作品。",
    email: "邮箱",
    wechat: "微信",
    phone: "电话",
  },
  en: {
    metaTitle: "Internship: Website Content Assistant | JYEdu",
    metaDesc: "JYEdu is hiring interns to help keep edu.jytech.us up to date: career articles, study-abroad and job-search guides, case studies and events.",
    badge: "Now hiring",
    title: "Website Content Intern",
    lead: "JYEdu is looking for interns to help with day-to-day content updates on edu.jytech.us. A good fit if you're interested in study-abroad, careers and education content and want hands-on experience in content operations and AI tools.",
    dutiesTitle: "What you'll do",
    duties: [
      "Update career articles and study-abroad / job-search guides; proofread Chinese and English copy",
      "Prepare and publish success stories, event notices, and school and job listings",
      "Draft with AI writing and translation tools, then fact-check and edit before publishing",
      "Check links, images and layout, and report site issues",
      "Help produce short videos and social-media assets",
    ],
    reqTitle: "What we're looking for",
    reqs: [
      "Current undergraduate or graduate student, any major",
      "Clear written Chinese and working English",
      "Careful with wording, facts and numbers",
      "Able to commit steady hours each week and meet deadlines",
      "Experience in content, social media, admissions or recruiting is a plus",
    ],
    gainTitle: "What you'll get",
    gains: [
      "Real experience running a website's content",
      "Practical skills with AI content tools",
      "First-hand insight and contacts in study-abroad and recruiting",
      "An internship certificate, and a recommendation letter for strong performers",
    ],
    applyTitle: "How to apply",
    applyText: "Email your résumé, or add us on WeChat with the note “Internship”. Feel free to include articles you've written, accounts you've run, or other work samples.",
    email: "Email",
    wechat: "WeChat",
    phone: "Phone",
  },
} satisfies Record<Locale, unknown>;

const EMAIL = "helen.lan@jytech.us";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const t = copy[locale as Locale];
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: { languages: { zh: "/zh/join", en: "/en/join" } },
  };
}

export default async function JoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = copy[locale as Locale];

  const lists = [
    { title: t.dutiesTitle, items: t.duties },
    { title: t.reqTitle, items: t.reqs },
    { title: t.gainTitle, items: t.gains },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-medium text-yellow-800">
          <Sparkles className="h-4 w-4" />
          {t.badge}
        </span>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">{t.title}</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-gray-600">{t.lead}</p>
      </header>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {lists.map((l) => (
          <section key={l.title} className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">{l.title}</h2>
            <ul className="mt-4 space-y-3">
              {l.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-gray-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-2xl bg-yellow-50 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900">{t.applyTitle}</h2>
        <p className="mt-3 leading-relaxed text-gray-700">{t.applyText}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <a href={`mailto:${EMAIL}?subject=${encodeURIComponent(t.title)}`} className="flex items-center gap-3 rounded-xl bg-white p-4 text-sm transition hover:shadow-md">
            <Mail className="h-5 w-5 flex-shrink-0 text-yellow-600" />
            <span>
              <span className="block text-gray-500">{t.email}</span>
              <span className="font-medium text-gray-900 break-all">{EMAIL}</span>
            </span>
          </a>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 text-sm">
            <MessageCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
            <span>
              <span className="block text-gray-500">{t.wechat}</span>
              <span className="font-medium text-gray-900">HELENLAN998</span>
            </span>
          </div>
          <a href="tel:17318011997" className="flex items-center gap-3 rounded-xl bg-white p-4 text-sm transition hover:shadow-md">
            <Phone className="h-5 w-5 flex-shrink-0 text-yellow-600" />
            <span>
              <span className="block text-gray-500">{t.phone}</span>
              <span className="font-medium text-gray-900">17318011997</span>
            </span>
          </a>
        </div>
      </section>
    </main>
  );
}
