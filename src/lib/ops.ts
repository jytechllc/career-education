import "server-only";

import { and, count, desc, gt, isNull } from "drizzle-orm";

import { db } from "./db";
import { listLearners } from "./learners";
import { collegeCoachingApplications, partners, posts, studentProfiles } from "./schema";

/**
 * Data for the admin dashboard (/admin): operations overview, prioritised
 * tasks generated from rules, opportunities, and how fresh each automated
 * pipeline is. Every source is optional — one being down never breaks the page.
 */

const JM = process.env.JOB_MATCHING_URL ?? "https://jobmatching.us";
const HK_NEWS = "https://hk.jytech.us/api/news";
const YOUTUBE = {
  jytech: "UCN35BJJ0w31qtFzD0tsChKw",
  jyedu: "UC-ZKAl9UZmDq1Iius_JzNUA",
};

type JmSummary = {
  contacts: Record<string, number>;
  outreach: Record<string, number>;
  replies: { company: string; contact_email: string; replied_at: string; source?: string }[];
  channels?: {
    channel: string;
    companies: number;
    with_email: number;
    contacted: number;
    replied: number;
    awaiting: number;
    opted_out: number;
    last_sent: string | null;
    active: boolean | null;
    daily_limit: number | null;
  }[];
  signups: { company: string; contact_name: string; city: string | null; roles: string; created_at: string }[];
  deadlines: { firm: string; programme: string; deadline: string; url: string }[];
  pipelines: Record<string, string | null>;
  listings: { active: number };
};
type NewsItem = { title: string; link: string; source: string; tags: string[]; date: string };

async function jmSummary(): Promise<JmSummary | null> {
  const token = process.env.JOB_MATCHING_API_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${JM}/api/ops/summary`, { headers: { authorization: `Bearer ${token}` }, next: { revalidate: 300 } });
    return res.ok ? ((await res.json()) as JmSummary) : null;
  } catch {
    return null;
  }
}

async function hkNews(): Promise<{ updatedAt: string; items: NewsItem[] } | null> {
  try {
    const res = await fetch(HK_NEWS, { next: { revalidate: 1800 } });
    return res.ok ? ((await res.json()) as { updatedAt: string; items: NewsItem[] }) : null;
  } catch {
    return null;
  }
}

/** Newest upload on a channel, from YouTube's public RSS feed. */
async function latestVideo(channelId: string): Promise<{ title: string; published: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const xml = await res.text();
    const entry = xml.split("<entry>")[1];
    if (!entry) return null;
    return {
      title: entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? "",
      published: entry.match(/<published>([^<]*)<\/published>/)?.[1] ?? "",
    };
  } catch {
    return null;
  }
}

export type Priority = "high" | "medium";
export type Task = { priority: Priority; kind: string; text: string; href?: string };
export type Pipeline = { key: string; last: string | null; maxHours: number; ok: boolean | null };

const hoursSince = (iso: string | null | undefined) => (iso ? (Date.now() - new Date(iso).getTime()) / 3600e3 : null);
const OPPORTUNITY_TAGS = /AI|創科|创科|初創|初创|人才|北都|河套|大灣區|大湾区|招聘|展|活動|活动|論壇|论坛|比賽|比赛|資助|资助/;

export async function loadOps(t: {
  tasks: Record<string, (...a: string[]) => string>;
  pipelines: Record<string, string>;
}) {
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const [jm, news, ytJytech, ytJyedu, learners, appsWeek, profilesNoResume, partnersNoEmail, postsWeek, lastPost] = await Promise.all([
    jmSummary(),
    hkNews(),
    latestVideo(YOUTUBE.jytech),
    latestVideo(YOUTUBE.jyedu),
    listLearners().catch(() => []),
    db.select({ n: count() }).from(collegeCoachingApplications).where(and(isNull(collegeCoachingApplications.deletedAt), gt(collegeCoachingApplications.createdAt, weekAgo))),
    db.select({ id: studentProfiles.id, name: studentProfiles.name }).from(studentProfiles).where(isNull(studentProfiles.resumeR2Key)),
    db.select({ name: partners.name }).from(partners).where(isNull(partners.contactEmail)),
    db.select({ n: count() }).from(posts).where(gt(posts.createdAt, weekAgo)),
    db.select({ at: posts.createdAt }).from(posts).orderBy(desc(posts.createdAt)).limit(1),
  ]);

  const p = jm?.pipelines ?? {};
  const pipelines: Pipeline[] = [
    { key: "shenzhenDiscovery", last: p.shenzhen_discovery ?? null, maxHours: 48 },
    { key: "outreachSent", last: p.outreach_sent ?? null, maxHours: 24 * 4 },
    { key: "hkszRecruiters", last: p.hksz_recruiters ?? null, maxHours: 48 },
    { key: "companyBoards", last: p.company_boards ?? null, maxHours: 48 },
    { key: "simplifyFeeds", last: p.simplify_feeds ?? null, maxHours: 48 },
    { key: "curated", last: p.curated ?? null, maxHours: 48 },
    { key: "headhunterLeads", last: p.headhunter_leads ?? null, maxHours: 72 },
    { key: "hkNews", last: news?.updatedAt ?? null, maxHours: 48 },
    { key: "blog", last: lastPost[0]?.at?.toISOString() ?? null, maxHours: 72 },
    { key: "youtubeJytech", last: ytJytech?.published ?? null, maxHours: 48 },
    { key: "youtubeJyedu", last: ytJyedu?.published ?? null, maxHours: 48 },
  ].map((x) => {
    const h = hoursSince(x.last);
    return { ...x, ok: h == null ? null : h <= x.maxHours };
  });

  const tasks: Task[] = [];
  for (const r of jm?.replies ?? []) tasks.push({ priority: "high", kind: "reply", text: t.tasks.reply(r.company), href: "https://jobmatching.us/zh/admin/employers/shenzhen" });
  for (const s of (jm?.signups ?? []).filter((x) => (hoursSince(x.created_at) ?? 999) < 24 * 14))
    tasks.push({ priority: "high", kind: "signup", text: t.tasks.signup(s.company, s.contact_name) });
  for (const x of pipelines.filter((x) => x.ok === false || x.ok === null))
    tasks.push({ priority: "high", kind: "pipeline", text: t.tasks.pipeline(t.pipelines[x.key] ?? x.key) });
  for (const dl of jm?.deadlines ?? []) {
    const days = Math.ceil((new Date(dl.deadline).getTime() - Date.now()) / 864e5);
    tasks.push({ priority: days <= 7 ? "high" : "medium", kind: "deadline", text: t.tasks.deadline(dl.firm, dl.programme, dl.deadline), href: "/admin/internships" });
  }
  if (profilesNoResume.length)
    tasks.push({ priority: "medium", kind: "resume", text: t.tasks.resume(String(profilesNoResume.length), profilesNoResume.map((x) => x.name ?? "").join("、")), href: "/admin/profiles" });
  for (const x of partnersNoEmail) tasks.push({ priority: "medium", kind: "partner", text: t.tasks.partner(x.name), href: "/admin/partners" });
  if (appsWeek[0].n) tasks.push({ priority: "medium", kind: "applications", text: t.tasks.applications(String(appsWeek[0].n)), href: "/admin/applications" });
  tasks.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1));

  const opportunities = (news?.items ?? [])
    .filter((n) => (hoursSince(n.date) ?? 999) < 24 * 14 && (n.tags.some((tg) => OPPORTUNITY_TAGS.test(tg)) || OPPORTUNITY_TAGS.test(n.title)))
    .slice(0, 10);

  return {
    kpis: {
      learners: learners.length,
      applicationsWeek: appsWeek[0].n,
      headhunters: jm?.contacts.headhunters ?? null,
      hr: jm ? (jm.contacts.hr_people ?? 0) : null,
      hkHeadhunters: jm?.contacts.hk ?? null,
      szHeadhunters: jm?.contacts.sz ?? null,
      outreachSent: jm?.outreach.sent ?? null,
      outreachReplied: jm?.outreach.replied ?? null,
      jobs: jm?.listings.active ?? null,
      postsWeek: postsWeek[0].n,
    },
    tasks,
    pipelines,
    opportunities,
    signups: jm?.signups ?? [],
    channels: jm?.channels ?? [],
    replies: jm?.replies ?? [],
    deadlines: jm?.deadlines ?? [],
    jmOk: !!jm,
  };
}
