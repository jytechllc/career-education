import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { fmtBeijing as fmt } from "@/lib/contract-format";
import type { ContractEventRow, ContractRow, ContractSignerRow } from "@/lib/schema";

export const EVENT_LABELS: Record<string, string> = {
  created: "发起签署",
  email_sent: "发送邮件",
  email_failed: "邮件发送失败",
  viewed: "打开合同",
  otp_sent: "发送验证码",
  otp_verified: "邮箱验证通过",
  otp_failed: "验证码错误",
  signed: "签署",
  completed: "全部签署完成",
  voided: "作废",
};

const STATUS_LABELS: Record<string, string> = { sent: "签署中", completed: "已完成", voided: "已作废" };

export function ContractBody({ contract }: { contract: ContractRow }) {
  return (
    <div className="prose prose-sm sm:prose-base max-w-none prose-headings:font-semibold prose-table:text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{contract.bodyMd}</ReactMarkdown>
    </div>
  );
}

export function ContractHeader({ contract }: { contract: ContractRow }) {
  return (
    <div className="border-b border-gray-200 pb-4 mb-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>合同编号 {contract.number}</span>
        <span
          className={`rounded-full px-2 py-0.5 font-medium ${
            contract.status === "completed"
              ? "bg-green-100 text-green-800"
              : contract.status === "voided"
                ? "bg-gray-200 text-gray-600"
                : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {STATUS_LABELS[contract.status] ?? contract.status}
        </span>
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">{contract.title}</h1>
    </div>
  );
}

/**
 * `statusOnly` is for a signer who still has to sign: the block must not look
 * like a place to sign (the real panel is below the contract), so it is a
 * plain progress list instead of signature boxes.
 */
export function SignatureBlock({ signers, statusOnly = false }: { signers: ContractSignerRow[]; statusOnly?: boolean }) {
  if (statusOnly) {
    return (
      <section className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="text-base font-semibold text-gray-900">签署进度</h2>
        <ul className="mt-2 text-sm text-gray-600 space-y-1">
          {signers.map((s) => (
            <li key={s.id}>
              {s.roleLabel}：{s.name} — {s.signedAt ? `已签署（${fmt(s.signedAt)}）` : "待签署"}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-6">
      <h2 className="text-lg font-semibold text-gray-900">电子签署</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {signers.map((s) => (
          <div key={s.id} className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-900">
              {s.roleLabel}：{s.name}
            </div>
            <div className="text-xs text-gray-500">{s.email}</div>
            {s.signedAt && s.signatureImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={`${s.name} 的签名`} className="mt-3 h-20 w-auto max-w-full" src={s.signatureImage} />
                <dl className="mt-2 text-xs text-gray-600 space-y-0.5">
                  <div>签署姓名：{s.signedName}</div>
                  <div>签署时间：{fmt(s.signedAt)}</div>
                  <div>签署 IP：{s.signedIp ?? "—"}</div>
                  <div>身份验证：邮箱一次性验证码，{fmt(s.verifiedAt)}</div>
                </dl>
              </>
            ) : (
              <div className="mt-3 text-sm text-gray-400">尚未签署</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function AuditTrail({
  contract,
  signers,
  events,
  chainOk,
}: {
  contract: ContractRow;
  signers: ContractSignerRow[];
  events: ContractEventRow[];
  chainOk: boolean;
}) {
  // A completed record is sealed by record_hash over the events up to
  // "completed"; show exactly those so the page matches what was hashed.
  const sealAt = contract.status === "completed" ? events.find((e) => e.type === "completed")?.id : undefined;
  const shown = sealAt ? events.filter((e) => e.id <= sealAt) : events;
  const nameOf = (id: number | null) => {
    const s = signers.find((x) => x.id === id);

    return s ? `${s.roleLabel} ${s.name}` : null;
  };

  return (
    <section className="mt-10 border-t border-gray-200 pt-6">
      <h2 className="text-lg font-semibold text-gray-900">签署审计记录</h2>
      <p className={`mt-1 text-sm ${chainOk ? "text-green-700" : "text-red-700 font-semibold"}`}>
        {chainOk
          ? "校验通过：合同正文和以下签署过程自发起以来没有被改动。"
          : "警告：签署过程记录校验失败，记录可能被改动，请联系发起方。"}
      </p>
      {contract.status === "voided" && (
        <p className="mt-2 text-sm text-gray-700">
          作废于 {fmt(contract.voidedAt)}，操作人 {contract.voidedBy}
          {contract.voidReason ? `，原因：${contract.voidReason}` : ""}
        </p>
      )}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-1 pr-3 font-normal">时间</th>
              <th className="py-1 pr-3 font-normal">事件</th>
              <th className="py-1 pr-3 font-normal">相关方</th>
              <th className="py-1 pr-3 font-normal">IP</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {shown.map((e) => (
              <tr key={e.id} className="border-t border-gray-100 align-top">
                <td className="py-1 pr-3 whitespace-nowrap">{fmt(e.createdAt)}</td>
                <td className="py-1 pr-3">{EVENT_LABELS[e.type] ?? e.type}</td>
                <td className="py-1 pr-3">{nameOf(e.signerId) ?? e.actor ?? "—"}</td>
                <td className="py-1 pr-3">{e.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="mt-4 text-xs text-gray-500">
        <summary className="cursor-pointer">技术凭证（用于核验合同未被改动）</summary>
        <dl className="mt-2 space-y-1 break-all">
          <div>
            合同正文指纹（SHA-256）：<span className="font-mono">{contract.contentHash}</span>
          </div>
          {contract.recordHash && (
            <div>
              签署记录指纹（SHA-256）：<span className="font-mono">{contract.recordHash}</span>
            </div>
          )}
          {signers
            .filter((s) => s.signatureHash)
            .map((s) => (
              <div key={s.id}>
                {s.roleLabel} {s.name} 签名指纹：<span className="font-mono">{s.signatureHash}</span>
              </div>
            ))}
        </dl>
      </details>
    </section>
  );
}
