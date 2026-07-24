"use client";

// Per-row delete for the customers list (two-step confirm). The full edit
// page keeps its own danger-zone delete; this is the quick path.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomer } from "./actions";

export function CustomerRowActions({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCustomer(customerId);
      if (result.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        setError(result.error ?? "Delete failed.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {confirming ? (
        <>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-full bg-rose-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-muted hover:bg-canvas-tint"
          >
            Keep
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending}
          className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
        >
          Delete
        </button>
      )}
      {error && (
        <p role="alert" className="w-full text-right text-[11.5px] font-semibold text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
