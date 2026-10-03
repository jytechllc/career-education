import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_LANG_COOKIE } from "@/lib/admin-i18n";

/** /admin/lang?to=en&back=/admin/applications — set the admin language. */
export function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") === "en" ? "en" : "zh";
  const back = req.nextUrl.searchParams.get("back") ?? "/admin";
  // Same-site admin paths only, so this can't be used as an open redirect.
  const dest = back.startsWith("/admin") ? back : "/admin";
  const res = NextResponse.redirect(new URL(dest, req.url));

  res.cookies.set(ADMIN_LANG_COOKIE, to, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return res;
}
