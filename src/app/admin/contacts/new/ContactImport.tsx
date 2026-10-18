"use client";

import { useState, useTransition } from "react";

import type { ImportRow } from "@/lib/contact-import";

import { importContactsAction, previewImportAction } from "../actions";

export type ImportText = {
  single: string;
  bulk: string;
  type: string;
  types: { headhunter: string; inhouse: string };
  fields: Record<"email" | "name" | "title" | "company" | "phone" | "wechat" | "linkedin" | "notes", string>;
  regions: string;
  regionLabels: Record<string, string>;
  add: string;
  file: string;
  paste: string;
  pastePlaceholder: string;
  columns: string;
  preview: string;
  previewing: string;
  importN: (n: number) => string;
  importing: string;
  invalidN: (n: number) => string;
  result: (added: number, updated: number, failed: number) => string;
  errors: Record<"auth" | "empty" | "parse" | "failed", string>;
};

const input = "w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm";

export function ContactImport({ t, regionKeys }: { t: ImportText; regionKeys: readonly string[] }) {
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [type, setType] = useState<"headhunter" | "inhouse">("headhunter");
  const [regions, setRegions] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const done = (res: Awaited<ReturnType<typeof importContactsAction>>) => {
    if (res.ok) {
      setMsg({ ok: true, text: t.result(res.result.added, res.result.updated, res.result.failed.length) });
      setRows(null);
    } else setMsg({ ok: false, text: t.errors[res.error] });
  };

  const typePicker = (
    <label className="flex items-center gap-2 text-sm">
      {t.type}
      <select className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
        <option value="headhunter">{t.types.headhunter}</option>
        <option value="inhouse">{t.types.inhouse}</option>
      </select>
    </label>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["single", "bulk"] as const).map((k) => (
          <button
            key={k}
            className={`rounded-full px-3 py-1 text-sm ${tab === k ? "bg-yellow-700 text-white" : "bg-white text-yellow-900"}`}
            type="button"
            onClick={() => {
              setTab(k);
              setMsg(null);
            }}
          >
            {t[k]}
          </button>
        ))}
      </div>

      {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}

      {tab === "single" ? (
        <form
          className="flex max-w-xl flex-col gap-3 rounded-lg bg-white p-4 shadow"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const v = (k: string) => String(f.get(k) ?? "").trim() || null;
            const row: ImportRow = {
              type,
              email: (v("email") ?? "").toLowerCase(),
              name: v("name"),
              title: v("title"),
              company: v("company"),
              phone: v("phone"),
              wechat: v("wechat"),
              linkedin: v("linkedin"),
              regions,
              notes: v("notes"),
              problems: [],
            };
            const form = e.currentTarget;
            start(async () => {
              const res = await importContactsAction([row]);
              done(res);
              if (res.ok) {
                form.reset();
                setRegions([]);
              }
            });
          }}
        >
          {typePicker}
          <div className="grid gap-3 sm:grid-cols-2">
            {(["email", "name", "title", "company", "phone", "wechat", "linkedin"] as const).map((k) => (
              <label key={k} className="flex flex-col gap-1 text-sm">
                {t.fields[k]}
                <input className={input} name={k} required={k === "email"} type={k === "email" ? "email" : "text"} />
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-1 text-sm">
            {t.regions}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {regionKeys.map((r) => (
                <label key={r} className="flex items-center gap-1 text-xs">
                  <input
                    checked={regions.includes(r)}
                    type="checkbox"
                    onChange={(e) => setRegions((p) => (e.target.checked ? [...p, r] : p.filter((x) => x !== r)))}
                  />
                  {t.regionLabels[r]}
                </label>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            {t.fields.notes}
            <textarea className={`${input} min-h-20`} name="notes" />
          </label>
          <button className="self-start rounded bg-yellow-700 px-4 py-1.5 text-sm text-white disabled:opacity-50" disabled={pending} type="submit">
            {pending ? t.importing : t.add}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <form
            className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              f.set("type", type);
              setMsg(null);
              start(async () => {
                const res = await previewImportAction(f);
                if (res.ok) setRows(res.rows);
                else {
                  setRows(null);
                  setMsg({ ok: false, text: t.errors[res.error] });
                }
              });
            }}
          >
            {typePicker}
            <p className="text-xs text-gray-500">{t.columns}</p>
            <label className="flex flex-col gap-1 text-sm">
              {t.file}
              <input accept=".xlsx,.csv,.tsv,.txt" className="text-sm" name="file" type="file" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t.paste}
              <textarea className={`${input} min-h-28 font-mono text-xs`} name="text" placeholder={t.pastePlaceholder} />
            </label>
            <button className="self-start rounded bg-yellow-700 px-4 py-1.5 text-sm text-white disabled:opacity-50" disabled={pending} type="submit">
              {pending && !rows ? t.previewing : t.preview}
            </button>
          </form>

          {rows && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="rounded bg-yellow-700 px-4 py-1.5 text-sm text-white disabled:opacity-50"
                  disabled={pending || !rows.some((r) => !r.problems.length)}
                  type="button"
                  onClick={() => start(async () => done(await importContactsAction(rows)))}
                >
                  {pending ? t.importing : t.importN(rows.filter((r) => !r.problems.length).length)}
                </button>
                {rows.some((r) => r.problems.length) && (
                  <span className="text-xs text-red-700">{t.invalidN(rows.filter((r) => r.problems.length).length)}</span>
                )}
              </div>
              <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-xs">
                  <thead className="bg-yellow-100/60 text-left text-yellow-900">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">{t.type}</th>
                      <th className="px-3 py-2">{t.fields.email}</th>
                      <th className="px-3 py-2">{t.fields.name}</th>
                      <th className="px-3 py-2">{t.fields.company}</th>
                      <th className="px-3 py-2">{t.regions}</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={`border-t border-gray-100 ${r.problems.length ? "bg-red-50" : ""}`}>
                        <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-1.5">{t.types[r.type]}</td>
                        <td className="px-3 py-1.5">{r.email}</td>
                        <td className="px-3 py-1.5">{r.name}</td>
                        <td className="px-3 py-1.5">{r.company}</td>
                        <td className="px-3 py-1.5">{r.regions.map((x) => t.regionLabels[x]).join("、")}</td>
                        <td className="px-3 py-1.5 text-red-700">{r.problems.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
