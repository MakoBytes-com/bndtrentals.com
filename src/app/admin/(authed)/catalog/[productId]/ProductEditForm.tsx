"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  updateProduct,
  uploadProductPdf,
  removeProductPdf,
  uploadProductPhotos,
  deleteProductPhoto,
  setProductCoverPhoto,
  deleteProduct,
} from "./actions";
import type { CatalogProductImage } from "@/lib/supabase/types";

// Resolve a stored image value to a renderable src: uploaded images are stored
// as "uploads/..." (served via the /images rewrite); legacy values are bare
// filenames under /public/images/.
function imageSrc(image: string): string | null {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `/images/${image}`;
}

type Initial = {
  id: string;
  name: string;
  manufacturer: string;
  subcategory: string;
  description: string;
  applications: string[];
  image: string;
  pdf: string;
  sort_order: number;
  is_published: boolean;
};

export function ProductEditForm({
  initial,
  categoryName: _categoryName,
  initialPhotos,
}: {
  initial: Initial;
  categoryName: string | null;
  initialPhotos: CatalogProductImage[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<Initial>(initial);
  const [photos, setPhotos] = useState<CatalogProductImage[]>(initialPhotos);
  const [applicationsText, setApplicationsText] = useState(
    initial.applications.join("\n"),
  );
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function handleDelete() {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteProduct(form.id);
      if (result.ok) {
        router.replace("/admin/catalog");
        router.refresh();
        return;
      }
      setDeleteError(result.error);
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const apps = applicationsText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const result = await updateProduct({
        id: form.id,
        name: form.name,
        manufacturer: form.manufacturer,
        subcategory: form.subcategory,
        description: form.description,
        applications: apps,
        image: form.image,
        pdf: form.pdf,
        sort_order: form.sort_order,
        is_published: form.is_published,
      });
      if (result.ok) setSavedAt(new Date());
      else setError(result.error);
    });
  }

  const [photoBusyId, setPhotoBusyId] = useState<string | null>(null);
  const [photoConfirmId, setPhotoConfirmId] = useState<string | null>(null);
  const [removingPdf, setRemovingPdf] = useState(false);

  async function handlePhotosUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null);
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      for (const file of files) fd.append("files", file);
      fd.set("productId", form.id);
      const result = await uploadProductPhotos(fd);
      if (result.ok) {
        setPhotos((p) => [...p, ...result.images]);
        setForm((f) => ({ ...f, image: result.cover ?? f.image }));
      } else {
        setImageError(result.error);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  async function handleDeletePhoto(imageId: string) {
    setImageError(null);
    setPhotoConfirmId(null);
    setPhotoBusyId(imageId);
    try {
      const result = await deleteProductPhoto(imageId);
      if (result.ok) {
        setPhotos((p) => p.filter((x) => x.id !== imageId));
        setForm((f) => ({ ...f, image: result.cover ?? "" }));
      } else {
        setImageError(result.error);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setPhotoBusyId(null);
    }
  }

  async function handleMakeCover(imageId: string) {
    setImageError(null);
    setPhotoBusyId(imageId);
    try {
      const result = await setProductCoverPhoto(imageId);
      if (result.ok) {
        setForm((f) => ({ ...f, image: result.cover }));
      } else {
        setImageError(result.error);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Couldn't set cover.");
    } finally {
      setPhotoBusyId(null);
    }
  }

  async function handleRemovePdf() {
    setUploadError(null);
    setRemovingPdf(true);
    try {
      const result = await removeProductPdf(form.id);
      if (result.ok) {
        setForm((f) => ({ ...f, pdf: "" }));
      } else {
        setUploadError(result.error);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Remove failed.");
    } finally {
      setRemovingPdf(false);
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("productId", form.id);
      const result = await uploadProductPdf(fd);
      if (result.ok) {
        setForm((f) => ({ ...f, pdf: result.filename }));
      } else {
        setUploadError(result.error);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-muted-soft/70 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Basic info
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name *">
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Manufacturer">
            <input
              type="text"
              value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              className={inputClass}
              placeholder="Olympus, Eddyfi, …"
            />
          </Field>
          <Field label="Subcategory (free text)">
            <input
              type="text"
              value={form.subcategory}
              onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
              className={inputClass}
              placeholder="Ultrasonic Thickness Gauge"
            />
          </Field>
          <Field label="Sort order">
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number(e.target.value) || 0 })
              }
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Description" className="mt-4">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="Customer-facing description shown on the product detail page."
          />
        </Field>

        <Field label="Applications (one per line)" className="mt-4">
          <textarea
            value={applicationsText}
            onChange={(e) => setApplicationsText(e.target.value)}
            rows={5}
            className={`${inputClass} resize-y font-mono text-[13.5px]`}
            placeholder={"Pipe wall thickness\nCorrosion mapping\nWeld inspection"}
          />
          <p className="mt-1 text-[12px] text-muted-soft">
            Each line becomes a bullet on the product page.
          </p>
        </Field>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Photos
        </h2>
        <p className="mt-2 text-[12.5px] text-muted">
          The <strong>cover</strong> photo shows in the catalog list, cart, and
          search results. Every photo shows in the gallery on the product page.
        </p>

        {photos.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-canvas-tint p-5 text-center text-[13px] text-muted">
            No photos yet — add some below.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => {
              const isCover = photo.path === form.image;
              const busy = photoBusyId === photo.id;
              return (
                <li
                  key={photo.id}
                  className={`rounded-xl border p-2 ${isCover ? "border-brand ring-2 ring-brand/25" : "border-line"}`}
                >
                  <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-lg bg-canvas-tint">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc(photo.path) ?? ""}
                      alt=""
                      className="size-full object-contain"
                    />
                    {isCover && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white">
                        Cover
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleMakeCover(photo.id)}
                        disabled={busy}
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-ink hover:bg-canvas-tint disabled:opacity-60"
                      >
                        {busy ? "…" : "Make cover"}
                      </button>
                    )}
                    {photoConfirmId === photo.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          disabled={busy}
                          className="rounded-full bg-rose-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          {busy ? "Deleting…" : "Yes, delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoConfirmId(null)}
                          className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-muted hover:bg-canvas-tint"
                        >
                          Keep
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPhotoConfirmId(photo.id)}
                        disabled={busy}
                        className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4">
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-bold text-white ${
              uploadingImage ? "bg-brand/60" : "bg-brand hover:bg-brand-dark"
            }`}
          >
            {uploadingImage ? "Uploading…" : "Add photos"}
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handlePhotosUpload}
              disabled={uploadingImage}
              className="hidden"
            />
          </label>
          <p className="mt-2 text-[12px] text-muted-soft">
            JPEG, PNG, WebP, or AVIF · max 10 MB each · pick several at once.
            New photos go live immediately.
          </p>
          {imageError && (
            <p role="alert" className="mt-2 text-[12.5px] font-semibold text-accent">
              {imageError}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Spec sheet (PDF)
        </h2>

        {form.pdf ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas-tint p-4">
            <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink">
              {form.pdf}
            </span>
            <a
              href={form.pdf.startsWith("http") ? form.pdf : `/pdfs/${form.pdf}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink hover:bg-canvas-tint"
            >
              View
            </a>
            <button
              type="button"
              onClick={handleRemovePdf}
              disabled={removingPdf}
              className="rounded-full border border-rose-200 bg-white px-4 py-2 text-[13px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              {removingPdf ? "Removing…" : "Remove"}
            </button>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-canvas-tint p-4 text-[13px] text-muted">
            No spec sheet attached.
          </p>
        )}

        <div className="mt-4 rounded-xl border border-dashed border-line bg-canvas-tint p-5">
          <p className="text-[13px] font-semibold text-ink">
            {form.pdf ? "Replace the spec sheet" : "Upload a spec sheet"}
          </p>
          <p className="mt-1 text-[12.5px] text-muted">
            PDF only, max 20 MB. Uploading replaces the current one and goes
            live immediately.
          </p>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handlePdfUpload}
            disabled={uploadingPdf}
            className="mt-3 block w-full text-[13px] text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-[13px] file:font-bold file:text-white hover:file:bg-brand-dark file:cursor-pointer"
          />
          {uploadingPdf && (
            <p className="mt-2 text-[12.5px] text-muted">Uploading…</p>
          )}
          {uploadError && (
            <p role="alert" className="mt-2 text-[12.5px] font-semibold text-accent">
              {uploadError}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Visibility
        </h2>
        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            className="size-5 accent-[var(--color-brand)]"
          />
          <span className="text-[14.5px] font-semibold text-ink">
            Published — visible to customers on the public catalog
          </span>
        </label>
        <p className="mt-2 ml-8 text-[12.5px] text-muted">
          Uncheck to hide this product everywhere on the public site without
          deleting it.
        </p>
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-rose-700">
          Danger zone
        </h2>
        <p className="mt-3 text-[14px] text-rose-900">
          Deleting removes this product from the catalog permanently. Existing
          quote leads keep their cart snapshot, but the public site can&apos;t
          reach this product anymore. Prefer unpublishing if you might want it
          back.
        </p>

        {!deleteConfirming ? (
          <button
            type="button"
            onClick={() => setDeleteConfirming(true)}
            className="mt-4 rounded-full border border-rose-300 bg-white px-5 py-2.5 text-[13.5px] font-bold text-rose-700 hover:bg-rose-100"
          >
            Delete this product
          </button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-[13.5px] font-semibold text-rose-800">
              Sure? This can&apos;t be undone.
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
          onClick={handleSave}
          disabled={pending}
          className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
