import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = {
  title: "Site content",
  robots: { index: false, follow: false },
};

export default function ContentPlaceholderPage() {
  return (
    <AdminPlaceholder
      eyebrow="Site content"
      title="Editable page sections"
      description="Edit copy on the public site without touching code — about page, team bios, application primers, location service-area copy, T&C summary, etc. Lives in the page_sections table; the public site reads the same rows."
      phase="Phase 3-D"
      features={[
        "Browse all editable sections grouped by page",
        "Edit body HTML or markdown; preview before save",
        "Toggle published / draft state per section",
        "Version history — see and revert previous edits",
        "Public site re-renders affected pages automatically (no redeploy)",
      ]}
    />
  );
}
