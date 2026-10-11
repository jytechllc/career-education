import type { Locale } from "./i18n";

// Press kit for media partners (/[locale]/press). Files live in the public
// Cloudflare R2 bucket `jyedu-press` (account d2ab0c57…, prefix press/), served
// with Content-Disposition: attachment so links download instead of playing.
// To move hosting (e.g. a custom domain), change PRESS_ASSET_BASE only.
export const PRESS_ASSET_BASE =
  process.env.NEXT_PUBLIC_PRESS_ASSET_BASE ?? "https://pub-b23a15f56cbd4293868cdc9c8da29d78.r2.dev/press";

export const pressUrl = (file: string) => `${PRESS_ASSET_BASE}/${file}`;

type Bi = { zh: string; en: string };

export type PressVideo = {
  file: string;
  poster: string;
  ratio: "16:9" | "9:16" | "3:4";
  duration: string;
  size: string;
  title: Bi;
  note: Bi;
  /** Same story cut for another platform. */
  alt?: { file: string; label: Bi; size: string };
};

export const pressVideos: PressVideo[] = [
  {
    file: "jycareer-brand-film-16x9.mp4",
    poster: "jycareer-brand-film-16x9.jpg",
    ratio: "16:9",
    duration: "1:16",
    size: "23 MB",
    title: { zh: "品牌宣传片（1 分钟动画）", en: "Brand film (1-minute animation)" },
    note: { zh: "横屏 1280×720，适合官网、公众号和新闻稿配图视频", en: "Landscape 1280×720 — for websites, articles and press releases" },
  },
  {
    file: "jycareer-salary-negotiation-9x16.mp4",
    poster: "jycareer-salary-negotiation-9x16.jpg",
    ratio: "9:16",
    duration: "0:55",
    size: "5 MB",
    title: { zh: "HR 问「期望薪资多少」怎么答？", en: "How to answer “What are your salary expectations?”" },
    note: { zh: "竖屏 1080×1920 · 薪资区间、涨薪逻辑、谈薪策略", en: "Vertical 1080×1920 · salary ranges, raises and negotiation" },
  },
  {
    file: "jycareer-h1b-weighted-lottery-9x16.mp4",
    poster: "jycareer-h1b-weighted-lottery-9x16.jpg",
    ratio: "9:16",
    duration: "0:44",
    size: "35 MB",
    title: { zh: "H-1B 新规：工资决定中签", en: "H-1B: the wage-weighted lottery explained" },
    note: { zh: "竖屏 1080×1920 · 片中历史画面来自 Wikimedia Commons，已标注署名", en: "Vertical 1080×1920 · archive footage from Wikimedia Commons, credited on screen" },
  },
  {
    file: "jycareer-bay-area-bank-jobs-9x16.mp4",
    poster: "jycareer-bay-area-bank-jobs-9x16.jpg",
    ratio: "9:16",
    duration: "0:29",
    size: "2 MB",
    title: { zh: "湾区商业银行岗位速览", en: "Bay Area commercial banking roles at a glance" },
    note: { zh: "竖屏 1080×1920，适合抖音、视频号、YouTube Shorts", en: "Vertical 1080×1920 — for Douyin, WeChat Channels, YouTube Shorts" },
    alt: { file: "jycareer-bay-area-bank-jobs-3x4.mp4", label: { zh: "小红书 3:4 版", en: "Xiaohongshu 3:4 cut" }, size: "8 MB" },
  },
];

export type PressLogo = { file: string; label: Bi; bg: "light" | "dark" };

export const pressLogos: PressLogo[] = [
  { file: "jycareer-logo-horizontal-dark.png", label: { zh: "横版标志 · 浅色背景用", en: "Horizontal logo · for light backgrounds" }, bg: "light" },
  { file: "jycareer-logo-horizontal-light.png", label: { zh: "横版标志 · 深色背景用", en: "Horizontal logo · for dark backgrounds" }, bg: "dark" },
  { file: "jycareer-mark.png", label: { zh: "JY 标识", en: "JY mark" }, bg: "light" },
  { file: "jycareer-icon-1024.png", label: { zh: "图标 1024×1024（另附 SVG）", en: "Icon 1024×1024 (SVG in kit)" }, bg: "light" },
];

export const brandColors = [
  { hex: "#CA8A04", name: { zh: "金色（主色）", en: "Gold (primary)" } },
  { hex: "#EAB308", name: { zh: "亮金", en: "Bright gold" } },
  { hex: "#111827", name: { zh: "深色", en: "Ink" } },
  { hex: "#FFFFFF", name: { zh: "白色", en: "White" } },
];

export const MEDIA_CONTACT = { phone: "17318011997", wechat: "HELENLAN998" };

const zh = {
  metaTitle: "媒体资料 | 杰圆职场教育",
  metaDesc: "杰圆职场教育媒体资料包：品牌介绍、标志、宣传片与短视频，供媒体合作方免费下载转发。",
  badge: "媒体合作",
  title: "媒体资料",
  lead: "欢迎媒体与合作伙伴下载转发以下视频、标志和介绍文字。转载请注明来源「杰圆职场教育 edu.jytech.us」。",
  kit: "下载品牌资料包（标志 + 介绍文字）",
  kitNote: "ZIP · 约 84 KB",
  aboutTitle: "机构介绍",
  oneLine: "一句话介绍",
  oneLineText: "杰圆职场教育——职业规划、求职辅导与升学咨询。",
  aboutZh: "中文简介",
  aboutEn: "English",
  copy: "复制",
  copied: "已复制",
  videosTitle: "视频",
  videosLead: "可直接下载原片发布。请保留片中品牌标识和素材署名。",
  download: "下载",
  logosTitle: "品牌标志",
  colorsTitle: "品牌色",
  rulesTitle: "转载说明",
  rules: [
    "以上视频、图片和文字可免费转载、转发，请注明来源「杰圆职场教育 edu.jytech.us」。",
    "请保留视频中的品牌标识和素材署名；可截取片段，但不得改变原意。",
    "不得用于商业广告，不得暗示杰圆职场教育为第三方产品或服务背书。",
    "如需采访、数据核实、原始素材或定制内容，请联系媒体合作。",
  ],
  contactTitle: "媒体合作联系",
  phone: "电话",
  wechat: "微信",
  contactNote: "采访、内容合作与素材需求，请注明媒体名称和用途。",
  archiveTitle: "历史视频",
  archiveLead: "我们在 YouTube 发布的每一条视频都会自动存档在这里，可下载原片、复制标题和简介后转发。",
  archiveCount: "共 {n} 条",
  watch: "YouTube",
  copyCaption: "复制标题和简介",
  article: "原文",
  archiveEmpty: "暂无存档视频。",
  more: "查看更早的视频",
};

const en: typeof zh = {
  metaTitle: "Press Kit | JYCareer",
  metaDesc: "JYCareer press kit: company description, logos, brand film and short videos, free for media partners to download and share.",
  badge: "Press",
  title: "Press kit",
  lead: "Media and partners are welcome to download and share the videos, logos and descriptions below. Please credit “JYCareer, edu.jytech.us”.",
  kit: "Download brand kit (logos + descriptions)",
  kitNote: "ZIP · about 84 KB",
  aboutTitle: "About",
  oneLine: "One line",
  oneLineText: "JYCareer — career planning, job-search coaching and admissions advising.",
  aboutZh: "中文简介",
  aboutEn: "English",
  copy: "Copy",
  copied: "Copied",
  videosTitle: "Videos",
  videosLead: "Download the original files to publish. Please keep the on-screen branding and footage credits.",
  download: "Download",
  logosTitle: "Logos",
  colorsTitle: "Brand colors",
  rulesTitle: "Usage",
  rules: [
    "The videos, images and text on this page may be shared free of charge with the credit “JYCareer, edu.jytech.us”.",
    "Keep the on-screen branding and footage credits. Excerpts are fine as long as the meaning isn't changed.",
    "Not for use in advertising, and don't imply that JYCareer endorses any third-party product or service.",
    "For interviews, fact-checking, source files or custom content, contact us below.",
  ],
  contactTitle: "Media contact",
  phone: "Phone",
  wechat: "WeChat",
  contactNote: "For interviews, partnerships or asset requests, please include your outlet and intended use.",
  archiveTitle: "Video archive",
  archiveLead: "Every video we publish on YouTube is archived here automatically. Download the original file and copy the title and caption to repost.",
  archiveCount: "{n} videos",
  watch: "YouTube",
  copyCaption: "Copy title & caption",
  article: "Article",
  archiveEmpty: "No archived videos yet.",
  more: "Show earlier videos",
};

export const pressCopy = (l: Locale) => (l === "en" ? en : zh);

export const boilerplate = {
  zh: "杰圆职场教育（JYCareer / JY Education and Career Center）是一家职业发展与升学咨询机构，为学生和职场人提供职业规划、简历优化、面试辅导，以及研究生与直博申请指导，并持续发布薪资行情、签证政策、行业岗位等职场内容。官网：edu.jytech.us",
  en: "JYCareer (JY Education and Career Center) is a career development and admissions advisory service. It helps students and professionals with career planning, résumé improvement, interview coaching and graduate and PhD applications, and publishes short explainers on salaries, work visas and industry roles. Website: edu.jytech.us",
};
