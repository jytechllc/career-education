"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ERRORS: Record<string, string> = {
  not_found: "签署链接无效。",
  not_open: "该合同当前不可签署（可能已作废或已完成）。",
  already_signed: "您已经签署过了。",
  too_soon: "验证码刚发送过，请稍后再试。",
  email_failed: "验证码邮件发送失败，请稍后重试；如仍收不到，请联系发起方。",
  no_code: "请先获取验证码。",
  code_expired: "验证码已过期，请重新获取。",
  too_many_attempts: "验证码错误次数过多，请重新获取。",
  bad_code: "验证码不正确，请检查后重新输入。",
  not_verified: "邮箱验证已超过 30 分钟失效，请重新获取验证码。您的签名和填写内容已保留。",
  hash_mismatch: "合同内容与您看到的版本不一致，页面已刷新，请重新审阅。",
  name_mismatch: "输入的姓名与签署人姓名不一致。如姓名登记有误，请联系发起方作废后重新发起。",
  no_consent: "请勾选同意电子签署。",
  bad_signature: "请在签名区手写签名。",
  bad_request: "请求无效，请刷新页面重试。",
  network: "网络错误，请检查网络后重试。",
};

/** Errors after which the page itself is out of date. */
const REFRESH_ON = new Set(["already_signed", "not_open", "hash_mismatch", "not_found"]);
/** Errors that mean the signer has to get a new code. */
const REVERIFY_ON = new Set(["not_verified", "code_expired", "too_many_attempts", "no_code"]);

const RESEND_SECONDS = 60;
const VERIFY_MINUTES = 30;

async function post(token: string, body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch(`/api/sign/${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };

    return res.ok ? null : (json.error ?? "bad_request");
  } catch {
    return "network";
  }
}

/** Same rule as the server: case and all whitespace ignored. */
function nameKey(s: string): string {
  return s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = ref.current!;
    const scale = Math.min(window.devicePixelRatio || 1, 2);

    c.width = c.clientWidth * scale;
    c.height = c.clientHeight * scale;
    const ctx = c.getContext("2d")!;

    ctx.scale(scale, scale);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();

    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const clear = () => {
    const c = ref.current!;

    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={ref}
        aria-label="手写签名区"
        className="h-40 w-full touch-none rounded-lg border-2 border-dashed border-gray-300 bg-white"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          const { x, y } = pos(e);
          const ctx = e.currentTarget.getContext("2d")!;

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 0.1, y + 0.1);
          ctx.stroke();
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const { x, y } = pos(e);
          const ctx = e.currentTarget.getContext("2d")!;

          ctx.lineTo(x, y);
          ctx.stroke();
        }}
        onPointerUp={(e) => {
          drawing.current = false;
          onChange(e.currentTarget.toDataURL("image/png"));
        }}
      />
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>请在虚线框内手写签名（手机可直接用手指）</span>
        <button className="underline" type="button" onClick={clear}>
          清除重写
        </button>
      </div>
    </div>
  );
}

export function SignPanel({
  token,
  contentHash,
  signerName,
  roleLabel,
  maskedEmail,
}: {
  token: string;
  contentHash: string;
  signerName: string;
  roleLabel: string;
  maskedEmail: string;
}) {
  const router = useRouter();
  const [codeSent, setCodeSent] = useState(false);
  const [verifiedUntil, setVerifiedUntil] = useState<Date | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);

    return () => clearTimeout(t);
  }, [cooldown]);

  const fail = (err: string) => {
    setError(ERRORS[err] ?? ERRORS.network);
    if (REFRESH_ON.has(err)) router.refresh();
    if (REVERIFY_ON.has(err)) {
      setVerifiedUntil(null);
      setCode("");
      if (err !== "no_code") setCodeSent(false);
    }
  };

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    const err = await post(token, { action: "send_code" });

    setBusy(false);
    if (err) return fail(err);
    setCodeSent(true);
    setCooldown(RESEND_SECONDS);
    setSentAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    const err = await post(token, { action: "verify", code });

    setBusy(false);
    if (err) return fail(err);
    setVerifiedUntil(new Date(Date.now() + VERIFY_MINUTES * 60 * 1000));
  };

  const nameOk = nameKey(name) === nameKey(signerName);
  const missing = {
    name: !name.trim() ? "请输入姓名" : !nameOk ? `与签署人姓名「${signerName}」不一致` : null,
    signature: !signature ? "请在上方框内手写签名" : null,
    consent: !consent ? "请勾选同意" : null,
  };

  const submit = async () => {
    if (missing.name || missing.signature || missing.consent) {
      setShowMissing(true);

      return;
    }
    setBusy(true);
    setError(null);
    const err = await post(token, { action: "sign", signedName: name, signatureImage: signature, contentHash, consent });

    if (err) {
      setBusy(false);

      return fail(err);
    }
    setDone(true);
    router.refresh();
  };

  const verified = verifiedUntil !== null;

  return (
    <section className="mt-6 scroll-mt-4 rounded-lg bg-white p-5 sm:p-8 shadow print:hidden" id="sign">
      <h2 className="text-lg font-semibold text-gray-900">
        以「{roleLabel}」身份签署：{signerName}
      </h2>

      {done ? (
        <p className="mt-3 rounded-lg bg-green-50 px-4 py-3 text-green-800">签署成功，正在更新页面…</p>
      ) : (
        <>
          {!verified && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">第 1 步：邮箱验证。</span>
                系统会向 {maskedEmail} 发送一次性验证码，用于确认是您本人签署。
              </p>
              {!codeSent ? (
                <button
                  className="mt-3 rounded-lg bg-yellow-700 px-5 py-2.5 text-white disabled:opacity-50"
                  disabled={busy}
                  type="button"
                  onClick={sendCode}
                >
                  {busy ? "发送中…" : "我已阅读合同，获取验证码"}
                </button>
              ) : (
                <>
                  <p className="mt-2 text-sm text-gray-600">
                    验证码已于 {sentAt} 发送，10 分钟内有效。没收到请检查垃圾邮件箱。
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      autoComplete="one-time-code"
                      className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-lg tracking-widest"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6 位验证码"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    />
                    <button
                      className="rounded-lg bg-yellow-700 px-5 py-2 text-white disabled:opacity-50"
                      disabled={busy || code.length !== 6}
                      type="button"
                      onClick={verify}
                    >
                      验证
                    </button>
                    <button
                      className="text-sm text-gray-500 underline disabled:no-underline disabled:opacity-60"
                      disabled={busy || cooldown > 0}
                      type="button"
                      onClick={sendCode}
                    >
                      {cooldown > 0 ? `重新发送（${cooldown}s）` : "重新发送"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Kept mounted once shown, so an expired verification doesn't wipe the signature. */}
          {(verified || signature || name) && (
            <div className={`mt-5 flex flex-col gap-4 ${verified ? "" : "opacity-60"}`}>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">第 2 步：签署。</span>
                {verified
                  ? `邮箱已验证，请在 ${verifiedUntil!.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" })} 前完成签署。`
                  : "请先完成上方邮箱验证。"}
              </p>
              <label className="text-sm text-gray-700">
                请输入您的姓名「{signerName}」以确认身份
                <input
                  className={`mt-1 block w-full max-w-xs rounded-lg border px-3 py-2 ${
                    name && !nameOk ? "border-red-400" : name && nameOk ? "border-green-500" : "border-gray-300"
                  }`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {name && nameOk && <span className="mt-1 block text-xs text-green-700">姓名一致</span>}
                {(showMissing || (name && !nameOk)) && missing.name && (
                  <span className="mt-1 block text-xs text-red-600">{missing.name}</span>
                )}
              </label>
              <div>
                <SignaturePad onChange={setSignature} />
                {showMissing && missing.signature && <p className="mt-1 text-xs text-red-600">{missing.signature}</p>}
              </div>
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  checked={consent}
                  className="mt-0.5 h-5 w-5 shrink-0"
                  type="checkbox"
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  本人已完整阅读并理解上述合同全部条款，同意以电子签名方式签署本合同。本人确认该电子签名由本人亲自完成，与手写签名或盖章具有同等法律效力。
                  {showMissing && missing.consent && <span className="block text-xs text-red-600">{missing.consent}</span>}
                </span>
              </label>
              <button
                className="self-start rounded-lg bg-yellow-700 px-6 py-2.5 text-white disabled:opacity-50"
                disabled={busy || !verified}
                type="button"
                onClick={submit}
              >
                {busy ? "提交中…" : "确认签署"}
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </>
      )}
    </section>
  );
}
