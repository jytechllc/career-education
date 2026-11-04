#!/usr/bin/env node
/**
 * SEO audit: crawls every URL in the sitemap and checks the on-page basics
 * (status, title, description, canonical, hreflang, Open Graph, JSON-LD, H1).
 * No dependencies; Node 22+.
 *
 * usage: node scripts/seo/audit.mjs [baseUrl] [--json out.json] [--md out.md] [--baseline prev.json]
 * Env: VERCEL_BYPASS (protection bypass secret for preview deployments), SEO_CONCURRENCY (default 6)
 * Exit code 1 when --baseline is given and the error count went up.
 */
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const base = (args.find((a) => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--")) ||
  "https://edu.jytech.us").replace(/\/$/, "");
// Audit as Googlebot so responses match what Google gets.
const headers = { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html) JYEduSEOAudit/1.0" };
if (process.env.VERCEL_BYPASS) headers["x-vercel-protection-bypass"] = process.env.VERCEL_BYPASS;

const TITLE_MAX = 65; // Google truncates around 600px; CJK counts double
const DESC_MIN = 50;
const DESC_MAX = 160;

const width = (s) => [...s].reduce((n, c) => n + (/[　-鿿＀-￯]/.test(c) ? 2 : 1), 0);
const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"));
  return m ? decode(m[1]) : undefined;
}

function parse(html) {
  // Next.js may stream metadata into <body> when it resolves late (Googlebot renders it), so scan the
  // whole document; <svg><title> is skipped so icon titles don't count as the page title.
  const head = html.replace(/<svg\b[\s\S]*?<\/svg>/gi, "");
  const tags = (re) => [...head.matchAll(re)].map((m) => m[0]);
  const meta = (key, val) => tags(/<meta\b[^>]*>/gi).find((t) => attr(t, key)?.toLowerCase() === val);
  const links = tags(/<link\b[^>]*>/gi);
  return {
    lang: attr(html.match(/<html\b[^>]*>/i)?.[0] ?? "", "lang"),
    title: decode(head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? ""),
    description: attr(meta("name", "description") ?? "", "content") ?? "",
    robots: attr(meta("name", "robots") ?? "", "content") ?? "",
    canonical: attr(links.find((t) => attr(t, "rel") === "canonical") ?? "", "href"),
    hreflang: Object.fromEntries(
      links.filter((t) => attr(t, "rel") === "alternate" && attr(t, "hreflang")).map((t) => [attr(t, "hreflang"), attr(t, "href")]),
    ),
    ogTitle: attr(meta("property", "og:title") ?? "", "content"),
    ogImage: attr(meta("property", "og:image") ?? "", "content"),
    jsonLd: [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
      try {
        const d = JSON.parse(m[1]);
        return [d].flat().map((x) => x["@type"]).flat().join(",");
      } catch {
        return "INVALID";
      }
    }),
    h1: (html.match(/<h1\b/gi) || []).length,
  };
}

async function get(url) {
  const r = await fetch(url, { headers, redirect: "manual" });
  return { status: r.status, location: r.headers.get("location"), body: r.status === 200 ? await r.text() : "" };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k]);
    }
  }));
  return out;
}

const issues = [];
const add = (severity, rule, url, detail) => issues.push({ severity, rule, url, detail });

const robots = await get(`${base}/robots.txt`);
if (robots.status !== 200) add("error", "robots-missing", `${base}/robots.txt`, `HTTP ${robots.status}`);
else if (/^\s*disallow:\s*\/\s*$/im.test(robots.body)) add("error", "robots-blocks-all", `${base}/robots.txt`, "Disallow: /");

const sm = await get(`${base}/sitemap.xml`);
if (sm.status !== 200) {
  add("error", "sitemap-missing", `${base}/sitemap.xml`, `HTTP ${sm.status}`);
}
const entries = [...sm.body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: decode(m[1].match(/<loc>([^<]*)<\/loc>/)?.[1] ?? ""),
  lastmod: m[1].match(/<lastmod>([^<]*)<\/lastmod>/)?.[1],
}));
// sitemaps carry the production host; audit the same paths on the target base (e.g. a preview)
const target = (loc) => base + new URL(loc).pathname;

const lastmods = entries.map((e) => e.lastmod).filter(Boolean);
const sameStamp = lastmods.filter((l) => l === lastmods[0]).length;
if (lastmods.length > 5 && sameStamp / lastmods.length > 0.5) {
  add("warn", "sitemap-lastmod-uniform", `${base}/sitemap.xml`, `${sameStamp}/${lastmods.length} entries share lastmod ${lastmods[0]}`);
}

const pages = await pool(entries, Number(process.env.SEO_CONCURRENCY) || 6, async ({ loc }) => {
  const url = target(loc);
  try {
    const r = await get(url);
    return { url, path: new URL(url).pathname, status: r.status, location: r.location, ...(r.body ? parse(r.body) : {}) };
  } catch (e) {
    return { url, path: new URL(url).pathname, status: 0, error: String(e) };
  }
});

const ok = pages.filter((p) => p.status === 200);
for (const p of pages) {
  if (p.status !== 200) {
    add("error", "sitemap-url-not-200", p.url, p.location ? `HTTP ${p.status} -> ${p.location}` : `HTTP ${p.status} ${p.error ?? ""}`);
  }
}

for (const p of ok) {
  const locale = p.path.split("/")[1];
  if (/noindex/i.test(p.robots)) add("error", "noindex-in-sitemap", p.url, p.robots);
  if (!p.title) add("error", "title-missing", p.url, "");
  else {
    if (width(p.title) > TITLE_MAX * 1.3) add("warn", "title-too-long", p.url, `${width(p.title)} width: ${p.title}`);
    const parts = p.title.split(/\s*[|｜–—-]\s*/).filter(Boolean);
    if (new Set(parts).size < parts.length) add("warn", "title-repeated-segment", p.url, p.title);
  }
  if (!p.description) add("error", "description-missing", p.url, "");
  else if (width(p.description) < DESC_MIN) add("warn", "description-too-short", p.url, p.description);
  else if (width(p.description) > DESC_MAX * 1.5) add("warn", "description-too-long", p.url, `${width(p.description)} width`);
  if (!p.canonical) add("error", "canonical-missing", p.url, "");
  else if (new URL(p.canonical, base).pathname !== p.path) add("error", "canonical-not-self", p.url, p.canonical);
  if (!Object.keys(p.hreflang).length) add("warn", "hreflang-missing", p.url, "");
  if (p.lang && locale && !p.lang.toLowerCase().startsWith(locale)) add("warn", "html-lang-mismatch", p.url, `lang=${p.lang}`);
  if (!p.ogImage) add("warn", "og-image-missing", p.url, "");
  if (p.jsonLd.includes("INVALID")) add("error", "jsonld-invalid", p.url, "");
  if (p.h1 !== 1) add("warn", "h1-count", p.url, `${p.h1} <h1>`);
}

const home = ok.find((p) => /^\/[a-z]{2}\/?$/.test(p.path));
if (home && !home.jsonLd.some((t) => /Organization/.test(t))) add("warn", "jsonld-organization-missing", home.url, "");

for (const field of ["title", "description"]) {
  const groups = new Map();
  for (const p of ok) if (p[field]) groups.set(p[field], [...(groups.get(p[field]) || []), p.path]);
  for (const [value, paths] of groups) {
    if (paths.length > 1) add("error", `duplicate-${field}`, paths.join(" "), `${paths.length} pages: ${value.slice(0, 80)}`);
  }
}

const count = (s) => issues.filter((i) => i.severity === s).length;
const byRule = Object.entries(
  issues.reduce((m, i) => ({ ...m, [`${i.severity}:${i.rule}`]: (m[`${i.severity}:${i.rule}`] || 0) + 1 }), {}),
).sort();
const report = { base, at: new Date().toISOString(), urls: entries.length, errors: count("error"), warnings: count("warn"), byRule, issues, pages };

const md = [
  `# SEO audit: ${base}`,
  ``,
  `${report.at} · ${entries.length} sitemap URLs · **${report.errors} errors**, ${report.warnings} warnings`,
  ``,
  `| Rule | Count |`,
  `|---|---|`,
  ...byRule.map(([r, n]) => `| ${r} | ${n} |`),
  ``,
  `## Issues`,
  ...issues.slice(0, 300).map((i) => `- **${i.severity}** \`${i.rule}\` ${i.url}${i.detail ? ` — ${i.detail}` : ""}`),
  issues.length > 300 ? `- … ${issues.length - 300} more in the JSON report` : "",
].join("\n");

if (flag("--json")) writeFileSync(flag("--json"), JSON.stringify(report, null, 2));
if (flag("--md")) writeFileSync(flag("--md"), md);
console.log(md.split("\n## Issues")[0]);

const baseline = flag("--baseline");
if (baseline) {
  const prev = JSON.parse(readFileSync(baseline, "utf8"));
  console.log(`\nbaseline errors ${prev.errors} -> ${report.errors}`);
  if (report.errors > prev.errors) process.exit(1);
}
