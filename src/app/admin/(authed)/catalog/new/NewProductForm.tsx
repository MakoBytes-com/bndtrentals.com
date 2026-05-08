"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "./actions";

type Category = { id: string; name: string; short: string | null };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function NewProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    category_id: categories[0]?.id ?? "",
    slug: "",
    name: "",
    manufacturer: "",
    subcategory: "",
    description: "",
    image: "",
    is_published: true,
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      // Auto-fill slug from name as long as the user hasn't typed in the
      // slug field manually. This is the lightweight ergonomic that any
      // CMS form needs.
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createProduct(form);
      if (result.ok) {
        router.replace(`/admin/catalog/${result.id}`);
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
          Category
        </legend>
        <label className="block">
          <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
            Equipment category *
          </span>
          <select
            required
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            aria-label="Equipment category"
            className={`${inputClass} mt-1.5`}
          >
            {categories.length === 0 && <option value="">— none —</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

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
              placeholder="Olympus 38DL Plus"
            />
          </label>
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Slug * <span className="text-muted-soft normal-case font-normal">(URL path)</span>
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
              placeholder="olympus-38dl-plus"
            />
            <span className="mt-1 block text-[12px] text-muted-soft">
              Auto-fills from the name; lowercase letters, numbers, dashes only.
              Must be unique within the category.
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
                Manufacturer
              </span>
              <input
                type="text"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                className={`${inputClass} mt-1.5`}
                placeholder="Olympus"
              />
            </label>
            <label className="block">
              <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
                Subcategory (free text)
              </span>
              <input
                type="text"
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                className={`${inputClass} mt-1.5`}
                placeholder="Ultrasonic Thickness Gauge"
              />
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Optional first-pass content
        </legend>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={`${inputClass} mt-1.5 resize-y`}
              placeholder="Short customer-facing description."
            />
          </label>
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Image filename
            </span>
            <input
              type="text"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className={`${inputClass} mt-1.5`}
              placeholder="olympus-38DL.jpg"
            />
            <span className="mt-1 block text-[12px] text-muted-soft">
              Filename relative to <code className="font-mono">/public/images/</code>.
              You can fill this later from the edit screen.
            </span>
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
          disabled={pending || !form.category_id || !form.slug || !form.name}
          className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create product"}
        </button>
      </div>
    </form>
  );
}
