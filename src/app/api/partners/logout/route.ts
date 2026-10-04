import { NextResponse } from "next/server";
import { clearPartnerSession, getPartnerSession } from "@/lib/partner-session";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const session = await getPartnerSession();

  await clearPartnerSession();
  if (session) await logActivity({ actorType: "partner", actor: session.username, action: "partner.logout" });
  return NextResponse.json({ success: true });
}
