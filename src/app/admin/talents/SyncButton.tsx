"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";

import { syncTalentsAction } from "./actions";

export function SyncButton({
  t,
}: {
  t: { sync: string; syncing: string; synced: string; syncFailed: string };
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-yellow-300 bg-white px-3 text-sm text-yellow-800 hover:bg-yellow-50 disabled:opacity-50"
        disabled={pending}
        type="button"
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await syncTalentsAction();

            setMsg(
              res.ok
                ? {
                    ok: true,
                    text: t.synced
                      .replace("{downloaded}", String(res.result.downloaded))
                      .replace("{unchanged}", String(res.result.unchanged))
                      .replace("{removed}", String(res.result.removed)),
                  }
                : { ok: false, text: t.syncFailed },
            );
          })
        }
      >
        <RefreshCw aria-hidden className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? t.syncing : t.sync}
      </button>
      {msg ? (
        <span className={`text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span>
      ) : null}
    </div>
  );
}
