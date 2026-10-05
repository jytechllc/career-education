import "server-only";

import { cookies, headers } from "next/headers";

/**
 * /admin lives outside the [locale] routes, so its language is a cookie set
 * by the EN / 中文 switch (/admin/lang). Without the cookie, follow the
 * browser: English if Accept-Language prefers it, otherwise Chinese.
 */
export type AdminLang = "zh" | "en";

export const ADMIN_LANG_COOKIE = "jyedu_admin_lang";

export async function getAdminLang(): Promise<AdminLang> {
  const saved = (await cookies()).get(ADMIN_LANG_COOKIE)?.value;

  if (saved === "en" || saved === "zh") return saved;

  const accept = ((await headers()).get("accept-language") ?? "").toLowerCase();

  return accept.startsWith("en") ? "en" : "zh";
}

const zh = {
  brand: "杰圆教育 · 管理后台",
  nav: {
    overview: "概览",
    applications: "学生申请",
    students: "站内学员",
    partners: "合作机构",
    talents: "学生档案",
    staff: "员工",
    activity: "操作日志",
  },
  backToSite: "返回网站",
  logout: "退出",
  switchTo: "EN",
  roles: { admin: "管理员", supervisor: "主管" },
  noAccess: {
    title: "没有访问权限",
    notStaff: "当前登录的账号 {email} 没有管理后台的访问权限。如需开通，请联系管理员。",
    unverified: "当前登录的账号 {email} 尚未完成邮箱验证。请先点击验证邮件中的链接，再重新登录。",
    adminOnly: "此页面仅限管理员访问，当前账号 {email} 没有该权限。",
    switchAccount: "退出并切换账号",
    backToAdmin: "返回后台首页",
  },
  dateLocale: "zh-CN",
  overview: {
    title: "概览",
    applications: "学生申请",
    lastWeek: "近 7 天新增",
    trash: "回收站",
    students: "站内学员",
    latest: "最新申请",
    allApplications: "全部申请",
    none: "还没有申请。",
    byPartner: "按合作机构",
    count: (n: number) => `${n} 份`,
  },
  applications: {
    title: (n: number) => `学生申请（${n}）`,
    trashTitle: (n: number) => `回收站（${n}）`,
    viewTrash: "查看回收站",
    backToList: "返回申请列表",
    searchPlaceholder: "姓名、邮箱、学校或专业",
    allPartners: "全部合作机构",
    filter: "筛选",
    trashNote: "移入回收站的申请保留 30 天，之后自动永久删除（含上传文件）。期间可以随时恢复。员工和合作机构都可以移入或恢复。",
    trash: "移入回收站",
    confirmTrash: "把这份申请移入回收站？30 天后会连同上传文件一起永久删除，期间可以恢复。",
    restore: "恢复",
    daysLeft: (n: number) => (n > 0 ? `${n} 天后永久删除` : "将在下次清理时永久删除"),
    empty: "没有符合条件的申请。",
  },
  students: {
    title: (n: number) => `站内学员（${n}）`,
    subtitle: "在网站登录并填写过个人资料（/profile）的用户。",
    searchPlaceholder: "姓名或邮箱",
    search: "搜索",
    emptySearch: "没有符合条件的学员。",
    empty: "还没有学员在网站上填写资料。",
    col: {
      name: "姓名",
      contact: "邮箱 / 电话",
      location: "所在地",
      job: "求职意向",
      visa: "需要签证担保",
      linkedin: "LinkedIn",
      updated: "更新时间",
    },
    years: (n: number) => `${n} 年经验`,
    yes: "需要",
    no: "不需要",
    open: "打开",
  },
  partners: {
    title: (n: number) => `合作机构（${n}）`,
    subtitle: "合作机构通过 /partners/login 登录，只能看到提交到自己名下的申请。",
    col: {
      name: "机构",
      email: "联系邮箱",
      login: "登录账号",
      active: "申请",
      trash: "回收站",
      last: "最近申请",
    },
  },
  talents: {
    title: (n: number) => `学生档案（${n}）`,
    subtitle: "来自 Google Drive「Talents」文件夹，每个子文件夹是一位学生。文件同步到 R2 缓存：每天自动同步一次，也可以点「立即同步」。",
    openFolder: "在 Drive 打开文件夹",
    searchPlaceholder: "学生姓名或文件名",
    search: "搜索",
    files: (n: number) => `${n} 个文件`,
    emptyFolder: "文件夹是空的",
    empty: "没有找到学生文件夹。",
    error: "读取缓存失败，请稍后重试。",
    accessNote: "点击文件从缓存打开，不需要 Google Drive 权限。标「仅 Drive」的文件太大或无法导出，会在 Drive 打开。",
    neverSynced: "还没有同步过。点「立即同步」从 Drive 拉取学生资料（首次约需一分钟）。",
    lastSynced: "上次同步",
    sync: "立即同步",
    syncing: "同步中…",
    synced: "同步完成：新增/更新 {downloaded}，未变 {unchanged}，删除 {removed}",
    syncFailed: "同步失败。请确认「Talents」文件夹仍共享给 autoclaw-analytics@jytech.iam.gserviceaccount.com。",
    driveOnly: "仅 Drive",
    updated: "更新于",
    kinds: { pdf: "PDF", doc: "文档", word: "Word", image: "图片", sheet: "表格", other: "文件" },
  },
  activity: {
    title: "操作日志",
    subtitle: "员工、合作机构、学生与访客、AI 和系统任务的每一次操作。只记录做了什么、对哪条记录，不保存聊天内容或文件内容。",
    allActors: "全部来源",
    actorTypes: { staff: "员工", partner: "合作机构", student: "学生", visitor: "访客", ai: "AI", system: "系统" },
    searchPlaceholder: "操作人、操作或对象",
    filter: "筛选",
    col: { time: "时间", actor: "操作人", action: "操作", target: "对象", detail: "详情" },
    empty: "没有符合条件的记录。",
    older: "更早的记录 →",
    newest: "← 回到最新",
  },
  staff: {
    title: "员工",
    subtitle: "员工用自己的邮箱登录（需已验证，Google 登录即可）。添加后下一次打开页面就生效。",
    addTitle: "添加员工",
    help: {
      admin: "全部后台页面，并可管理员工",
      supervisor: "全部后台页面（学生申请、站内学员、合作机构），不能管理员工",
    },
    col: { email: "邮箱", role: "角色", addedBy: "添加人", actions: "操作" },
    you: "（你）",
    env: "环境变量",
    pinned: "固定，需改环境变量",
  },
  staffControls: {
    emailLabel: "员工邮箱",
    emailPlaceholder: "员工的登录邮箱",
    roleLabel: "角色",
    add: "添加员工",
    adding: "添加中…",
    added: "已添加 {email}",
    remove: "删除",
    removed: "已删除",
    confirmRemove: "删除员工 {email}？",
    roleOf: "{email} 的角色",
    errors: {
      invalidEmail: "邮箱格式不正确",
      unknownRole: "未知角色",
      pinned: "该邮箱由环境变量固定，不能在后台修改",
      self: "不能修改或删除自己",
      failed: "操作失败，请重试",
    },
  },
};

export type AdminDict = typeof zh;

const en: AdminDict = {
  brand: "JYEdu · Admin",
  nav: {
    overview: "Overview",
    applications: "Applications",
    students: "Site students",
    partners: "Partners",
    talents: "Student files",
    staff: "Staff",
    activity: "Activity log",
  },
  backToSite: "Back to site",
  logout: "Log out",
  switchTo: "中文",
  roles: { admin: "Admin", supervisor: "Supervisor" },
  noAccess: {
    title: "No access",
    notStaff: "The signed-in account {email} doesn't have access to the admin portal. Ask an admin to grant you access.",
    unverified: "The signed-in account {email} hasn't verified its email yet. Click the link in the verification email, then sign in again.",
    adminOnly: "This page is for admins only. The account {email} doesn't have that role.",
    switchAccount: "Sign out and switch account",
    backToAdmin: "Back to admin home",
  },
  dateLocale: "en-US",
  overview: {
    title: "Overview",
    applications: "Applications",
    lastWeek: "Last 7 days",
    trash: "Trash",
    students: "Site students",
    latest: "Latest applications",
    allApplications: "All applications",
    none: "No applications yet.",
    byPartner: "By partner",
    count: (n: number) => `${n}`,
  },
  applications: {
    title: (n: number) => `Applications (${n})`,
    trashTitle: (n: number) => `Trash (${n})`,
    viewTrash: "View trash",
    backToList: "Back to applications",
    searchPlaceholder: "Name, email, school or major",
    allPartners: "All partners",
    filter: "Filter",
    trashNote:
      "Trashed applications are kept for 30 days, then permanently deleted with their uploaded files. Restore any time before then. Staff and partners can both trash and restore.",
    trash: "Move to trash",
    confirmTrash: "Move this application to trash? It is permanently deleted with its files after 30 days; you can restore it until then.",
    restore: "Restore",
    daysLeft: (n: number) => (n > 0 ? `Deleted in ${n} day${n === 1 ? "" : "s"}` : "Deleted at the next cleanup"),
    empty: "No applications match.",
  },
  students: {
    title: (n: number) => `Site students (${n})`,
    subtitle: "People who signed in and filled in their profile (/profile).",
    searchPlaceholder: "Name or email",
    search: "Search",
    emptySearch: "No students match.",
    empty: "No one has filled in a profile yet.",
    col: {
      name: "Name",
      contact: "Email / phone",
      location: "Location",
      job: "Looking for",
      visa: "Needs sponsorship",
      linkedin: "LinkedIn",
      updated: "Updated",
    },
    years: (n: number) => `${n} yrs experience`,
    yes: "Yes",
    no: "No",
    open: "Open",
  },
  partners: {
    title: (n: number) => `Partners (${n})`,
    subtitle: "Partners sign in at /partners/login and only see applications submitted to them.",
    col: {
      name: "Partner",
      email: "Contact email",
      login: "Login",
      active: "Applications",
      trash: "Trash",
      last: "Latest",
    },
  },
  talents: {
    title: (n: number) => `Student files (${n})`,
    subtitle: "From the Google Drive \"Talents\" folder: each subfolder is one student. Files are mirrored to an R2 cache daily, or whenever you press Sync now.",
    openFolder: "Open folder in Drive",
    searchPlaceholder: "Student or file name",
    search: "Search",
    files: (n: number) => `${n} file${n === 1 ? "" : "s"}`,
    emptyFolder: "Folder is empty",
    empty: "No student folders found.",
    error: "Couldn't read the cache — try again shortly.",
    accessNote: "Files open from the cache — no Google Drive access needed. Files marked \"Drive only\" are too large or can't be exported and open in Drive.",
    neverSynced: "Not synced yet. Press Sync now to pull the student files from Drive (about a minute the first time).",
    lastSynced: "Last synced",
    sync: "Sync now",
    syncing: "Syncing…",
    synced: "Synced: {downloaded} new/updated, {unchanged} unchanged, {removed} removed",
    syncFailed: "Sync failed. Check the \"Talents\" folder is still shared with autoclaw-analytics@jytech.iam.gserviceaccount.com.",
    driveOnly: "Drive only",
    updated: "Updated",
    kinds: { pdf: "PDF", doc: "Doc", word: "Word", image: "Image", sheet: "Sheet", other: "File" },
  },
  activity: {
    title: "Activity log",
    subtitle: "Every action by staff, partners, students and visitors, AI and system jobs. Records what happened to which record — never chat messages or file contents.",
    allActors: "All sources",
    actorTypes: { staff: "Staff", partner: "Partner", student: "Student", visitor: "Visitor", ai: "AI", system: "System" },
    searchPlaceholder: "Actor, action or target",
    filter: "Filter",
    col: { time: "Time", actor: "Actor", action: "Action", target: "Target", detail: "Detail" },
    empty: "No matching entries.",
    older: "Older entries →",
    newest: "← Back to newest",
  },
  staff: {
    title: "Staff",
    subtitle:
      "Staff sign in with their own email (it must be verified — Google sign-in works). Changes apply the next time they open a page.",
    addTitle: "Add staff",
    help: {
      admin: "Every admin page, plus staff management",
      supervisor: "Every admin page (applications, site students, partners); no staff management",
    },
    col: { email: "Email", role: "Role", addedBy: "Added by", actions: "Actions" },
    you: "(you)",
    env: "Env var",
    pinned: "Pinned — change the env var",
  },
  staffControls: {
    emailLabel: "Staff email",
    emailPlaceholder: "Their sign-in email",
    roleLabel: "Role",
    add: "Add staff",
    adding: "Adding…",
    added: "Added {email}",
    remove: "Remove",
    removed: "Removed",
    confirmRemove: "Remove {email}?",
    roleOf: "Role for {email}",
    errors: {
      invalidEmail: "That email doesn't look valid",
      unknownRole: "Unknown role",
      pinned: "This email is pinned by an env var and can't be changed here",
      self: "You can't change or remove yourself",
      failed: "Something went wrong — try again",
    },
  },
};

export async function getAdminDict(): Promise<{ lang: AdminLang; t: AdminDict }> {
  const lang = await getAdminLang();

  return { lang, t: lang === "en" ? en : zh };
}
