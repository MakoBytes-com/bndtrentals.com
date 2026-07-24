"use server";

// Write side of the visual CMS. All mutations require an admin session and go
// through the service-role client. Content lives in page_sections row
// `cms:<page>` (JSONB metadata); images go to the catalog-images bucket and are
// stored as "uploads/..." so they resolve via the /images rewrite.

import { revalidatePath } from "next/cache";
import { getAdminSession, ADMIN_ONLY_ERROR } from "@/lib/auth/session";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { CMS_SLUG_PREFIX, CMS_PAGES } from "@/lib/cms";

function pathForPage(page: string): string {
  return CMS_PAGES.find((p) => p.page === page)?.path ?? `/${page}`;
}

async function upsertField(page: string, key: string, value: string) {
  const supa = getAdminSupabase();
  const slug = `${CMS_SLUG_PREFIX}${page}`;
  const { data: row } = await supa
    .from("page_sections")
    .select("id, metadata")
    .eq("slug", slug)
    .maybeSingle();
  const metadata = {
    ...((row?.metadata as Record<string, unknown>) ?? {}),
    [key]: value,
  };
  if (row?.id) {
    const { error } = await supa
      .from("page_sections")
      .update({ metadata })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supa.from("page_sections").insert({
      slug,
      title: `CMS: ${page}`,
      body_html: "",
      metadata,
      is_published: true,
    });
    if (error) throw new Error(error.message);
  }
}

export async function savePageField(
  page: string,
  key: string,
  value: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "Not signed in." };
  if (session.role !== "admin") return { ok: false, error: ADMIN_ONLY_ERROR };
  if (typeof page !== "string" || typeof key !== "string") {
    return { ok: false, error: "Invalid target." };
  }
  if (typeof value !== "string" || value.length > 20000) {
    return { ok: false, error: "Value too long." };
  }
  try {
    await upsertField(page, key, value);
    revalidatePath(pathForPage(page));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }
}

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function uploadPageImage(
  formData: FormData,
): Promise<{ ok: true; value: string; src: string } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "Not signed in." };
  if (session.role !== "admin") return { ok: false, error: ADMIN_ONLY_ERROR };

  const file = formData.get("file");
  const page = String(formData.get("page") ?? "");
  const key = String(formData.get("key") ?? "");
  if (!(file instanceof File)) return { ok: false, error: "No file selected." };
  if (!page || !key) return { ok: false, error: "Missing target." };

  const ext = IMAGE_EXT[file.type];
  if (!ext) return { ok: false, error: "Use a JPEG, PNG, WebP, or AVIF image." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Image is over 10 MB." };

  const safeKey = key.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 40) || "image";
  const objectPath = `pages/${page}/${safeKey}-${Date.now()}.${ext}`;

  const supa = getAdminSupabase();
  const buf = await file.arrayBuffer();
  const { error: upErr } = await supa.storage
    .from("catalog-images")
    .upload(objectPath, buf, {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
      upsert: false,
    });
  if (upErr) return { ok: false, error: `Upload failed: ${upErr.message}` };

  const value = `uploads/${objectPath}`;
  try {
    await upsertField(page, key, value);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't link image." };
  }
  revalidatePath(pathForPage(page));
  return { ok: true, value, src: `/images/${value}` };
}
