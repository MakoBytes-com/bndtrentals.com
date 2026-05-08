"use client";

import { useState, useTransition } from "react";
import { updateSection } from "../actions";
import type { PageSection } from "@/lib/supabase/types";

export function SectionEditForm({ initial }: { initial: PageSection }) {
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body_html);
  const [published, setPublished] = useState(initial.is_published);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateSection({
        id: initial.id,
        title,
        body_html: body,
        is_published: published,
      });
      if (result.ok) setSavedAt(new Date());
      else setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[14.5px] text-ink focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <div className="mt-8 space-y-6">
      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Title
        </legend>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Body
        </legend>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={16}
          className={`${inputClass} resize-y font-mono text-[13.5px]`}
        />
        <p className="mt-2 text-[12px] text-muted-soft">
          Editing the body bumps the version number on save (currently v
          {initial.version}). Public pages render this verbatim — sanitize
          any pasted-in HTML before saving.
        </p>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Visibility
        </legend>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="size-5 accent-[var(--color-brand)]"
          />
          <span className="text-[14.5px] font-semibold text-ink">Published</span>
        </label>
      </fieldset>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-lg">
        <div className="min-w-0 text-[13px] text-muted">
          {error ? (
            <span role="alert" className="font-semibold text-accent">
              {error}
            </span>
          ) : savedAt ? (
            <>Saved at {savedAt.toLocaleTimeString()}.</>
          ) : (
            <>Edits write to the live database immediately on save.</>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
