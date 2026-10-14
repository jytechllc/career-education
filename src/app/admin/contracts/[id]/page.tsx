import Link from "next/link";
import { notFound } from "next/navigation";

import { AuditTrail, ContractBody, ContractHeader, SignatureBlock } from "@/components/contracts/ContractRecord";
import { CopyLink } from "@/components/contracts/CopyLink";
import { PendingButton } from "@/components/contracts/PendingButton";
import { VoidForm } from "@/components/contracts/VoidForm";
import { requireStaff } from "@/lib/admin-auth";
import { fmtBeijing } from "@/lib/contract-format";
import { getContract, signUrl, verifyEventChain } from "@/lib/contracts";
import type { ContractEventRow, ContractSignerRow } from "@/lib/schema";

import { attestAction, resendAction, voidAction } from "../actions";

/** One line per signer, from the same events the audit trail shows. */
function progress(s: ContractSignerRow, events: ContractEventRow[]): { text: string; tone: "ok" | "warn" | "bad" | "muted" } {
  const linkOnly = (s.signerInfo as { verification?: string } | null)?.verification === "none";
  const attested = events.some((e) => e.type === "identity_attested" && e.signerId === s.id);

  if (s.signedAt) {
    return linkOnly && !attested
      ? { text: `已签署（未验证邮箱，建议核实身份）· ${fmtBeijing(s.signedAt, false)}`, tone: "warn" }
      : { text: `已签署 · ${fmtBeijing(s.signedAt, false)}`, tone: "ok" };
  }

  const mine = events.filter((e) => e.signerId === s.id);
  const last = (type: string) => [...mine].reverse().find((e) => e.type === type);
  const lastMail = [...mine].reverse().find((e) => e.type === "email_sent" || e.type === "email_failed");

  if (s.selfIdentify && !s.email) return { text: "等待对方打开链接、填写身份信息", tone: "muted" };
  if (last("otp_verified")) return { text: "已验证邮箱，尚未完成签署", tone: "warn" };
  if (s.viewedAt) return { text: `已打开 · ${fmtBeijing(s.viewedAt, false)}，未签署`, tone: "warn" };
  if (lastMail?.type === "email_failed") {
    return { text: `邮件发送失败 · ${fmtBeijing(lastMail.createdAt, false)}，请重发或复制链接发微信`, tone: "bad" };
  }
  if (lastMail) return { text: `邮件已发送 · ${fmtBeijing(lastMail.createdAt, false)}，对方未打开`, tone: "muted" };

  return { text: "未发邮件，请复制链接发给对方", tone: "muted" };
}

const TONE = { ok: "text-green-700", warn: "text-yellow-700", bad: "text-red-700 font-medium", muted: "text-gray-500" };

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await requireStaff(`/admin/contracts/${id}`);
  const data = Number.isInteger(Number(id)) ? await getContract(Number(id)) : null;

  if (!data) notFound();

  const { contract, signers, events } = data;
  const open = contract.status === "sent";
  const signedCount = signers.filter((s) => s.signedAt).length;

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <Link className="text-sm text-yellow-800 underline" href="/admin/contracts">
        ← 返回合同列表
      </Link>

      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-gray-900">
            签署方 · {signedCount}/{signers.length} 已签
          </h2>
          <span className="text-xs text-gray-500">时间均为北京时间</span>
        </div>
        <div className="mt-3 flex flex-col divide-y divide-gray-100">
          {signers.map((s) => {
            const p = progress(s, events);

            return (
              <div key={s.id} className="py-3 flex flex-wrap items-center gap-3 text-sm">
                <div className="min-w-48">
                  <div className="font-medium">
                    {s.roleLabel}：{s.name || "（由对方填写）"}
                  </div>
                  <div className="text-xs text-gray-500">{s.email || "仅链接签署"}</div>
                </div>
                <div className={`text-xs ${TONE[p.tone]}`}>{p.text}</div>
                {(s.signerInfo as { verification?: string } | null)?.verification === "none" && (
                  <form action={attestAction} className="w-full flex flex-wrap items-center gap-2">
                    <input name="contractId" type="hidden" value={contract.id} />
                    <input name="signerId" type="hidden" value={s.id} />
                    <input
                      className="flex-1 min-w-64 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                      name="note"
                      placeholder="记录身份核实：如 2026-10-14 Helen 与家长微信视频，核对身份证姓名一致"
                      required
                    />
                    <PendingButton label="记录身份核实" pendingLabel="保存中…" />
                  </form>
                )}
                {open && !s.signedAt && (
                  <div className="ml-auto flex items-center gap-3">
                    {s.email && (
                      <form action={resendAction}>
                        <input name="contractId" type="hidden" value={contract.id} />
                        <input name="signerId" type="hidden" value={s.id} />
                        <PendingButton label="重发邮件" pendingLabel="发送中…" />
                      </form>
                    )}
                    <CopyLink url={signUrl(s.token)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {open && (
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3 border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500">
              链接只发给对应签署人本人；对方仍需用自己邮箱收到的验证码才能签署。
            </p>
            <VoidForm
              action={voidAction}
              contractId={contract.id}
              number={contract.number}
              signed={signedCount}
              total={signers.length}
            />
          </div>
        )}
      </div>

      <article className="bg-white rounded-lg shadow p-5 sm:p-8">
        <ContractHeader contract={contract} />
        <ContractBody contract={contract} />
        <SignatureBlock events={events} signers={signers} />
        <AuditTrail chainOk={verifyEventChain(events)} contract={contract} events={events} signers={signers} />
      </article>
    </div>
  );
}
