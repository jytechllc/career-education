import { notFound } from "next/navigation";
import {
  GraduationCap,
  Target,
  Users,
  Search,
  Award,
  Beaker,
  ListChecks,
  CalendarClock,
  PenLine,
  FileText,
  MessageSquare,
  Wallet,
  ClipboardCheck,
  Mic,
  Plane,
  DollarSign,
  CheckCircle,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { hasLocale } from "@/lib/i18n";

type Phase = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

type Copy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: { label: string; value: string }[];
  intro: { title: string; body: string };
  phase1: { title: string; items: Phase[] };
  phase2: { title: string; items: Phase[] };
  phase3: { title: string; items: Phase[] };
  fees: {
    title: string;
    subtitle: string;
    cards: { title: string; price: string; note: string }[];
    exclusion: string;
  };
  disclaimer: string;
  cta: { title: string; body: string; phone: string; wechat: string };
};

const zh: Copy = {
  eyebrow: "PhD 留学申请 · JYEdu 杰圆教育",
  title: "From Profile to Funded PhD Admission",
  subtitle: "从背景画像到带资助录取——一站式博士（PhD）留学申请规划",
  stats: [
    { label: "目标入学季", value: "2027 Fall" },
    { label: "目标院校/地区", value: "美国·德国 等" },
    { label: "服务周期", value: "约 6 个月" },
    { label: "服务阶段", value: "3 大阶段" },
  ],
  intro: {
    title: "为什么需要系统化的 PhD 申请规划？",
    body:
      "博士申请不是简单的选校投递，而是研究方向、导师匹配、科研背景、文书叙事与资金规划的综合竞争。我们把整个过程拆解为「明确方向 → 打造竞争力 → 全程申请支持」三个阶段，配合研究导师（Research Mentor）与文书顾问团队，帮助学生把分散的背景，梳理成一份有说服力的申请案例。",
  },
  phase1: {
    title: "第一阶段 · 明确研究方向",
    items: [
      {
        icon: Search,
        title: "梳理背景画像",
        desc: "梳理学生学术背景、科研经历、成果与长期目标，形成「人物画像」，作为选校、选导师、选资助路径的基础。",
      },
      {
        icon: Target,
        title: "对齐研究方向",
        desc: "研究导师协助识别学生既有专长与未来学术/职业目标的连接点，强化申请材料在专业审阅时呈现的整体叙事。",
      },
      {
        icon: Users,
        title: "定向院校/教授/实验室",
        desc: "结合研究方向筛选目标院校与实验室，制定教授名单及个性化联系（套磁）方案，提升获得实质回复的概率。",
      },
    ],
  },
  phase2: {
    title: "第二阶段 · 打造竞争力档案",
    items: [
      {
        icon: Beaker,
        title: "强化科研背景",
        desc: "在研究导师指导下推进、完善科研工作，必要时协助形成可发表的研究成果，提升申请竞争力。",
      },
      {
        icon: ListChecks,
        title: "结构化差距分析",
        desc: "对照目标院校要求，明确成绩单、科研证明、考试成绩、文书、推荐信等材料的补强优先级。",
      },
      {
        icon: CalendarClock,
        title: "以截止日期为节点的执行计划",
        desc: "制定约 6 个月周期的执行路线图，统筹科研产出、标准化考试（含 GRE 备考协调）与文书写作的时间安排。",
      },
    ],
  },
  phase3: {
    title: "第三阶段 · 全程申请支持",
    items: [
      {
        icon: PenLine,
        title: "个人陈述与定制文书",
        desc: "协助撰写、打磨个性化 Statement of Purpose 及院校/项目定制 Essay，呈现连贯且有证据支撑的申请故事。",
      },
      {
        icon: FileText,
        title: "推荐信策略",
        desc: "指导推荐人突出学生的学术能力与科研潜力，使推荐信真正为申请案例加分。",
      },
      {
        icon: Wallet,
        title: "奖学金与资金规划",
        desc: "提供奖学金信息及资金规划协助，帮助学生和家庭系统评估学费、生活费等预期支出。",
      },
      {
        icon: ClipboardCheck,
        title: "材料审核与提交",
        desc: "协助完成申请材料审核、提交，包括银行流水、成绩单、院校沟通等事项指导。",
      },
      {
        icon: Mic,
        title: "面试辅导",
        desc: "如目标院校/项目要求面试，提供模拟面试与常见问题准备，聚焦简洁、可信的表达方式。",
      },
      {
        icon: Plane,
        title: "行前指导",
        desc: "涵盖境外独立生活、保险、财务及院校相关注意事项，帮助学生更平稳地完成从录取到入学的过渡。",
      },
    ],
  },
  fees: {
    title: "费用说明",
    subtitle: "以下费用经个案评估后确定，具体以签署的服务协议为准",
    cards: [
      {
        title: "PhD 申请咨询服务费",
        price: "¥180,000",
        note: "一次性收取，覆盖第一至第三阶段全部咨询服务内容",
      },
      {
        title: "GRE 备考辅导（可选）",
        price: "¥30,000",
        note: "如学生需要，单独计费",
      },
      {
        title: "论文写作/发表协助（可选，按篇计费）",
        price: "¥30,000 / 篇",
        note: "协助推进、撰写并投递一篇可用于申请的研究论文",
      },
    ],
    exclusion:
      "以上费用不含院校申请费、期刊/会议论文版面费及审稿费、标准化考试报名费等第三方费用，该等费用由学生/家庭直接支付给相关第三方机构。",
  },
  disclaimer:
    "本项目提供的是升学咨询与申请支持服务，我们将尽最大努力（Best Efforts）为学生服务，但院校录取、奖学金/资助发放与否及具体金额，最终决定权在目标院校及资助方，不作任何保证或承诺。",
  cta: {
    title: "预约一对一咨询",
    body: "了解你的背景是否适合本项目，以及 2027 Fall 申请的时间规划",
    phone: "电话：17318011997",
    wechat: "微信：HELENLAN998",
  },
};

const en: Copy = {
  eyebrow: "PhD Admissions · JYEdu",
  title: "From Profile to Funded PhD Admission",
  subtitle: "A structured path from academic profile to funded PhD offers",
  stats: [
    { label: "Target Intake", value: "Fall 2027" },
    { label: "Target Regions", value: "US · Germany + more" },
    { label: "Program Length", value: "~6 months" },
    { label: "Program Stages", value: "3 stages" },
  ],
  intro: {
    title: "Why a structured PhD admissions plan matters",
    body:
      "A strong PhD application is far more than picking schools and submitting forms — it's a combination of research direction, professor fit, research credibility, narrative writing, and funding planning. We break the process into three stages — Explore the Right Direction, Build a Competitive Profile, and Apply with End-to-End Support — backed by a Research Mentor and an editorial team, to turn a scattered background into a coherent, compelling case.",
  },
  phase1: {
    title: "Phase 1 · Explore the Right Academic Direction",
    items: [
      {
        icon: Search,
        title: "Build the Profile Snapshot",
        desc: "We map the student's academic background, research experience, achievements, and long-term goals — the foundation for selecting programs, advisors, and funding pathways.",
      },
      {
        icon: Target,
        title: "Align Research with Future Goals",
        desc: "A research mentor helps connect the student's existing expertise with future academic and professional ambitions, strengthening the overall narrative.",
      },
      {
        icon: Users,
        title: "Identify Universities, Professors & Labs",
        desc: "We build a targeted professor/lab list based on research fit and funding potential, with personalised outreach to increase the odds of a meaningful response.",
      },
    ],
  },
  phase2: {
    title: "Phase 2 · Build a Competitive Profile",
    items: [
      {
        icon: Beaker,
        title: "Strengthen Research Credibility",
        desc: "Working with a research mentor, the student develops — and where possible publishes — research that raises the credibility of the application.",
      },
      {
        icon: ListChecks,
        title: "Structured Gap Analysis",
        desc: "We map the profile against target-program requirements and prioritise which materials — transcripts, research evidence, test scores, essays, recommendations — need strengthening.",
      },
      {
        icon: CalendarClock,
        title: "Deadline-Driven Roadmap",
        desc: "A roughly six-month execution plan coordinates research output, standardised testing (including GRE prep), and application writing around real deadlines.",
      },
    ],
  },
  phase3: {
    title: "Phase 3 · Apply with End-to-End Support",
    items: [
      {
        icon: PenLine,
        title: "Personal Statement & Tailored Essays",
        desc: "We help shape a personalised Statement of Purpose and program-specific essays into a coherent, evidence-based application story.",
      },
      {
        icon: FileText,
        title: "Recommendation Strategy",
        desc: "Recommenders are guided to highlight the student's academic ability and research potential in ways that genuinely strengthen the case.",
      },
      {
        icon: Wallet,
        title: "Scholarship & Financial Planning",
        desc: "We help students and families understand available scholarship channels and plan for tuition, living costs, and other expected expenses.",
      },
      {
        icon: ClipboardCheck,
        title: "Application Review & Submission",
        desc: "Guidance on completing and submitting materials — bank statements, transcripts, university communication, and procedural details.",
      },
      {
        icon: Mic,
        title: "Interview Preparation",
        desc: "Where interviews are required, students practise likely questions, focusing on concise, confident, and credible communication.",
      },
      {
        icon: Plane,
        title: "Pre-Departure Orientation",
        desc: "Covering independent life abroad, insurance, finances, and institutional expectations, to smooth the transition from offer to enrolment.",
      },
    ],
  },
  fees: {
    title: "Program Fees",
    subtitle: "Fees below are confirmed after individual case assessment; the signed service agreement governs",
    cards: [
      {
        title: "PhD Admissions Counselling Program",
        price: "¥180,000",
        note: "One-time fee, covers all counselling services across Phases 1–3",
      },
      {
        title: "GRE Preparation (optional)",
        price: "¥30,000",
        note: "Billed separately if needed",
      },
      {
        title: "Research Paper Writing/Publication Support (optional, per paper)",
        price: "¥30,000 / paper",
        note: "Support to develop, write, and submit one research paper for the application",
      },
    ],
    exclusion:
      "Fees above exclude application charges, journal/conference publication and review fees, and standardised test registration fees — these third-party costs are paid directly by the student/family.",
  },
  disclaimer:
    "This program provides admissions counselling and application support. We work on a best-efforts basis, but final decisions on admission, funding, and scholarship amounts rest solely with the target university and funding bodies — no outcome is guaranteed or promised.",
  cta: {
    title: "Book a 1-on-1 Consultation",
    body: "Find out whether your profile fits this program and how a Fall 2027 timeline would look",
    phone: "Phone: 17318011997",
    wechat: "WeChat: HELENLAN998",
  },
};

function PhaseSection({ title, items }: { title: string; items: Phase[] }) {
  return (
    <div className="mb-8 sm:mb-16">
      <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-4 sm:mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-lg shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mb-3" />
              <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-700">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function PhdAdmissionPage({
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
        <div className="text-center mb-8 sm:mb-16">
          <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide text-yellow-700 mb-3">
            <GraduationCap className="h-4 w-4" />
            {c.eyebrow}
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-yellow-900 mb-3 sm:mb-4">
            {c.title}
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-4 sm:mb-6">
            {c.subtitle}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {c.stats.map((s, i) => (
              <div key={i} className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
                <p className="text-xs sm:text-sm text-gray-600">{s.label}</p>
                <p className="text-sm sm:text-lg font-bold text-yellow-900">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-4 sm:mb-6">
            {c.intro.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            {c.intro.body}
          </p>
        </div>

        <PhaseSection title={c.phase1.title} items={c.phase1.items} />
        <PhaseSection title={c.phase2.title} items={c.phase2.items} />
        <PhaseSection title={c.phase3.title} items={c.phase3.items} />

        <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg shadow-lg p-4 sm:p-8 mb-8 sm:mb-16 border-2 border-yellow-300">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-2">
            <DollarSign className="inline-block h-6 w-6 sm:h-8 sm:w-8 mr-2" />
            {c.fees.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            {c.fees.subtitle}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {c.fees.cards.map((card, i) => (
              <div key={i} className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
                <h3 className="text-sm sm:text-base font-semibold text-yellow-800 mb-2">
                  {card.title}
                </h3>
                <p className="text-xl sm:text-2xl font-bold text-yellow-900 mb-1">
                  {card.price}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">{card.note}</p>
              </div>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 border-t border-yellow-200 pt-3 sm:pt-4">
            {c.fees.exclusion}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8 sm:mb-16 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {c.disclaimer}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-yellow-900">
            {c.cta.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
            {c.cta.body}
          </p>
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
