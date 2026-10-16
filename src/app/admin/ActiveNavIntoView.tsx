"use client";

import { useEffect } from "react";

/**
 * The small-screen admin menu scrolls sideways; bring the current page's
 * link into view so people can see where they are.
 */
export function ActiveNavIntoView({ navId }: { navId: string }) {
  useEffect(() => {
    document
      .querySelector(`#${navId} [aria-current="page"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [navId]);

  return null;
}
