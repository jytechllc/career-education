// Cloudflare scheduled worker for career-education background jobs.
// Calls Next.js API routes with a bearer secret on a schedule.

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

// Map each cron expression to the job it triggers.
type Job = { kind: "generate-post"; locale: string } | { kind: "purge-trash" };

const CRON_JOB: Record<string, Job> = {
  "0 1 * * *": { kind: "generate-post", locale: "zh" }, // daily Chinese post
  "0 2 * * 1": { kind: "generate-post", locale: "en" }, // weekly English post
  "0 3 * * *": { kind: "purge-trash" }, // daily: permanently delete trash older than 30 days
};

async function callRoute(env: Env, path: string): Promise<void> {
  const base = env.APP_BASE_URL.replace(/\/+$/, "");
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.CRON_SECRET}`,
      "user-agent": "cloudflare-cron/career-education",
    },
    body: "{}",
  });
  const text = await res.text();
  console.log(`${path} -> ${res.status} ${text.slice(0, 200)}`);
}

async function runJob(env: Env, job: Job): Promise<void> {
  if (job.kind === "generate-post") {
    await callRoute(env, `/api/cron/generate-post?locale=${encodeURIComponent(job.locale)}`);
  } else {
    await callRoute(env, `/api/cron/purge-trash`);
  }
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const job = CRON_JOB[controller.cron] ?? { kind: "generate-post", locale: "zh" };
    ctx.waitUntil(
      runJob(env, job).catch((err) =>
        console.error(`cron job error (${controller.cron}):`, err),
      ),
    );
  },

  // Allow manual triggering during dev: GET /?job=purge-trash or ?locale=zh
  async fetch(request: Request, env: Env): Promise<Response> {
    const params = new URL(request.url).searchParams;
    const jobParam = params.get("job");
    const job: Job =
      jobParam === "purge-trash"
        ? { kind: "purge-trash" }
        : { kind: "generate-post", locale: params.get("locale") ?? "zh" };
    await runJob(env, job);
    return new Response(`triggered ${JSON.stringify(job)}\n`);
  },
};
