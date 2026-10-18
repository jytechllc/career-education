import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { getSignedInlineUrl } from "@/lib/r2";
import { studentProfiles } from "@/lib/schema";

export const dynamic = "force-dynamic";

/** /admin/profiles/<id>/resume — staff only; the original upload via a fresh signed link. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.redirect(
      new URL(`/auth/login?returnTo=${encodeURIComponent(`/admin/profiles/${id}/resume`)}`, req.url),
    );
  }
  const email = session.user.email ?? null;
  const role = session.user.email_verified ? await staffRoleOf(email) : null;

  if (!role) return new NextResponse("Not found", { status: 404 });
  const [p] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, Number(id) || 0)).limit(1);

  if (!p?.resumeR2Key) return new NextResponse("Not found", { status: 404 });
  await logActivity({ actorType: "staff", actor: email, action: "profile.resume_open", targetType: "student_profile", targetId: p.id });

  return NextResponse.redirect(
    await getSignedInlineUrl(p.resumeR2Key, p.resumeFileName ?? "resume", p.resumeMime ?? "application/pdf"),
  );
}
