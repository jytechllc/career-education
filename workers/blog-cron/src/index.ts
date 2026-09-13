// Cloudflare scheduled worker: triggers the career-education blog generator.
// It calls the Next.js API route /api/cron/generate-post with a bearer secret.

interface Env {
  APP_BASE_URL: string; // e.g. https://career.jytech.us
  CRON_SECRET: string; // must match the Next.js CRON_SECRET
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

// Map each cron expression to the locale it generates.
const CRON_LOCALE: Record<string, string> = {
  "0 1 * * *": "zh", // daily Chinese post
  "0 2 * * 1": "en", // weekly English post
};

async function generate(env: Env, locale: string): Promise<void> {
  const base = env.APP_BASE_URL.replace(/\/+$/, "");
  const url = `${base}/api/cron/generate-post?locale=${encodeURIComponent(locale)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.CRON_SECRET}`,
      "user-agent": "cloudflare-cron/career-blog",
    },
    body: "{}",
  });
  const text = await res.text();
  console.log(`generate-post[${locale}] -> ${res.status} ${text.slice(0, 200)}`);
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const locale = CRON_LOCALE[controller.cron] ?? "zh";
    ctx.waitUntil(
      generate(env, locale).catch((err) =>
        console.error("blog-cron error:", err),
      ),
    );
  },

  // Allow manual triggering during dev: GET /?locale=zh
  async fetch(request: Request, env: Env): Promise<Response> {
    const locale = new URL(request.url).searchParams.get("locale") ?? "zh";
    await generate(env, locale);
    return new Response(`triggered generate-post[${locale}]\n`);
  },
};
