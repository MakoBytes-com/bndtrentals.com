import type { Metadata } from "next";
import { SITE } from "./site";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
};

// Centralized metadata helper so every public page emits a consistent set of
// canonical, OpenGraph, and Twitter-card tags instead of falling back to the
// generic root-layout values when shared on Slack / LinkedIn / iMessage / etc.
export function pageMetadata({
  title,
  description,
  path,
  ogImage,
}: PageMetaInput): Metadata {
  const canonical = path.startsWith("/") ? path : `/${path}`;
  const url = `${SITE.url}${canonical === "/" ? "" : canonical}`;
  const images = ogImage ? [{ url: ogImage }] : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: `${title} | ${SITE.name}`,
      description,
      url,
      locale: "en_US",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
