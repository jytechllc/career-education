import "server-only";

/**
 * JY Tech's recruiter and employer contacts, read from job-matching
 * (GET /api/contacts). Internal resource: view only, one page at a time,
 * no export. Region tags can be edited (POST /api/contacts/regions).
 */
export const CONTACT_REGIONS = ["hong kong", "shenzhen", "china", "singapore", "us", "uk", "india", "other"] as const;
export type ContactRegion = (typeof CONTACT_REGIONS)[number];
export const CONTACT_TYPES = ["headhunter", "company_inbox", "inhouse", "org"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];
/** The two categories staff filter by: agency headhunters, and company HR (in-house people + official inboxes). */
export const CONTACT_CATEGORIES = ["headhunter", "hr", "org"] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];
export type ContactOrigin = "recruiter" | "employer_inbox" | "employer_contact";

export type Contact = {
  type: ContactType;
  origin: ContactOrigin;
  id: string;
  name: string | null;
  title: string | null;
  company: string | null;
  email: string;
  regions: string[];
  regionSource: string | null;
  linkedin: string | null;
  city: string | null;
  emailSource: string | null;
  lastSeen: string | null;
  contactedAt: string | null;
  repliedAt: string | null;
  phone: string | null;
  wechat: string | null;
  notes: string | null;
  addedBy: string | null;
};

export type ContactPage = {
  rows: Contact[];
  total: number;
  page: number;
  pageSize: number;
  counts: { region: string; type: ContactType; n: number }[];
};

const BASE = process.env.JOB_MATCHING_URL ?? "https://jobmatching.us";

function auth(): Record<string, string> {
  const token = process.env.JOB_MATCHING_API_TOKEN;
  if (!token) throw new Error("JOB_MATCHING_API_TOKEN is not set");
  return { authorization: `Bearer ${token}` };
}

export async function fetchContacts(q: { type?: string; region?: string; q?: string; page?: number }): Promise<ContactPage> {
  const qs = new URLSearchParams();
  if (q.type) qs.set("type", q.type);
  if (q.region) qs.set("region", q.region);
  if (q.q) qs.set("q", q.q);
  if (q.page && q.page > 1) qs.set("page", String(q.page));
  const res = await fetch(`${BASE}/api/contacts?${qs}`, { headers: auth(), cache: "no-store" });
  if (!res.ok) throw new Error(`job-matching ${res.status}`);
  return (await res.json()) as ContactPage;
}

export async function saveContactRegions(origin: ContactOrigin, id: string, regions: string[]): Promise<void> {
  const res = await fetch(`${BASE}/api/contacts/regions`, {
    method: "POST",
    headers: { ...auth(), "content-type": "application/json" },
    body: JSON.stringify({ origin, id, regions }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`job-matching ${res.status}: ${await res.text()}`);
}

export type ImportResult = { added: number; updated: number; failed: { row: number; email: string; error: string }[] };

export async function importContacts(
  actor: string,
  contacts: {
    type: "headhunter" | "inhouse" | "org";
    email: string;
    name: string | null;
    title: string | null;
    company: string | null;
    phone: string | null;
    wechat: string | null;
    linkedin: string | null;
    regions: string[];
    notes: string | null;
  }[],
): Promise<ImportResult> {
  const res = await fetch(`${BASE}/api/contacts`, {
    method: "POST",
    headers: { ...auth(), "content-type": "application/json" },
    body: JSON.stringify({ actor, contacts }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`job-matching ${res.status}: ${await res.text()}`);
  return (await res.json()) as ImportResult;
}

export async function saveContactCategory(id: string, category: ContactCategory): Promise<void> {
  const res = await fetch(`${BASE}/api/contacts/category`, {
    method: "POST",
    headers: { ...auth(), "content-type": "application/json" },
    body: JSON.stringify({ id, category }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`job-matching ${res.status}: ${await res.text()}`);
}
