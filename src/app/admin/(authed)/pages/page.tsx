import type { Metadata } from "next";
import { CMS_PAGES } from "@/lib/cms";
import { requireFullAdminPage } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Pages" };

export default async function AdminPagesList() {
  await requireFullAdminPage();
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Site pages</h1>
        <p className="mt-1 text-[14.5px] text-muted">
          Edit any page visually — open it, then click any text to edit it and
          any image to replace it. Changes go live as you save.
        </p>
      </header>

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {CMS_PAGES.map((p) => (
          <li key={p.page} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-ink">{p.label}</p>
              <p className="truncate font-mono text-[12.5px] text-muted-soft">{p.path}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={p.path}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink hover:bg-canvas-tint"
              >
                View
              </a>
              <a
                href={`/api/cms/edit?path=${encodeURIComponent(p.path)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-brand px-5 py-2 text-[13px] font-bold text-white hover:bg-brand-dark"
              >
                Edit visually ↗
              </a>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[12.5px] text-muted-soft">
        Tip: the editor only appears for signed-in admins. Visitors never see the
        edit controls, even on the same URL.
      </p>
    </div>
  );
}
