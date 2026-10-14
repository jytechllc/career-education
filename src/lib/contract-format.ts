// Client-safe formatting shared by the signer page and /admin/contracts, so the
// same moment reads the same everywhere (contracts are signed in China).

export const CONTRACT_TZ = "Asia/Shanghai";

export function fmtBeijing(d: Date | string | null | undefined, withLabel = true): string {
  if (!d) return "—";

  const s = new Date(d).toLocaleString("zh-CN", { timeZone: CONTRACT_TZ, hour12: false });

  return withLabel ? `${s}（北京时间）` : s;
}

/** yyyymmdd in Beijing time — used in contract numbers. */
export function ymdBeijing(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CONTRACT_TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(d)
    .replace(/-/g, "");
}

/**
 * Unfilled blanks left in contract text: runs of full-width spaces, ____,
 * empty 【 】, or 年　月　日 date stubs. Returns each offending line (trimmed).
 */
export function findBlanks(md: string): string[] {
  const re = /(　{3,}|_{3,}|【\s*】|年\s{2,}月\s{2,}日|年　+月　+日)/;

  return md
    .split("\n")
    .filter((l) => re.test(l))
    .map((l) => l.replace(/\*\*/g, "").trim().slice(0, 80));
}

/**
 * Imported contracts end with a hand-signing page (### 签署页 …) — blank
 * signature/date/seal lines that the electronic signature block replaces.
 * Returns the text with that section removed, and whether one was found.
 */
export function stripSignaturePage(md: string): { text: string; stripped: boolean } {
  const m = md.match(/^#{1,6}\s*(签署页|签字页|Signature Page)[^\n]*$/im);

  if (!m || m.index === undefined) return { text: md, stripped: false };

  return { text: md.slice(0, m.index).trimEnd() + "\n", stripped: true };
}

/** Party labels named in the contract (甲方 / 乙方 / 丙方 …), in order of first mention. */
export function findParties(md: string): string[] {
  const seen: string[] = [];

  for (const m of md.matchAll(/\*\*([甲乙丙丁])方/g)) {
    const label = `${m[1]}方`;

    if (!seen.includes(label)) seen.push(label);
  }

  return seen;
}
