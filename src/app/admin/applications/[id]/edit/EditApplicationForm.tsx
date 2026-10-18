"use client";

import { useActionState } from "react";

import type { AppFieldKind } from "@/lib/application-fields";

import { updateApplicationAction } from "../../actions";

const input = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

export function EditApplicationForm({
  id,
  sections,
  t,
}: {
  id: number;
  sections: {
    title: string;
    fields: { key: string; label: string; kind: AppFieldKind; required: boolean; value: string }[];
  }[];
  t: { save: string; saving: string; saved: string; errors: Record<string, string> };
}) {
  const [state, action, pending] = useActionState(updateApplicationAction, { saved: false, error: null });

  return (
    <form action={action} className="flex flex-col gap-5">
      <input name="id" type="hidden" value={id} />
      {sections.map((s) => (
        <section key={s.title} className="bg-white rounded-lg shadow p-5">
          <h2 className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-3">{s.title}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {s.fields.map((f) => (
              <label key={f.key} className={`text-sm text-gray-600 ${f.kind === "long" ? "md:col-span-2" : ""}`}>
                {f.label}
                {f.required ? <span className="text-red-500"> *</span> : null}
                {f.kind === "long" ? (
                  <textarea
                    className={`${input} mt-1`}
                    defaultValue={f.value}
                    name={f.key}
                    rows={Math.min(8, Math.max(2, Math.ceil(f.value.length / 90)))}
                  />
                ) : (
                  <input
                    className={`${input} mt-1`}
                    defaultValue={f.value}
                    name={f.key}
                    required={f.required}
                    type={f.kind === "email" ? "email" : f.kind === "date" ? "date" : "text"}
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-0 -mx-4 sm:mx-0 flex items-center gap-3 bg-yellow-50/95 px-4 py-3 sm:rounded-lg border-t border-yellow-200">
        <button
          className="h-10 rounded-md bg-yellow-600 px-5 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? t.saving : t.save}
        </button>
        {!pending && state.error ? (
          <span className="text-xs text-red-600">{t.errors[state.error] ?? state.error}</span>
        ) : !pending && state.saved ? (
          <span className="text-xs text-green-700">{t.saved}</span>
        ) : null}
      </div>
    </form>
  );
}
