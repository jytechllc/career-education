import type { getAdminDict } from "@/lib/admin-i18n";
import type { BoardJob } from "@/lib/jobs";

const TYPE_STYLE = {
  intern: "bg-blue-50 text-blue-700",
  entry: "bg-green-50 text-green-700",
  experienced: "bg-purple-50 text-purple-700",
} as const;

type JobsDict = Awaited<ReturnType<typeof getAdminDict>>["t"]["jobs"];

/** Job rows from jobmatching.us, shared by 岗位 and the internships tracker. */
export default function JobsTable({ items, lang, t }: { items: BoardJob[]; lang: string; t: JobsDict }) {
  const dateFmt = new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" });

  return (
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
                <tr>
                  <th className="px-4 py-2">{t.col.title}</th>
                  <th className="px-4 py-2">{t.col.company}</th>
                  <th className="px-4 py-2">{t.col.type}</th>
                  <th className="px-4 py-2">{t.col.location}</th>
                  <th className="px-4 py-2">{t.col.category}</th>
                  <th className="px-4 py-2">{t.col.posted}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((j) => (
                  <tr key={j.key} className="align-top hover:bg-yellow-50/40">
                    <td className="px-4 py-2">
                      <a className="font-medium text-yellow-900 hover:underline" href={j.url} rel="noreferrer" target="_blank">{j.title}</a>
                      {j.kind === "recruiter" && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{t.recruiter}</span>}
                    </td>
                    <td className="px-4 py-2">{j.company || "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs ${TYPE_STYLE[j.type]}`}>{t.types[j.type]}</span>
                    </td>
                    <td className="max-w-[16rem] px-4 py-2 text-gray-600">{j.locations.slice(0, 3).join("; ")}{j.locations.length > 3 && " …"}</td>
                    <td className="px-4 py-2 text-gray-600">{j.category || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-500">{j.postedAt ? dateFmt.format(new Date(j.postedAt)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
  );
}
