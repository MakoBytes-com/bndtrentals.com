"use client";

// Inline-editable text node. In normal mode it renders exactly as a plain
// element (zero overhead, zero layout change). In edit mode it becomes
// contentEditable and saves on blur. The text content is written to the DOM
// once via ref so React never reconciles (and clobbers) the user's edits —
// only the className changes on save status, which is safe.

import { createElement, useEffect, useRef, useState } from "react";
import { savePageField } from "@/lib/cms-actions";

type Status = "idle" | "saving" | "saved" | "error";

export function Editable({
  as = "span",
  value,
  page,
  k,
  editable,
  className,
}: {
  as?: string;
  value: string;
  page: string;
  k: string;
  editable: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const initialized = useRef(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (editable && ref.current && !initialized.current) {
      ref.current.innerText = value;
      initialized.current = true;
    }
  }, [editable, value]);

  if (!editable) {
    return createElement(as, { className }, value);
  }

  async function handleBlur() {
    const next = (ref.current?.innerText ?? "").replace(/ /g, " ").replace(/\s+$/g, "");
    if (next === value) {
      setStatus("idle");
      return;
    }
    setStatus("saving");
    const r = await savePageField(page, k, next);
    if (r.ok) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1200);
    } else {
      setStatus("error");
      if (typeof window !== "undefined") window.alert(`Couldn't save: ${r.error}`);
    }
  }

  const stateClass =
    status === "saving" ? "cms-busy" : status === "saved" ? "cms-ok" : status === "error" ? "cms-err" : "";

  return createElement(as, {
    ref,
    className: `${className ?? ""} cms-edit ${stateClass}`.trim(),
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    onBlur: handleBlur,
    "data-cms-key": k,
    title: "Click to edit · click away to save",
  });
}
