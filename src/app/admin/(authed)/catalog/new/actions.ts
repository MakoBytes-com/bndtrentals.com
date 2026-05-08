"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";

const slugRegex = /^[a-z0-9][a-z0-9-]*$/;

const createSchema = z.object({
  category_id: z.string().uuid(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and dashes only."),
  name: z.string().trim().min(1).max(300),
  manufacturer: z.string().trim().max(200).optional().or(z.literal("")),
  subcategory: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  image: z.string().trim().max(500).optional().or(z.literal("")),
  is_published: z.boolean().default(true),
});

export type CreateProductInput = z.input<typeof createSchema>;

function blank(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

export async function createProduct(input: CreateProductInput) {
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
    .from("catalog_products")
    .insert({
      category_id: data.category_id,
      slug: data.slug,
      name: data.name,
      manufacturer: blank(data.manufacturer),
      subcategory: blank(data.subcategory),
      description: blank(data.description),
      image: blank(data.image),
      applications: [],
      is_published: data.is_published,
    })
    .select("id")
    .single();

  if (error || !row) {
    if (error?.code === "23505") {
      return {
        ok: false as const,
        error: `A product with slug "${data.slug}" already exists in this category.`,
      };
    }
    return { ok: false as const, error: error?.message ?? "Insert failed." };
  }

  revalidatePath("/admin/catalog");
  revalidatePath("/admin");
  return { ok: true as const, id: row.id };
}

export async function createProductAndRedirect(input: CreateProductInput) {
  const result = await createProduct(input);
  if (result.ok) {
    redirect(`/admin/catalog/${result.id}`);
  }
  return result;
}
