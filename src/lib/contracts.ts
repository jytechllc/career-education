import "server-only";

import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { logActivity } from "./activity";
import { fmtBeijing, ymdBeijing } from "./contract-format";
import { db } from "./db";
import {
  contractEvents,
  contracts,
  contractSigners,
  type ContractEventRow,
  type ContractRow,
  type ContractSignerRow,
} from "./schema";

/**
 * E-signature for service contracts.
 *
 * What makes a signature here hold up:
 *  - the text is frozen at creation and every signer signs its SHA-256
 *    (content_hash); the hash the signer's page showed is re-checked on submit;
 *  - a one-time code emailed to the signer's own address proves who signed —
 *    the link token alone cannot sign;
 *  - IP, user agent, time and the drawn signature are stored per signer;
 *  - every step goes into contract_events, hash-chained so a deleted or edited
 *    event is detectable;
 *  - when the last party signs, the whole record is snapshotted and hashed.
 */

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
const MAX_SIGNATURE_BYTES = 300_000;

export type ContractStatus = "sent" | "completed" | "voided";

export interface SignerInput {
  roleLabel: string;
  name: string;
  email: string;
  /** Leave name/email empty; the signer enters them on the signing page. */
  selfIdentify?: boolean;
}

/** What a self-identifying signer enters before their email code is sent. */
export interface SignerIdentity {
  name: string;
  email: string;
  relationship: string;
  phone: string;
  address: string;
}

export interface SignerInfo {
  relationship?: string;
  phone?: string;
  address?: string;
  /** "email" = verified by emailed code; "none" = link only, self-declared. */
  verification?: "email" | "none";
  /** Staff confirmation of who signed, e.g. after a video call. */
  attestedBy?: string;
  attestedAt?: string;
  attestNote?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

/** JSON with sorted keys — jsonb reorders keys, so hashes must not depend on order. */
export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;

  const o = v as Record<string, unknown>;

  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`)
    .join(",")}}`;
}

export function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** Normalised so CRLF vs LF or trailing whitespace can't change the hash. */
export function contentHashOf(title: string, bodyMd: string): string {
  const norm = (s: string) => s.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "").trim();

  return sha256(`${norm(title)}\n\n${norm(bodyMd)}`);
}

export function baseUrl(): string {
  return (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function signUrl(token: string): string {
  return `${baseUrl()}/sign/${token}`;
}

export function requestMeta(h: Headers): RequestMeta {
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  return {
    ip: fwd || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent")?.slice(0, 500) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

async function appendEvent(
  contractId: number,
  type: string,
  opts: {
    signerId?: number | null;
    actor?: string | null;
    meta?: RequestMeta;
    detail?: Record<string, unknown>;
  } = {},
): Promise<void> {
  const [prev] = await db
    .select({ hash: contractEvents.hash })
    .from(contractEvents)
    .where(eq(contractEvents.contractId, contractId))
    .orderBy(desc(contractEvents.id))
    .limit(1);
  const prevHash = prev?.hash ?? null;
  const createdAt = new Date();
  const payload = {
    contractId,
    signerId: opts.signerId ?? null,
    type,
    actor: opts.actor ?? null,
    ip: opts.meta?.ip ?? null,
    userAgent: opts.meta?.userAgent ?? null,
    detail: opts.detail ?? null,
    createdAt: createdAt.toISOString(),
  };

  await db.insert(contractEvents).values({
    ...payload,
    createdAt,
    prevHash,
    hash: sha256(`${prevHash ?? ""}|${canonicalJson(payload)}`),
  });
}

/** Recomputes every event hash; false means the trail was altered. */
export function verifyEventChain(events: ContractEventRow[]): boolean {
  const known = new Set<string>();

  for (const e of events) {
    const payload = {
      contractId: e.contractId,
      signerId: e.signerId ?? null,
      type: e.type,
      actor: e.actor ?? null,
      ip: e.ip ?? null,
      userAgent: e.userAgent ?? null,
      detail: e.detail ?? null,
      createdAt: e.createdAt.toISOString(),
    };

    if (sha256(`${e.prevHash ?? ""}|${canonicalJson(payload)}`) !== e.hash) return false;
    if (e.prevHash && !known.has(e.prevHash)) return false;
    known.add(e.hash);
  }

  return true;
}

// ---------------------------------------------------------------------------
// Email (Brevo — same account as the contact form)
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const SENDER_NAME = "杰圆教育 电子签约";

async function sendViaBrevo(to: { email: string; name: string }, subject: string, html: string): Promise<boolean> {
  const key = process.env.REVO_API_KEY;

  if (!key) return false;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "api-key": key },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: "helen.lan@jytech.us" },
      to: [to],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) console.error("[contracts] Brevo error", res.status, await res.text());

  return res.ok;
}

/** Fallback sender. RESEND_FROM must be on a domain verified in Resend. */
async function sendViaResend(to: { email: string; name: string }, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!key || !from) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: `${SENDER_NAME} <${from}>`,
      to: [to.email],
      reply_to: "helen.lan@jytech.us",
      subject,
      html,
    }),
  });

  if (!res.ok) console.error("[contracts] Resend error", res.status, await res.text());

  return res.ok;
}

/** Brevo first (the site's main sender); Resend if Brevo is unavailable. */
async function sendMail(to: { email: string; name: string }, subject: string, html: string): Promise<boolean> {
  if (await sendViaBrevo(to, subject, html)) return true;
  if (await sendViaResend(to, subject, html)) return true;
  console.error("[contracts] no email provider succeeded:", subject);

  return false;
}

function mailShell(inner: string): string {
  return `<div style="font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;max-width:560px;margin:0 auto;color:#1f2937;line-height:1.7">${inner}<p style="color:#9ca3af;font-size:12px;margin-top:28px">此邮件由 edu.jytech.us 电子签约系统发送。如非本人操作，请忽略本邮件。</p></div>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="background:#a16207;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">${label}</a></p><p style="font-size:12px;color:#6b7280;word-break:break-all">如按钮无法打开，请复制链接：${href}</p>`;
}

export async function emailSignRequest(contract: ContractRow, signer: ContractSignerRow): Promise<boolean> {
  if (!signer.email) return false;

  const ok = await sendMail(
    { email: signer.email, name: signer.name },
    `请签署：${contract.title}`,
    mailShell(
      `<p>${esc(signer.name)}，您好：</p><p>请您以「${esc(signer.roleLabel)}」身份审阅并签署《${esc(contract.title)}》（编号 ${esc(contract.number)}）。签署时系统会向本邮箱发送一次性验证码以确认身份。</p>${button(signUrl(signer.token), "审阅并签署")}`,
    ),
  );

  await appendEvent(contract.id, ok ? "email_sent" : "email_failed", {
    signerId: signer.id,
    actor: "system",
    detail: { kind: "sign_request" },
  });

  return ok;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listContracts() {
  return db
    .select({
      id: contracts.id,
      number: contracts.number,
      title: contracts.title,
      status: contracts.status,
      createdAt: contracts.createdAt,
      completedAt: contracts.completedAt,
      signers: sql<number>`(select count(*)::int from ${contractSigners} s where s.contract_id = ${contracts.id})`,
      signed: sql<number>`(select count(*)::int from ${contractSigners} s where s.contract_id = ${contracts.id} and s.signed_at is not null)`,
    })
    .from(contracts)
    .orderBy(desc(contracts.createdAt));
}

export async function getContract(id: number) {
  const [contract] = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);

  if (!contract) return null;

  const [signers, events] = await Promise.all([
    db.select().from(contractSigners).where(eq(contractSigners.contractId, id)).orderBy(asc(contractSigners.position)),
    db.select().from(contractEvents).where(eq(contractEvents.contractId, id)).orderBy(asc(contractEvents.id)),
  ]);

  return { contract, signers, events };
}

export async function getByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;

  const [signer] = await db.select().from(contractSigners).where(eq(contractSigners.token, token)).limit(1);

  if (!signer) return null;

  return { signer, ...(await getContract(signer.contractId))! };
}

// ---------------------------------------------------------------------------
// Staff actions
// ---------------------------------------------------------------------------

async function nextNumber(): Promise<string> {
  const ymd = ymdBeijing();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(contracts);

  return `JY-${ymd}-${String(n + 1).padStart(4, "0")}`;
}

export async function createContract(
  input: { title: string; bodyMd: string; signers: SignerInput[]; sendEmail: boolean },
  staffEmail: string,
  meta: RequestMeta,
): Promise<number> {
  const title = input.title.trim();
  const bodyMd = input.bodyMd.replace(/\r\n?/g, "\n").trim();
  const signers = input.signers
    .map((s) => ({
      roleLabel: s.roleLabel.trim(),
      name: s.selfIdentify ? "" : s.name.trim(),
      email: s.selfIdentify ? "" : s.email.trim().toLowerCase(),
      selfIdentify: !!s.selfIdentify,
    }))
    .filter((s) => s.roleLabel || s.name || s.email || s.selfIdentify);

  if (!title || !bodyMd) throw new Error("合同标题和正文不能为空");
  if (signers.length < 1) throw new Error("至少需要一位签署人");
  for (const s of signers) {
    if (!s.roleLabel) throw new Error("每位签署人都需要填写身份（如 甲方）");
    if (!s.selfIdentify && (!s.name || !EMAIL_RE.test(s.email))) {
      throw new Error("每位签署人都需要填写姓名和有效邮箱，或勾选「由对方填写」");
    }
  }

  const [contract] = await db
    .insert(contracts)
    .values({
      number: await nextNumber(),
      title,
      bodyMd,
      contentHash: contentHashOf(title, bodyMd),
      createdBy: staffEmail,
    })
    .returning();

  const rows = await db
    .insert(contractSigners)
    .values(
      signers.map((s, i) => ({
        contractId: contract.id,
        position: i + 1,
        ...s,
        token: randomBytes(24).toString("base64url"),
      })),
    )
    .returning();

  await appendEvent(contract.id, "created", {
    actor: staffEmail,
    meta,
    detail: {
      contentHash: contract.contentHash,
      signers: signers.map((s) => (s.selfIdentify ? `${s.roleLabel}（签署人自行填写）` : `${s.roleLabel} ${s.name} <${s.email}>`)),
    },
  });

  if (input.sendEmail) {
    for (const s of rows) await emailSignRequest(contract, s);
  }

  return contract.id;
}

export async function resendSignRequest(contractId: number, signerId: number): Promise<boolean> {
  const data = await getContract(contractId);
  const signer = data?.signers.find((s) => s.id === signerId);

  if (!data || !signer || data.contract.status !== "sent" || signer.signedAt) return false;

  return emailSignRequest(data.contract, signer);
}

export async function voidContract(contractId: number, staffEmail: string, reason: string, meta: RequestMeta) {
  const [row] = await db
    .update(contracts)
    .set({ status: "voided", voidedAt: new Date(), voidedBy: staffEmail, voidReason: reason.trim() || null })
    .where(and(eq(contracts.id, contractId), eq(contracts.status, "sent")))
    .returning({ id: contracts.id });

  if (row) await appendEvent(contractId, "voided", { actor: staffEmail, meta, detail: { reason: reason.trim() } });
}

// ---------------------------------------------------------------------------
// Signer actions
// ---------------------------------------------------------------------------

export async function recordView(token: string, meta: RequestMeta): Promise<void> {
  const [row] = await db
    .update(contractSigners)
    .set({ viewedAt: new Date() })
    .where(and(eq(contractSigners.token, token), isNull(contractSigners.viewedAt)))
    .returning();

  if (row) await appendEvent(row.contractId, "viewed", { signerId: row.id, actor: row.email, meta });
}

export type SignError =
  | "not_found"
  | "not_open"
  | "already_signed"
  | "too_soon"
  | "email_failed"
  | "no_code"
  | "code_expired"
  | "too_many_attempts"
  | "bad_code"
  | "not_verified"
  | "hash_mismatch"
  | "name_mismatch"
  | "no_consent"
  | "bad_signature"
  | "bad_identity"
  | "bad_request";

export async function sendOtp(
  token: string,
  meta: RequestMeta,
  identity?: SignerIdentity,
): Promise<SignError | null> {
  const data = await getByToken(token);

  if (!data) return "not_found";

  const { contract } = data;
  let { signer } = data;

  if (contract.status !== "sent") return "not_open";
  if (signer.signedAt) return "already_signed";
  if (signer.otpSentAt && Date.now() - signer.otpSentAt.getTime() < OTP_RESEND_MS) return "too_soon";

  // A self-identifying signer may set or correct their details until their
  // email is verified; after that the identity is fixed.
  if (signer.selfIdentify && !signer.verifiedAt) {
    const id = {
      name: identity?.name.trim() ?? "",
      email: identity?.email.trim().toLowerCase() ?? "",
      relationship: identity?.relationship.trim() ?? "",
      phone: identity?.phone.trim() ?? "",
      address: identity?.address.trim() ?? "",
    };

    if (!id.name || !EMAIL_RE.test(id.email) || !id.relationship || !id.phone) return "bad_identity";

    const info: SignerInfo = { relationship: id.relationship, phone: id.phone, address: id.address || undefined };
    const [row] = await db
      .update(contractSigners)
      .set({ name: id.name, email: id.email, signerInfo: info })
      .where(and(eq(contractSigners.id, signer.id), isNull(contractSigners.verifiedAt)))
      .returning();

    if (!row) return "not_verified";
    signer = row;
    await appendEvent(contract.id, "identity_provided", {
      signerId: signer.id,
      actor: id.email,
      meta,
      detail: { name: id.name, email: id.email, ...info },
    });
  }

  if (!signer.email) return "bad_identity";

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  await db
    .update(contractSigners)
    .set({ otpHash: sha256(`${signer.id}:${code}`), otpSentAt: new Date(), otpAttempts: 0 })
    .where(eq(contractSigners.id, signer.id));

  const ok = await sendMail(
    { email: signer.email, name: signer.name },
    `签署验证码：${code}`,
    mailShell(
      `<p>${esc(signer.name)}，您好：</p><p>您正在签署《${esc(contract.title)}》（编号 ${esc(contract.number)}）。验证码：</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>10 分钟内有效。请勿将验证码告诉他人。</p>`,
    ),
  );

  if (!ok) return "email_failed";

  await appendEvent(contract.id, "otp_sent", { signerId: signer.id, actor: signer.email, meta });

  return null;
}

/**
 * Link-only identity for a self-identifying signer who has no email: they
 * declare name, relationship and phone, and that is recorded as unverified.
 * Staff can later add an attestation (attestIdentity). Locks the identity.
 */
export async function declareIdentity(
  token: string,
  identity: Omit<SignerIdentity, "email">,
  meta: RequestMeta,
): Promise<SignError | null> {
  const data = await getByToken(token);

  if (!data) return "not_found";

  const { signer, contract } = data;

  if (contract.status !== "sent") return "not_open";
  if (signer.signedAt) return "already_signed";
  if (!signer.selfIdentify) return "bad_request";

  const id = {
    name: identity.name.trim(),
    relationship: identity.relationship.trim(),
    phone: identity.phone.trim(),
    address: identity.address.trim(),
  };

  if (!id.name || !id.relationship || !id.phone) return "bad_identity";

  // Once declared (or email-verified), the identity is fixed; re-declaring
  // only refreshes the 30-minute signing window for the same person.
  if (signer.verifiedAt) {
    if ((signer.signerInfo as SignerInfo | null)?.verification !== "none" || signer.name !== id.name) return "bad_identity";
    await db.update(contractSigners).set({ verifiedAt: new Date() }).where(eq(contractSigners.id, signer.id));

    return null;
  }

  const info: SignerInfo = {
    relationship: id.relationship,
    phone: id.phone,
    address: id.address || undefined,
    verification: "none",
  };
  const [row] = await db
    .update(contractSigners)
    .set({ name: id.name, email: "", signerInfo: info, verifiedAt: new Date(), otpHash: null })
    .where(and(eq(contractSigners.id, signer.id), isNull(contractSigners.verifiedAt)))
    .returning();

  if (!row) return "bad_identity";
  await appendEvent(contract.id, "identity_declared", {
    signerId: signer.id,
    actor: id.phone,
    meta,
    detail: { name: id.name, ...info },
  });

  return null;
}

/**
 * Change an unsigned signer's email (e.g. they prefer another mailbox). Any
 * pending code or verification is cleared so the new address has to verify.
 */
export async function changeSignerEmail(
  contractId: number,
  signerId: number,
  email: string,
  staffEmail: string,
  meta: RequestMeta,
): Promise<boolean> {
  const next = email.trim().toLowerCase();

  if (!EMAIL_RE.test(next)) return false;

  const [old] = await db.select().from(contractSigners).where(eq(contractSigners.id, signerId)).limit(1);

  if (!old || old.contractId !== contractId || old.signedAt || old.selfIdentify) return false;

  const [row] = await db
    .update(contractSigners)
    .set({ email: next, otpHash: null, otpSentAt: null, otpAttempts: 0, verifiedAt: null })
    .where(and(eq(contractSigners.id, signerId), isNull(contractSigners.signedAt)))
    .returning();

  if (!row) return false;
  await appendEvent(contractId, "signer_email_changed", {
    signerId,
    actor: staffEmail,
    meta,
    detail: { from: old.email, to: next },
  });

  return true;
}

/** Staff record that they confirmed a link-only signer's identity. */
export async function attestIdentity(
  contractId: number,
  signerId: number,
  staffEmail: string,
  note: string,
  meta: RequestMeta,
): Promise<boolean> {
  const data = await getContract(contractId);
  const signer = data?.signers.find((s) => s.id === signerId);
  const info = (signer?.signerInfo ?? {}) as SignerInfo;

  if (!signer || info.verification !== "none" || !note.trim()) return false;

  // A signed row is frozen by trigger, so the attestation lives in the
  // audit trail only; the record view reads it from there.
  await appendEvent(contractId, "identity_attested", {
    signerId,
    actor: staffEmail,
    meta,
    detail: { note: note.trim() },
  });

  return true;
}

export async function verifyOtp(token: string, code: string, meta: RequestMeta): Promise<SignError | null> {
  const data = await getByToken(token);

  if (!data) return "not_found";

  const { signer, contract } = data;

  if (contract.status !== "sent") return "not_open";
  if (signer.signedAt) return "already_signed";
  if (!signer.otpHash || !signer.otpSentAt) return "no_code";
  if (Date.now() - signer.otpSentAt.getTime() > OTP_TTL_MS) return "code_expired";
  if (signer.otpAttempts >= OTP_MAX_ATTEMPTS) return "too_many_attempts";

  const expected = Buffer.from(signer.otpHash, "hex");
  const got = Buffer.from(sha256(`${signer.id}:${code.trim()}`), "hex");

  if (!timingSafeEqual(expected, got)) {
    await db
      .update(contractSigners)
      .set({ otpAttempts: sql`${contractSigners.otpAttempts} + 1` })
      .where(eq(contractSigners.id, signer.id));
    await appendEvent(contract.id, "otp_failed", { signerId: signer.id, actor: signer.email, meta });

    return "bad_code";
  }

  await db
    .update(contractSigners)
    .set({ verifiedAt: new Date(), otpHash: null })
    .where(eq(contractSigners.id, signer.id));
  await appendEvent(contract.id, "otp_verified", { signerId: signer.id, actor: signer.email, meta });

  return null;
}

/** Normalised for comparison: case, all whitespace (incl. full-width) ignored. */
function nameKey(s: string): string {
  return s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

export async function signContract(
  token: string,
  input: { signedName: string; signatureImage: string; contentHash: string; consent: boolean },
  meta: RequestMeta,
): Promise<SignError | null> {
  const data = await getByToken(token);

  if (!data) return "not_found";

  const { signer, contract } = data;

  if (contract.status !== "sent") return "not_open";
  if (signer.signedAt) return "already_signed";
  // Verification is valid for the session it was done in, up to 30 minutes.
  if (!signer.verifiedAt || Date.now() - signer.verifiedAt.getTime() > 30 * 60 * 1000) return "not_verified";
  if (input.contentHash !== contract.contentHash || contentHashOf(contract.title, contract.bodyMd) !== contract.contentHash) {
    return "hash_mismatch";
  }
  if (nameKey(input.signedName) !== nameKey(signer.name)) return "name_mismatch";
  if (!input.consent) return "no_consent";
  if (
    !input.signatureImage.startsWith("data:image/png;base64,") ||
    input.signatureImage.length > MAX_SIGNATURE_BYTES ||
    input.signatureImage.length < 500
  ) {
    return "bad_signature";
  }

  const [row] = await db
    .update(contractSigners)
    .set({
      signedAt: new Date(),
      signedName: input.signedName.trim(),
      signatureImage: input.signatureImage,
      signatureHash: sha256(input.signatureImage),
      signedIp: meta.ip,
      signedUserAgent: meta.userAgent,
    })
    .where(and(eq(contractSigners.id, signer.id), isNull(contractSigners.signedAt)))
    .returning();

  if (!row) return "already_signed";

  await appendEvent(contract.id, "signed", {
    signerId: signer.id,
    actor: signer.email,
    meta,
    detail: { contentHash: contract.contentHash, signatureHash: row.signatureHash, signedName: row.signedName },
  });

  const completed = await maybeComplete(contract.id);

  // Everyone but the last signer gets a receipt now; the last one gets the
  // completion email instead.
  if (!completed && signer.email) {
    const ok = await sendMail(
      { email: signer.email, name: signer.name },
      `您已签署：${contract.title}`,
      mailShell(
        `<p>${esc(signer.name)}，您好：</p><p>您已于 ${esc(fmtBeijing(row.signedAt))} 以「${esc(signer.roleLabel)}」身份签署《${esc(contract.title)}》（编号 ${esc(contract.number)}）。其他各方签署完成后，系统会再发一封邮件，附完整签署记录的链接。</p>${button(signUrl(signer.token), "查看合同")}`,
      ),
    );

    await appendEvent(contract.id, ok ? "email_sent" : "email_failed", {
      signerId: signer.id,
      actor: "system",
      detail: { kind: "signed_receipt" },
    });
  }

  return null;
}

/** Marks the contract completed when nobody is left to sign; true if this call did it. */
async function maybeComplete(contractId: number): Promise<boolean> {
  const [{ pending }] = await db
    .select({ pending: sql<number>`count(*)::int` })
    .from(contractSigners)
    .where(and(eq(contractSigners.contractId, contractId), isNull(contractSigners.signedAt)));

  if (pending > 0) return false;

  // Only one concurrent last-signer wins this update.
  const [won] = await db
    .update(contracts)
    .set({ status: "completed", completedAt: new Date() })
    .where(and(eq(contracts.id, contractId), eq(contracts.status, "sent")))
    .returning();

  if (!won) return false;

  await appendEvent(contractId, "completed", { actor: "system" });

  const data = (await getContract(contractId))!;
  const record = {
    number: won.number,
    title: won.title,
    bodyMd: won.bodyMd,
    contentHash: won.contentHash,
    createdAt: won.createdAt.toISOString(),
    completedAt: won.completedAt!.toISOString(),
    signers: data.signers.map((s) => ({
      roleLabel: s.roleLabel,
      name: s.name,
      email: s.email,
      signedName: s.signedName,
      info: s.signerInfo ?? null,
      signedAt: s.signedAt!.toISOString(),
      signedIp: s.signedIp,
      signatureHash: s.signatureHash,
    })),
    events: data.events.map((e) => ({ type: e.type, actor: e.actor, at: e.createdAt.toISOString(), hash: e.hash })),
  };
  const recordHash = sha256(canonicalJson(record));

  await db.update(contracts).set({ completedRecord: record, recordHash }).where(eq(contracts.id, contractId));

  let delivered = 0;

  for (const s of data.signers) {
    if (!s.email) continue;

    const ok = await sendMail(
      { email: s.email, name: s.name },
      `已完成签署：${won.title}`,
      mailShell(
        `<p>${esc(s.name)}，您好：</p><p>《${esc(won.title)}》（编号 ${esc(won.number)}）已由全部 ${data.signers.length} 方签署完成。您可以随时通过下方链接查看、打印或保存签署记录。</p><p style="font-size:12px;color:#6b7280">记录指纹（SHA-256）：${recordHash}</p>${button(signUrl(s.token), "查看签署记录")}`,
      ),
    );

    if (ok) delivered++;
  }
  // Logged outside the contract trail: the trail is sealed by record_hash at
  // completion, and what is shown must be exactly what was hashed.
  await logActivity({
    actorType: "system",
    actor: "contracts",
    action: "contract.completed_email",
    targetType: "contract",
    targetId: contractId,
    detail: { delivered, of: data.signers.length },
  });

  return true;
}
