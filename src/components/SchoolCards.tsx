import type { ReactNode } from "react";

// Minimal hast types — just what react-markdown hands a `table` component.
type HastText = { type: "text"; value: string };
type HastElement = {
  type: "element";
  tagName: string;
  properties?: { href?: string };
  children: HastNode[];
};
type HastNode = HastText | HastElement | { type: string };

const isElement = (n: HastNode): n is HastElement => n.type === "element";

function elements(n: HastElement, tag: string): HastElement[] {
  return n.children.filter(
    (c): c is HastElement => isElement(c) && c.tagName === tag,
  );
}

function textOf(n: HastNode): string {
  if (n.type === "text") return (n as HastText).value;
  if (isElement(n)) return n.children.map(textOf).join("");
  return "";
}

// Cell content is inline markdown only: text, links, bold/italic, code, br.
function render(n: HastNode, key: number): ReactNode {
  if (n.type === "text") return (n as HastText).value;
  if (!isElement(n)) return null;
  const kids = n.children.map(render);
  switch (n.tagName) {
    case "a":
      return (
        <a key={key} href={n.properties?.href} target="_blank" rel="noopener noreferrer">
          {kids}
        </a>
      );
    case "strong":
      return <strong key={key}>{kids}</strong>;
    case "em":
      return <em key={key}>{kids}</em>;
    case "code":
      return <code key={key}>{kids}</code>;
    case "br":
      return <br key={key} />;
    default:
      return <span key={key}>{kids}</span>;
  }
}

type Parsed = { headers: string[]; rows: HastElement[][] };

function parse(table: HastElement): Parsed {
  const [thead] = elements(table, "thead");
  const [tbody] = elements(table, "tbody");
  const headRow = thead ? elements(thead, "tr")[0] : undefined;
  const headers = headRow ? elements(headRow, "th").map((c) => textOf(c).trim()) : [];
  const rows = tbody
    ? elements(tbody, "tr").map((tr) => elements(tr, "td"))
    : [];
  return { headers, rows };
}

const SCHOOL = /学校/;
const LONG = /优势|理由/;
const BADGE = /^(档位|STEM)$/;

// A school list is a table with a 学校 column and a long 优势/理由 column;
// comparison tables (cost bands, application mix) stay as tables.
export function asSchoolTable(node: unknown): Parsed | null {
  if (!node || !isElement(node as HastNode)) return null;
  const parsed = parse(node as HastElement);
  const { headers } = parsed;
  if (!headers.some((h) => SCHOOL.test(h)) || !headers.some((h) => LONG.test(h))) {
    return null;
  }
  return parsed;
}

function tierTone(text: string) {
  if (text.includes("冲刺")) return "bg-rose-100 text-rose-800";
  if (text.includes("主申")) return "bg-blue-100 text-blue-800";
  if (text.includes("保底")) return "bg-emerald-100 text-emerald-800";
  return "bg-gray-100 text-gray-700";
}

function stemTone(text: string) {
  if (text.includes("已核实")) return "bg-green-100 text-green-800";
  if (text.includes("不适用")) return "bg-gray-100 text-gray-600";
  return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
}

export default function SchoolCards({ headers, rows }: Parsed) {
  const nameIdx = headers.findIndex((h) => SCHOOL.test(h));
  const longIdx = headers.findIndex((h) => LONG.test(h));

  return (
    <div className="not-prose my-6 grid gap-4 md:grid-cols-2">
      {rows.map((cells, r) => (
        <div
          key={r}
          className="flex flex-col rounded-xl border border-yellow-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap gap-2">
            {headers.map((h, i) =>
              BADGE.test(h) && cells[i] ? (
                <span
                  key={i}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    h === "STEM" ? stemTone(textOf(cells[i])) : tierTone(textOf(cells[i]))
                  }`}
                >
                  {h === "STEM" ? "STEM：" : ""}
                  {cells[i].children.map(render)}
                </span>
              ) : null,
            )}
          </div>

          <h4 className="mt-3 text-lg font-bold leading-snug text-gray-900 [&_strong]:font-bold">
            {cells[nameIdx]?.children.map(render)}
          </h4>

          <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            {headers.map((h, i) =>
              i === nameIdx || i === longIdx || BADGE.test(h) || !cells[i] ? null : (
                <div key={i}>
                  <dt className="text-xs text-gray-500">{h}</dt>
                  <dd className="mt-0.5 text-gray-800 [&_a]:text-yellow-700 [&_a]:underline">
                    {cells[i].children.map(render)}
                  </dd>
                </div>
              ),
            )}
          </dl>

          {longIdx >= 0 && cells[longIdx] && (
            <div className="mt-4 border-t border-yellow-100 pt-3 text-sm leading-relaxed text-gray-700 [&_a]:text-yellow-700 [&_a]:underline">
              <p className="mb-1 text-xs font-medium text-yellow-700">{headers[longIdx]}</p>
              {cells[longIdx].children.map(render)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
