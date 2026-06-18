// Resolve a stored image reference to a renderable URL.
// - Uploaded images are stored as "uploads/<...>" and served via the
//   next.config rewrite (/images/uploads/* -> Supabase Storage bucket).
// - Full URLs (http...) are used as-is.
// - Everything else is a legacy filename bundled in /public/images/.
// Client-safe (no server-only import) so both pages and client components use it.
export function imageSrc(
  image: string | null | undefined,
): string | null {
  if (!image) return null;
  const v = image.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return v;
  return `/images/${v}`;
}
