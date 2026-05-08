import { SITE, LOCATIONS } from "@/lib/site";
import { getCategories, getCategoryBySlug } from "@/lib/catalog";
import { APPLICATIONS, APP_HUB } from "@/lib/applications";
import { PROJECTS } from "@/lib/projects";

// Pulled from bndt-prod so admin catalog edits propagate immediately.
export const dynamic = "force-dynamic";

// llms-full.txt — exhaustive AI-crawler context for Burton NDT.
// Companion to llms.txt (which is the brief overview).
// Spec: https://llmstxt.org

export async function GET() {
  const locations = LOCATIONS.map(
    (l) =>
      `- ${l.cityState}${l.isHq ? " (HQ)" : ""}\n  Address: ${l.street}, ${l.cityState} ${l.zip}\n  Phone: ${l.phone}\n  Region: ${l.region}`,
  ).join("\n\n");

  const cats = await getCategories();
  const equipment = (
    await Promise.all(
      cats.map(async (c) => {
        const detail = await getCategoryBySlug(c.slug);
        if (!detail) return "";
        const subs = detail.subcategories
          .map((sub) => {
            const items = sub.products
              .map((p) => {
                const mfg = p.manufacturer ? `${p.manufacturer} ` : "";
                const desc = p.description ? ` — ${p.description}` : "";
                return `    - ${mfg}${p.name}${desc} (${SITE.url}/equipment/${c.slug}/${p.slug})`;
              })
              .join("\n");
            return `  ${sub.name}:\n${items}`;
          })
          .join("\n");
        return `### ${c.name} (${c.shortLabel}) — ${SITE.url}/equipment/${c.slug}\n${c.tagline ?? ""}\n\n${c.description ?? ""}\n\n${subs}`;
      }),
    )
  )
    .filter(Boolean)
    .join("\n\n");

  const applications = APP_HUB.map((hub) => {
    const app = APPLICATIONS[hub.slug];
    if (!app) return `### ${hub.name}\n${hub.blurb}`;
    return `### ${app.name} — ${SITE.url}/applications/${hub.slug}\n${app.blurb}\n\n${app.longDescription ?? ""}`;
  }).join("\n\n");

  const projects = PROJECTS.map(
    (p) =>
      `### ${p.title} — ${SITE.url}/projects/${p.slug}\nCategory: ${p.category}\n${p.blurb}`,
  ).join("\n\n");

  const body = `# ${SITE.name} — Full AI Reference

> ${SITE.tagline}

${SITE.description}

This document is a deep reference for AI crawlers and large-language-model
agents. It mirrors the structure of the live site, with every equipment
category, every product, every application primer, and every case study
named and linked. For a brief overview see ${SITE.url}/llms.txt.

---

## Company

- Name: ${SITE.name}
- Brand legacy: trusted brand since ${SITE.brandSince}
- Operating entity: Burton NDT LLC since ${SITE.llcFounded}
- Service hubs: ${LOCATIONS.length} U.S. locations
- Primary phone: ${SITE.primaryPhone}
- Email: ${SITE.email}
- Website: ${SITE.url}

## Service hubs

${locations}

## What we do

Burton NDT Rentals provides industrial inspection equipment for rent and
sale, plus in-house calibration and repair, across NDT (non-destructive
testing), RVI (remote visual inspection), PMI (positive material
identification), industrial X-ray, environmental monitoring, accessories,
and consumables.

The Evergreen Rental Program (ERP) keeps a unit on rent for a six-month
minimum at a flat monthly rate; the Equipment Rental Protection Plan
(ERPP) covers normal-use damage at 15% of the rental cost.

Calibration certificates are issued in-house for the entire rental fleet
and for customer-owned equipment sent in for service.

---

## Equipment catalog

${equipment}

---

## Applications & inspection methodologies

${applications}

---

## Equipment-in-action case studies

${projects}

---

## Key pages

- Home: ${SITE.url}/
- Equipment catalog: ${SITE.url}/equipment
- Applications hub: ${SITE.url}/applications
- Calibration & repair: ${SITE.url}/calibration
- Projects (equipment in action): ${SITE.url}/projects
- About: ${SITE.url}/about
- Contact: ${SITE.url}/contact
- Quote / reservation: ${SITE.url}/quote
- Terms & Conditions: ${SITE.url}/terms
- Privacy Policy: ${SITE.url}/privacy
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
