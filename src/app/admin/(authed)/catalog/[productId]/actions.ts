"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import type { CatalogProduct } from "@/lib/supabase/types";

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

  // Persist the public-bucket path on the product row.
  const { error: updErr } = await supa
    .from("catalog_products")
    .update({ pdf: path })
    .eq("id", productId);
  if (updErr) {
    return { ok: false, error: `Saved upload but couldn't link product: ${updErr.message}` };
  }

  revalidatePath(`/admin/catalog/${productId}`);
  return { ok: true, filename: path };
}
