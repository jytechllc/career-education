"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { collegeCoachingApplications } from "@/lib/schema";
import { logActivity } from "@/lib/activity";
import { APPLICATION_FIELDS, parseAppField } from "@/lib/application-fields";

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

/** Staff edit of an application's intake answers (whitelisted fields only). */
export async function updateApplicationAction(
  _prev: { saved: boolean; error: string | null },
  form: FormData,
): Promise<{ saved: boolean; error: string | null }> {
  const actor = await staffEmail();
  const id = Number(form.get("id"));

  if (!actor || !Number.isInteger(id)) return { saved: false, error: "notFound" };
  const [cur] = await db
    .select()
    .from(collegeCoachingApplications)
    .where(eq(collegeCoachingApplications.id, id))
    .limit(1);

  if (!cur) return { saved: false, error: "notFound" };

  const next: Record<string, string | string[] | null> = {};
  const changed: string[] = [];

  for (const f of APPLICATION_FIELDS) {
    const v = parseAppField(f, String(form.get(f.key) ?? ""));

    if (f.required && !v) return { saved: false, error: "required" };
    if (f.kind === "email" && typeof v === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return { saved: false, error: "invalidEmail" };
    }
    if (JSON.stringify(v) !== JSON.stringify(cur[f.key] ?? null)) {
      next[f.key] = v;
      changed.push(f.key);
    }
  }

  if (changed.length) {
    await db.update(collegeCoachingApplications).set(next).where(eq(collegeCoachingApplications.id, id));
    await logActivity({
      actorType: "staff",
      actor,
      action: "application.update",
      targetType: "application",
      targetId: id,
      detail: { fields: changed },
    });
    revalidatePath("/admin/applications");
    revalidatePath(`/admin/applications/${id}/edit`);
  }

  return { saved: true, error: null };
}
