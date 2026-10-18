import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import subsetFont from "subset-font";

import type { StudentProfile } from "./schema";
import { profileCode, scrubPii } from "./student-profiles";

/**
 * De-identified profile PDF: the profile fields (minus name and contact) and
 * the redacted resume, under the student's code instead of their name.
 *
 * Fonts (OFL, in assets/fonts): Latin text is set in Noto Sans and everything
 * else in Noto Sans SC. pdf-lib mis-sizes Latin digits taken from the CJK font,
 * and its own subsetting scrambles CJK glyphs, so each PDF embeds harfbuzz
 * subsets of just the characters it uses.
 */

const FONT_DIR = path.join(process.cwd(), "assets/fonts");
const FONT_FILES = ["NotoSans-Regular.ttf", "NotoSans-Bold.ttf", "NotoSansSC-Regular.ttf", "NotoSansSC-Bold.ttf"];

let fontBytes: Promise<Buffer[]> | null = null;

function loadFonts() {
  fontBytes ??= Promise.all(FONT_FILES.map((f) => readFile(path.join(FONT_DIR, f))));

  return fontBytes;
}

const A4 = { w: 595.28, h: 841.89 };
const M = { x: 50, top: 56, bottom: 56 };
const INK = rgb(0.13, 0.13, 0.13);
const MUTED = rgb(0.45, 0.45, 0.45);
const ACCENT = rgb(0.6, 0.42, 0.05);
const RULE = rgb(0.85, 0.8, 0.65);

/** One weight: a Latin font plus the CJK fallback for whatever it lacks. */
class Face {
  private latinChars: Set<number>;

  constructor(
    private latin: PDFFont,
    private cjk: PDFFont,
  ) {
    this.latinChars = new Set(latin.getCharacterSet());
  }

  /** Text split into runs that each use a single font. */
  segments(text: string, size: number): { font: PDFFont; text: string; w: number }[] {
    const out: { font: PDFFont; text: string; w: number }[] = [];

    for (const ch of text) {
      const font = this.latinChars.has(ch.codePointAt(0)!) ? this.latin : this.cjk;
      const last = out[out.length - 1];

      if (last?.font === font) last.text += ch;
      else out.push({ font, text: ch, w: 0 });
    }
    for (const s of out) s.w = s.font.widthOfTextAtSize(s.text, size);

    return out;
  }

  draw(page: PDFPage, text: string, x: number, y: number, size: number, color: RGB) {
    for (const s of this.segments(text, size)) {
      if (s.text.trim()) page.drawText(s.text, { x, y, size, font: s.font, color });
      x += s.w;
    }
  }
}

type Run = { text: string; bold: boolean };

/** Split `**bold**` markers into runs. */
function runsOf(line: string): Run[] {
  const runs: Run[] = [];

  for (const p of line.split(/(\*\*[^*]+\*\*)/g)) {
    if (!p) continue;
    if (p.startsWith("**") && p.endsWith("**")) runs.push({ text: p.slice(2, -2), bold: true });
    // Italic has no face here; drop its markers (and any stray **).
    else runs.push({ text: p.replace(/\*\*/g, "").replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1$2"), bold: false });
  }

  return runs;
}

/** Break points: each CJK character on its own, Latin words with their trailing spaces. */
const TOKEN_RE = /[⺀-鿿豈-﫿＀-￯]|[^\s⺀-鿿豈-﫿＀-￯]+\s*|\s+/g;

const NO_LINE_START = /^[、，。：；！？）」』》,.:;!?)\]]$/;

class Writer {
  private page!: PDFPage;
  private y = 0;
  private pageNo = 0;

  constructor(
    private doc: PDFDocument,
    private regular: Face,
    private bold: Face,
    private footer: string,
  ) {
    this.newPage();
  }

  private newPage() {
    this.page = this.doc.addPage([A4.w, A4.h]);
    this.pageNo++;
    this.y = A4.h - M.top;
    this.regular.draw(this.page, `${this.footer}  ·  ${this.pageNo}`, M.x, M.bottom - 24, 7.5, MUTED);
  }

  private ensure(h: number) {
    if (this.y - h < M.bottom) this.newPage();
  }

  gap(h: number) {
    this.y -= h;
  }

  rule() {
    this.ensure(8);
    this.page.drawLine({
      start: { x: M.x, y: this.y },
      end: { x: A4.w - M.x, y: this.y },
      thickness: 0.6,
      color: RULE,
    });
    this.y -= 8;
  }

  /** Wrapped rich text, advancing y. */
  para(runs: Run[], { size = 9.5, indent = 0, color = INK, lead = 1.5, bullet = false, hang = 0 } = {}) {
    const maxW = A4.w - M.x * 2 - indent - hang;
    const lineH = size * lead;
    type Seg = { font: PDFFont; text: string; w: number };
    const lines: Seg[][] = [[]];
    let lineW = 0;

    for (const run of runs) {
      const face = run.bold ? this.bold : this.regular;

      for (const tok of run.text.match(TOKEN_RE) ?? []) {
        const segs = face.segments(tok, size);
        const w = segs.reduce((a, s) => a + s.w, 0);

        // Closing punctuation never starts a line; it may overhang the margin slightly.
        if (lineW + w > maxW && lines[lines.length - 1].length && !NO_LINE_START.test(tok)) {
          if (/^\s+$/.test(tok)) continue;
          lines.push([]);
          lineW = 0;
        }
        lines[lines.length - 1].push(...segs);
        lineW += w;
      }
    }

    lines.forEach((line, i) => {
      this.ensure(lineH);
      this.y -= lineH;
      if (bullet && i === 0) this.regular.draw(this.page, "•", M.x + indent, this.y, size, color);
      let x = M.x + indent + hang;

      for (const seg of line) {
        if (seg.text.trim()) this.page.drawText(seg.text, { x, y: this.y, size, font: seg.font, color });
        x += seg.w;
      }
    });
  }

  heading(text: string, size = 12) {
    this.ensure(size * 3);
    this.gap(size * 0.6);
    this.para([{ text, bold: true }], { size, color: ACCENT, lead: 1.4 });
    this.gap(3);
  }

  /** Label/value row of the profile table. */
  field(label: string, value: string | null, missing: string) {
    const lines = (value ?? missing).split("\n").filter((l) => l.trim());

    // Same baseline as the value's first line (para moves down one line, then draws).
    this.ensure(15);
    this.bold.draw(this.page, label, M.x, this.y - 9.5 * 1.5, 9, MUTED);
    lines.forEach((l) =>
      this.para([{ text: l, bold: false }], { size: 9.5, indent: 120, color: value ? INK : MUTED, lead: 1.5 }),
    );
    this.gap(3);
  }
}

/** Minimal Markdown → PDF: headings, bullets, bold runs, paragraphs. */
function renderMarkdown(w: Writer, md: string) {
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      w.gap(4);
      continue;
    }
    const h = line.match(/^#{1,6}\s+(.*)$/);

    if (h) {
      w.heading(h[1].replace(/\*\*/g, ""), 11);
      continue;
    }
    const b = line.match(/^(\s*)[-*+•]\s+(.*)$/);

    if (b) {
      w.para(runsOf(b[2]), { indent: 6 + Math.min(b[1].length, 8) * 3, hang: 10, bullet: true });
      continue;
    }
    // Indented continuation lines sit under the bullet text above them.
    const lead = line.match(/^\s*/)![0].length;

    w.para(runsOf(line.trim()), lead ? { indent: 6 + Math.min(lead - 2, 8) * 3 + 10 } : {});
  }
}

export interface ProfilePdfLabels {
  title: string;
  subtitle: string;
  generated: string;
  footer: string;
  missing: string;
  resumeHeading: string;
  fields: { label: string; value: (p: StudentProfile) => string | null }[];
}

export async function buildRedactedPdf(p: StudentProfile, labels: ProfilePdfLabels): Promise<Uint8Array> {
  const known = { name: p.name, email: p.email, phone: p.phone };
  const scrub = (v: string | null) => (v ? scrubPii(v, known) || null : null);
  const code = profileCode(p.id);
  const values = labels.fields.map((f) => ({ label: f.label, value: scrub(f.value(p)) }));
  const resume = p.redactedResumeMd ? scrubPii(p.redactedResumeMd, known) : "";

  // Every character any page will draw (page numbers included).
  const used = [
    labels.title,
    labels.subtitle,
    labels.generated,
    labels.footer,
    labels.missing,
    labels.resumeHeading,
    code,
    ...values.flatMap((v) => [v.label, v.value ?? ""]),
    resume,
    " ·•0123456789",
  ].join("");
  const subsets = await Promise.all(
    (await loadFonts()).map((bytes) => subsetFont(bytes, used, { targetFormat: "truetype" })),
  );
  const doc = await PDFDocument.create();

  doc.registerFontkit(fontkit);
  // pdf-lib draws advance widths only, so ligatures and kerning would misplace glyphs.
  const features = { liga: false, clig: false, dlig: false, calt: false, kern: false, palt: false };
  const [latin, latinBold, cjk, cjkBold] = await Promise.all(
    subsets.map((bytes) => doc.embedFont(bytes, { subset: false, features })),
  );

  doc.setTitle(`${labels.title} ${code}`);
  doc.setAuthor("JYEdu");
  doc.setProducer("edu.jytech.us");
  doc.setCreator("edu.jytech.us");

  const w = new Writer(doc, new Face(latin, cjk), new Face(latinBold, cjkBold), labels.footer);

  w.para([{ text: labels.title, bold: true }], { size: 18, color: ACCENT, lead: 1.3 });
  w.para([{ text: `${code}  ·  ${labels.subtitle}`, bold: false }], { size: 9, color: MUTED });
  w.para([{ text: labels.generated, bold: false }], { size: 8, color: MUTED });
  w.gap(6);
  w.rule();

  for (const v of values) w.field(v.label, v.value, labels.missing);

  if (resume) {
    w.gap(4);
    w.rule();
    w.heading(labels.resumeHeading, 13);
    renderMarkdown(w, resume);
  }

  return doc.save();
}
