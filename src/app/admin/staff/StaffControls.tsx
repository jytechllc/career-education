"use client";

import { useState, useTransition } from "react";

import { STAFF_ROLES as ROLES, type StaffRole as StaffRoleName } from "@/lib/staff-roles";

/** Strings from the admin dictionary (staffControls), passed down by the page. */
export type StaffControlsText = {
  emailLabel: string;
  emailPlaceholder: string;
  roleLabel: string;
  add: string;
  adding: string;
  added: string;
  remove: string;
  removed: string;
  confirmRemove: string;
  roleOf: string;
  errors: Record<"invalidEmail" | "unknownRole" | "pinned" | "self" | "failed", string>;
};
type RoleText = Record<StaffRoleName, string>;

const fill = (s: string, email: string) => s.replace("{email}", email);

import { removeStaffAction, saveStaffAction } from "./actions";

export function AddStaffForm({ t, roles }: { t: StaffControlsText; roles: RoleText }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRoleName>("supervisor");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveStaffAction(email, role);

          if (res.ok) {
            setMsg({ ok: true, text: fill(t.added, email.trim()) });
            setEmail("");
          } else {
            setMsg({ ok: false, text: t.errors[res.error] });
          }
        });
      }}
    >
      <input
        required
        aria-label={t.emailLabel}
        className="h-9 w-72 max-w-full rounded-md border border-yellow-200 bg-white px-3 text-sm"
        placeholder={t.emailPlaceholder}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <select
        aria-label={t.roleLabel}
        className="h-9 rounded-md border border-yellow-200 bg-white px-2 text-sm"
        value={role}
        onChange={(e) => setRole(e.target.value as StaffRoleName)}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {roles[r]}
          </option>
        ))}
      </select>
      <button
        className="h-9 rounded-md bg-yellow-600 px-4 text-sm text-white hover:bg-yellow-700 disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? t.adding : t.add}
      </button>
      {msg ? (
        <span className={`text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}>
          {msg.text}
        </span>
      ) : null}
    </form>
  );
}

export function StaffRowControls({
  email,
  role: initial,
  t,
  roles,
}: {
  email: string;
  role: StaffRoleName;
  t: StaffControlsText;
  roles: RoleText;
}) {
  const [role, setRole] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [pending, start] = useTransition();

  if (removed) return <span className="text-xs text-gray-400">{t.removed}</span>;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <select
        aria-label={fill(t.roleOf, email)}
        className="h-8 rounded-md border border-yellow-200 bg-white px-2 text-xs"
        disabled={pending}
        value={role}
        onChange={(e) => {
          const next = e.target.value as StaffRoleName;

          start(async () => {
            setError(null);
            const res = await saveStaffAction(email, next);

            if (res.ok) setRole(next);
            else setError(t.errors[res.error]);
          });
        }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {roles[r]}
          </option>
        ))}
      </select>
      <button
        className="h-8 rounded-md border border-red-300 px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
        disabled={pending}
        type="button"
        onClick={() => {
          if (!confirm(fill(t.confirmRemove, email))) return;
          start(async () => {
            setError(null);
            const res = await removeStaffAction(email);

            if (res.ok) setRemoved(true);
            else setError(t.errors[res.error]);
          });
        }}
      >
        {t.remove}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
