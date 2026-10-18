"use client";

import { useState, useTransition } from "react";

import { saveCategoryAction, saveRegionsAction } from "./actions";

export type RegionEditorText = {
  edit: string;
  save: string;
  saving: string;
  cancel: string;
  manual: string;
  errors: { empty: string; failed: string };
};

export function RegionEditor({
  origin,
  id,
  regions,
  manual,
  all,
  labels,
  t,
}: {
  origin: "recruiter" | "employer_inbox" | "employer_contact";
  id: string;
  regions: string[];
  manual: boolean;
  all: readonly string[];
  labels: Record<string, string>;
  t: RegionEditorText;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(regions);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        {regions.map((r) => (
          <span key={r} className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-900">
            {labels[r] ?? r}
          </span>
        ))}
        {manual && <span className="text-[10px] text-gray-400">{t.manual}</span>}
        <button
          className="text-xs text-yellow-800 underline"
          type="button"
          onClick={() => {
            setPicked(regions);
            setError(null);
            setOpen(true);
          }}
        >
          {t.edit}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-2">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {all.map((r) => (
          <label key={r} className="flex items-center gap-1 text-xs">
            <input
              checked={picked.includes(r)}
              type="checkbox"
              onChange={(e) => setPicked((p) => (e.target.checked ? [...p, r] : p.filter((x) => x !== r)))}
            />
            {labels[r] ?? r}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          className="rounded bg-yellow-700 px-2 py-0.5 text-xs text-white disabled:opacity-50"
          disabled={pending}
          type="button"
          onClick={() =>
            start(async () => {
              const res = await saveRegionsAction(origin, id, picked);
              if (res.ok) setOpen(false);
              else setError(t.errors[res.error]);
            })
          }
        >
          {pending ? t.saving : t.save}
        </button>
        <button className="text-xs text-gray-500 underline" type="button" onClick={() => setOpen(false)}>
          {t.cancel}
        </button>
      </div>
    </div>
  );
}

/** 猎头 ↔ 企业人力资源 for contacts on the recruiter list. */
export function CategoryPicker({
  id,
  value,
  labels,
}: {
  id: string;
  value: "headhunter" | "hr";
  labels: { headhunter: string; hr: string };
}) {
  const [cur, setCur] = useState(value);
  const [pending, start] = useTransition();

  return (
    <select
      className="rounded border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-600 disabled:opacity-50"
      disabled={pending}
      value={cur}
      onChange={(e) => {
        const next = e.target.value as "headhunter" | "hr";
        const prev = cur;
        setCur(next);
        start(async () => {
          const res = await saveCategoryAction(id, next);
          if (!res.ok) setCur(prev);
        });
      }}
    >
      <option value="headhunter">{labels.headhunter}</option>
      <option value="hr">{labels.hr}</option>
    </select>
  );
}
