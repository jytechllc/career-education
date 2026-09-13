# career-education

杰圆职场教育 / JY Career — Next.js 16 marketing site for jytech.

Migrated from a Vite SPA to match the jytech monorepo conventions:
Next.js 16 + React 19 + Tailwind 4 + Auth0 v4 (`@auth0/nextjs-auth0`).

## Setup

```bash
cp .env.example .env.local
# fill in AUTH0_*, XAI_API_KEY, REVO_API_KEY
npm install
npm run dev
```

## Auth0

Uses the same `@auth0/nextjs-auth0` v4 pattern as `easy-site`:

- `src/lib/auth0.ts` — `Auth0Client` instance.
- `src/proxy.ts` — middleware. Exposes the SDK-managed routes:
  - `/auth/login`
  - `/auth/logout`
  - `/auth/callback`
  - `/auth/profile`

Set in your Auth0 application:

- Allowed Callback URLs: `http://localhost:3000/auth/callback`, plus prod URL
- Allowed Logout URLs: `http://localhost:3000`, plus prod URL

## i18n

URL-based locale routing under `src/app/[locale]`. Supported locales: `zh`
(default), `en`. Add a locale by adding it to `src/lib/i18n.ts` and dropping
`<locale>.json` in `src/lib/dictionaries/`.

## Database

Neon Postgres + Drizzle ORM (matches `easy-site`).

Set `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (for migrations) in
`.env.local`, then push the schema:

```bash
npm run db:push        # apply schema (use during dev)
npm run db:generate    # generate SQL migrations
npm run db:studio      # open Drizzle Studio
```

Schema lives in [src/lib/schema.ts](src/lib/schema.ts). The `candidates` table
stores per-user job-application info, keyed by `auth0_id`.

## Routes

- `/[locale]` — marketing home
- `/[locale]/cases` — case index
- `/[locale]/sydney-industry-report`
- `/[locale]/singapore-work-visa-guide`
- `/[locale]/profile` — **gated**, candidate profile form
- `/api/chat` — Grok-powered chatbot
- `/api/contact` — Brevo email form
