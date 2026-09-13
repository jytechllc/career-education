import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "jyedu_partner_session";
const ALG = "HS256";

function getSecret() {
  const secret = process.env.PARTNER_SESSION_SECRET;
  if (!secret) throw new Error("PARTNER_SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type PartnerSession = {
  partnerId: number;
  partnerSlug: string;
  username: string;
};

export async function createPartnerSession(session: PartnerSession) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getPartnerSession(): Promise<PartnerSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as PartnerSession;
  } catch {
    return null;
  }
}

export async function clearPartnerSession() {
  (await cookies()).delete(COOKIE_NAME);
}
