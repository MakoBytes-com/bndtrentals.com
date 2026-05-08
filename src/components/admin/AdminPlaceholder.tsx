import type { ReactNode } from "react";
import Link from "next/link";

// Placeholder shown for admin module pages that haven't been built yet.
// Lives at /admin/catalog, /admin/calibration, /admin/content until each
// module's real implementation lands. Keeps the sidebar functional and
// surfaces what the page WILL do so Burton staff aren't confused.

export function AdminPlaceholder({
  eyebrow,
  title,
  description,
  features,
  phase,
}: {
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
  phase: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-[15px] text-muted leading-relaxed">{description}</p>

      <div className="mt-8 rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          <div>
            <p className="text-[14.5px] font-bold text-ink">Under construction</p>
            <p className="text-[12.5px] text-muted-soft">{phase}</p>
          </div>
        </div>

        <p className="mt-5 text-[13px] font-bold uppercase tracking-widest text-muted">
          What this will do
        </p>
        <ul className="mt-3 space-y-2.5 text-[14.5px] text-ink-soft">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft"
        >
          Back to dashboard
        </Link>
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-[14px] font-bold text-ink hover:bg-canvas-tint"
        >
          Quote leads
        </Link>
      </div>
    </div>
  );
}
