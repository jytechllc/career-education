"use server";

import { revalidatePath } from "next/cache";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { CONTACT_REGIONS, CONTACT_TYPES, saveContactRegions, type ContactType } from "@/lib/contacts";

export type RegionsResult = { ok: true } | { ok: false; error: "empty" | "failed" };

/** Edit a contact's region tags. Any staff member; every edit is logged. */
export async function saveRegionsAction(type: ContactType, id: string, regions: string[]): Promise<RegionsResult> {
  const session = await auth0.getSession();
  const email = session?.user.email ?? null;
  const role = session?.user.email_verified ? await staffRoleOf(email) : null;

  if (!role || !CONTACT_TYPES.includes(type)) return { ok: false, error: "failed" };
  const clean = regions.filter((r) => (CONTACT_REGIONS as readonly string[]).includes(r));

  if (!clean.length) return { ok: false, error: "empty" };
  try {
    await saveContactRegions(type, id, clean);
    await logActivity({
      actorType: "staff",
      actor: email,
      action: "contact.regions",
      targetType: type,
      targetId: id,
      detail: { regions: clean },
    });
    revalidatePath("/admin/contacts");

    return { ok: true };
  } catch (e) {
    console.error("[admin/contacts] region save failed", e);

    return { ok: false, error: "failed" };
  }
}
