"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory } from "../actions";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function NewCategoryForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: "",
    name: "",
    short: "",
    tagline: "",
    description: "",
    sort_order: 0,
    is_published: true,
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCategory(form);
      if (result.ok) {
        router.replace(`/admin/catalog/categories/${result.id}`);
        router.refresh();
        return;
      }
      setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[14.5px] text-ink focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Identity
        </legend>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Name *
            </span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="Non-Destructive Testing"
            />
          </label>
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Slug * <span className="text-muted-soft normal-case font-normal">(URL segment)</span>
            </span>
            <input
              type="text"
              required
              pattern="[a-z0-9][a-z0-9-]*"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
              className={`${inputClass} mt-1.5 font-mono`}
              placeholder="ndt"
            />
            <span className="mt-1 block text-[12px] text-muted-soft">
              Auto-fills from the name; lowercase letters, numbers, dashes only.
              Cannot be changed after creation.
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
                Short label
              </span>
              <input
                type="text"
                value={form.short}
                onChange={(e) => setForm({ ...form, short: e.target.value })}
                className={`${inputClass} mt-1.5`}
                placeholder="NDT"
                maxLength={40}
              />
              <span className="mt-1 block text-[12px] text-muted-soft">
                Used in compact UI (sidebar, breadcrumbs).
              </span>
            </label>
            <label className="block">
              <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
                Sort order
              </span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                className={`${inputClass} mt-1.5`}
              />
              <span className="mt-1 block text-[12px] text-muted-soft">
                Lower numbers appear first.
              </span>
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Description
        </legend>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Tagline
            </span>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className={`${inputClass} mt-1.5`}
              placeholder="One-line summary for the catalog overview"
            />
          </label>
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Long description
            </span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className={`${inputClass} mt-1.5 resize-y`}
              placeholder="Customer-facing description shown on the category page."
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Visibility
        </legend>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
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

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={pending || !form.slug || !form.name}
          className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create category"}
        </button>
      </div>
    </form>
  );
}
