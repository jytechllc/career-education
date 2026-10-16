import "server-only";

/**
 * Curated internship collections live in job-matching (jobmatching.us,
 * data/curated/ → listings). This reads one back through its partner API;
 * job-matching closes a row once its deadline passes and lists open rows on
 * its public /jobs board.
 */
export type InternshipKind = "foreign" | "chinese" | "local" | "regulator";
export type InternshipStatus = "open" | "likelyOpen" | "notYet" | "closed" | "unknown";

/** The researched fields, in one language. */
export type InternshipText = {
  firm: string;
  programme: string;
  duration: string;
  deadlineText: string;
  eligibility: string;
  sourceNote: string;
};

/** Chinese at the top level (as researched), English under `en`. */
export type Internship = InternshipText & {
  id: string;
  kind: InternshipKind;
  deadline: string | null;
  status: InternshipStatus;
  /** status, closed once the deadline has passed. */
  effectiveStatus: InternshipStatus;
  url: string;
  listingId: string;
  en?: InternshipText;
};

export type InternshipCollection = {
  collection: string;
  title: string;
  checkedAt: string;
  rows: Internship[];
};

export const HK_BANK_SUMMER_2027 = "hk-bank-summer-2027";

const JOB_MATCHING_URL = process.env.JOB_MATCHING_URL ?? "https://jobmatching.us";

export async function fetchInternshipCollection(collection: string): Promise<InternshipCollection> {
  const token = process.env.JOB_MATCHING_API_TOKEN;

  if (!token) throw new Error("JOB_MATCHING_API_TOKEN is not set");
// ?v= is part of the cache key: bump it when the response shape changes so
  // pages don't keep an hour-old copy in the old shape.
  const url = `${JOB_MATCHING_URL}/api/listings/curated/${encodeURIComponent(collection)}?v=2`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`job-matching ${res.status}`);

  return (await res.json()) as InternshipCollection;
}
