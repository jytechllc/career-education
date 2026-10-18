"use server";

import { revalidatePath } from "next/cache";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { CONTACT_REGIONS, CONTACT_TYPES, importContacts, saveContactRegions, type ContactType, type ImportResult } from "@/lib/contacts";
import { parseContacts, type ImportRow } from "@/lib/contact-import";

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

async function staffEmail(): Promise<string | null> {
  const session = await auth0.getSession();
  const email = session?.user.email ?? null;
  const role = session?.user.email_verified ? await staffRoleOf(email) : null;

  return role ? email : null;
}

/** Parse an upload or pasted table; nothing is saved yet. */
export async function previewImportAction(form: FormData): Promise<{ ok: true; rows: ImportRow[] } | { ok: false; error: "auth" | "empty" | "parse" }> {
  if (!(await staffEmail())) return { ok: false, error: "auth" };
  try {
    const file = form.get("file");
    const rows = await parseContacts(
      { file: file instanceof File ? file : null, text: String(form.get("text") ?? "") },
      form.get("type") === "inhouse" ? "inhouse" : "headhunter",
    );
    return rows.length ? { ok: true, rows } : { ok: false, error: "empty" };
  } catch (e) {
    console.error("[admin/contacts] parse failed", e);
    return { ok: false, error: "parse" };
  }
}

/** Save contacts (one from the form, or the valid rows of an import). Logged. */
export async function importContactsAction(rows: ImportRow[]): Promise<{ ok: true; result: ImportResult } | { ok: false; error: "auth" | "empty" | "failed" }> {
  const email = await staffEmail();
  if (!email) return { ok: false, error: "auth" };
  const valid = rows
    .filter((r) => !r.problems.length && (r.type === "headhunter" || r.type === "inhouse"))
    .slice(0, 1000)
    .map(({ problems: _p, ...r }) => ({ ...r, regions: r.regions.filter((x) => (CONTACT_REGIONS as readonly string[]).includes(x)) }));
  if (!valid.length) return { ok: false, error: "empty" };
  try {
    const result = await importContacts(email, valid);
    await logActivity({
      actorType: "staff",
      actor: email,
      action: valid.length === 1 ? "contact.add" : "contact.import",
      targetType: "contacts",
      detail: { rows: valid.length, added: result.added, updated: result.updated, failed: result.failed.length },
    });
    revalidatePath("/admin/contacts");

    return { ok: true, result };
  } catch (e) {
    console.error("[admin/contacts] import failed", e);

    return { ok: false, error: "failed" };
  }
}
