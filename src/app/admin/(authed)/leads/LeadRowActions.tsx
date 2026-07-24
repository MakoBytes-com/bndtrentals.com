"use client";

// Quick actions on each inbox row: flag/unflag spam and delete (two-step
// confirm). Server actions revalidate; router.refresh() repaints the list.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLeadSpam, deleteLead } from "./[id]/actions";

export function LeadRowActions({
  leadId,
  status,
  canDelete,
}: {
  leadId: string;
  status: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSpam = status === "spam";

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => run(() => setLeadSpam(leadId, !isSpam))}
        disabled={pending}
        className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-muted hover:bg-canvas-tint hover:text-ink disabled:opacity-60"
      >
        {isSpam ? "Not spam" : "Spam"}
      </button>
      {canDelete &&
        (confirming ? (
          <>
            <button
              type="button"
              onClick={() => run(() => deleteLead(leadId))}
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
        ))}
      {error && (
        <p role="alert" className="w-full text-right text-[11.5px] font-semibold text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
