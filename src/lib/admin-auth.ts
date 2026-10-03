import "server-only";

import { notFound, redirect } from "next/navigation";

import { auth0 } from "./auth0";

/**
 * Staff admin = an Auth0 user whose *verified* email is in ADMIN_EMAILS
 * (comma-separated, Vercel env). Unverified addresses are self-asserted at
 * sign-up, so they never qualify.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

/**
 * Page gate for /admin. Signed out → login and back to `returnTo`; signed in
 * but not an admin → 404, so the route's existence stays unconfirmed.
 */
export async function requireAdmin(returnTo: string): Promise<{ email: string }> {
  const session = await auth0.getSession();

  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);

  const email = session.user.email ?? null;

  if (!session.user.email_verified || !isAdminEmail(email)) notFound();

  return { email: email! };
}
