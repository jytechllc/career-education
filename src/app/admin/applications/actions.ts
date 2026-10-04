"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { collegeCoachingApplications } from "@/lib/schema";

async function isStaff(): Promise<boolean> {
  const session = await auth0.getSession();

  return !!(session?.user.email_verified && (await staffRoleOf(session.user.email)));
}

/**
 * Move to / restore from trash. Trashed applications are purged with their
 * files 30 days after deletedAt by /api/cron/purge-trash — the same rule
 * the partner portal uses, so either side can trash and the other sees it.
 */
async function setTrashed(id: number, trashed: boolean): Promise<{ ok: boolean }> {
  if (!Number.isInteger(id) || !(await isStaff())) return { ok: false };

  const [row] = await db
    .update(collegeCoachingApplications)
    .set({ deletedAt: trashed ? new Date() : null })
    .where(eq(collegeCoachingApplications.id, id))
    .returning({ id: collegeCoachingApplications.id });

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
