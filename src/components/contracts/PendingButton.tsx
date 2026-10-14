"use client";

import { useFormStatus } from "react-dom";

export function PendingButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="text-xs text-yellow-800 underline disabled:opacity-50" disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}
