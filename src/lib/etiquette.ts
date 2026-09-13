import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/lib/i18n";

// Workplace-etiquette curriculum. Unlike the blog (time-sensitive, AI-generated
// into Postgres), these are evergreen lessons authored in-repo so they stay
// versioned, reviewable and renderable without a database.
export type Lesson = {
  slug: string;
  order: number;
  title: string;
  summary: string;
  tags: string[];
  minutes: number;
  content: string; // markdown body
};

const ROOT = path.join(process.cwd(), "content", "etiquette");

const cache = new Map<Locale, Lesson[]>();

// Minimal frontmatter reader: `key: value` pairs, plus `[a, b]` array values.
// Deliberately not a full YAML parser — the lesson files only use this subset.
function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body: match[2].trimStart() };
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

export function listLessons(locale: Locale): Lesson[] {
  const cached = cache.get(locale);
  if (cached) return cached;

  const dir = path.join(ROOT, locale);
  if (!fs.existsSync(dir)) return [];

  const lessons = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { meta, body } = parseFrontmatter(raw);
      return {
        slug: meta.slug || file.replace(/^\d+-/, "").replace(/\.md$/, ""),
        order: Number(meta.order ?? 0),
        title: meta.title ?? file,
        summary: meta.summary ?? "",
        tags: parseList(meta.tags),
        minutes: Number(meta.minutes ?? 6),
        content: body,
      } satisfies Lesson;
    })
    .sort((a, b) => a.order - b.order);

  cache.set(locale, lessons);
  return lessons;
}

export function getLesson(locale: Locale, slug: string): Lesson | null {
  return listLessons(locale).find((l) => l.slug === slug) ?? null;
}

export function getNeighbors(locale: Locale, slug: string) {
  const lessons = listLessons(locale);
  const i = lessons.findIndex((l) => l.slug === slug);
  return {
    prev: i > 0 ? lessons[i - 1] : null,
    next: i >= 0 && i < lessons.length - 1 ? lessons[i + 1] : null,
  };
}
