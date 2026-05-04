// Equipment-in-action case studies (originally /industries/* on the live site).
// Each is a short YouTube demo of a specific tool deployed in the field.

export type Project = {
  slug: string;
  title: string;
  category: string;
  blurb: string;
  youtubeId: string;
  thumb: string;
  related?: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "amigo-2",
    title: "Eddyfi TSC Amigo 2 — ACFM Inspection",
    category: "ACFM",
    blurb:
      "Alternating Current Field Measurement of welds and surface-breaking cracks. The Amigo 2 detects defects through paint and coatings without the need for surface preparation — ideal for offshore, refinery, and pipeline inspection campaigns.",
    youtubeId: "WL-ntWiL0iA",
    thumb: "5.jpg",
    related: "/equipment/ndt",
  },
  {
    slug: "jaws-retrieval-tool",
    title: "Sensor Networks JAWS — Foreign Object Retrieval",
    category: "FOSAR",
    blurb:
      "JAWS is a magnetic retrieval tool for pulling foreign objects out of pipework, vessels, and tanks during turnarounds. Pairs with our pushrod cameras and crawlers for find-and-recover operations.",
    youtubeId: "aJWQ0gLZNvI",
    thumb: "4.jpg",
    related: "/equipment/rvi",
  },
  {
    slug: "taycon",
    title: "TAYCON — Robotic Tank Inspection",
    category: "RVI",
    blurb:
      "Robotic tank-floor inspection in action. Walk through how TAYCON systems image floor plates without confined-space entry — saving hours of scaffolding and a man-entry permit.",
    youtubeId: "NueL8jetL5I",
    thumb: "2.jpg",
    related: "/equipment/rvi",
  },
  {
    slug: "versatrax-150",
    title: "Eddyfi Inuktun Versatrax 150 — Pipe Crawler",
    category: "RVI",
    blurb:
      "The Versatrax 150 magnetic-tracked crawler navigates 6\" diameter pipework and larger. Watch it tackle bends, vertical climbs, and submerged inspections under live operating conditions.",
    youtubeId: "3I9IHkAjWDI",
    thumb: "1.jpg",
    related: "/equipment/rvi",
  },
];

export const PROJECT_BY_SLUG: Record<string, Project> = Object.fromEntries(
  PROJECTS.map((p) => [p.slug, p])
);
