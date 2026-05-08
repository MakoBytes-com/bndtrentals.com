"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCategory, deleteCategory } from "../actions";
import type { CatalogCategory } from "@/lib/supabase/types";

export function CategoryEditForm({
  initial,
  productCount,
}: {
  initial: CatalogCategory;
  productCount: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    id: initial.id,
    name: initial.name,
    short: initial.short ?? "",
    tagline: initial.tagline ?? "",
    description: initial.description ?? "",
    sort_order: initial.sort_order,
    is_published: initial.is_published,
  });
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateCategory(form);
      if (result.ok) setSavedAt(new Date());
      else setError(result.error);
    });
  }

  function handleDelete() {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteCategory(initial.id);
      if (result.ok) {
        router.replace("/admin/catalog/categories");
        router.refresh();
        return;
      }
      setDeleteError(result.error);
      setDeleteConfirming(false);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[14.5px] text-ink focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <div className="mt-8 space-y-6">
      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Identity
        </legend>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Name
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`${inputClass} mt-1.5`}
            />
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
                maxLength={40}
              />
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
            Published — visible on the public catalog
          </span>
        </label>
      </fieldset>

      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-rose-700">
          Danger zone
        </h2>
        {productCount > 0 ? (
          <p className="mt-3 text-[14px] text-rose-900">
            This category has <strong>{productCount} product{productCount === 1 ? "" : "s"}</strong>.
            You can&apos;t delete it until you move or delete those products.
            Use the <strong>Published</strong> toggle above to hide the
            category from the public site without deleting it.
          </p>
        ) : (
          <>
            <p className="mt-3 text-[14px] text-rose-900">
              This category has no products. Deletion is permanent.
            </p>
            {!deleteConfirming ? (
              <button
                type="button"
                onClick={() => setDeleteConfirming(true)}
                className="mt-4 rounded-full border border-rose-300 bg-white px-5 py-2.5 text-[13.5px] font-bold text-rose-700 hover:bg-rose-100"
              >
                Delete this category
              </button>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-[13.5px] font-semibold text-rose-800">
                  Sure?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deletePending}
                  className="rounded-full bg-rose-600 px-5 py-2.5 text-[13.5px] font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {deletePending ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirming(false)}
                  className="rounded-full border border-line bg-white px-5 py-2.5 text-[13.5px] font-semibold text-muted hover:bg-canvas-tint"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
        {deleteError && (
          <p role="alert" className="mt-3 rounded-lg bg-white p-2.5 text-[13px] font-semibold text-rose-700 ring-1 ring-rose-200">
            {deleteError}
          </p>
        )}
      </section>

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
