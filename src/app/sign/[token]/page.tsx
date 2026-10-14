import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AuditTrail, ContractBody, ContractHeader, SignatureBlock } from "@/components/contracts/ContractRecord";
import { PrintButton } from "@/components/contracts/PrintButton";
import { SignPanel } from "@/components/contracts/SignPanel";
import { getByToken, recordView, requestMeta, verifyEventChain } from "@/lib/contracts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "电子签约",
  robots: { index: false, follow: false },
};

function maskEmail(email: string): string {
  if (!email) return "您填写的邮箱";
  const [user, domain] = email.split("@");

  return `${user.slice(0, 2)}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let data = await getByToken(token);

  if (!data) notFound();

  if (!data.signer.viewedAt) {
    await recordView(token, requestMeta(await headers()));
    data = (await getByToken(token))!;
  }

  const { contract, signer, signers, events } = data;
  const open = contract.status === "sent" && !signer.signedAt;
  const info = (signer.signerInfo ?? {}) as { relationship?: string; phone?: string; address?: string; verification?: string };
  // A link-only signer who already declared but hasn't signed confirms again
  // (same details, locked) instead of being asked for an email code.
  const lockedIdentity = signer.selfIdentify && !!signer.verifiedAt && info.verification === "none";
  const needIdentity = signer.selfIdentify && (!signer.verifiedAt || lockedIdentity);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <header className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white print:hidden">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <span className="font-bold">杰圆教育 · 电子签约</span>
          {contract.status === "completed" && <PrintButton />}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        {contract.status === "voided" && (
          <div className="mb-4 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700 print:hidden">
            该合同已作废，无法签署。如有疑问请联系发起方。
          </div>
        )}
        {contract.status === "sent" && signer.signedAt && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 print:hidden">
            您已完成签署。其他各方签署完成后，系统会把完整签署记录发送到您的邮箱。
          </div>
        )}
        {contract.status === "completed" && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 print:hidden">
            全部各方已签署完成，签署记录已发到您的邮箱。点击右上角「打印 / 保存 PDF」可保存一份；本链接长期有效，可随时回来查看。
            <span className="block mt-1 text-xs text-green-700">
              在微信里打开时如果无法保存，请点右上角「…」，选择「在浏览器打开」后再保存。
            </span>
          </div>
        )}
        {open && (
          <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-900">
            <p className="font-medium">
              {signer.name ? `${signer.name}，` : ""}请以「{signer.roleLabel}」身份签署本合同，约需 3 分钟：
            </p>
            <ol className="mt-1 list-decimal pl-5 space-y-0.5">
              <li>阅读下方合同全文；</li>
              {needIdentity && <li>在页面底部填写您的姓名、联系方式和邮箱；</li>}
              <li>获取邮箱验证码（发送到 {maskEmail(signer.email)}）；</li>
              <li>输入姓名、手写签名并确认。</li>
            </ol>
            <a className="mt-2 inline-block font-medium text-yellow-800 underline" href="#sign">
              直接去签署 ↓
            </a>
          </div>
        )}

        <article className="rounded-lg bg-white p-5 sm:p-8 shadow print:shadow-none print:p-0">
          <ContractHeader contract={contract} />
          <ContractBody contract={contract} />
          <SignatureBlock events={events} signers={signers} statusOnly={contract.status === "sent"} />
          {contract.status !== "sent" && (
            <AuditTrail chainOk={verifyEventChain(events)} contract={contract} events={events} signers={signers} />
          )}
        </article>

        {open && (
          <div className="sticky bottom-0 -mx-4 mt-6 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden print:hidden">
            <a className="block rounded-lg bg-yellow-700 py-2.5 text-center text-white" href="#sign">
              阅读完毕，去签署 ↓
            </a>
          </div>
        )}

        {open && (
          <SignPanel
            contentHash={contract.contentHash}
            initialIdentity={
              needIdentity
                ? {
                    name: signer.name,
                    email: signer.email,
                    relationship: info.relationship ?? "",
                    phone: info.phone ?? "",
                    address: info.address ?? "",
                  }
                : undefined
            }
            maskedEmail={maskEmail(signer.email)}
            lockedIdentity={lockedIdentity}
            needIdentity={needIdentity}
            roleLabel={signer.roleLabel}
            signerName={signer.name}
            token={token}
          />
        )}
      </main>
    </div>
  );
}
