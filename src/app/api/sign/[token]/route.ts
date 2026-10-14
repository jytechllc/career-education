import { NextResponse } from "next/server";

import { declareIdentity, requestMeta, sendOtp, signContract, verifyOtp } from "@/lib/contracts";

/**
 * Signer endpoint. One POST with an `action`:
 *   { action: "send_code" }
 *   { action: "verify", code }
 *   { action: "sign", signedName, signatureImage, contentHash, consent }
 * Errors come back as { error: <SignError> } for the page to translate.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const meta = requestMeta(request.headers);
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  let error: string | null;

  switch (body.action) {
    case "send_code":
      error = await sendOtp(
        token,
        meta,
        body.identity && typeof body.identity === "object"
          ? {
              name: String((body.identity as Record<string, unknown>).name ?? ""),
              email: String((body.identity as Record<string, unknown>).email ?? ""),
              relationship: String((body.identity as Record<string, unknown>).relationship ?? ""),
              phone: String((body.identity as Record<string, unknown>).phone ?? ""),
              address: String((body.identity as Record<string, unknown>).address ?? ""),
            }
          : undefined,
      );
      break;
    case "declare": {
      const id = (body.identity ?? {}) as Record<string, unknown>;

      error = await declareIdentity(
        token,
        {
          name: String(id.name ?? ""),
          relationship: String(id.relationship ?? ""),
          phone: String(id.phone ?? ""),
          address: String(id.address ?? ""),
        },
        meta,
      );
      break;
    }
    case "verify":
      error = await verifyOtp(token, String(body.code ?? ""), meta);
      break;
    case "sign":
      error = await signContract(
        token,
        {
          signedName: String(body.signedName ?? ""),
          signatureImage: String(body.signatureImage ?? ""),
          contentHash: String(body.contentHash ?? ""),
          consent: body.consent === true,
        },
        meta,
      );
      break;
    default:
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (error) return NextResponse.json({ error }, { status: error === "not_found" ? 404 : 400 });

  return NextResponse.json({ ok: true });
}
