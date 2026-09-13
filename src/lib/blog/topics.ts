import type { Locale } from "@/lib/i18n";

// Topic seeds for the auto-generated job-market blog.
// The cron rotates through these so coverage stays balanced over time.
export type Topic = {
  key: string;
  category: { zh: string; en: string };
  // A concrete angle the model should research/write about.
  brief: { zh: string; en: string };
};

export const TOPICS: Topic[] = [
  {
    key: "industry-trends",
    category: { zh: "行业趋势", en: "Industry Trends" },
    brief: {
      zh: "近期热门行业的招聘趋势与人才需求变化（科技、金融、医疗、新能源、AI 等）",
      en: "Recent hiring trends and talent demand shifts across hot industries (tech, finance, healthcare, clean energy, AI).",
    },
  },
  {
    key: "salary-insights",
    category: { zh: "薪资行情", en: "Salary Insights" },
    brief: {
      zh: "热门岗位的薪资区间、涨薪逻辑与谈薪策略",
      en: "Salary ranges for in-demand roles, what drives raises, and how to negotiate offers.",
    },
  },
  {
    key: "overseas-work",
    category: { zh: "海外就业", en: "Working Abroad" },
    brief: {
      zh: "面向中国求职者的海外就业与工作签证要点（澳洲、新加坡、北美等）",
      en: "Overseas employment and work-visa essentials for Chinese job seekers (Australia, Singapore, North America).",
    },
  },
  {
    key: "ai-and-jobs",
    category: { zh: "AI 与职场", en: "AI & Work" },
    brief: {
      zh: "AI 对各岗位的影响、哪些技能更值钱、如何与 AI 协作",
      en: "How AI is reshaping roles, which skills are gaining value, and how to work alongside AI.",
    },
  },
  {
    key: "job-search-skills",
    category: { zh: "求职技巧", en: "Job-Search Skills" },
    brief: {
      zh: "简历、面试、求职渠道的实操技巧与常见误区",
      en: "Practical resume, interview and job-channel tactics, plus common mistakes to avoid.",
    },
  },
  {
    key: "career-growth",
    category: { zh: "职业发展", en: "Career Growth" },
    brief: {
      zh: "职业规划、转行、晋升与长期竞争力构建",
      en: "Career planning, switching fields, getting promoted and building long-term competitiveness.",
    },
  },
  {
    key: "graduate-employment",
    category: { zh: "应届就业", en: "New-Grad Employment" },
    brief: {
      zh: "应届毕业生就业形势、校招节奏与第一份工作的选择",
      en: "The new-grad job market, campus-recruiting timelines, and choosing a first job.",
    },
  },
];

export function pickTopic(index: number): Topic {
  return TOPICS[((index % TOPICS.length) + TOPICS.length) % TOPICS.length];
}

export function topicLabel(t: Topic, locale: Locale) {
  return { category: t.category[locale], brief: t.brief[locale] };
}
