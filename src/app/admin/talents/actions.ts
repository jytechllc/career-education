"use server";

import { revalidatePath } from "next/cache";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { syncTalents, type SyncResult } from "@/lib/talents-cache";

/** "Sync now" on /admin/talents. Any staff member may run it. */
export async function syncTalentsAction(): Promise<
  { ok: true; result: SyncResult } | { ok: false }
> {
  const session = await auth0.getSession();
  const role = session?.user.email_verified ? await staffRoleOf(session.user.email) : null;

  if (!role) return { ok: false };

  try {
    const result = await syncTalents();

    revalidatePath("/admin/talents");

    return { ok: true, result };
  } catch (e) {
    console.error("[admin/talents] sync failed", e);

    return { ok: false };
  }
}
