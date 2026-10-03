import { desc, ilike, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { candidates } from "@/lib/schema";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);

  await requireAdmin(`/admin/students${q ? `?q=${encodeURIComponent(q)}` : ""}`);

  const like = `%${q}%`;
  const rows = await db
    .select()
    .from(candidates)
    .where(q ? or(ilike(candidates.name, like), ilike(candidates.email, like)) : undefined)
    .orderBy(desc(candidates.updatedAt))
    .limit(500);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-yellow-900">站内学员（{rows.length}）</h1>
        <p className="text-sm text-gray-500 mt-1">在网站登录并填写过个人资料（/profile）的用户。</p>
      </div>

      <form className="flex gap-2" method="get">
        <input
          className="h-10 rounded-md border border-yellow-200 bg-white px-3 text-sm w-64 max-w-full"
          defaultValue={q}
          name="q"
          placeholder="姓名或邮箱"
          type="search"
        />
        <button
          className="h-10 rounded-md bg-yellow-600 px-4 text-sm font-medium text-white hover:bg-yellow-700"
          type="submit"
        >
          搜索
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          {q ? "没有符合条件的学员。" : "还没有学员在网站上填写资料。"}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
              <tr>
                <th className="px-4 py-2">姓名</th>
                <th className="px-4 py-2">邮箱 / 电话</th>
                <th className="px-4 py-2">所在地</th>
                <th className="px-4 py-2">求职意向</th>
                <th className="px-4 py-2">需要签证担保</th>
                <th className="px-4 py-2">LinkedIn</th>
                <th className="px-4 py-2">更新时间</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-2 font-medium">{c.name ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {c.email ?? "—"}
                    {c.phone ? <div className="text-xs text-gray-500">{c.phone}</div> : null}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {[c.jobType, c.yearsOfExperience != null ? `${c.yearsOfExperience} 年经验` : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {c.needsVisaSponsorship == null ? "—" : c.needsVisaSponsorship ? "需要" : "不需要"}
                  </td>
                  <td className="px-4 py-2">
                    {c.linkedinUrl ? (
                      <a className="text-yellow-700 underline" href={c.linkedinUrl} rel="noreferrer" target="_blank">
                        打开
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {c.updatedAt.toLocaleDateString("zh-CN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
