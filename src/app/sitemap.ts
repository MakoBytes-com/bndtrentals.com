import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getCategories, getAllPublishedProducts } from "@/lib/catalog";
import { APPLICATIONS } from "@/lib/applications";
import { PROJECTS } from "@/lib/projects";
import { LOCATION_CONTENT } from "@/lib/location-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/equipment`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/applications`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/calibration`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/locations`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/quote`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
  const locationRoutes: MetadataRoute.Sitemap = Object.keys(LOCATION_CONTENT).map((slug) => ({
    url: `${base}/locations/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const [categories, products] = await Promise.all([
    getCategories(),
    getAllPublishedProducts(),
  ]);
  const equipmentRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/equipment/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));
  const productRoutes: MetadataRoute.Sitemap = products.map(({ category, product }) => ({
    url: `${base}/equipment/${category.slug}/${product.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const appRoutes: MetadataRoute.Sitemap = Object.keys(APPLICATIONS).map((slug) => ({
    url: `${base}/applications/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const projectRoutes: MetadataRoute.Sitemap = PROJECTS.map((p) => ({
    url: `${base}/projects/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...staticRoutes, ...locationRoutes, ...equipmentRoutes, ...productRoutes, ...appRoutes, ...projectRoutes];
}
