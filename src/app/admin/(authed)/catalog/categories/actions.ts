"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import type { CatalogCategory } from "@/lib/supabase/types";

const slugRegex = /^[a-z0-9][a-z0-9-]*$/;

const createSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and dashes only."),
  name: z.string().trim().min(1).max(200),
  short: z.string().trim().max(40).optional().or(z.literal("")),
  tagline: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  sort_order: z.number().int().min(-9999).max(9999).default(0),
  is_published: z.boolean().default(true),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  short: z.string().trim().max(40).optional().or(z.literal("")),
  tagline: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  sort_order: z.number().int().min(-9999).max(9999),
  is_published: z.boolean(),
});

export type CreateCategoryInput = z.input<typeof createSchema>;
export type UpdateCategoryInput = z.input<typeof updateSchema>;

function blank(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

export async function createCategory(input: CreateCategoryInput) {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const data = parsed.data;

  const supa = getAdminSupabase();
  const { data: row, error } = await supa
    .from("catalog_categories")
    .insert({
      slug: data.slug,
      name: data.name,
      short: blank(data.short),
      tagline: blank(data.tagline),
      description: blank(data.description),
      sort_order: data.sort_order,
      is_published: data.is_published,
    })
    .select("id")
    .single();

  if (error || !row) {
    if (error?.code === "23505") {
      return { ok: false as const, error: `Slug "${data.slug}" already exists.` };
    }
    return { ok: false as const, error: error?.message ?? "Insert failed." };
  }

  revalidatePath("/admin/catalog");
  revalidatePath("/admin/catalog/categories");
  return { ok: true as const, id: row.id };
}

export async function createCategoryAndRedirect(input: CreateCategoryInput) {
  const result = await createCategory(input);
  if (result.ok) redirect(`/admin/catalog/categories/${result.id}`);
  return result;
}

export async function updateCategory(input: UpdateCategoryInput) {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const data = parsed.data;

  const supa = getAdminSupabase();
  const update: Partial<CatalogCategory> = {
    name: data.name,
    short: blank(data.short),
    tagline: blank(data.tagline),
    description: blank(data.description),
    sort_order: data.sort_order,
    is_published: data.is_published,
  };

  const { error } = await supa
    .from("catalog_categories")
    .update(update)
    .eq("id", data.id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/admin/catalog/categories/${data.id}`);
  revalidatePath("/admin/catalog/categories");
  revalidatePath("/admin/catalog");
  return { ok: true as const };
}

export async function deleteCategory(categoryId: string) {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };
  if (typeof categoryId !== "string" || categoryId.length < 10) {
    return { ok: false as const, error: "Invalid category id." };
  }

  const supa = getAdminSupabase();

  // Pre-check: count products in this category. Friendlier than waiting
  // for the FK violation since we can show the actual count.
  const { count } = await supa
    .from("catalog_products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if ((count ?? 0) > 0) {
    return {
      ok: false as const,
      error: `Cannot delete — ${count} product${count === 1 ? "" : "s"} still belong to this category. Move or delete them first, or unpublish the category to hide it.`,
    };
  }

  const { error } = await supa
    .from("catalog_categories")
    .delete()
    .eq("id", categoryId);
  if (error) {
    if (error.code === "23503") {
      return {
        ok: false as const,
        error: "Cannot delete — products still reference this category.",
      };
    }
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin/catalog");
  revalidatePath("/admin/catalog/categories");
  return { ok: true as const };
}

export async function deleteCategoryAndRedirect(categoryId: string) {
  const result = await deleteCategory(categoryId);
  if (result.ok) redirect("/admin/catalog/categories");
  return result;
}
