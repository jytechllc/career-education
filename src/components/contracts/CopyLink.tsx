"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        className="rounded-lg border border-yellow-700 px-3 py-1 text-xs text-yellow-800 hover:bg-yellow-50"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setState("copied");
            setTimeout(() => setState("idle"), 2000);
          } catch {
            setState("failed");
          }
        }}
      >
        {state === "copied" ? "已复制，可粘贴到微信" : "复制链接（发微信）"}
      </button>
      {state === "failed" && (
        <input
          readOnly
          className="w-72 rounded border border-gray-300 px-2 py-1 text-xs"
          value={url}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
    </span>
  );
}
