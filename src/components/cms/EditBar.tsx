"use client";

// Floating toolbar shown only in edit mode (admin + draft-mode cookie). Tells
// the user what to do and gives a way out of edit mode / back to the page
// list. "Done" clears the draft cookie — until then, every page the admin
// visits stays editable.

import Link from "next/link";

export function EditBar({ path, label }: { path: string; label: string }) {
  return (
    <div className="cms-bar" role="region" aria-label="Page editor toolbar">
      <span className="cms-bar-dot" aria-hidden />
      <strong className="cms-bar-title">Editing: {label}</strong>
      <span className="cms-bar-hint">
        Click any text to edit it (saves when you click away). Click any image to replace it.
      </span>
      <Link href="/admin/pages" className="cms-bar-btn cms-bar-btn--ghost">
        All pages
      </Link>
      <a href={`/api/cms/edit/exit?path=${encodeURIComponent(path)}`} className="cms-bar-btn">
        Done
      </a>
    </div>
  );
}
