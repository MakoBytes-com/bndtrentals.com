"use client";

// Collapsible "file a ticket" panel. Submits through the server action which
// signs a tenant JWT and posts to the Mako master control plane.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitTicket } from "./actions";

const inputClass =
  "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-muted-soft/70 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

export function NewTicketForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("not_sure");
  const [priority, setPriority] = useState("normal");
  const [error, setError] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitTicket({
        title,
        description,
        category: category as "quick_change" | "feature" | "bug" | "not_sure",
        priority: priority as "low" | "normal" | "high",
      });
      if (result.ok) {
        setSentAt(new Date());
        setTitle("");
        setDescription("");
        setCategory("not_sure");
        setPriority("normal");
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-bold text-ink">Need something from Mako?</p>
            <p className="mt-0.5 text-[13px] text-muted">
              Site changes, fixes, new features — file it here.
            </p>
            {sentAt && (
              <p className="mt-1 text-[12.5px] font-semibold text-emerald-700">
                Ticket sent at {sentAt.toLocaleTimeString()} — it&apos;s in the queue below.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-brand px-6 py-3 text-[14.5px] font-bold text-white hover:bg-brand-dark"
          >
            + New ticket
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Title *
            </span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Update the Groves location hours"
              className={`${inputClass} mt-1.5`}
            />
          </label>

          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              What do you need? *
            </span>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Describe the change, problem, or idea. Links and examples help."
              className={`${inputClass} mt-1.5 resize-y`}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
                Type
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputClass} mt-1.5`}
              >
                <option value="quick_change">Quick change</option>
                <option value="feature">New feature</option>
                <option value="bug">Something&apos;s broken</option>
                <option value="not_sure">Not sure</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
                Priority
              </span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`${inputClass} mt-1.5`}
              >
                <option value="low">Low — whenever</option>
                <option value="normal">Normal</option>
                <option value="high">High — business is affected</option>
              </select>
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-[13.5px] text-accent"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-brand px-6 py-3 text-[14.5px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send ticket"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="rounded-full border border-line bg-white px-5 py-3 text-[14px] font-semibold text-muted hover:bg-canvas-tint"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
