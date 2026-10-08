/**
 * Public-domain / free-licence visuals for the daily Short, so scenes stop
 * looking like slides:
 *
 *   stockVideo()   Pexels (PEXELS_API_KEY) or Pixabay (PIXABAY_API_KEY) footage
 *   govImage()     US federal government photos on Wikimedia Commons — federal
 *                  works are public domain (17 U.S.C. §105), so no licence risk
 *   shootSource()  a real screenshot of an official page (uscis.gov, dol.gov,
 *                  dhs.gov) with the quoted sentence highlighted
 *   manualMedia()  a clip/photo supplied in a hand-written script (e.g. a CC-BY
 *                  video) — credit and licence are required, and they are
 *                  printed on screen and in the description
 *
 * Every helper returns null instead of throwing: a missing key, an empty search
 * or a blocked site drops back to the coded background, never fails the run.
 * Each result is { kind: "video" | "image", file, credit, license, url }.
 */
import fs from "node:fs";
import path from "node:path";

const UA = "jycareer-daily-short/1.0 (https://edu.jytech.us)";

/**
 * Official pages the script may cite. Hand-checked 2026-10-07: each URL loads
 * for a headless browser and contains `highlight` verbatim. travel.state.gov
 * and bls.gov block headless browsers, so they are not on the list.
 */
export const SOURCES = {
  "h1b-lottery": {
    label: "USCIS 官网原文",
    url: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations-and-fashion-models/h-1b-electronic-registration-process",
    highlight: "USCIS will conduct a weighted selection among properly submitted registrations",
    about: "H-1B 抽签改为按工资级别加权",
  },
  "h1b-register": {
    label: "USCIS 官网原文",
    url: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations-and-fashion-models/h-1b-electronic-registration-process",
    highlight: "you must first electronically register and pay the required H-1B registration fee",
    about: "H-1B 先在线注册、交注册费",
  },
  "opt": {
    label: "USCIS 官网原文",
    url: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students",
    highlight: "temporary employment that is directly related to an F-1 student",
    about: "OPT 必须和专业直接相关",
  },
  "opt-12-months": {
    label: "USCIS 官网原文",
    url: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students",
    highlight: "up to 12 months of OPT employment authorization",
    about: "OPT 最多 12 个月",
  },
  "stem-opt": {
    label: "DHS 官网原文",
    url: "https://studyinthestates.dhs.gov/stem-opt-hub",
    highlight: "may apply for a 24-month STEM OPT extension",
    about: "STEM OPT 可延长 24 个月",
  },
  "eb5": {
    label: "USCIS 官网原文",
    url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/eb-5-immigrant-investor-program",
    highlight: "are eligible to apply for lawful permanent residence",
    about: "EB-5 投资人可申请绿卡",
  },
  "o1": {
    label: "USCIS 官网原文",
    url: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement",
    highlight: "possesses extraordinary ability in the sciences, arts, education, business, or athletics",
    about: "O-1 杰出人才签证的条件",
  },
  "prevailing-wage": {
    label: "美国劳工部原文",
    url: "https://flag.dol.gov/programs/prevailingwages",
    highlight: "The requirement to pay prevailing wages",
    about: "雇主必须支付现行工资",
  },
};

async function download(url, file, headers = {}) {
  const res = await fetch(url, { headers: { "user-agent": UA, ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

const warn = (what, e) => console.log(`  [broll] ${what}: ${e?.message ?? e}`);

// ---- stock footage -----------------------------------------------------------

async function pexels(query, file) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=medium&per_page=8`,
    { headers: { Authorization: key } },
  );
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const v = (await res.json()).videos?.find((x) => x.duration >= 4);
  if (!v) return null;
  // Smallest rendition that still covers 1080 wide.
  const f = v.video_files
    .filter((x) => x.file_type === "video/mp4" && x.width >= 1080)
    .sort((a, b) => a.width - b.width)[0];
  if (!f) return null;
  await download(f.link, file);
  return { kind: "video", file, credit: `Pexels · ${v.user?.name ?? "unknown"}`, license: "Pexels License", url: v.url };
}

async function pixabay(query, file) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://pixabay.com/api/videos/?key=${key}&q=${encodeURIComponent(query)}&safesearch=true&per_page=10`,
  );
  if (!res.ok) throw new Error(`Pixabay ${res.status}`);
  const hit = (await res.json()).hits?.find((h) => h.duration >= 4);
  if (!hit) return null;
  // 1080p or the next size down; the 4K "large" files run to 70 MB.
  const r = ["large", "medium", "small"]
    .map((k) => hit.videos[k])
    .find((x) => x?.url && x.height >= 720 && x.size < 25_000_000);
  if (!r) return null;
  await download(r.url, file);
  return { kind: "video", file, credit: `Pixabay · ${hit.user}`, license: "Pixabay Content License", url: hit.pageURL };
}

/** Free-licence footage for an English keyword query; Pexels first (it has portrait clips). */
export async function stockVideo(query, file) {
  if (!query) return null;
  for (const [name, fn] of [["Pexels", pexels], ["Pixabay", pixabay]]) {
    try {
      const r = await fn(query, file);
      if (r) return r;
    } catch (e) {
      warn(`${name} "${query}"`, e);
    }
  }
  return null;
}

// ---- federal public-domain photos -------------------------------------------

// Scans of personal documents and flat graphics read badly as a background
// (and a stranger's visa is not ours to show), so they are skipped.
const SKIP_TITLE = /visa|passport|card|document|form|seal|logo|emblem|map|flag|chart|diagram|signature|\.svg|\.tif/i;

/** A US-federal public-domain photo from Wikimedia Commons. No key needed. */
export async function govImage(query, file) {
  if (!query) return null;
  try {
    const params = new URLSearchParams({
      action: "query", format: "json", generator: "search", gsrnamespace: "6", gsrlimit: "15",
      gsrsearch: `${query} hastemplate:"PD-USGov"`,
      prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1600",
    });
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { "user-agent": UA } });
    const pages = Object.values((await res.json()).query?.pages ?? {}).sort((a, b) => a.index - b.index);
    const pick = pages.find((p) => {
      const ii = p.imageinfo?.[0];
      return ii && /jpeg|png/.test(ii.mime) && ii.width >= 1200 && !SKIP_TITLE.test(p.title) &&
        /public domain/i.test(ii.extmetadata?.LicenseShortName?.value ?? "");
    });
    if (!pick) return null;
    const ii = pick.imageinfo[0];
    await download(ii.thumburl || ii.url, file);
    const artist = (ii.extmetadata?.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim();
    return {
      kind: "image", file,
      credit: `${artist || "U.S. Government"} · Wikimedia Commons`,
      license: "公有领域 · 美国联邦政府作品",
      url: ii.descriptionurl,
    };
  } catch (e) {
    warn(`Commons "${query}"`, e);
    return null;
  }
}

// ---- official page screenshot -----------------------------------------------

/**
 * Screenshot `SOURCES[id]` at 1080×1920 with its highlight sentence marked and
 * scrolled to the upper third. Null if the page is blocked or the sentence has
 * moved — a source scene without the quote would prove nothing.
 */
export async function shootSource(browser, id, file) {
  const src = SOURCES[id];
  if (!src) return null;
  const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, locale: "en-US" });
  try {
    const page = await ctx.newPage();
    const res = await page.goto(src.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    if (!res?.ok()) throw new Error(`HTTP ${res?.status()}`);
    await page.waitForTimeout(1500);
    const found = await page.evaluate((needle) => {
      const norm = (s) => s.replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, " ").toLowerCase();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes = []; let text = "";
      for (let n; (n = walker.nextNode());) { nodes.push([n, text.length]); text += n.textContent; }
      // Index into the raw text; norm() keeps length except for collapsed whitespace,
      // so search the raw text with a whitespace-tolerant regex instead.
      const esc = norm(needle).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+").replace(/'/g, "['\u2019]");
      const m = new RegExp(esc, "i").exec(text);
      if (!m) return false;
      const at = (i) => { let k = nodes.length - 1; while (nodes[k][1] > i) k--; return [nodes[k][0], i - nodes[k][1]]; };
      const range = document.createRange();
      range.setStart(...at(m.index)); range.setEnd(...at(m.index + m[0].length));
      const first = range.getBoundingClientRect();
      window.scrollBy(0, first.top - window.innerHeight * 0.33);
      for (const r of range.getClientRects()) {
        const d = document.createElement("div");
        Object.assign(d.style, {
          position: "absolute", left: `${r.left + window.scrollX - 3}px`, top: `${r.top + window.scrollY - 2}px`,
          width: `${r.width + 6}px`, height: `${r.height + 4}px`, background: "rgba(250,204,21,.55)",
          mixBlendMode: "multiply", borderRadius: "4px", zIndex: 99999, pointerEvents: "none",
        });
        document.body.appendChild(d);
      }
      return true;
    }, src.highlight);
    if (!found) throw new Error("highlight sentence not on page");
    await page.screenshot({ path: file, type: "jpeg", quality: 90 });
    return { kind: "image", file, credit: new URL(src.url).hostname, license: "公有领域 · 美国联邦政府网站", url: src.url, source: src };
  } catch (e) {
    warn(`source ${id}`, e);
    return null;
  } finally {
    await ctx.close();
  }
}

// ---- hand-supplied media -----------------------------------------------------

/**
 * `{ file, credit, license, url }` from a hand-written script, path relative
 * to this folder. Credit and licence are mandatory: a CC-BY clip without
 * attribution is a copyright claim waiting to happen. Use CC-BY clips only
 * under our own commentary — a re-upload counts as reused content on YouTube.
 */
export function manualMedia(here, m) {
  if (!m) return null;
  if (!m.file || !m.credit || !m.license) throw new Error(`media needs file, credit and license: ${JSON.stringify(m)}`);
  const file = path.resolve(here, m.file);
  if (!fs.existsSync(file)) throw new Error(`media file not found: ${file}`);
  const kind = /\.(mp4|mov|webm|mkv)$/i.test(file) ? "video" : "image";
  return { kind, file, credit: m.credit, license: m.license, url: m.url ?? "" };
}
