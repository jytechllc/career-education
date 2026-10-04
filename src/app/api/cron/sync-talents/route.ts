import { NextResponse } from "next/server";

import { syncTalents } from "@/lib/talents-cache";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Daily Drive → R2 mirror of the Talents folder (Vercel cron sends GET). */
async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncTalents();

    await logActivity({ actorType: "system", actor: "cron", action: "talents.sync", detail: { ...result } });

    return NextResponse.json(result);
  } catch (e) {
    console.error("[cron/sync-talents]", e);

    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
