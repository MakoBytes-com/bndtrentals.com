"use client";

import { useTransition } from "react";

export function AdminLogoutButton({ compact = false }: { compact?: boolean }) {
  const [isPending, start] = useTransition();

  function handleLogout() {
    start(async () => {
      await fetch("/admin/logout", { method: "POST" });
      window.location.href = "/admin/login";
    });
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className="text-[13px] font-semibold text-muted hover:text-accent disabled:opacity-50"
      >
        {isPending ? "Signing out…" : "Sign out"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="mt-3 w-full rounded-lg border border-white/10 bg-white/0 px-3 py-2 text-[13px] font-semibold text-white/85 hover:bg-white/10 disabled:opacity-50"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
