/**
 * Daily blog post → narrated kinetic-typography YouTube Short → JYEdu channel.
 *
 *   1. pick today's zh post from Neon (or POST_SLUG)
 *   2. Claude on Bedrock condenses it into a short script (hook / 3 points / quote)
 *   3. edge-tts narration per scene → scene timing
 *   4. template.html rendered frame-by-frame with Playwright → ffmpeg
 *   5. bgm.py synthesizes a royalty-free bed; ducked under the voice, loudnorm
 *   6. upload mp4 to R2 (public URL) → Buffer createPost on the YouTube channel
 *
 * Env: DATABASE_URL, AWS_REGION, BEDROCK_MODEL_ID?, POST_SLUG?, MAX_AGE_HOURS? (20),
 *      DRY_RUN=1 (render only), R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *      R2_BUCKET_NAME, R2_PUBLIC_URL, BUFFER_API_KEY, BUFFER_YT_CHANNEL_ID,
 *      CLIP_PUBLISH_MODE (shareNow | draft, default draft), CLIP_YT_PRIVACY (public),
 *      CHROME_PATH? (use a local Chrome instead of Playwright's), PYTHON? (python3).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { neon } from "@neondatabase/serverless";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { chromium } from "playwright";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SITE = "https://edu.jytech.us";
const MODEL = process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-sonnet-4-6";
const VOICE = "zh-CN-YunxiNeural";
const FPS = 30;
const DRY = process.env.DRY_RUN === "1";
const MODE = process.env.CLIP_PUBLISH_MODE || "draft";

const reqEnv = (k) => { const v = process.env[k]; if (!v) throw new Error(`missing env ${k}`); return v; };
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: ["ignore", "inherit", "inherit"] });

// ---- 1) pick the post ------------------------------------------------------
async function pickPost() {
  const sql = neon(reqEnv("DATABASE_URL"));
  const slug = process.env.POST_SLUG;
  const rows = slug
    ? await sql`select slug, title, summary, content, category, tags, published_at from posts where slug = ${slug} limit 1`
    : await sql`select slug, title, summary, content, category, tags, published_at from posts
        where locale = 'zh' and status = 'published'
          and published_at > now() - make_interval(hours => ${Number(process.env.MAX_AGE_HOURS || 20)})
        order by published_at desc limit 1`;
  return rows[0] ?? null;
}

// ---- 2) script -------------------------------------------------------------
const SCRIPT_TOOL = {
  name: "save_short",
  description: "Save the Short script.",
  input_schema: {
    type: "object",
    properties: {
      kicker: { type: "string", description: "≤12字，栏目/场景提示，如「HR 最常问的问题」" },
      hook: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2,
        description: "两行大字钩子：第1行≤8字（最抓眼的词），第2行≤16字" },
      hook_say: { type: "string", description: "开场口播，≤30字，口语化、有悬念" },
      points: {
        type: "array", minItems: 3, maxItems: 3,
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "要点标题，≤10字" },
            detail: { type: "string", description: "一句话展开，≤34字，具体可操作" },
            say: { type: "string", description: "该要点口播，≤36字" },
          },
          required: ["title", "detail", "say"],
        },
      },
      quote: { type: "string", description: "收尾金句，≤26字" },
      quote_say: { type: "string", description: "金句口播，≤28字" },
      yt_title: { type: "string", description: "YouTube 标题，≤40字，不含话题标签，制造好奇或痛点" },
      hashtags: { type: "array", items: { type: "string" }, description: "4-6个中文话题词，不带#" },
    },
    required: ["kicker", "hook", "hook_say", "points", "quote", "quote_say", "yt_title", "hashtags"],
  },
};

async function writeScript(post) {
  const client = new AnthropicBedrock({ awsRegion: process.env.AWS_REGION || "us-east-1" });
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    tools: [SCRIPT_TOOL],
    tool_choice: { type: "tool", name: "save_short" },
    messages: [{
      role: "user",
      content: `你是「JYCareer 杰圆职场教育」的短视频编导。把下面这篇职场博客改编成一条约 40 秒的竖屏短视频脚本（YouTube Shorts / 抖音风格）。

要求：
- 只用文章里的观点，不编造统计数字、百分比、公司名或案例。
- 开场 2 秒内抛出痛点或反常识，让人停下来。
- 三个要点各自独立成立，标题短促有力，展开句具体可操作。
- 口播是给 AI 配音读的：简体中文、口语化、短句，不要英文缩写和符号。
- 严格遵守各字段字数上限（屏幕放不下）。

文章标题：${post.title}
分类：${post.category ?? ""}
摘要：${post.summary ?? ""}

正文：
${post.content.slice(0, 6000)}`,
    }],
  });
  const tool = msg.content.find((b) => b.type === "tool_use");
  if (!tool) throw new Error("model returned no save_short call");
  return tool.input;
}

// ---- 3) narration ----------------------------------------------------------
function tts(text, out) {
  execFileSync("edge-tts", ["--voice", VOICE, "--rate=+20%", "--text", text, "--write-media", out], { stdio: "pipe" });
}

// ---- 4) render frames --------------------------------------------------------
async function render(data, out) {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.addInitScript((d) => { window.DATA = d; }, data);
  await page.goto("file://" + path.join(HERE, "template.html"));
  await page.evaluate(() => document.fonts.ready);
  const total = data.starts[data.starts.length - 1];
  const n = Math.ceil(total * FPS);
  const enc = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", out], { stdio: ["pipe", "inherit", "inherit"] });
  for (let f = 0; f < n; f++) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    const buf = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once("drain", r));
  }
  enc.stdin.end();
  await new Promise((r) => enc.on("close", r));
  await browser.close();
  return n;
}

// ---- 5) audio ----------------------------------------------------------------
function buildAudio(work, voices, starts, hits, video, out) {
  const A = (n) => path.join(work, n);
  const total = starts[starts.length - 1];
  ff(["-f", "lavfi", "-i", "aevalsrc='(random(0)*2-1)*pow(t/0.35,2)*exp(-max(0,t-0.35)*25)*0.6':d=0.5:s=44100",
    "-af", "highpass=f=600,lowpass=f=5000", A("whoosh.wav")]);
  ff(["-f", "lavfi", "-i", "aevalsrc='sin(2*PI*(38+70*exp(-t*25))*t)*exp(-t*7)*0.9+(random(0)*2-1)*exp(-t*40)*0.25':d=0.6:s=44100", A("hit.wav")]);
  execFileSync(process.env.PYTHON || "python3", [path.join(HERE, "bgm.py"), total.toFixed(2), A("bgm.wav"),
    ...starts.slice(1, -1).map((s) => s.toFixed(2))], { stdio: "inherit" });

  const ev = [];
  voices.forEach((f, i) => ev.push([f, starts[i] + 0.05, 1.0]));
  starts.slice(1, -1).forEach((s) => ev.push([A("whoosh.wav"), Math.max(0, s - 0.35), 0.5]));
  hits.forEach((s) => ev.push([A("hit.wav"), s, 0.5]));
  const ins = [], fl = [];
  ev.forEach(([f, at, vol], i) => {
    ins.push("-i", f);
    const ms = Math.round(at * 1000);
    fl.push(`[${i}:a]aresample=44100,aformat=channel_layouts=stereo,volume=${vol},adelay=${ms}|${ms}[e${i}]`);
  });
  const n = ev.length;
  fl.push(`${ev.map((_, i) => `[e${i}]`).join("")}amix=inputs=${n}:normalize=0,apad,atrim=0:${total.toFixed(2)},asplit=2[vx][key]`);
  ins.push("-i", A("bgm.wav"));
  fl.push(`[${n}:a]aformat=channel_layouts=stereo,volume=0.2[b]`);
  fl.push(`[b][key]sidechaincompress=threshold=0.02:ratio=8:attack=10:release=400[bd]`);
  fl.push(`[vx][bd]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[a]`);
  ff([...ins, "-i", video, "-filter_complex", fl.join(";"), "-map", `${n + 1}:v`, "-map", "[a]",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-shortest", "-movflags", "+faststart", out]);
}

// ---- 6) publish ----------------------------------------------------------------
async function uploadR2(file, key) {
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${reqEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: reqEnv("R2_ACCESS_KEY_ID"), secretAccessKey: reqEnv("R2_SECRET_ACCESS_KEY") },
  });
  await s3.send(new PutObjectCommand({
    Bucket: reqEnv("R2_BUCKET_NAME"), Key: key, Body: fs.readFileSync(file),
    ContentType: "video/mp4", CacheControl: "public, max-age=31536000",
  }));
  return `${reqEnv("R2_PUBLIC_URL").replace(/\/$/, "")}/${key}`;
}

async function bufferPost(videoUrl, title, description) {
  const q = (v) => JSON.stringify(v);
  const draft = MODE !== "shareNow";
  const input = [
    `text: ${q(description)}`,
    `channelId: ${q(reqEnv("BUFFER_YT_CHANNEL_ID"))}`,
    `mode: ${draft ? "addToQueue" : "shareNow"}`,
    `saveToDraft: ${draft}`,
    `aiAssisted: true`,
    `schedulingType: automatic`,
    `assets: [{ video: { url: ${q(videoUrl)} } }]`,
    `metadata: { youtube: { title: ${q(title)}, categoryId: ${q("28")}, privacy: ${process.env.CLIP_YT_PRIVACY || "public"}, madeForKids: false, isAiGenerated: true } }`,
  ].join(", ");
  const res = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${reqEnv("BUFFER_API_KEY")}` },
    body: JSON.stringify({ query: `mutation { createPost(input: { ${input} }) {
      ... on PostActionSuccess { post { id } } ... on MutationError { message } } }` }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error("Buffer: " + json.errors.map((e) => e.message).join("; "));
  if (json.data?.createPost?.message) throw new Error("Buffer: " + json.data.createPost.message);
  return json.data?.createPost?.post?.id;
}

// ---- main --------------------------------------------------------------------
const post = await pickPost();
if (!post) { console.log("No fresh zh post — nothing to do."); process.exit(0); }
console.log(`Post: ${post.slug} — ${post.title}`);

const date = new Date(post.published_at).toISOString().slice(0, 10);
const work = path.resolve(HERE, "out", `${date}-${post.slug}`);
fs.mkdirSync(work, { recursive: true });

const script = await writeScript(post);

// Hard guard: the prompt forbids invented numbers, but the model still slipped
// "90%的人" into a title once. Any percentage, or a number that isn't in the
// article, falls back to safe text instead of shipping a fake statistic.
const source = `${post.title}\n${post.summary ?? ""}\n${post.content}`;
const fakeNumber = (text) =>
  /\d+(\.\d+)?\s*[%％]|百分之/.test(text) ||
  (text.match(/\d+(\.\d+)?/g) ?? []).some((n) => n !== "3" && !source.includes(n));
if (fakeNumber(script.yt_title)) { console.log(`Title had an unsupported number, using post title: ${script.yt_title}`); script.yt_title = post.title.slice(0, 40); }
if (script.hook.some(fakeNumber)) { console.log(`Hook had an unsupported number: ${script.hook.join(" / ")}`); script.hook = [post.category || "职场干货", post.title.slice(0, 16)]; }
script.points.forEach((p) => { if (fakeNumber(p.title) || fakeNumber(p.detail) || fakeNumber(p.say)) throw new Error(`Point has an unsupported number: ${p.title} / ${p.detail}`); });
if (fakeNumber(script.quote) || fakeNumber(script.hook_say) || fakeNumber(script.quote_say)) throw new Error("Quote/narration has an unsupported number");
fs.writeFileSync(path.join(work, "script.json"), JSON.stringify(script, null, 2));
console.log("Script:", script.hook.join(" / "));

const lines = [
  script.hook_say,
  ...script.points.map((p) => p.say),
  script.quote_say,
  "完整文章在杰圆职场教育官网。关注 JYCareer，每天一条职场干货！",
];
const voices = lines.map((t, i) => { const f = path.join(work, `v${i}.mp3`); tts(t, f); return f; });
const MIN = [2.8, 3.2, 3.2, 3.2, 2.8, 4.0]; // keep each scene long enough for its animation
const starts = [0];
voices.forEach((f, i) => starts.push(starts[i] + Math.max(MIN[i], dur(f) + 0.35) + (i === voices.length - 1 ? 1.5 : 0)));
console.log("Scenes:", starts.map((s) => s.toFixed(1)).join(" "));

const silent = path.join(work, "video.mp4");
const frames = await render({
  starts, hook: script.hook, kicker: script.kicker, points: script.points, quote: script.quote,
  quoteSub: "—— JYCareer 杰圆职场教育", category: post.category,
}, silent);
console.log(`Rendered ${frames} frames`);

const hits = [0.15, 1.1, ...starts.slice(1, 4).map((s) => s + 0.2)];
const final = path.join(work, "short.mp4");
buildAudio(work, voices, starts, hits, silent, final);
console.log(`Video: ${final} (${dur(final).toFixed(1)}s)`);

const tags = (script.hashtags || []).slice(0, 6).map((t) => "#" + t.replace(/^#/, "").replace(/\s+/g, ""));
const title = `${script.yt_title} ${tags.slice(0, 3).join(" ")}`.slice(0, 100);
const description = [
  post.summary || script.hook.join("，"),
  "",
  ...script.points.map((p, i) => `${i + 1}. ${p.title}：${p.detail}`),
  "",
  `完整文章：${SITE}/zh/blog/${post.slug}`,
  "",
  "JYCareer 杰圆职场教育 · 每天一条职场干货",
  tags.join(" "),
].join("\n");
fs.writeFileSync(path.join(work, "meta.json"), JSON.stringify({ title, description }, null, 2));

if (DRY) { console.log("DRY_RUN — not publishing.\n" + title); process.exit(0); }
const url = await uploadR2(final, `jycareer-shorts/${date}-${post.slug}.mp4`);
console.log("R2:", url);
async function postStatus(id) {
  const res = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${reqEnv("BUFFER_API_KEY")}` },
    body: JSON.stringify({ query: `{ post(input: { id: ${JSON.stringify(id)} }) { status externalLink error { message } } }` }),
  });
  return (await res.json()).data?.post;
}
// shareNow goes out asynchronously; poll until YouTube accepts or Buffer reports an error.
async function waitSent(id) {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 10_000));
    const p = await postStatus(id);
    if (p?.status === "sent") return p;
    if (p?.status === "error") return p;
  }
  return { status: "timeout" };
}

let id = await bufferPost(url, title, description);
console.log(`Buffer ${MODE} → post ${id}\n${title}`);
if (MODE === "shareNow") {
  let result = await waitSent(id);
  if (result.status === "error") {
    console.log(`Buffer error: ${result.error?.message} — retrying once`);
    id = await bufferPost(url, title, description);
    result = await waitSent(id);
  }
  if (result.status !== "sent") throw new Error(`YouTube publish failed (${result.status}): ${result.error?.message ?? "no response"} — Buffer post ${id}`);
  console.log(`Published: ${result.externalLink}`);
}
