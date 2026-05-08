import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = {
  title: "Catalog",
  robots: { index: false, follow: false },
};

export default function CatalogPlaceholderPage() {
  return (
    <AdminPlaceholder
      eyebrow="Catalog"
      title="Equipment catalog editor"
      description="The 95 products and 7 categories from the public site already live in your bndt-prod database. The editor below ships next — until then the catalog is read-only on the public site, sourced directly from the rows in catalog_products and catalog_categories."
      phase="Phase 3-B"
      features={[
        "Browse / search 95 products with category + manufacturer filters",
        "Edit name, description, applications, manufacturer, image, sort order",
        "Toggle is_published to hide or show items on the public catalog",
        "Upload spec-sheet PDFs to the catalog-pdfs bucket (max 20 MB, application/pdf only)",
        "Add / rename / reorder categories; nest subcategories",
        "Public site automatically reflects edits — no redeploy needed",
      ]}
    />
  );
}
