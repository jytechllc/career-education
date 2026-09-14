"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RotateCcw } from "lucide-react";

export function TrashButton({ applicationId }: { applicationId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault(); // don't toggle the parent <details>
    e.stopPropagation();
    if (!confirm("Move this application to trash? It will be permanently deleted after 30 days.")) {
      return;
    }
    setBusy(true);
    await fetch(`/api/partners/applications/${applicationId}/trash`, { method: "POST" });
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50 transition"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Move to Trash
    </button>
  );
}

export function RestoreButton({
  applicationId,
  daysRemaining,
}: {
  applicationId: number;
  daysRemaining: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    await fetch(`/api/partners/applications/${applicationId}/restore`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400">
        Permanently deleted in {daysRemaining} day{daysRemaining === 1 ? "" : "s"}
      </span>
      <button
        onClick={handleClick}
        disabled={busy}
        className="flex items-center gap-1 text-xs text-yellow-700 hover:text-yellow-900 disabled:opacity-50 transition"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Restore
      </button>
    </div>
  );
}
