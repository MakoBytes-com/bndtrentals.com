"use client";

import { useState, useTransition } from "react";
import { updateLead } from "./actions";
import type { QuoteLeadStatus } from "@/lib/supabase/types";

const STATUSES: Array<{ value: QuoteLeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "spam", label: "Spam" },
];

export function LeadStatusForm({
  id,
  initialStatus,
  initialNotes,
}: {
  id: string;
  initialStatus: QuoteLeadStatus;
  initialNotes: string;
}) {
  const [status, setStatus] = useState<QuoteLeadStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateLead({ id, status, internalNotes: notes });
      if (result.ok) {
        setSavedAt(new Date());
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="text-[12px] font-bold uppercase tracking-widest text-muted">
        Status & notes
      </h3>

      <label className="mt-4 block">
        <span className="block text-[12px] font-semibold text-ink">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as QuoteLeadStatus)}
          className="mt-1 w-full rounded-lg border border-line bg-canvas-tint px-3 py-2 text-[14px] focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="block text-[12px] font-semibold text-ink">
          Internal notes
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Customer-invisible notes — quotes given, follow-ups, etc."
          className="mt-1 w-full rounded-lg border border-line bg-canvas-tint px-3 py-2 text-[14px] focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </label>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-accent/5 p-2.5 text-[13px] text-accent">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="mt-4 w-full rounded-full bg-ink px-4 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>

      {savedAt && (
        <p className="mt-2 text-center text-[12px] text-muted-soft">
          Saved at {savedAt.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
