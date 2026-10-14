"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50" disabled={pending} type="submit">
      {pending ? "作废中…" : label}
    </button>
  );
}

export function VoidForm({
  action,
  contractId,
  number,
  signed,
  total,
}: {
  action: (form: FormData) => Promise<void>;
  contractId: number;
  number: string;
  signed: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="text-xs text-red-700 underline" type="button" onClick={() => setOpen(true)}>
        作废合同…
      </button>
    );
  }

  return (
    <form action={action} className="w-full rounded-lg border border-red-200 bg-red-50 p-3 flex flex-col gap-2">
      <input name="contractId" type="hidden" value={contractId} />
      <p className="text-sm text-red-800">
        确认作废 {number}？已有 {signed}/{total} 方签署。作废后任何一方都不能再签署，此操作不可撤销；记录会永久保留。
      </p>
      <input
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        name="reason"
        placeholder="作废原因（必填，会写进审计记录）"
        required
      />
      <div className="flex gap-3">
        <Submit label="确认作废" />
        <button className="text-sm text-gray-600 underline" type="button" onClick={() => setOpen(false)}>
          取消
        </button>
      </div>
    </form>
  );
}
