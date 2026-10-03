import "server-only";

import { notFound, redirect } from "next/navigation";

import { auth0 } from "./auth0";

export type StaffRole = "admin" | "supervisor";

function allowlist(varName: string): string[] {
  return (process.env[varName] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Staff = an Auth0 user whose *verified* email is in ADMIN_EMAILS or
 * SUPERVISOR_EMAILS (comma-separated, Vercel env). Unverified addresses are
 * self-asserted at sign-up, so they never qualify. Both roles see all of
 * /admin today; admin-only surfaces (billing, settings) check role === "admin".
 */
export function staffRoleOf(email: string | null | undefined): StaffRole | null {
  if (!email) return null;
  const e = email.toLowerCase();

  if (allowlist("ADMIN_EMAILS").includes(e)) return "admin";
  if (allowlist("SUPERVISOR_EMAILS").includes(e)) return "supervisor";

  return null;
}

/**
 * Page gate for /admin (admins and supervisors). Signed out → login and back
 * to `returnTo`; signed in but not staff → 404, so the route's existence
 * stays unconfirmed.
 */
export async function requireStaff(
  returnTo: string,
): Promise<{ email: string; role: StaffRole }> {
  const session = await auth0.getSession();

  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);

  const email = session.user.email ?? null;
  const role = session.user.email_verified ? staffRoleOf(email) : null;

  if (!role) notFound();

  return { email: email!, role };
}
