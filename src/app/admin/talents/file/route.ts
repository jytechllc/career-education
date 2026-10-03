import { NextResponse, type NextRequest } from "next/server";

import { auth0 } from "@/lib/auth0";
import { staffRoleOf } from "@/lib/admin-auth";
import { getSignedInlineUrl } from "@/lib/r2";
import { readTalentsManifest } from "@/lib/talents-cache";

export const dynamic = "force-dynamic";

/**
 * /admin/talents/file?id=<driveFileId> — staff only. Signs a fresh R2 link
 * on each click, so links on a long-open page never go stale.
 */
export async function GET(req: NextRequest) {
  const session = await auth0.getSession();
  const email = session?.user.email ?? null;
  const role = session?.user.email_verified ? await staffRoleOf(email) : null;

  if (!session) {
    const back = `/admin/talents/file?${req.nextUrl.searchParams}`;

    return NextResponse.redirect(new URL(`/auth/login?returnTo=${encodeURIComponent(back)}`, req.url));
  }
  if (!role) return new NextResponse("Not found", { status: 404 });

  const id = req.nextUrl.searchParams.get("id");
  const manifest = await readTalentsManifest();
  const file = manifest?.folders.flatMap((f) => f.files).find((f) => f.id === id);

  if (!file) return new NextResponse("Not found", { status: 404 });
  // Not cached (too large / non-exportable): fall back to Drive.
  if (!file.r2Key) {
    return file.webViewLink
      ? NextResponse.redirect(file.webViewLink)
      : new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.redirect(await getSignedInlineUrl(file.r2Key, file.cachedName, file.cachedType));
}
