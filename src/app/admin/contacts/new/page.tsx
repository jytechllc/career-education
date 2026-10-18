import Link from "next/link";

import { requireStaff } from "@/lib/admin-auth";
import { getAdminDict } from "@/lib/admin-i18n";
import { CONTACT_REGIONS } from "@/lib/contacts";

import { ContactImport } from "./ContactImport";

export default async function NewContactsPage() {
  await requireStaff("/admin/contacts/new");
  const { t: d } = await getAdminDict();
  const t = d.contactImport;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link className="text-sm text-gray-500 underline" href="/admin/contacts">
          {t.back}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-yellow-900">{t.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
      </div>
      <ContactImport regionKeys={CONTACT_REGIONS} t={{ ...t.form, regionLabels: d.contacts.regions }} />
    </div>
  );
}
