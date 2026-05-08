"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSection } from "../actions";

export function NewSectionForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      slug: String(fd.get("slug") ?? "").trim(),
      title: String(fd.get("title") ?? "").trim(),
      body_html: String(fd.get("body_html") ?? ""),
      is_published: fd.get("is_published") === "on",
    };
    startTransition(async () => {
      const result = await createSection(payload);
      if (result.ok) {
        router.replace(`/admin/content/${result.id}`);
        router.refresh();
        return;
      }
      setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-muted-soft/70 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Identity
        </legend>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Slug *
            </span>
            <input
              type="text"
              name="slug"
              required
              pattern="[a-z0-9][a-z0-9-]*"
              className={`${inputClass} mt-1.5 font-mono`}
              placeholder="about-mission"
            />
            <span className="mt-1 block text-[12px] text-muted-soft">
              Lowercase letters, numbers, dashes. Used as the lookup key —
              cannot be changed after creation.
            </span>
          </label>
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Title *
            </span>
            <input
              type="text"
              name="title"
              required
              className={`${inputClass} mt-1.5`}
              placeholder="Our mission"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Body
        </legend>
        <label className="block">
          <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
            Plain text or HTML
          </span>
          <textarea
            name="body_html"
            rows={12}
            className={`${inputClass} mt-1.5 resize-y font-mono text-[13.5px]`}
            placeholder="<p>Burton NDT delivers calibrated industrial inspection equipment…</p>"
          />
          <span className="mt-1 block text-[12px] text-muted-soft">
            Accepts HTML. Plain text will be rendered as a single paragraph
            on the public site (Phase 3-D-2 wires consumption).
          </span>
        </label>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Visibility
        </legend>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked
            className="size-5 accent-[var(--color-brand)]"
          />
          <span className="text-[14.5px] font-semibold text-ink">
            Published on creation
          </span>
        </label>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-[13.5px] text-accent">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create section"}
        </button>
      </div>
    </form>
  );
}
