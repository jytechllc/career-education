import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import {
  ArrowRight,
  Award,
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
  eligibility: {
    title: string;
    subtitle: string;
    programs: { name: string; points: string[] }[];
    resultsTitle: string;
    results: string[];
  };
  roadmap: {
    title: string;
    subtitle: string;
    outcomeLabel: string;
    phases: {
      tag: string;
      name: string;
      goal: string;
      intro: string;
      items: { title: string; body?: string; points?: string[] }[];
      outcome: string;
    }[];
  };
  exclusion: string;
  disclaimer: string;
  cta: { title: string; body: string; phone: string; wechat: string };
};

const zh: Copy = {
  meta: {
    title: "研究生与直博留学申请服务",
    description:
      "研究生留学申请三档服务：申请助力、超级 VIP、长线规划 VIP，覆盖带奖学金的硕士、硕博连读与全额资助 PhD 申请；按 Explore、Build、Apply 三阶段推进，预约一对一咨询获取方案与报价。",
  },
  eyebrow: "研究生留学申请 · 杰圆职场教育",
  title: "研究生留学申请服务",
  subtitle: "硕士申请三档服务，从申请季冲刺到大一起的四年规划；另有本科直博服务",
  currency: "",
  notIncluded: "不含",
  tiers: [
    {
      name: "申请助力",
      price: "咨询报价",
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
      price: "咨询报价",
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
      price: "咨询报价",
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
    price: "咨询报价",
    currency: "",
    tagline: "本科毕业直接申请博士，目标是全球名校全额资助录取",
    points: [
      "约 6 个月、三个阶段：明确研究方向 → 打造竞争力档案 → 全程申请支持",
      "研究导师匹配、教授与实验室定向联系、科研背景强化",
      "个人陈述、推荐信策略、奖学金与资金规划、面试辅导、行前指导",
      "当季未取得 Top 100 全额资助录取的，在满足合同约定配合条件的前提下继续服务后续申请季，不再另收咨询服务费",
    ],
    addons: "可选服务：GRE 备考辅导；论文写作/发表协助（按篇计费）",
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
  eligibility: {
    title: "项目申请条件",
    subtitle: "带奖学金或资助的项目竞争激烈，我们会先评估学生是否符合以下条件",
    programs: [
      {
        name: "带奖学金或资助的硕士项目（MS）",
        points: [
          "至少在申请截止日期前 6 个月启动申请流程",
          "愿意考虑美国及其他国家的院校",
          "学术成绩较好，并愿意参加 GRE 考试",
          "具备一定的科研背景；暂无科研经历的，需愿意参加科研项目",
        ],
      },
      {
        name: "硕博连读（MS + PhD）或全额资助博士项目（Funded PhD）",
        points: [
          "已发表学术研究论文",
          "GPA 3.0 及以上",
          "愿意参加 GRE 考试",
          "至少在申请截止日期前 6 个月报名申请服务",
          "愿意配合团队联系教授，并参与较为严格的邮件沟通与面试流程",
          "愿意考虑美国及其他国家的院校",
        ],
      },
    ],
    resultsTitle: "过往录取成果",
    results: [
      "帮助已发表科研论文的本科毕业生，直接获得美国带科研资助的博士项目录取",
      "帮助具备相关背景与经历的学生，获得理科及管理学领域带资助的硕士与博士项目录取",
    ],
  },
  roadmap: {
    title: "大学申请服务路线图",
    subtitle:
      "申请服务分为探索（Explore）、提升（Build）、申请（Apply）三个阶段，按学生背景定制，以录取结果为导向",
    outcomeLabel: "阶段成果：",
    phases: [
      {
        tag: "Explore",
        name: "第一阶段 · 探索",
        goal: "背景评估、院校定位、科研及资助机会分析",
        intro:
          "为学生建立个人背景档案，围绕目标学位、科研资助、国家、院校、财务预算及奖学金机会进行全面分析。",
        items: [
          { title: "了解学生的个人背景、学术经历及科研方向" },
          { title: "根据现有背景和成绩，研究提供奖学金的硕士项目、带资助的硕博连读及博士项目" },
          { title: "根据目标院校的录取要求，规划需要参加的标准化考试" },
          { title: "在多所大学中寻找与学生科研方向匹配的教授，并持续开展联系" },
          { title: "针对每位教授制定联系方案、撰写针对性邮件，了解教授或实验室可提供的科研资助" },
        ],
        outcome:
          "结合科研调研与背景分析完成差距分析（Gap Analysis），明确学生需要提升的方面，为申请目标学位项目和院校做好准备。",
      },
      {
        tag: "Build",
        name: "第二阶段 · 背景提升",
        goal: "背景提升、申请规划、申请材料准备",
        intro: "在约 6 个月内系统完善学生的申请背景，在正式申请前尽可能弥补各项不足。",
        items: [
          {
            title: "综合背景分析",
            body: "对照目标院校的申请要求，建立完整的学生背景框架，确保各项申请条件与材料准备充分。",
          },
          {
            title: "差距分析（Gap Analysis）",
            body: "全面比对学生现有背景与目标院校录取要求，明确截止日期前 6 个月内需要完成的提升事项。",
          },
          {
            title: "申请路线图",
            body: "根据各院校截止日期、申请轮次及 GRE 备考计划，制定完整的申请时间表与行动方案。",
          },
          {
            title: "文书、推荐信、科研及论文展示指导",
            body: "在标准化成绩与个人经历之外，申请文书和补充材料是竞争激烈的院校评估申请者综合能力的重要依据。专业文书编辑帮助学生：",
            points: [
              "挖掘个人兴趣、专业技能与实践经历",
              "展示个人特点、学术能力与职业目标",
              "梳理科研经历与论文成果",
              "构建有竞争力的申请叙事",
              "向招生官有效呈现个人优势",
            ],
          },
        ],
        outcome:
          "形成符合目标院校要求的完整申请背景，包括申请文书、推荐信、个人陈述的框架及教授联系资源，确保在截止日期前完成申请提交。",
      },
      {
        tag: "Apply",
        name: "第三阶段 · 正式申请",
        goal: "正式申请、奖学金申请、面试及录取",
        intro: "向目标院校提交有竞争力的申请材料，争取实现预期录取目标。",
        items: [
          {
            title: "个人陈述 / 学习目的陈述（SOP）",
            body: "阐述申请者对目标项目的兴趣、相关经历，以及未来能为学校和行业带来的价值。文书编辑深入分析学生背景，用有意义的个人经历展示其成长过程与综合能力，契合目标院校重视的核心能力。",
          },
          {
            title: "硕士申请文书（Master's Essays）",
            body: "针对各研究生院的特定题目进行写作指导，展示申请者的沟通能力、适应能力等个人特质与软实力，以及与目标项目和专业方向的匹配度。",
          },
          {
            title: "推荐信（Letters of Recommendation）",
            body: "通过真实、可靠的事例，证明申请者在学术与职业发展中展现的知识水平、专业能力与综合素质。编辑与学生深入讨论，充分呈现个人成就与背景优势。",
          },
          {
            title: "奖学金及教育贷款协助",
            body: "持续提供可申请的奖学金信息；通过行业合作伙伴提供教育贷款申请协助，并由顾问指导学生做好教育资金规划。",
          },
          {
            title: "大学申请支持",
            body: "升学顾问全程支持正式申请与提交：",
            points: [
              "申请表填写指导",
              "申请材料准备与审核",
              "银行存款证明样本指导",
              "成绩单准备指导",
              "就申请过程中的问题代表学生与大学沟通",
              "正式提交前的全面检查",
            ],
          },
          {
            title: "面试准备（如适用）",
            body: "针对常见面试问题、回答策略、表达方式及语言语气进行辅导，帮助学生简洁、得体且有说服力地展示个人优势。",
          },
          {
            title: "行前指导",
            body: "帮助学生适应新的国家、院校与独立生活：",
            points: [
              "海外生活与文化适应",
              "当地日常生活规则",
              "医疗保险与旅行保险",
              "医疗与财务常识",
              "国际机票安排",
              "签证办理指导",
            ],
          },
        ],
        outcome: "完成全部申请，争取目标院校录取。",
      },
    ],
  },
  exclusion:
    "服务费用不含院校申请费、标准化考试报名费、成绩寄送费等第三方费用，该等费用由学生/家庭直接支付给相关机构。具体服务内容以签署的服务协议为准。",
  disclaimer:
    "本服务提供的是升学咨询与申请支持，我们将尽最大努力（Best Efforts）为学生服务；实习与科研项目以实际匹配到的机会为准。院校录取与否的最终决定权在目标院校，不作任何保证或承诺。",
  cta: {
    title: "预约一对一咨询",
    body: "根据你的年级、专业和目标院校，推荐合适的服务档位并提供报价",
    phone: "电话：17318011997",
    wechat: "微信：HELENLAN998",
  },
};

const en: Copy = {
  meta: {
    title: "Graduate & Direct-PhD Admissions Services",
    description:
      "Three master's admissions packages — Application Boost, Super VIP and Long-Term VIP — covering scholarship MS, MS + PhD and fully funded PhD applications through an Explore, Build and Apply roadmap. Book a 1-on-1 consultation for a plan and quote.",
  },
  eyebrow: "Graduate Admissions · JYCareerEdu",
  title: "Graduate Admissions Services",
  subtitle: "Three master's packages, from an application-season sprint to four-year planning — plus a direct-PhD program",
  currency: "",
  notIncluded: "Not included",
  tiers: [
    {
      name: "Application Boost",
      price: "Quote on request",
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
      price: "Quote on request",
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
      price: "Quote on request",
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
    price: "Quote on request",
    currency: "",
    tagline: "Apply to PhD programs straight from undergrad, aiming for fully funded offers at top universities",
    points: [
      "About 6 months in three phases: research direction → competitive profile → full application support",
      "Research mentor matching, targeted outreach to professors and labs, research strengthening",
      "Statement of purpose, recommendation strategy, scholarship and funding planning, interview prep, pre-departure guidance",
      "If no Top 100 fully funded offer is secured that season, service continues into later seasons at no extra counselling fee, subject to the conditions in the agreement",
    ],
    addons: "Optional: GRE prep; research paper writing/publication support (per paper)",
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
  eligibility: {
    title: "Who These Programs Fit",
    subtitle:
      "Scholarship and funded programs are highly competitive, so we first check whether a student meets these requirements",
    programs: [
      {
        name: "Master's (MS) with Scholarship or Funding",
        points: [
          "Start the process at least 6 months before the application deadline",
          "Open to universities in the US and other countries",
          "Strong academic record and willing to take the GRE",
          "Some research background — or willing to join a research project if none yet",
        ],
      },
      {
        name: "MS + PhD or Fully Funded PhD",
        points: [
          "Has published research papers",
          "GPA of 3.0 or above",
          "Willing to take the GRE",
          "Enrolls at least 6 months before the application deadline",
          "Works with the team on professor outreach, including rigorous email exchanges and interviews",
          "Open to universities in the US and other countries",
        ],
      },
    ],
    resultsTitle: "Past Results",
    results: [
      "Helped undergraduates with published research gain direct admission to research-funded PhD programs in the US",
      "Helped students with relevant backgrounds gain funded master's and PhD admissions in science and management",
    ],
  },
  roadmap: {
    title: "College Admissions Roadmap",
    subtitle:
      "Our College Admissions Program runs in three phases — Explore, Build and Apply — personalized to each student and focused on results",
    outcomeLabel: "Phase outcome: ",
    phases: [
      {
        tag: "Explore",
        name: "Phase 1 · Explore",
        goal: "Profile assessment, school positioning, research and funding opportunities",
        intro:
          "We build the student's profile and analyze target degrees, research funding, countries, universities, budget and scholarship opportunities.",
        items: [
          { title: "Understand the student's background, academic history and research interests" },
          { title: "Research scholarship master's programs and funded MS + PhD and PhD programs that fit the student's record" },
          { title: "Plan the standardized tests required by target programs" },
          { title: "Find professors whose research matches the student's across multiple universities, and keep outreach going" },
          { title: "Tailor an outreach plan and email for each professor to learn what research funding their lab can offer" },
        ],
        outcome:
          "A gap analysis based on research findings and the student's profile, defining what to strengthen before applying to target programs and universities.",
      },
      {
        tag: "Build",
        name: "Phase 2 · Build",
        goal: "Profile building, application planning, materials preparation",
        intro:
          "Over about 6 months, we systematically strengthen the student's profile and close as many gaps as possible before applying.",
        items: [
          {
            title: "Comprehensive profile analysis",
            body: "Build a complete profile framework against target schools' requirements so every condition and document is covered.",
          },
          {
            title: "Gap analysis",
            body: "Compare the current profile with admission requirements and set the improvements to finish in the 6 months before the deadline.",
          },
          {
            title: "Application roadmap",
            body: "A full timeline and action plan based on deadlines, application rounds and the GRE prep plan.",
          },
          {
            title: "Essays, recommendations, research and publications",
            body: "Beyond test scores and experience, essays and supplements are how competitive schools judge overall ability. Our editors help students:",
            points: [
              "Uncover interests, skills and hands-on experience",
              "Show personal qualities, academic ability and career goals",
              "Organize research experience and publications",
              "Build a competitive application narrative",
              "Present strengths clearly to admissions officers",
            ],
          },
        ],
        outcome:
          "A complete profile matching target schools, with frameworks for essays, recommendations and the personal statement plus professor contacts — ready to submit before deadlines.",
      },
      {
        tag: "Apply",
        name: "Phase 3 · Apply",
        goal: "Applications, scholarships, interviews and admission",
        intro: "We present competitive applications to universities to reach the admission goals.",
        items: [
          {
            title: "Personal Statement / Statement of Purpose (SOP)",
            body: "Explains the student's interest in the program, relevant experience and the value they will bring. Editors draw on meaningful experiences to show growth and the core competencies target schools look for.",
          },
          {
            title: "Master's essays",
            body: "Guidance on each graduate school's prompts, showing soft skills such as communication and adaptability, and fit with the program and field.",
          },
          {
            title: "Letters of recommendation",
            body: "Credible, concrete examples of the student's knowledge, skills and character. Editors work closely with students to bring out achievements and strengths.",
          },
          {
            title: "Scholarships and education loans",
            body: "Ongoing scholarship leads, plus education loan support through industry partners and advice on funding plans.",
          },
          {
            title: "Application support",
            body: "Advisors support the full submission process:",
            points: [
              "Application form guidance",
              "Materials preparation and review",
              "Bank statement sample guidance",
              "Transcript preparation",
              "Communicating with universities on the student's behalf",
              "Full check before final submission",
            ],
          },
          {
            title: "Interview preparation (if applicable)",
            body: "Coaching on common questions, answer strategy, delivery, language and tone, so students present themselves concisely and persuasively.",
          },
          {
            title: "Pre-departure orientation",
            body: "Helping students adjust to a new country, school and independent life:",
            points: [
              "Life overseas and cultural adjustment",
              "Everyday local rules",
              "Health and travel insurance",
              "Medical and financial basics",
              "International flights",
              "Visa guidance",
            ],
          },
        ],
        outcome: "All applications submitted, aiming for admission to target universities.",
      },
    ],
  },
  exclusion:
    "Service fees exclude application fees, test registration and score-report fees and other third-party costs, which the student/family pays directly. The signed service agreement governs the exact scope.",
  disclaimer:
    "We provide admissions counselling and application support on a best-efforts basis; internships and research projects depend on the opportunities actually matched. Admission decisions rest solely with the universities — no outcome is guaranteed or promised.",
  cta: {
    title: "Book a 1-on-1 Consultation",
    body: "We'll recommend a package and give you a quote based on your year, field and target schools",
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

  return { title: c.meta.title, description: c.meta.description, ...pageMeta(locale, "/graduate-admission") };
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
          <span className="text-2xl sm:text-3xl font-bold text-yellow-900">
            {tier.price}
          </span>
          {c.currency ? <span className="text-xs font-medium text-gray-500">{c.currency}</span> : null}
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

        <section className="mb-10 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 text-center">
            {c.eligibility.title}
          </h2>
          <p className="mt-2 mb-6 text-center text-sm sm:text-base text-gray-600">
            {c.eligibility.subtitle}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {c.eligibility.programs.map((p) => (
              <div key={p.name} className="rounded-xl border border-yellow-100 bg-white p-5 sm:p-6 shadow-lg">
                <h3 className="text-base sm:text-lg font-bold text-yellow-900">{p.name}</h3>
                <ul className="mt-4 space-y-2.5">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-gray-800">
                      <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-yellow-800 p-5 sm:p-6 text-white">
            <h3 className="inline-flex items-center gap-2 text-base sm:text-lg font-bold">
              <Award aria-hidden className="h-5 w-5" />
              {c.eligibility.resultsTitle}
            </h3>
            <ul className="mt-3 space-y-2">
              {c.eligibility.results.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-yellow-50">
                  <Star aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </section>

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

        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 text-center">
            {c.roadmap.title}
          </h2>
          <p className="mt-2 mb-6 text-center text-sm sm:text-base text-gray-600">
            {c.roadmap.subtitle}
          </p>
          <ol className="space-y-6">
            {c.roadmap.phases.map((phase, i) => (
              <li key={phase.tag} className="rounded-xl border border-yellow-100 bg-white p-5 sm:p-8 shadow-lg">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-yellow-900">{phase.name}</h3>
                  <span className="text-xs font-semibold uppercase tracking-wide text-yellow-700">
                    {phase.tag}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-yellow-800">{phase.goal}</p>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">{phase.intro}</p>
                <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {phase.items.map((item) => (
                    <li key={item.title} className="flex items-start gap-2 text-sm">
                      <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                      <div>
                        <p className={item.body ? "font-semibold text-yellow-900" : "text-gray-800"}>
                          {item.title}
                        </p>
                        {item.body ? (
                          <p className="mt-1 text-gray-600 leading-relaxed">{item.body}</p>
                        ) : null}
                        {item.points ? (
                          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-gray-600 marker:text-yellow-500">
                            {item.points.map((pt) => (
                              <li key={pt}>{pt}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-gray-800">
                  <span className="font-semibold text-yellow-900">{c.roadmap.outcomeLabel}</span>
                  {phase.outcome}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className="bg-white rounded-xl shadow-lg border border-yellow-100 p-5 sm:p-8 mb-8 sm:mb-12 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-yellow-700">
              <Microscope className="h-4 w-4" />
              {c.phd.eyebrow}
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-yellow-900">{c.phd.name}</h2>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-yellow-900">
                {c.phd.price}
              </span>
              {c.phd.currency ? <span className="text-xs font-medium text-gray-500">{c.phd.currency}</span> : null}
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
