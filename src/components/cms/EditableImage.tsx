"use client";

// Inline-replaceable image. Normal mode renders a plain next/image with the
// same props as before (no layout change). Edit mode adds a dashed outline and
// a click handler: clicking the image opens a file picker and uploads a
// replacement, which swaps in place. The hidden <input> is a Fragment sibling
// so it never affects layout (works for both `fill` and fixed-size images).

import Image from "next/image";
import { useRef, useState } from "react";
import { uploadPageImage } from "@/lib/cms-actions";
import { imageSrc } from "@/lib/image-src";

type Props = {
  value: string;
  alt: string;
  page: string;
  k: string;
  editable: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function EditableImage({
  value,
  alt,
  page,
  k,
  editable,
  className,
  style,
  ...imgProps
}: Props) {
  const [current, setCurrent] = useState(value);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolved = imageSrc(current) ?? "/icon.png";

  if (!editable) {
    return (
      <Image src={resolved} alt={alt} className={className} style={style} {...imgProps} />
    );
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("page", page);
    fd.set("key", k);
    const r = await uploadPageImage(fd);
    setBusy(false);
    if (r.ok) setCurrent(r.value);
    else window.alert(`Couldn't upload: ${r.error}`);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <Image
        src={resolved}
        alt={alt}
        className={`${className ?? ""} cms-img-edit ${busy ? "cms-busy" : ""}`.trim()}
        style={{ ...style, cursor: "pointer" }}
        title="Click to replace this image"
        onClick={() => !busy && inputRef.current?.click()}
        {...imgProps}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={onPick}
        style={{ display: "none" }}
      />
    </>
  );
}
