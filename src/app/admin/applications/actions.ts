"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { collegeCoachingApplications } from "@/lib/schema";
import { logActivity } from "@/lib/activity";

/** The signed-in staff member's email, or null when not staff. */
async function staffEmail(): Promise<string | null> {
  const session = await auth0.getSession();
  const email = session?.user.email ?? null;

  return session?.user.email_verified && (await staffRoleOf(email)) ? email : null;
}

/**
 * Move to / restore from trash. Trashed applications are purged with their
 * files 30 days after deletedAt by /api/cron/purge-trash — the same rule
 * the partner portal uses, so either side can trash and the other sees it.
 */
async function setTrashed(id: number, trashed: boolean): Promise<{ ok: boolean }> {
  const actor = await staffEmail();

  if (!Number.isInteger(id) || !actor) return { ok: false };

  const [row] = await db
    .update(collegeCoachingApplications)
    .set({ deletedAt: trashed ? new Date() : null })
    .where(eq(collegeCoachingApplications.id, id))
    .returning({ id: collegeCoachingApplications.id });

  if (row) {
    await logActivity({
      actorType: "staff",
      actor,
      action: trashed ? "application.trash" : "application.restore",
      targetType: "application",
      targetId: id,
    });
  }
  revalidatePath("/admin/applications");
  revalidatePath("/admin");

  return { ok: !!row };
}

export async function trashApplicationAction(id: number) {
  return setTrashed(id, true);
}

export async function restoreApplicationAction(id: number) {
  return setTrashed(id, false);
}
