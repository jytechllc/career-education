import { NextResponse } from "next/server";
import { generatePost } from "@/lib/blog/generate";
import { hasLocale, defaultLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const key = new URL(request.url).searchParams.get("key");
  return key === secret;
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const localeParam = new URL(request.url).searchParams.get("locale");
  const locale = localeParam && hasLocale(localeParam) ? localeParam : defaultLocale;

  try {
    const post = await generatePost(locale);
    return NextResponse.json({
      ok: true,
      post: {
        slug: post.slug,
        locale: post.locale,
        title: post.title,
        category: post.category,
        url: `/${post.locale}/blog/${post.slug}`,
      },
    });
  } catch (error) {
    console.error("generate-post error:", error);
    return NextResponse.json(
      { ok: false, error: "generation_failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return handle(request);
}

// GET allowed too so a Cloudflare cron / manual trigger can use either verb.
export async function GET(request: Request) {
  return handle(request);
}
