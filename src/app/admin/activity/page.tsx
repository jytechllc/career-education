import Link from "next/link";
import { and, desc, eq, ilike, lt, or, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { activityLog } from "@/lib/schema";
import type { ActorType } from "@/lib/activity";

const PAGE_SIZE = 100;
const ACTOR_TYPES: ActorType[] = ["staff", "partner", "student", "visitor", "ai", "system"];

const TONE: Record<string, string> = {
  staff: "bg-yellow-100 text-yellow-900",
  partner: "bg-blue-100 text-blue-900",
  student: "bg-green-100 text-green-900",
  visitor: "bg-gray-100 text-gray-700",
  ai: "bg-purple-100 text-purple-900",
  system: "bg-slate-200 text-slate-700",
};

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; before?: string }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams(
    Object.entries(sp).filter((e): e is [string, string] => !!e[1]),
  ).toString();

  await requireStaff(`/admin/activity${qs ? `?${qs}` : ""}`, { adminOnly: true });
  const { t: d } = await getAdminDict();
  const t = d.activity;

  const type = ACTOR_TYPES.includes(sp.type as ActorType) ? (sp.type as ActorType) : null;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const before = Number(sp.before) || null;

  const where: SQL[] = [];

  if (type) where.push(eq(activityLog.actorType, type));
  if (before) where.push(lt(activityLog.id, before));
  if (q) {
    const like = `%${q}%`;

    where.push(
      or(
        ilike(activityLog.actor, like),
        ilike(activityLog.action, like),
        ilike(activityLog.targetId, like),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(activityLog)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(activityLog.id))
    .limit(PAGE_SIZE);

  const keep = new URLSearchParams();

  if (type) keep.set("type", type);
  if (q) keep.set("q", q);
  const olderHref =
    rows.length === PAGE_SIZE
      ? `/admin/activity?${new URLSearchParams([...keep, ["before", String(rows[rows.length - 1].id)]])}`
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-yellow-900">{t.title}</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-3xl">{t.subtitle}</p>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <select
          className="h-10 rounded-md border border-yellow-200 bg-white px-3 text-sm"
          defaultValue={type ?? ""}
          name="type"
        >
          <option value="">{t.allActors}</option>
          {ACTOR_TYPES.map((a) => (
            <option key={a} value={a}>
              {t.actorTypes[a]}
            </option>
          ))}
        </select>
        <input
          className="h-10 rounded-md border border-yellow-200 bg-white px-3 text-sm w-64 max-w-full"
          defaultValue={q}
          name="q"
          placeholder={t.searchPlaceholder}
          type="search"
        />
        <button
          className="h-10 rounded-md bg-yellow-600 px-4 text-sm font-medium text-white hover:bg-yellow-700"
          type="submit"
        >
          {t.filter}
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">{t.empty}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
              <tr>
                <th className="px-4 py-2 whitespace-nowrap">{t.col.time}</th>
                <th className="px-4 py-2">{t.col.actor}</th>
                <th className="px-4 py-2">{t.col.action}</th>
                <th className="px-4 py-2">{t.col.target}</th>
                <th className="px-4 py-2">{t.col.detail}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                    {r.createdAt.toLocaleString(d.dateLocale, { hour12: false })}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`mr-2 rounded-full px-2 py-0.5 text-[11px] ${TONE[r.actorType] ?? TONE.visitor}`}
                    >
                      {t.actorTypes[r.actorType as ActorType] ?? r.actorType}
                    </span>
                    <span className="break-all text-gray-800">{r.actor ?? "—"}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-800">{r.action}</td>
                  <td className="px-4 py-2 text-xs text-gray-600 break-all">
                    {r.targetType ? `${r.targetType}:${r.targetId ?? ""}` : "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500 break-all max-w-md">
                    {r.detail ? JSON.stringify(r.detail) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between text-sm">
        {before ? (
          <Link className="text-yellow-700 underline" href={`/admin/activity${keep.size ? `?${keep}` : ""}`}>
            {t.newest}
          </Link>
        ) : (
          <span />
        )}
        {olderHref ? (
          <Link className="text-yellow-700 underline" href={olderHref}>
            {t.older}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
