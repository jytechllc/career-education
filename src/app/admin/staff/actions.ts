"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { assertAdmin, envStaffRole } from "@/lib/admin-auth";
import { staffMembers } from "@/lib/schema";
import { STAFF_ROLES, type StaffRole } from "@/lib/staff-roles";
import { logActivity } from "@/lib/activity";

/** `error` is a key into the admin dictionary's staffControls.errors. */
export type StaffError = "invalidEmail" | "unknownRole" | "pinned" | "self" | "failed";
export type StaffActionResult = { ok: true } | { ok: false; error: StaffError };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Add a staff member or change their role. Admin only. */
export async function saveStaffAction(
  emailInput: string,
  role: StaffRole,
): Promise<StaffActionResult> {
  try {
    const admin = await assertAdmin();
    const email = emailInput.trim().toLowerCase();

    if (!EMAIL_RE.test(email)) return { ok: false, error: "invalidEmail" };
    if (!STAFF_ROLES.includes(role)) return { ok: false, error: "unknownRole" };
    if (envStaffRole(email)) return { ok: false, error: "pinned" };
    if (email === admin.email.toLowerCase()) return { ok: false, error: "self" };

    await db
      .insert(staffMembers)
      .values({ email, role, addedBy: admin.email })
      .onConflictDoUpdate({
        target: staffMembers.email,
        set: { role, updatedAt: sql`now()` },
      });
    await logActivity({ actorType: "staff", actor: admin.email, action: "staff.save", targetType: "staff", targetId: email, detail: { role } });
    revalidatePath("/admin/staff");

    return { ok: true };
  } catch (e) {
    console.error("[admin/staff]", e);

    return { ok: false, error: "failed" };
  }
}

/** Remove a staff member. Admin only. */
export async function removeStaffAction(emailInput: string): Promise<StaffActionResult> {
  try {
    const admin = await assertAdmin();
    const email = emailInput.trim().toLowerCase();

    if (envStaffRole(email)) return { ok: false, error: "pinned" };
    if (email === admin.email.toLowerCase()) return { ok: false, error: "self" };

    await db.delete(staffMembers).where(eq(staffMembers.email, email));
    await logActivity({ actorType: "staff", actor: admin.email, action: "staff.remove", targetType: "staff", targetId: email });
    revalidatePath("/admin/staff");

    return { ok: true };
  } catch (e) {
    console.error("[admin/staff]", e);

    return { ok: false, error: "failed" };
  }
}
