import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { collegeCoachingApplications } from "@/lib/schema";
import { getPartnerSession } from "@/lib/partner-session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Ownership check is baked into the WHERE clause, not a separate SELECT —
  // a partner can only ever affect their own rows, full stop.
  const [updated] = await db
    .update(collegeCoachingApplications)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(collegeCoachingApplications.id, id),
        eq(collegeCoachingApplications.partnerId, session.partnerId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
