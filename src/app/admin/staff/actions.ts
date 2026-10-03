"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { assertAdmin, envStaffRole } from "@/lib/admin-auth";
import { staffMembers } from "@/lib/schema";
import { STAFF_ROLES, type StaffRole } from "@/lib/staff-roles";

export type StaffActionResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Add a staff member or change their role. Admin only. */
export async function saveStaffAction(
  emailInput: string,
  role: StaffRole,
): Promise<StaffActionResult> {
  try {
    const admin = await assertAdmin();
    const email = emailInput.trim().toLowerCase();

    if (!EMAIL_RE.test(email)) return { ok: false, error: "邮箱格式不正确" };
    if (!STAFF_ROLES.includes(role)) return { ok: false, error: "未知角色" };
    if (envStaffRole(email)) return { ok: false, error: "该邮箱由环境变量固定，不能在后台修改" };
    if (email === admin.email.toLowerCase()) return { ok: false, error: "不能修改自己的角色" };

    await db
      .insert(staffMembers)
      .values({ email, role, addedBy: admin.email })
      .onConflictDoUpdate({
        target: staffMembers.email,
        set: { role, updatedAt: sql`now()` },
      });
    revalidatePath("/admin/staff");

    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Remove a staff member. Admin only. */
export async function removeStaffAction(emailInput: string): Promise<StaffActionResult> {
  try {
    const admin = await assertAdmin();
    const email = emailInput.trim().toLowerCase();

    if (envStaffRole(email)) return { ok: false, error: "该邮箱由环境变量固定，不能在后台删除" };
    if (email === admin.email.toLowerCase()) return { ok: false, error: "不能删除自己" };

    await db.delete(staffMembers).where(eq(staffMembers.email, email));
    revalidatePath("/admin/staff");

    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
