import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth0 } from "./auth0";
import { db } from "./db";
import { staffMembers } from "./schema";
import type { StaffRole } from "./staff-roles";

export type { StaffRole };

function allowlist(varName: string): string[] {
  return (process.env[varName] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Role pinned by ADMIN_EMAILS / SUPERVISOR_EMAILS (Vercel env). These cannot
 * be removed or demoted from /admin/staff, so nobody can lock everyone out.
 */
export function envStaffRole(email: string | null | undefined): StaffRole | null {
  if (!email) return null;
  const e = email.toLowerCase();

  if (allowlist("ADMIN_EMAILS").includes(e)) return "admin";
  if (allowlist("SUPERVISOR_EMAILS").includes(e)) return "supervisor";

  return null;
}

export function listEnvStaff(): { email: string; role: StaffRole }[] {
  const all = [...allowlist("ADMIN_EMAILS"), ...allowlist("SUPERVISOR_EMAILS")];

  return Array.from(new Set(all)).map((email) => ({ email, role: envStaffRole(email)! }));
}

const dbStaffRole = cache(async (email: string): Promise<StaffRole | null> => {
  const rows = await db
    .select({ role: staffMembers.role })
    .from(staffMembers)
    .where(eq(staffMembers.email, email.toLowerCase()))
    .limit(1);
  const role = rows[0]?.role;

  return role === "admin" || role === "supervisor" ? role : null;
});

/**
 * Staff = an Auth0 user whose *verified* email is pinned in env or listed in
 * staff_members (managed from /admin/staff). Unverified addresses are
 * self-asserted at sign-up, so callers must check email_verified first.
 * Both roles see the admin pages; staff management is admin-only.
 */
export async function staffRoleOf(
  email: string | null | undefined,
): Promise<StaffRole | null> {
  if (!email) return null;

  return envStaffRole(email) ?? (await dbStaffRole(email));
}

/**
 * Page gate for /admin. Signed out → login and back to `returnTo`; signed in
 * but not staff (or not an admin, with `adminOnly`) → /admin/no-access, which
 * tells them why and lets them switch accounts.
 */
export async function requireStaff(
  returnTo: string,
  { adminOnly = false }: { adminOnly?: boolean } = {},
): Promise<{ email: string; role: StaffRole }> {
  const session = await auth0.getSession();

  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);

  const email = session.user.email ?? null;
  const role = session.user.email_verified ? await staffRoleOf(email) : null;

  if (!role || (adminOnly && role !== "admin")) {
    const reason = !session.user.email_verified ? "unverified" : role ? "admin-only" : "not-staff";

    redirect(`/admin/no-access?reason=${reason}`);
  }

  return { email: email!, role };
}

/** Server Action gate: throws instead of rendering a 404. */
export async function assertAdmin(): Promise<{ email: string }> {
  const session = await auth0.getSession();
  const email = session?.user.email ?? null;
  const role = session?.user.email_verified ? await staffRoleOf(email) : null;

  if (role !== "admin") throw new Error("Not authorized");

  return { email: email! };
}
