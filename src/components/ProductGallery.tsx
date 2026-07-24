"use client";

// Product-page photo gallery: big main image + thumbnail strip (only when
// there's more than one photo). Paths come resolved through imageSrc, so
// uploaded ("uploads/…") and legacy bundled filenames both render.

import { useState } from "react";
import Image from "next/image";
import { imageSrc } from "@/lib/image-src";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [selected, setSelected] = useState(0);
  const current = images[Math.min(selected, images.length - 1)];
  const currentSrc = imageSrc(current);

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-line bg-canvas-tint">
        <div className="aspect-[4/3] flex items-center justify-center p-10">
          {currentSrc && (
            <Image
              src={currentSrc}
              alt={alt}
              width={900}
              height={700}
              priority
              className="max-h-full w-auto object-contain"
            />
          )}
        </div>
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5" aria-label="Product photos">
          {images.map((img, i) => {
            const thumb = imageSrc(img);
            if (!thumb) return null;
            const active = i === selected;
            return (
              <li key={`${img}-${i}`}>
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-label={`Show photo ${i + 1} of ${images.length}`}
                  aria-current={active ? "true" : undefined}
                  className={`block w-full overflow-hidden rounded-xl border bg-canvas-tint transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    active
                      ? "border-brand ring-2 ring-brand/25"
                      : "border-line hover:border-brand/50"
                  }`}
                >
                  <span className="flex aspect-square items-center justify-center p-2">
                    <Image
                      src={thumb}
                      alt=""
                      width={160}
                      height={160}
                      className="max-h-full w-auto object-contain"
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
