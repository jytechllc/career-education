// The whole jobmatching.us board (internships, entry-level, experienced) for
// the edu admin, via job-matching's token-protected /api/listings/board.

export type JobType = "intern" | "entry" | "experienced";
export type BoardTab = "all" | JobType;

export type BoardJob = {
  key: string;
  kind: "recruiter" | "listing";
  type: JobType;
  category: string;
  title: string;
  company: string;
  locations: string[];
  workMode: string | null;
  sponsorship: string | null;
  salary: { min: number | null; max: number | null; currency: string; period: string } | null;
  url: string;
  postedAt: number | null;
};

export type JobBoard = {
  page: number;
  total: number;
  hasMore: boolean;
  counts: Record<BoardTab, number>;
  categories: { name: string; count: number }[];
  fetchedAt: number | null;
  items: BoardJob[];
};

export type JobFilters = { type: BoardTab; q: string; loc: string; category: string; sponsor: boolean; page: number };

const JOB_MATCHING_URL = process.env.JOB_MATCHING_URL ?? "https://jobmatching.us";

export async function fetchJobBoard(f: JobFilters): Promise<JobBoard> {
  const token = process.env.JOB_MATCHING_API_TOKEN;

  if (!token) throw new Error("JOB_MATCHING_API_TOKEN is not set");
  const qs = new URLSearchParams({
    type: f.type,
    ...(f.q && { q: f.q }),
    ...(f.loc && { loc: f.loc }),
    ...(f.category && { category: f.category }),
    ...(f.sponsor && { sponsor: "1" }),
    page: String(f.page),
  });
  const res = await fetch(`${JOB_MATCHING_URL}/api/listings/board?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 1800 },
  });

  if (!res.ok) throw new Error(`job-matching board ${res.status}`);

  return res.json();
}
