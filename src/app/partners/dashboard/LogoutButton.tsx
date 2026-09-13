"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/partners/logout", { method: "POST" });
    router.push("/partners/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
