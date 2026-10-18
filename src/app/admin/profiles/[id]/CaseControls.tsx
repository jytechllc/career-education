"use client";

import { useState, useTransition } from "react";

import { updateCaseAction } from "../actions";

export type CaseText = {
  title: string;
  status: string;
  statuses: { new: string; active: string; closed: string };
  unset: string;
  owner: string;
  jyedu: string;
  poc: string;
  pocPlaceholder: string;
  save: string;
  saving: string;
  saved: string;
  failed: string;
};

export function CaseControls({
  id,
  status,
  ownerPartnerId,
  poc,
  partners,
  t,
}: {
  id: number;
  status: string | null;
  ownerPartnerId: number | null;
  poc: string | null;
  partners: { id: number; name: string }[];
  t: CaseText;
}) {
  const [s, setS] = useState(status ?? "");
  const [owner, setOwner] = useState(ownerPartnerId == null ? "jyedu" : String(ownerPartnerId));
  const [p, setP] = useState(poc ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const field = "rounded border border-gray-300 bg-white px-2 py-1.5 text-sm";

  return (
    <section className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow">
      <h2 className="font-semibold text-yellow-900">{t.title}</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          {t.status}
          <select className={field} value={s} onChange={(e) => setS(e.target.value)}>
            <option value="">{t.unset}</option>
            <option value="new">{t.statuses.new}</option>
            <option value="active">{t.statuses.active}</option>
            <option value="closed">{t.statuses.closed}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          {t.owner}
          <select className={field} value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="jyedu">{t.jyedu}</option>
            {partners.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          {t.poc}
          <input className={`${field} w-48`} placeholder={t.pocPlaceholder} value={p} onChange={(e) => setP(e.target.value)} />
        </label>
        <button
          className="rounded bg-yellow-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          disabled={pending}
          type="button"
          onClick={() =>
            start(async () => {
              const res = await updateCaseAction(id, s || null, owner === "jyedu" ? null : Number(owner), p || null);
              setMsg(res.ok ? t.saved : t.failed);
            })
          }
        >
          {pending ? t.saving : t.save}
        </button>
        {msg && <span className="text-xs text-gray-500">{msg}</span>}
      </div>
    </section>
  );
}
