"use client";

import { useState, useTransition } from "react";

import { ROLE_LABELS, STAFF_ROLES as ROLES, type StaffRole as StaffRoleName } from "@/lib/staff-roles";

import { removeStaffAction, saveStaffAction } from "./actions";

export function AddStaffForm() {
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
            setMsg({ ok: true, text: `已添加 ${email.trim()}` });
            setEmail("");
          } else {
            setMsg({ ok: false, text: res.error });
          }
        });
      }}
    >
      <input
        required
        aria-label="员工邮箱"
        className="h-9 w-72 max-w-full rounded-md border border-yellow-200 bg-white px-3 text-sm"
        placeholder="员工的登录邮箱"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <select
        aria-label="角色"
        className="h-9 rounded-md border border-yellow-200 bg-white px-2 text-sm"
        value={role}
        onChange={(e) => setRole(e.target.value as StaffRoleName)}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <button
        className="h-9 rounded-md bg-yellow-600 px-4 text-sm text-white hover:bg-yellow-700 disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "添加中…" : "添加员工"}
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
}: {
  email: string;
  role: StaffRoleName;
}) {
  const [role, setRole] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [pending, start] = useTransition();

  if (removed) return <span className="text-xs text-gray-400">已删除</span>;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <select
        aria-label={`${email} 的角色`}
        className="h-8 rounded-md border border-yellow-200 bg-white px-2 text-xs"
        disabled={pending}
        value={role}
        onChange={(e) => {
          const next = e.target.value as StaffRoleName;

          start(async () => {
            setError(null);
            const res = await saveStaffAction(email, next);

            if (res.ok) setRole(next);
            else setError(res.error);
          });
        }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <button
        className="h-8 rounded-md border border-red-300 px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
        disabled={pending}
        type="button"
        onClick={() => {
          if (!confirm(`删除员工 ${email}？`)) return;
          start(async () => {
            setError(null);
            const res = await removeStaffAction(email);

            if (res.ok) setRemoved(true);
            else setError(res.error);
          });
        }}
      >
        删除
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
