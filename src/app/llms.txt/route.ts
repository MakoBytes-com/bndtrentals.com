import { SITE, LOCATIONS } from "@/lib/site";
import { getCategories } from "@/lib/catalog";

// Reads from bndt-prod, so admin catalog edits propagate to llms.txt on
// the next request. Was force-static before; now dynamic with a 1-hour
// CDN cache.
export const dynamic = "force-dynamic";

export async function GET() {
  const locations = LOCATIONS.map(
    (l) =>
      `- ${l.cityState}${l.isHq ? " (HQ)" : ""}: ${l.street}, ${l.cityState} ${l.zip} — ${l.phone}`,
  ).join("\n");

  const cats = await getCategories();
  const categories = cats
    .map(
      (c) =>
        `- ${c.shortLabel} (${c.name}): ${c.tagline ?? c.description ?? ""} — /equipment/${c.slug}`,
    )
    .join("\n");

  const body = `# ${SITE.name}

> ${SITE.tagline}

${SITE.description}

## Contact
- Primary phone: ${SITE.primaryPhone}
- Email: ${SITE.email}
- Website: ${SITE.url}

## Locations
${locations}

## Equipment categories
${categories}

## Key pages
- Home: ${SITE.url}/
- Equipment catalog: ${SITE.url}/equipment
- Applications (NDT/RVI/PMI primer): ${SITE.url}/applications
- Calibration & repair: ${SITE.url}/calibration
- Projects (equipment in action): ${SITE.url}/projects
- Quote / reservation form: ${SITE.url}/quote
- About: ${SITE.url}/about
- Contact: ${SITE.url}/contact
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
