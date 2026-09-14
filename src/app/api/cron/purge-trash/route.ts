import { NextResponse } from "next/server";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { collegeCoachingApplications, applicationFiles } from "@/lib/schema";
import { deleteFile } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 60;

const TRASH_RETENTION_DAYS = 30;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const key = new URL(request.url).searchParams.get("key");
  return key === secret;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const expired = await db
    .select({ id: collegeCoachingApplications.id })
    .from(collegeCoachingApplications)
    .where(
      and(
        isNotNull(collegeCoachingApplications.deletedAt),
        lt(collegeCoachingApplications.deletedAt, cutoff)
      )
    );

  let filesDeleted = 0;
  for (const { id } of expired) {
    const files = await db
      .select()
      .from(applicationFiles)
      .where(eq(applicationFiles.applicationId, id));

    for (const f of files) {
      await deleteFile(f.r2Key).catch((e) =>
        console.error(`purge-trash: failed to delete R2 object ${f.r2Key}:`, e)
      );
      filesDeleted++;
    }

    // application_files rows cascade-delete with the parent (FK onDelete:
    // "cascade"); the R2 objects don't, which is why we delete them above.
    await db
      .delete(collegeCoachingApplications)
      .where(eq(collegeCoachingApplications.id, id));
  }

  return NextResponse.json({
    ok: true,
    applicationsPurged: expired.length,
    filesDeleted,
  });
}
