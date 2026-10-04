"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";

import { restoreApplicationAction, trashApplicationAction } from "./actions";

export function TrashButton({
  id,
  label,
  confirmText,
}: {
  id: number;
  label: string;
  confirmText: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
      disabled={pending}
      type="button"
      onClick={() => {
        if (!confirm(confirmText)) return;
        start(async () => {
          await trashApplicationAction(id);
          router.refresh();
        });
      }}
    >
      <Trash2 aria-hidden className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function RestoreButton({
  id,
  label,
  note,
}: {
  id: number;
  label: string;
  note: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500">{note}</span>
      <button
        className="flex items-center gap-1 text-xs text-yellow-800 hover:text-yellow-950 disabled:opacity-50"
        disabled={pending}
        type="button"
        onClick={() =>
          start(async () => {
            await restoreApplicationAction(id);
            router.refresh();
          })
        }
      >
        <RotateCcw aria-hidden className="h-3.5 w-3.5" />
        {label}
      </button>
    </div>
  );
}
