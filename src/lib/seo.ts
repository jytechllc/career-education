/** Shared metadata helpers for edu.jytech.us. */
import { pressUrl } from "@/lib/press";

/** Site-wide Open Graph image (the brand film cover in the press kit). */
export const DEFAULT_OG_IMAGE = { url: pressUrl("jycareer-brand-film-16x9.jpg"), width: 720, height: 406 };

/**
 * Returns alternates metadata (self-referencing canonical + zh/en hreflang)
 * for a locale page. `path` should start with "/" (e.g. "/blog").
 */
export function pageMeta(locale: string, path: string) {
  return {
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        "zh-CN": `/zh${path}`,
        en: `/en${path}`,
        "x-default": `/zh${path}`,
      },
    },
  } as const;
}

/**
 * Reports that only exist in Chinese render the same zh content at /en/…,
 * so both locales point their canonical at the zh URL (and the sitemap skips /en).
 */
export const ZH_ONLY_PATHS = [
  "/accounting-phd-plan",
  "/accounting-us-plan",
  "/china-us-study-market",
  "/performing-arts-funding",
];

export function zhOnlyMeta(path: string) {
  return { alternates: { canonical: `/zh${path}` } } as const;
}
