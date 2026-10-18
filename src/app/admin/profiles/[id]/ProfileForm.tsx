"use client";

import { useActionState } from "react";

import { updateProfileAction } from "../actions";

const input = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-amber-600/70";

export function ProfileForm({
  id,
  fields,
  contact,
  t,
}: {
  id: number;
  fields: { key: string; label: string; value: string; source: string | null; multiline: boolean }[];
  contact: { email: string; phone: string };
  t: {
    missing: string;
    contactTitle: string;
    email: string;
    phone: string;
    save: string;
    saving: string;
    saved: string;
  };
}) {
  const [state, action, pending] = useActionState(updateProfileAction, { saved: false, error: null });

  return (
    <form action={action} className="flex flex-col gap-4">
      <input name="id" type="hidden" value={id} />
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {fields.map((f) => (
          <label key={f.key} className="grid gap-2 p-4 md:grid-cols-[13rem_1fr] md:items-start">
            <span className="text-sm font-medium text-gray-700 md:pt-2">
              {f.label}
              {f.source ? (
                <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-normal text-yellow-800">
                  {f.source}
                </span>
              ) : null}
            </span>
            {f.multiline ? (
              <textarea
                className={input}
                defaultValue={f.value}
                name={f.key}
                placeholder={t.missing}
                rows={Math.min(6, Math.max(2, f.value.split("\n").length))}
              />
            ) : (
              <input
                className={input}
                defaultValue={f.value}
                inputMode={f.key === "age" ? "numeric" : undefined}
                name={f.key}
                placeholder={t.missing}
              />
            )}
          </label>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-700">{t.contactTitle}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-600">
            {t.email}
            <input className={`${input} mt-1`} defaultValue={contact.email} name="email" type="email" />
          </label>
          <label className="text-sm text-gray-600">
            {t.phone}
            <input className={`${input} mt-1`} defaultValue={contact.phone} name="phone" />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="h-10 rounded-md bg-yellow-600 px-5 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? t.saving : t.save}
        </button>
        {state.saved && !pending ? <span className="text-xs text-green-700">{t.saved}</span> : null}
      </div>
    </form>
  );
}
