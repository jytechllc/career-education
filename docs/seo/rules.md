# SEO rules for edu.jytech.us

The checklist the SEO agent (`.github/workflows/seo-agent.yml`) fixes against. The agent re-reads
Google Search Central each run and records new or changed guidance in the changelog at the bottom.
Rules marked **[audit]** are checked mechanically by `scripts/seo/audit.mjs`.

Last reviewed against Google Search Central: 2026-11-04

## Crawling and indexing
- robots.txt allows public pages and blocks /admin, /api, /auth, /sign, /partner. **[audit]**
- sitemap.xml lists every public page in both locales plus published blog posts, and every listed URL returns 200 without redirects. **[audit]**
- `lastmod` is the content's real modification time, not the build time; Google ignores lastmod that is always "now". **[audit]**
- No page in the sitemap carries `noindex`. **[audit]**
- Unlisted client reports and account pages stay out of the sitemap.

## Per-page metadata (Next.js `generateMetadata` / `metadata`)
- Every page has its own `<title>` and meta description; no two indexable pages share either. **[audit]**
- zh and en versions of a page are translations, so their titles differ too. **[audit]**
- The title carries the brand once (via the root `title.template`); don't repeat it in the page title. **[audit]**
- Titles stay under ~60 characters (~30 CJK characters); descriptions 50–160 characters (CJK ~25–80). **[audit]**
- Every indexable page sets a self-referencing canonical (`alternates.canonical`). Never set canonical in a layout: it is inherited by every child page. **[audit]**
- zh/en pairs declare each other with `alternates.languages` (hreflang), plus `x-default`. **[audit]**
- `<html lang>` matches the page locale (`zh-CN` / `en`). **[audit]**
- Open Graph title, description and image are set; a site-wide default image is acceptable. **[audit]**
- Exactly one `<h1>` per page. **[audit]**

## Structured data
- Home pages carry `Organization` / `EducationalOrganization` JSON-LD (name, url, logo, contactPoint). **[audit]**
- Blog posts carry `Article` (headline, datePublished, dateModified, author, image).
- FAQ rich results are limited to authoritative government and health sites, so don't add FAQPage for rich results.
- JSON-LD must be valid JSON and describe content visible on the page. **[audit]**

## Content quality
- No near-duplicate blog posts (e.g. `slug` and `slug-2` covering the same topic); keep one and redirect the other.
- AI-assisted content is fine when it is accurate and useful; scaled low-value content violates spam policy.
- Brand names: 杰圆职场教育 on Chinese pages, JYCareerEdu on English pages (decided 2026-11-04). The footer's
  DBA line (`usCompany`) lists registered names and stays as is.
- Don't change visible marketing copy without a human decision.

## Changelog
- 2026-11-04: initial checklist.
- 2026-11-04: brand names decided: 杰圆职场教育 / JYCareerEdu.
- 2026-11-04: Google confirmed spam policies now explicitly extend to "generative AI responses in Google Search" (May 2026 — https://developers.google.com/search/docs/essentials/spam-policies). Existing AI-content rule unchanged; no new action needed.
- 2026-11-04: Gen AI Content Guide updated with Search Quality Rater guidance (Oct 2026 — https://developers.google.com/search/docs/fundamentals/using-gen-ai-content). Reinforces existing rule; no rule change.
- 2026-11-04: New spam policy for "back-button hijacking" (Apr 2026 — https://developers.google.com/search/blog/2026/04/back-button-hijacking). Not directly applicable to this static site; no rule added.
