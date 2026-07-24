import { revalidatePath } from "next/cache";

// Purges every public page that renders catalog data. The public site is
// statically cached (ISR), so catalog admin mutations must call this for
// edits to go live immediately instead of waiting out the revalidate window.
// Only callable from server actions / route handlers.
export function revalidatePublicCatalog() {
  revalidatePath("/");
  revalidatePath("/equipment");
  revalidatePath("/equipment/[slug]", "page");
  revalidatePath("/equipment/[slug]/[product]", "page");
  // Location hubs feature category tiles pulled from the catalog.
  revalidatePath("/locations/[slug]", "page");
}
