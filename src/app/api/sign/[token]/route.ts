import { NextResponse } from "next/server";

import { requestMeta, sendOtp, signContract, verifyOtp } from "@/lib/contracts";

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
      error = await sendOtp(token, meta);
      break;
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
