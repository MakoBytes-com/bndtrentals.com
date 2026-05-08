"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import type { PageSection } from "@/lib/supabase/types";

const slugRegex = /^[a-z0-9][a-z0-9-]*$/;

const createSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and dashes only."),
  title: z.string().trim().min(1).max(200),
  body_html: z.string().max(200000).default(""),
  is_published: z.boolean().default(true),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  body_html: z.string().max(200000),
  is_published: z.boolean(),
});

export type CreateSectionInput = z.input<typeof createSchema>;
export type UpdateSectionInput = z.input<typeof updateSchema>;

export async function createSection(input: CreateSectionInput) {
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
    .from("page_sections")
    .insert({
      slug: data.slug,
      title: data.title,
      body_html: data.body_html,
      is_published: data.is_published,
      published_at: data.is_published ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !row) {
    if (error?.code === "23505") {
      return { ok: false as const, error: `Slug "${data.slug}" already exists.` };
    }
    return { ok: false as const, error: error?.message ?? "Insert failed." };
  }

  revalidatePath("/admin/content");
  return { ok: true as const, id: row.id };
}

export async function createSectionAndRedirect(input: CreateSectionInput) {
  const result = await createSection(input);
  if (result.ok) {
    redirect(`/admin/content/${result.id}`);
  }
  return result;
}

export async function updateSection(input: UpdateSectionInput) {
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
  // Pull current row so we can bump version on body change.
  const { data: current, error: getErr } = await supa
    .from("page_sections")
    .select("body_html, version, is_published")
    .eq("id", data.id)
    .maybeSingle();
  if (getErr || !current) {
    return { ok: false as const, error: "Section not found." };
  }

  const update: Partial<PageSection> = {
    title: data.title,
    body_html: data.body_html,
    is_published: data.is_published,
  };
  if (current.body_html !== data.body_html) {
    update.version = (current.version ?? 1) + 1;
  }
  if (data.is_published && !current.is_published) {
    update.published_at = new Date().toISOString();
  }

  const { error } = await supa
    .from("page_sections")
    .update(update)
    .eq("id", data.id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/admin/content/${data.id}`);
  revalidatePath("/admin/content");
  return { ok: true as const };
}
