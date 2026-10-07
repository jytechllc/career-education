/**
 * Weekly peer scan for the JYCareer YouTube channel (layer 1 of the
 * self-evolving loop): what are Chinese-language study-abroad / North-America
 * job-search channels publishing, and what is working — versus our own videos.
 *
 *   node --env-file=<env with GOOGLE_SERVICE_ACCOUNT_KEY> scripts/competitor-scan.mjs
 *
 * Public YouTube Data API only (service account, youtube.readonly). Quota: each
 * search costs 100 units of the 10k/day budget, so the query list stays short.
 * Writes out/scan-<date>.json and prints a markdown report.
 */
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUR_HANDLE = "JYCareer-2023";
const DAYS = Number(process.env.SCAN_DAYS || 90);
const QUERIES = (process.env.SCAN_QUERIES ||
  "美国求职 留学生|留学生 找工作 北美|OPT H1B 留学生|美国 PhD 申请|北美 实习 内推|留学生 绿卡|美国 简历 面试 留学生|计算机 留学生 求职")
  .split("|");

let key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
if (typeof key === "string") key = JSON.parse(key);
const yt = google.youtube({
  version: "v3",
  auth: new google.auth.GoogleAuth({ credentials: key, scopes: ["https://www.googleapis.com/auth/youtube.readonly"] }),
});

const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
const ageDays = (iso) => Math.max(1, (Date.now() - new Date(iso).getTime()) / 86_400_000);
const secs = (iso) => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "") || []; return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0); };

async function videoDetails(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const r = await yt.videos.list({ part: ["snippet", "statistics", "contentDetails"], id: ids.slice(i, i + 50) });
    for (const v of r.data.items ?? []) {
      const views = Number(v.statistics?.viewCount || 0);
      out.push({
        id: v.id, title: v.snippet.title, channel: v.snippet.channelTitle, channelId: v.snippet.channelId,
        published: v.snippet.publishedAt, seconds: secs(v.contentDetails?.duration),
        views, likes: Number(v.statistics?.likeCount || 0), comments: Number(v.statistics?.commentCount || 0),
        viewsPerDay: Math.round(views / ageDays(v.snippet.publishedAt)),
      });
    }
  }
  return out;
}

// --- peers -------------------------------------------------------------------
const found = new Map();
for (const q of QUERIES) {
  const r = await yt.search.list({
    part: ["id"], q, type: ["video"], videoDuration: "short", order: "viewCount",
    publishedAfter: since, relevanceLanguage: "zh-Hans", maxResults: 25,
  });
  for (const it of r.data.items ?? []) if (it.id?.videoId) found.set(it.id.videoId, (found.get(it.id.videoId) || []).concat(q));
}
const peers = (await videoDetails([...found.keys()]))
  .filter((v) => v.seconds > 0 && v.seconds <= 180 && /[一-鿿]/.test(v.title))
  .map((v) => ({ ...v, queries: found.get(v.id) }))
  .sort((a, b) => b.viewsPerDay - a.viewsPerDay);

const byChannel = new Map();
for (const v of peers) {
  const c = byChannel.get(v.channelId) || { channel: v.channel, channelId: v.channelId, videos: 0, views: 0 };
  c.videos += 1; c.views += v.views; byChannel.set(v.channelId, c);
}
const chIds = [...byChannel.keys()];
for (let i = 0; i < chIds.length; i += 50) {
  const r = await yt.channels.list({ part: ["statistics", "snippet"], id: chIds.slice(i, i + 50) });
  for (const c of r.data.items ?? []) Object.assign(byChannel.get(c.id), {
    subscribers: Number(c.statistics?.subscriberCount || 0), handle: c.snippet?.customUrl || "",
  });
}
const channels = [...byChannel.values()].sort((a, b) => b.views - a.views);

// --- us ----------------------------------------------------------------------
const me = (await yt.channels.list({ part: ["contentDetails", "statistics", "snippet"], forHandle: OUR_HANDLE })).data.items[0];
const up = await yt.playlistItems.list({ part: ["contentDetails"], playlistId: me.contentDetails.relatedPlaylists.uploads, maxResults: 50 });
const ours = await videoDetails((up.data.items ?? []).map((i) => i.contentDetails.videoId));

// --- report ------------------------------------------------------------------
const date = new Date().toISOString().slice(0, 10);
const OUT = path.join(HERE, "daily-short", "out");
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, `scan-${date}.json`), JSON.stringify({ date, days: DAYS, queries: QUERIES, ours, peers, channels }, null, 2));

const n = (x) => x.toLocaleString("en-US");
const lines = [
  `# 同行扫描 ${date}（近 ${DAYS} 天，${QUERIES.length} 个关键词，${peers.length} 条中文 Shorts）`, "",
  `## 我们：${me.snippet.title}（订阅 ${n(Number(me.statistics.subscriberCount))}，总播放 ${n(Number(me.statistics.viewCount))}）`, "",
  "| 标题 | 秒 | 播放 | 日均 | 赞 |", "|---|---|---|---|---|",
  ...ours.map((v) => `| ${v.title.slice(0, 40)} | ${v.seconds} | ${n(v.views)} | ${n(v.viewsPerDay)} | ${v.likes} |`), "",
  "## 同行：日均播放最高的 20 条", "", "| 标题 | 频道 | 秒 | 播放 | 日均 |", "|---|---|---|---|---|",
  ...peers.slice(0, 20).map((v) => `| ${v.title.slice(0, 44)} | ${v.channel.slice(0, 16)} | ${v.seconds} | ${n(v.views)} | ${n(v.viewsPerDay)} |`), "",
  "## 同行频道（按命中视频总播放）", "", "| 频道 | 订阅 | 命中条数 | 命中播放 |", "|---|---|---|---|",
  ...channels.slice(0, 15).map((c) => `| ${c.channel.slice(0, 20)} ${c.handle} | ${n(c.subscribers || 0)} | ${c.videos} | ${n(c.views)} |`),
];
console.log(lines.join("\n"));
