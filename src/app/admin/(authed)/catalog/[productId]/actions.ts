"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublicCatalog } from "@/lib/revalidate-catalog";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import type { CatalogProduct, CatalogProductImage } from "@/lib/supabase/types";

const productUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(300),
  manufacturer: z.string().trim().max(200).optional().or(z.literal("")),
  subcategory: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  applications: z.array(z.string().max(300)).max(50).default([]),
  image: z.string().trim().max(500).optional().or(z.literal("")),
  pdf: z.string().trim().max(500).optional().or(z.literal("")),
  sort_order: z.number().int().min(-9999).max(9999).default(0),
  is_published: z.boolean(),
});

export type ProductUpdateInput = z.input<typeof productUpdateSchema>;

export type ProductUpdateResult =
  | { ok: true }
  | { ok: false; error: string };

function blank(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

export async function updateProduct(
  input: ProductUpdateInput,
): Promise<ProductUpdateResult> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "Not signed in." };

  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const data = parsed.data;

  const supa = getAdminSupabase();
  const update: Partial<CatalogProduct> = {
    name: data.name,
    manufacturer: blank(data.manufacturer),
    subcategory: blank(data.subcategory),
    description: blank(data.description),
    applications: data.applications.filter((a) => a.trim().length > 0),
    image: blank(data.image),
    pdf: blank(data.pdf),
    sort_order: data.sort_order,
    is_published: data.is_published,
  };

  const { error } = await supa
    .from("catalog_products")
    .update(update)
    .eq("id", data.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/catalog/${data.id}`);
  revalidatePath("/admin/catalog");
  revalidatePath("/admin");
  revalidatePublicCatalog();
  return { ok: true };
}

export async function uploadProductPdf(formData: FormData): Promise<
  | { ok: true; filename: string }
  | { ok: false; error: string }
> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "Not signed in." };

  const file = formData.get("file");
  const productId = String(formData.get("productId") ?? "");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file selected." };
  }
  if (!productId) {
    return { ok: false, error: "Missing product id." };
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, error: "Only PDF files are accepted." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { ok: false, error: "File is over 20 MB. Please reduce or split." };
  }

  // Slugify filename to avoid storage-path issues.
  const safeBase = file.name
    .replace(/\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 80);
  const path = `${productId}/${safeBase}-${Date.now()}.pdf`;

  const supa = getAdminSupabase();
  const { data: existing } = await supa
    .from("catalog_products")
    .select("pdf")
    .eq("id", productId)
    .maybeSingle();

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await supa.storage
    .from("catalog-pdfs")
    .upload(path, arrayBuffer, {
      contentType: "application/pdf",
      cacheControl: "public, max-age=31536000, immutable",
      upsert: false,
    });
  if (uploadErr) {
    return { ok: false, error: `Upload failed: ${uploadErr.message}` };
  }

  // Store with an "uploads/" prefix so the public link /pdfs/uploads/<path>
  // resolves via the next.config rewrite to the catalog-pdfs bucket. (Legacy
  // flat filenames keep serving from /public/pdfs/.)
  const pdfValue = `uploads/${path}`;
  const { error: updErr } = await supa
    .from("catalog_products")
    .update({ pdf: pdfValue })
    .eq("id", productId);
  if (updErr) {
    return { ok: false, error: `Saved upload but couldn't link product: ${updErr.message}` };
  }

  // Replacing an uploaded spec sheet orphans the old object — clean it up
  // (legacy /public/pdfs filenames are left alone).
  const oldObject = bucketObjectPath(existing?.pdf ?? null);
  if (oldObject && oldObject !== path) {
    await supa.storage.from("catalog-pdfs").remove([oldObject]);
  }

  revalidatePath(`/admin/catalog/${productId}`);
  revalidatePublicCatalog();
  return { ok: true, filename: pdfValue };
}

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// Values stored as "uploads/<objectPath>" live in a Supabase Storage bucket;
// legacy bare filenames live in /public/images (or /public/pdfs) inside the
// repo and must never be storage-deleted.
function bucketObjectPath(stored: string | null): string | null {
  if (!stored || !stored.startsWith("uploads/")) return null;
  return stored.slice("uploads/".length);
}

/**
 * Add one or more photos to a product's gallery ("files" entries in the form
 * data). If the product has no cover image yet, the first uploaded photo
 * becomes the cover.
 */
export async function uploadProductPhotos(formData: FormData): Promise<
  | { ok: true; images: CatalogProductImage[]; cover: string | null }
  | { ok: false; error: string }
> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "Not signed in." };

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { ok: false, error: "Missing product id." };
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return { ok: false, error: "No files selected." };
  if (files.length > 12) return { ok: false, error: "Upload at most 12 photos at a time." };

  for (const file of files) {
    if (!IMAGE_TYPES[file.type]) {
      return { ok: false, error: `"${file.name}" isn't a JPEG, PNG, WebP, or AVIF image.` };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, error: `"${file.name}" is over 10 MB. Please resize it.` };
    }
  }

  const supa = getAdminSupabase();
  const { data: product, error: prodErr } = await supa
    .from("catalog_products")
    .select("id, image")
    .eq("id", productId)
    .maybeSingle();
  if (prodErr || !product) return { ok: false, error: "Product not found." };

  const { data: existing } = await supa
    .from("catalog_product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);
  let nextSort = (existing?.[0]?.sort_order ?? -1) + 1;

  const inserted: CatalogProductImage[] = [];
  for (const file of files) {
    const ext = IMAGE_TYPES[file.type];
    const safeBase = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 80) || "image";
    // Path inside the catalog-images bucket. The DB stores it prefixed with
    // "uploads/" so /images/uploads/... resolves via the next.config rewrite.
    const objectPath = `${productId}/${safeBase}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadErr } = await supa.storage
      .from("catalog-images")
      .upload(objectPath, arrayBuffer, {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
        upsert: false,
      });
    if (uploadErr) {
      return { ok: false, error: `Upload of "${file.name}" failed: ${uploadErr.message}` };
    }

    const { data: row, error: insErr } = await supa
      .from("catalog_product_images")
      .insert({ product_id: productId, path: `uploads/${objectPath}`, sort_order: nextSort++ })
      .select("*")
      .single();
    if (insErr || !row) {
      return { ok: false, error: `Uploaded "${file.name}" but couldn't save it: ${insErr?.message ?? "insert failed"}` };
    }
    inserted.push(row);
  }

  // No cover yet → promote the first new photo so listings/cart/OG have one.
  let cover = product.image;
  if (!cover && inserted.length > 0) {
    cover = inserted[0].path;
    await supa.from("catalog_products").update({ image: cover }).eq("id", productId);
  }

  revalidatePath(`/admin/catalog/${productId}`);
  revalidatePublicCatalog();
  return { ok: true, images: inserted, cover };
}

/**
 * Delete one gallery photo. Uploaded files are also removed from storage;
 * legacy bundled images only lose their gallery row. If the deleted photo was
 * the cover, the next remaining photo (if any) becomes the cover.
 */
export async function deleteProductPhoto(imageId: string): Promise<
  | { ok: true; cover: string | null }
  | { ok: false; error: string }
> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "Not signed in." };
  if (typeof imageId !== "string" || imageId.length < 10) {
    return { ok: false, error: "Invalid photo id." };
  }

  const supa = getAdminSupabase();
  const { data: row, error: rowErr } = await supa
    .from("catalog_product_images")
    .select("*")
    .eq("id", imageId)
    .maybeSingle();
  if (rowErr || !row) return { ok: false, error: "Photo not found." };

  const { error: delErr } = await supa
    .from("catalog_product_images")
    .delete()
    .eq("id", imageId);
  if (delErr) return { ok: false, error: delErr.message };

  const objectPath = bucketObjectPath(row.path);
  if (objectPath) {
    // Best-effort: the row is gone either way; an orphaned object is harmless.
    await supa.storage.from("catalog-images").remove([objectPath]);
  }

  const { data: product } = await supa
    .from("catalog_products")
    .select("id, image")
    .eq("id", row.product_id)
    .maybeSingle();

  let cover = product?.image ?? null;
  if (product && product.image === row.path) {
    const { data: rest } = await supa
      .from("catalog_product_images")
      .select("path")
      .eq("product_id", row.product_id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1);
    cover = rest?.[0]?.path ?? null;
    await supa.from("catalog_products").update({ image: cover }).eq("id", row.product_id);
  }

  revalidatePath(`/admin/catalog/${row.product_id}`);
  revalidatePublicCatalog();
  return { ok: true, cover };
}

/** Make an existing gallery photo the cover image. */
export async function setProductCoverPhoto(imageId: string): Promise<
  | { ok: true; cover: string }
  | { ok: false; error: string }
> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "Not signed in." };
  if (typeof imageId !== "string" || imageId.length < 10) {
    return { ok: false, error: "Invalid photo id." };
  }

  const supa = getAdminSupabase();
  const { data: row, error: rowErr } = await supa
    .from("catalog_product_images")
    .select("*")
    .eq("id", imageId)
    .maybeSingle();
  if (rowErr || !row) return { ok: false, error: "Photo not found." };

  const { error: updErr } = await supa
    .from("catalog_products")
    .update({ image: row.path })
    .eq("id", row.product_id);
  if (updErr) return { ok: false, error: updErr.message };

  revalidatePath(`/admin/catalog/${row.product_id}`);
  revalidatePublicCatalog();
  return { ok: true, cover: row.path };
}

/** Remove the spec sheet: clears the pointer and deletes an uploaded file. */
export async function removeProductPdf(productId: string): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "Not signed in." };
  if (typeof productId !== "string" || productId.length < 10) {
    return { ok: false, error: "Invalid product id." };
  }

  const supa = getAdminSupabase();
  const { data: product, error: prodErr } = await supa
    .from("catalog_products")
    .select("id, pdf")
    .eq("id", productId)
    .maybeSingle();
  if (prodErr || !product) return { ok: false, error: "Product not found." };

  const { error: updErr } = await supa
    .from("catalog_products")
    .update({ pdf: null })
    .eq("id", productId);
  if (updErr) return { ok: false, error: updErr.message };

  const objectPath = bucketObjectPath(product.pdf);
  if (objectPath) {
    await supa.storage.from("catalog-pdfs").remove([objectPath]);
  }

  revalidatePath(`/admin/catalog/${productId}`);
  revalidatePublicCatalog();
  return { ok: true };
}

export async function deleteProduct(productId: string) {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };
  if (typeof productId !== "string" || productId.length < 10) {
    return { ok: false as const, error: "Invalid product id." };
  }

  const supa = getAdminSupabase();
  const { error } = await supa
    .from("catalog_products")
    .delete()
    .eq("id", productId);
  if (error) return { ok: false as const, error: error.message };

  // Best-effort storage cleanup — uploaded photos and spec sheets live under
  // "<productId>/…" in their buckets (gallery rows cascade via the FK).
  for (const bucket of ["catalog-images", "catalog-pdfs"] as const) {
    const { data: objects } = await supa.storage.from(bucket).list(productId);
    if (objects?.length) {
      await supa.storage
        .from(bucket)
        .remove(objects.map((o) => `${productId}/${o.name}`));
    }
  }

  revalidatePath("/admin/catalog");
  revalidatePath("/admin");
  revalidatePublicCatalog();
  return { ok: true as const };
}

export async function deleteProductAndRedirect(productId: string) {
  const result = await deleteProduct(productId);
  if (result.ok) {
    redirect("/admin/catalog");
  }
  return result;
}
