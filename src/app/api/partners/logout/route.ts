import { NextResponse } from "next/server";
import { clearPartnerSession } from "@/lib/partner-session";

export async function POST() {
  await clearPartnerSession();
  return NextResponse.json({ success: true });
}
