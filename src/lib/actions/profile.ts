"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { candidates, type Candidate } from "@/lib/schema";

export type ProfileInput = {
  phone?: string;
  preferredLanguage?: string;
  gender?: string;
  ethnicity?: string;
  veteranStatus?: string;
  disability?: string;
  expectedSalary?: string;
  authorizedInCountry?: boolean;
  validDrivingLicense?: boolean;
  needsVisaSponsorship?: boolean;
  availableDate?: string;
  yearsOfExperience?: number;
  jobType?: string;
  fullyRemote?: boolean;
  linkedinUrl?: string;
  portfolioUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
};

export async function getMyProfile(): Promise<Candidate | null> {
  const session = await auth0.getSession();
  if (!session?.user?.sub) return null;

  const rows = await db
    .select()
    .from(candidates)
    .where(eq(candidates.auth0Id, session.user.sub as string))
    .limit(1);

  return rows[0] ?? null;
}

export async function saveMyProfile(input: ProfileInput) {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return { ok: false as const, error: "Not authenticated" };
  }

  const auth0Id = session.user.sub as string;

  const values = {
    auth0Id,
    name: (session.user.name as string | undefined) ?? null,
    email: (session.user.email as string | undefined) ?? null,
    phone: input.phone || null,
    preferredLanguage: input.preferredLanguage || null,
    gender: input.gender || null,
    ethnicity: input.ethnicity || null,
    veteranStatus: input.veteranStatus || null,
    disability: input.disability || null,
    expectedSalary: input.expectedSalary || null,
    authorizedInCountry: input.authorizedInCountry ?? null,
    validDrivingLicense: input.validDrivingLicense ?? null,
    needsVisaSponsorship: input.needsVisaSponsorship ?? null,
    availableDate: input.availableDate || null,
    yearsOfExperience:
      typeof input.yearsOfExperience === "number"
        ? input.yearsOfExperience
        : null,
    jobType: input.jobType || null,
    fullyRemote: input.fullyRemote ?? null,
    linkedinUrl: input.linkedinUrl || null,
    portfolioUrl: input.portfolioUrl || null,
    address: input.address || null,
    city: input.city || null,
    state: input.state || null,
    zipcode: input.zipcode || null,
    updatedAt: new Date(),
  };

  await db
    .insert(candidates)
    .values(values)
    .onConflictDoUpdate({
      target: candidates.auth0Id,
      set: { ...values, updatedAt: new Date() },
    });

  revalidatePath("/[locale]/profile", "page");
  return { ok: true as const };
}
