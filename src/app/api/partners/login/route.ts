import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerCredentials, partners } from "@/lib/schema";
import { createPartnerSession } from "@/lib/partner-session";
import { logActivity } from "@/lib/activity";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const [credential] = await db
    .select()
    .from(partnerCredentials)
    .where(eq(partnerCredentials.username, username))
    .limit(1);

  if (!credential || !(await bcrypt.compare(password, credential.passwordHash))) {
    await logActivity({ actorType: "partner", actor: String(username).slice(0, 100), action: "partner.login_failed" });

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const [partner] = await db
    .select()
    .from(partners)
    .where(eq(partners.id, credential.partnerId))
    .limit(1);

  if (!partner) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createPartnerSession({
    partnerId: partner.id,
    partnerSlug: partner.slug,
    username: credential.username,
  });
  await logActivity({ actorType: "partner", actor: credential.username, action: "partner.login", detail: { partner: partner.slug } });

  return NextResponse.json({ success: true });
}
