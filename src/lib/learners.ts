import "server-only";

import { desc, isNull } from "drizzle-orm";

import { db } from "./db";
import { candidates, collegeCoachingApplications, partners, studentProfiles } from "./schema";
import { profileCode } from "./student-profiles";

/**
 * One list of everyone who is a 学员: new applications (including partner
 * referrals), students registered on the site, and student profiles (Drive
 * Talents folders / uploaded resumes). People are matched across sources by
 * email; anyone without an email is matched by name.
 */
export type LearnerSource = "application" | "site" | "profile";

export type Learner = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  school: string | null;
  goal: string | null;
  sources: LearnerSource[];
  partner: string | null;
  applicationIds: number[];
  candidateId: number | null;
  profileId: number | null;
  profileCode: string | null;
  /** Case handling from the profile: new / active / closed, owner (partner or JYEdu), POC. */
  caseStatus: string | null;
  owner: string | null;
  poc: string | null;
  updatedAt: Date;
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export async function listLearners(): Promise<Learner[]> {
  const [apps, sites, profiles, partnerRows] = await Promise.all([
    db
      .select({
        id: collegeCoachingApplications.id,
        fullName: collegeCoachingApplications.fullName,
        email: collegeCoachingApplications.email,
        phone: collegeCoachingApplications.phone,
        currentSchool: collegeCoachingApplications.currentSchool,
        intendedMajor: collegeCoachingApplications.intendedMajor,
        partnerId: collegeCoachingApplications.partnerId,
        createdAt: collegeCoachingApplications.createdAt,
      })
      .from(collegeCoachingApplications)
      .where(isNull(collegeCoachingApplications.deletedAt))
      .orderBy(desc(collegeCoachingApplications.createdAt)),
    db.select().from(candidates).orderBy(desc(candidates.updatedAt)).limit(2000),
    db.select().from(studentProfiles).orderBy(desc(studentProfiles.updatedAt)),
    db.select({ id: partners.id, name: partners.name }).from(partners),
  ]);
  const partnerName = new Map(partnerRows.map((p) => [p.id, p.name]));

  const byKey = new Map<string, Learner>();
  const upsert = (key: string, base: Omit<Learner, "key" | "sources" | "applicationIds">, source: LearnerSource) => {
    const cur = byKey.get(key);
    if (!cur) {
      byKey.set(key, { key, ...base, sources: [source], applicationIds: [] });
      return byKey.get(key)!;
    }
    if (!cur.sources.includes(source)) cur.sources.push(source);
    cur.email ??= base.email;
    cur.phone ??= base.phone;
    cur.school ??= base.school;
    cur.goal ??= base.goal;
    cur.partner ??= base.partner;
    cur.candidateId ??= base.candidateId;
    cur.profileId ??= base.profileId;
    cur.profileCode ??= base.profileCode;
    cur.caseStatus ??= base.caseStatus;
    cur.owner ??= base.owner;
    cur.poc ??= base.poc;
    if (base.updatedAt > cur.updatedAt) cur.updatedAt = base.updatedAt;
    return cur;
  };
  const keyFor = (email: string | null | undefined, name: string | null | undefined) =>
    email?.trim() ? `e:${email.trim().toLowerCase()}` : `n:${norm(name ?? "")}`;

  for (const p of profiles) {
    upsert(
      keyFor(p.email, p.name),
      {
        name: p.name ?? profileCode(p.id),
        email: p.email ?? null,
        phone: p.phone ?? null,
        school: p.masterSchool ?? p.phdSchool ?? null,
        goal: p.targetRoles ?? null,
        partner: null,
        candidateId: null,
        profileId: p.id,
        profileCode: profileCode(p.id),
        caseStatus: p.caseStatus ?? null,
        owner: p.caseStatus || p.poc ? (p.ownerPartnerId ? (partnerName.get(p.ownerPartnerId) ?? null) : "JYEdu") : null,
        poc: p.poc ?? null,
        updatedAt: p.updatedAt,
      },
      "profile",
    );
  }
  for (const a of apps) {
    const l = upsert(
      keyFor(a.email, a.fullName),
      {
        name: a.fullName,
        email: a.email,
        phone: a.phone ?? null,
        school: a.currentSchool ?? null,
        goal: a.intendedMajor ?? null,
        partner: a.partnerId ? (partnerName.get(a.partnerId) ?? null) : null,
        candidateId: null,
        profileId: null,
        profileCode: null,
        caseStatus: null,
        owner: a.partnerId ? (partnerName.get(a.partnerId) ?? null) : null,
        poc: null,
        updatedAt: a.createdAt,
      },
      "application",
    );
    l.applicationIds.push(a.id);
  }
  for (const c of sites) {
    upsert(
      keyFor(c.email, c.name),
      {
        name: c.name ?? c.email ?? "—",
        email: c.email ?? null,
        phone: c.phone ?? null,
        school: null,
        goal: c.jobType ?? null,
        partner: null,
        candidateId: c.id,
        profileId: null,
        profileCode: null,
        caseStatus: null,
        owner: null,
        poc: null,
        updatedAt: c.updatedAt,
      },
      "site",
    );
  }

  return Array.from(byKey.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}
