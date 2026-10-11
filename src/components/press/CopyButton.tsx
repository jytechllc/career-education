"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        } catch {
          /* text stays selectable */
        }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-yellow-400 hover:text-yellow-700"
    >
      {ok ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {ok ? done : label}
    </button>
  );
}
