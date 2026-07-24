import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { CMS_PAGES } from "@/lib/cms";

// Leaves the visual editor: clears the draft cookie so the browser goes back
// to the statically cached public pages. No auth gate needed — disabling
// draft mode is always safe.

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("path") ?? "/";
  const target = CMS_PAGES.find((p) => p.path === requested)?.path ?? "/";

  const draft = await draftMode();
  draft.disable();
  redirect(target);
}
