"use client";

import { useActionState, useState } from "react";

import { findBlanks, findParties, stripSignaturePage } from "@/lib/contract-format";

import { createContractAction } from "../actions";

type Signer = { roleLabel: string; name: string; email: string };

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

/**
 * Blanks the e-sign system itself fills — the record header carries the
 * contract number and every signature is timestamped — rewritten on import so
 * they don't trip the unfilled-blank check.
 */
function fillSystemBlanks(md: string): string {
  return md
    .replace(/^(\*\*本?合同编号[^\n]*?[：:]\*\*)[\s　]*$/m, "$1 见本合同页首电子合同编号")
    .replace(/^(\*\*签署日期[^\n]*?[：:]\*\*)[\s　]*$/m, "$1 以各方电子签署时间为准");
}

export function NewContractForm() {
  const [state, action, pending] = useActionState(createContractAction, { error: null });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [importNote, setImportNote] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [blanksAck, setBlanksAck] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [signers, setSigners] = useState<Signer[]>([
    { roleLabel: "甲方", name: "", email: "" },
    { roleLabel: "乙方", name: "", email: "" },
  ]);

  const update = (i: number, k: keyof Signer, v: string) => {
    setReviewing(false);
    setSigners((s) => s.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    const { text, stripped } = stripSignaturePage(await file.text());
    const parties = findParties(text);

    setBody(fillSystemBlanks(text));
    setReviewing(false);
    const h1 = text.match(/^#\s+(.+)$/m)?.[1]?.trim();

    if (h1 && !title) setTitle(h1);
    if (parties.length) {
      setSigners((cur) => parties.map((p, i) => ({ roleLabel: p, name: cur[i]?.name ?? "", email: cur[i]?.email ?? "" })));
    }
    setImportNote(
      [
        `已导入 ${file.name}。`,
        stripped ? "已去掉原文末尾的手写「签署页」，电子签名区会自动附在合同末尾。" : null,
        parties.length ? `已按正文中的签约方（${parties.join("、")}）设置签署方，请核对顺序。` : null,
        "合同编号和签署日期由系统生成。",
      ]
        .filter(Boolean)
        .join(""),
    );
  };

  const blanks = findBlanks(body);
  const filledSigners = signers.filter((s) => s.roleLabel || s.name || s.email);
  const canReview = title.trim() && body.trim() && filledSigners.length > 0;

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">
          合同标题
          <input
            className={`${input} mt-1`}
            name="title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setReviewing(false);
            }}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700">合同正文（Markdown）</span>
          <label className="cursor-pointer rounded-lg border border-yellow-700 px-3 py-1 text-sm text-yellow-800 hover:bg-yellow-50">
            从 .md 文件导入
            <input accept=".md,.markdown,.txt" className="hidden" type="file" onChange={(e) => loadFile(e.target.files?.[0])} />
          </label>
        </div>
        {importNote && <p className="text-xs text-green-700">{importNote}</p>}
        <textarea
          className={`${input} font-mono h-96`}
          name="bodyMd"
          placeholder="粘贴合同正文，或从 docs/contracts 下的 .md 文件导入。请先把姓名、金额等空白处填好——发起后不能再改。"
          required
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setReviewing(false);
          }}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
        <div className="text-sm font-medium text-gray-700">签署方（身份要与正文里的甲方/乙方对应）</div>
        {signers.map((s, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[120px_1fr_1.4fr_auto] items-center">
            <input className={input} name="roleLabel" placeholder="身份，如 甲方" value={s.roleLabel} onChange={(e) => update(i, "roleLabel", e.target.value)} />
            <input className={input} name="name" placeholder="证件上的真实姓名" value={s.name} onChange={(e) => update(i, "name", e.target.value)} />
            <input className={input} name="email" placeholder="邮箱" type="email" value={s.email} onChange={(e) => update(i, "email", e.target.value)} />
            <button
              className="text-xs text-gray-500 underline disabled:opacity-30"
              disabled={signers.length <= 1}
              type="button"
              onClick={() => setSigners((x) => x.filter((_, j) => j !== i))}
            >
              移除
            </button>
          </div>
        ))}
        <button
          className="self-start text-sm text-yellow-800 underline"
          type="button"
          onClick={() => setSigners((x) => [...x, { roleLabel: "", name: "", email: "" }])}
        >
          + 添加签署方
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input checked={sendEmail} name="sendEmail" type="checkbox" onChange={(e) => setSendEmail(e.target.checked)} />
        立即给各签署方发送签署邮件（不勾选则只生成链接，可在详情页复制后通过微信发送）
      </label>

      {!reviewing ? (
        <button
          className="self-start rounded-lg bg-yellow-700 px-6 py-2.5 text-white disabled:opacity-50"
          disabled={!canReview}
          type="button"
          onClick={() => {
            setBlanksAck(false);
            setReviewing(true);
          }}
        >
          下一步：核对
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3 border-2 border-yellow-600">
          <div className="font-semibold text-yellow-900">发起前核对（发起后正文不可修改）</div>
          <div className="text-sm text-gray-700">
            <div className="font-medium">签署时，每一方必须输入下面这个姓名（大小写和空格不限）：</div>
            <ul className="mt-1 list-disc pl-5">
              {filledSigners.map((s, i) => (
                <li key={i}>
                  {s.roleLabel}：<span className="font-semibold">{s.name || "（未填）"}</span> · {s.email || "（未填）"}
                </li>
              ))}
            </ul>
          </div>
          {blanks.length > 0 && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              <div className="font-medium">正文里还有 {blanks.length} 处空白没填：</div>
              <ul className="mt-1 list-disc pl-5 text-xs">
                {blanks.slice(0, 12).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <label className="mt-2 flex items-center gap-2 text-xs">
                <input checked={blanksAck} type="checkbox" onChange={(e) => setBlanksAck(e.target.checked)} />
                这些空白是有意留空的，确认发起
              </label>
            </div>
          )}
          <p className="text-xs text-gray-500">
            {sendEmail ? "确认后会立即给以上各方发送签署邮件。" : "确认后只生成签署链接，不发邮件。"}
            发现问题只能作废后重新发起，作废的合同也会永久留档。
          </p>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex gap-3">
            <button
              className="rounded-lg bg-yellow-700 px-6 py-2.5 text-white disabled:opacity-50"
              disabled={pending || (blanks.length > 0 && !blanksAck)}
              type="submit"
            >
              {pending ? "发起中…" : "确认无误，锁定并发起"}
            </button>
            <button className="text-sm text-gray-600 underline" type="button" onClick={() => setReviewing(false)}>
              返回修改
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
