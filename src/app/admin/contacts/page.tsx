import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { logActivity } from "@/lib/activity";
import { CONTACT_REGIONS, CONTACT_TYPES, fetchContacts, type ContactPage } from "@/lib/contacts";

import { RegionEditor } from "./RegionEditor";

export default async function AdminContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; region?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const type = CONTACT_TYPES.find((x) => x === sp.type);
  const region = CONTACT_REGIONS.find((x) => x === sp.region);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);
  const params = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { type, region, q: q || undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/contacts${s ? `?${s}` : ""}`;
  };

  const { email } = await requireStaff(params({ page: page > 1 ? String(page) : undefined }));
  const { t: d } = await getAdminDict();
  const t = d.contacts;

  let data: ContactPage | null = null;
  try {
    data = await fetchContacts({ type, region, q, page });
  } catch (e) {
    console.error("[admin/contacts] job-matching read failed", e);
  }
  // Internal resource: record who looked at which slice.
  await logActivity({ actorType: "staff", actor: email, action: "contact.view", detail: { type, region, q, page } });

  const count = (r: string | undefined, ty: string | undefined) =>
    (data?.counts ?? [])
      .filter((c) => (r ? c.region === r : c.region === "hong kong" || c.region === "shenzhen") && (!ty || c.type === ty))
      .reduce((n, c) => n + c.n, 0);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm ${active ? "bg-yellow-700 text-white" : "bg-white text-yellow-900 hover:bg-yellow-100"}`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-yellow-900">{t.title}</h1>
          <Link className="rounded bg-yellow-700 px-3 py-1.5 text-sm text-white" href="/admin/contacts/new">
            {t.addLink}
          </Link>
        </div>
        <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Link className={chip(!type)} href={params({ type: undefined, page: undefined })}>
            {t.allTypes} <span className="opacity-70">{count(region, undefined)}</span>
          </Link>
          {CONTACT_TYPES.map((ty) => (
            <Link key={ty} className={chip(type === ty)} href={params({ type: ty, page: undefined })}>
              {t.types[ty]} <span className="opacity-70">{count(region, ty)}</span>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={chip(!region)} href={params({ region: undefined, page: undefined })}>
            {t.hkSz}
          </Link>
          {CONTACT_REGIONS.map((r) => (
            <Link key={r} className={chip(region === r)} href={params({ region: r, page: undefined })}>
              {t.regions[r]} <span className="opacity-70">{count(r, type)}</span>
            </Link>
          ))}
        </div>
        <form className="flex flex-wrap gap-2" method="get">
          {type && <input name="type" type="hidden" value={type} />}
          {region && <input name="region" type="hidden" value={region} />}
          <input
            className="w-72 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
            defaultValue={q}
            name="q"
            placeholder={t.searchPlaceholder}
          />
          <button className="rounded bg-yellow-700 px-3 py-1.5 text-sm text-white" type="submit">
            {t.search}
          </button>
        </form>
      </div>

      {!data && <p className="text-sm text-red-700">{t.error}</p>}
      {data && (
        <>
          <p className="text-xs text-gray-500">{t.showing(data.total, data.page, pages)}</p>
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
                <tr>
                  <th className="px-4 py-2">{t.col.name}</th>
                  <th className="px-4 py-2">{t.col.company}</th>
                  <th className="px-4 py-2">{t.col.email}</th>
                  <th className="px-4 py-2 min-w-56">{t.col.regions}</th>
                  <th className="px-4 py-2">{t.col.status}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-gray-500" colSpan={5}>
                      {t.empty}
                    </td>
                  </tr>
                )}
                {data.rows.map((c) => (
                  <tr key={`${c.type}-${c.id}`} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-2">
                      <div className="font-medium">{c.name ?? t.types[c.type]}</div>
                      <div className="text-xs text-gray-500">{c.title ?? ""}</div>
                      {c.city && <div className="text-xs text-gray-400">{c.city}</div>}
                    </td>
                    <td className="px-4 py-2">
                      <div>{c.company ?? "—"}</div>
                      <div className="text-xs text-gray-400">{t.types[c.type]}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div>{c.email}</div>
                      {(c.phone || c.wechat) && (
                        <div className="text-xs text-gray-500">{[c.phone, c.wechat && `WeChat ${c.wechat}`].filter(Boolean).join(" · ")}</div>
                      )}
                      {c.notes && <div className="text-xs text-gray-500 whitespace-pre-wrap">{c.notes}</div>}
                      <div className="flex gap-2 text-xs">
                        {c.linkedin && (
                          <a className="text-yellow-800 underline" href={c.linkedin} rel="noreferrer" target="_blank">
                            {c.type === "headhunter" || c.type === "inhouse" ? "LinkedIn" : t.profile}
                          </a>
                        )}
                        {c.emailSource && (
                          <a className="text-yellow-800 underline" href={c.emailSource} rel="noreferrer" target="_blank">
                            {t.emailSource}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <RegionEditor
                        all={CONTACT_REGIONS}
                        id={c.id}
                        labels={t.regions}
                        manual={c.regionSource === "manual"}
                        regions={c.regions}
                        t={t.editor}
                        type={c.type}
                      />
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">
                      {c.repliedAt ? t.status.replied : c.contactedAt ? t.status.contacted : t.status.none}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {page > 1 && (
              <Link className="text-yellow-800 underline" href={params({ page: String(page - 1) })}>
                {t.prev}
              </Link>
            )}
            {page < pages && (
              <Link className="text-yellow-800 underline" href={params({ page: String(page + 1) })}>
                {t.next}
              </Link>
            )}
          </div>
        </>
      )}
      <p className="text-xs text-gray-500">{t.note}</p>
    </div>
  );
}
