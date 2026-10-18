import "server-only";

import ExcelJS from "exceljs";

import { CONTACT_REGIONS } from "./contacts";

/**
 * Parse a staff upload (.xlsx / .csv, or a table pasted from Excel) into
 * contacts for job-matching's POST /api/contacts. Headers may be Chinese or
 * English; unknown columns are ignored.
 */
export type ImportRow = {
  type: "headhunter" | "inhouse" | "org";
  email: string;
  name: string | null;
  title: string | null;
  company: string | null;
  phone: string | null;
  wechat: string | null;
  linkedin: string | null;
  regions: string[];
  notes: string | null;
  /** Validation problems; rows with any are not imported. */
  problems: string[];
};

const HEADERS: Record<keyof Omit<ImportRow, "problems">, RegExp> = {
  type: /^(类型|類型|type|contact ?type)$/i,
  email: /^(邮箱|郵箱|电子邮件|電郵|email|e-mail|work email)$/i,
  name: /^(姓名|名字|name|full ?name|联系人|聯絡人)$/i,
  title: /^(职位|職位|title|job ?title|position)$/i,
  company: /^(公司|公司名称|公司名稱|company|organi[sz]ation|firm)$/i,
  phone: /^(电话|電話|手机|手機|phone|mobile|tel)$/i,
  wechat: /^(微信|微信号|wechat|wechat ?id)$/i,
  linkedin: /^(linkedin|领英|領英)$/i,
  regions: /^(区域|區域|地区|地區|region|regions)$/i,
  notes: /^(备注|備註|notes?|remark)$/i,
};

const REGION_ALIASES: [RegExp, string][] = [
  [/^(香港|hk|hong ?kong)$/i, "hong kong"],
  [/^(深圳|sz|shenzhen)$/i, "shenzhen"],
  [/^(中国内地|中國內地|内地|內地|中国|中國|大陆|大陸|china|mainland( china)?)$/i, "china"],
  [/^(新加坡|sg|singapore)$/i, "singapore"],
  [/^(美国|美國|us|usa|united states)$/i, "us"],
  [/^(英国|英國|uk|united kingdom)$/i, "uk"],
  [/^(印度|india)$/i, "india"],
  [/^(其他|其它|other)$/i, "other"],
];

function parseRegions(v: string): { regions: string[]; unknown: string[] } {
  const regions: string[] = [];
  const unknown: string[] = [];
  for (const part of v.split(/[、,，;；/|+\s]+/).map((s) => s.trim()).filter(Boolean)) {
    const hit = REGION_ALIASES.find(([re]) => re.test(part))?.[1] ?? (CONTACT_REGIONS as readonly string[]).find((r) => r === part.toLowerCase());
    if (hit) regions.push(hit);
    else unknown.push(part);
  }
  return { regions: Array.from(new Set(regions)), unknown };
}

function parseType(v: string, fallback: ImportRow["type"]): ImportRow["type"] {
  if (/组织|組織|协会|協會|狮子会|獅子會|商会|商會|校友会|校友會|association|club|chamber|society|ngo|npo/i.test(v)) return "org";
  if (/猎头|獵頭|headhunt|agency|search|recruitment consultant/i.test(v)) return "headhunter";
  if (/企业|企業|内部|內部|in-?house|hr|company/i.test(v)) return "inhouse";
  return fallback;
}

/** Simple CSV/TSV split that honours double quotes. */
function splitTable(text: string): string[][] {
  const delim = text.split("\n")[0].includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

async function xlsxTable(buf: ArrayBuffer): Promise<string[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const rows: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (r) => {
    const vals: string[] = [];
    r.eachCell({ includeEmpty: true }, (c, col) => {
      const v = c.value as unknown;
      vals[col - 1] =
        v == null
          ? ""
          : typeof v === "object" && v !== null && "text" in v
            ? String((v as { text: unknown }).text)
            : typeof v === "object" && v !== null && "hyperlink" in v
              ? String((v as { hyperlink: unknown }).hyperlink).replace(/^mailto:/i, "")
              : String(v);
    });
    rows.push(Array.from(vals, (x) => x ?? ""));
  });
  return rows;
}

export async function parseContacts(input: { file?: File | null; text?: string }, fallbackType: ImportRow["type"]): Promise<ImportRow[]> {
  let table: string[][] = [];
  if (input.file && input.file.size > 0) {
    if (/\.xlsx$/i.test(input.file.name)) table = await xlsxTable(await input.file.arrayBuffer());
    else table = splitTable(await input.file.text());
  } else if (input.text?.trim()) {
    table = splitTable(input.text);
  }
  if (table.length < 2) return [];

  const head = table[0].map((h) => h.trim());
  const col = Object.fromEntries(
    Object.entries(HEADERS).map(([k, re]) => [k, head.findIndex((h) => re.test(h))]),
  ) as Record<keyof typeof HEADERS, number>;
  const get = (r: string[], k: keyof typeof HEADERS) => (col[k] >= 0 ? (r[col[k]] ?? "").trim() : "");

  return table.slice(1, 1001).map((r) => {
    const problems: string[] = [];
    const email = get(r, "email").toLowerCase();
    const type = parseType(get(r, "type"), fallbackType);
    // Organisations may be recorded without an email (website and name only).
    if (type === "org") {
      if (!email && !get(r, "company")) problems.push("organisation name or email required");
      else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push("invalid email");
    } else if (col.email < 0) problems.push("no email column");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push("invalid email");
    const { regions, unknown } = parseRegions(get(r, "regions"));
    if (unknown.length) problems.push(`unknown region: ${unknown.join(", ")}`);
    const opt = (k: keyof typeof HEADERS) => get(r, k) || null;

    return {
      type,
      email,
      name: opt("name"),
      title: opt("title"),
      company: opt("company"),
      phone: opt("phone"),
      wechat: opt("wechat"),
      linkedin: opt("linkedin"),
      regions,
      notes: opt("notes"),
      problems,
    };
  });
}
