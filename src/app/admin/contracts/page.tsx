import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { fmtBeijing } from "@/lib/contract-format";
import { listContracts } from "@/lib/contracts";

const STATUS: Record<string, { label: string; cls: string }> = {
  sent: { label: "签署中", cls: "bg-yellow-100 text-yellow-800" },
  completed: { label: "已完成", cls: "bg-green-100 text-green-800" },
  voided: { label: "已作废", cls: "bg-gray-200 text-gray-600" },
};

export default async function AdminContractsPage() {
  await requireStaff("/admin/contracts");
  const rows = await listContracts();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-yellow-900">电子合同（{rows.length}）</h1>
          <p className="text-sm text-gray-500 mt-1">
            发起后合同正文即锁定；各方通过邮件链接 + 邮箱验证码签署。合同记录永久保留，未完成的只能作废，不能删除。
          </p>
        </div>
        <Link className="rounded-lg bg-yellow-700 px-4 py-2 text-sm text-white" href="/admin/contracts/new">
          发起签署
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-yellow-100/60 text-left text-xs text-yellow-900">
            <tr>
              <th className="px-4 py-2">编号</th>
              <th className="px-4 py-2">合同</th>
              <th className="px-4 py-2">状态</th>
              <th className="px-4 py-2 text-right">签署进度</th>
              <th className="px-4 py-2">发起时间（北京）</th>
              <th className="px-4 py-2">完成时间（北京）</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={6}>
                  还没有合同。
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-mono text-xs text-gray-500">{c.number}</td>
                <td className="px-4 py-2">
                  <Link className="font-medium text-yellow-800 underline" href={`/admin/contracts/${c.id}`}>
                    {c.title}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS[c.status]?.cls ?? ""}`}>
                    {STATUS[c.status]?.label ?? c.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {c.signed}/{c.signers}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">{fmtBeijing(c.createdAt, false)}</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {c.completedAt ? fmtBeijing(c.completedAt, false) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
