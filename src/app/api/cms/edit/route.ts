import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { CMS_PAGES } from "@/lib/cms";

// Entry point for the visual editor. Public pages are statically cached, so
// editing needs Next draft mode: this handler (admins only) sets the draft
// cookie and sends the browser to the page, which then renders per-request
// with the edit affordances. Exit is /api/cms/edit/exit.

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session.userId) {
    redirect("/admin/login");
  }
  // Page editing is admin-only; staff get bounced to their dashboard.
  if (session.role !== "admin") {
    redirect("/admin");
  }

  // Only CMS-editable paths — also keeps the redirect target off user input.
  const requested = new URL(request.url).searchParams.get("path") ?? "/";
  const target = CMS_PAGES.find((p) => p.path === requested)?.path ?? "/";

  const draft = await draftMode();
  draft.enable();
  redirect(target);
}
