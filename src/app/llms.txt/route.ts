import { SITE, LOCATIONS } from "@/lib/site";
import { CATEGORIES } from "@/lib/equipment";

export const dynamic = "force-static";

export function GET() {
  const locations = LOCATIONS.map(
    (l) => `- ${l.cityState}${l.isHq ? " (HQ)" : ""}: ${l.street}, ${l.cityState} ${l.zip} — ${l.phone}`
  ).join("\n");

  const categories = CATEGORIES.map(
    (c) => `- ${c.short} (${c.name}): ${c.tagline} — /equipment/${c.slug}`
  ).join("\n");

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
