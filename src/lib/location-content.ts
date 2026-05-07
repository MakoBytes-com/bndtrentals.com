// Location-specific content layered on top of the LOCATIONS array in site.ts.
// Keep this honest — Burton's site is a B2B catalog, not a marketing puff piece;
// the goal is to give Google enough genuine local context that the right
// service-area queries find the right hub, without fabricating claims.

import type { Location } from "./site";

export type LocationSlug = "la-porte" | "groves" | "marietta";

export type LocationContent = {
  slug: LocationSlug;
  cityKey: string; // matches LOCATIONS[].city for join
  hours: string;
  serviceArea: string[];
  industries: string[];
  applicationsHighlight: string[];
  intro: string;
  whyHere: string;
};

export const LOCATION_CONTENT: Record<LocationSlug, LocationContent> = {
  "la-porte": {
    slug: "la-porte",
    cityKey: "La Porte",
    hours: "Mon–Fri, 7:00 AM – 5:00 PM Central",
    serviceArea: [
      "La Porte",
      "Pasadena",
      "Deer Park",
      "Baytown",
      "Channelview",
      "Houston",
      "Texas City",
      "Galveston",
      "Freeport",
    ],
    industries: [
      "Petrochemical & refining",
      "Pipeline & midstream",
      "Marine & offshore",
      "Power generation",
      "Heavy industrial fabrication",
    ],
    applicationsHighlight: ["NDT", "PMI", "X-Ray", "RVI"],
    intro:
      "Our Gulf Coast headquarters in La Porte is the central warehouse for the rental fleet and the bench for in-house calibration and repair. Most rentals leave the same business day; equipment dropped off for calibration goes on the bench within 24 hours.",
    whyHere:
      "La Porte puts us inside the Houston Ship Channel petrochemical corridor — the largest concentration of refineries, chemical plants, and pipeline infrastructure in the U.S. Customers in Pasadena, Deer Park, Baytown, Texas City, and Freeport can swing by the warehouse, and we routinely ship across the Gulf Coast same-day.",
  },
  groves: {
    slug: "groves",
    cityKey: "Groves",
    hours: "Mon–Fri, 7:30 AM – 4:30 PM Central",
    serviceArea: [
      "Groves",
      "Port Arthur",
      "Beaumont",
      "Orange",
      "Nederland",
      "Port Neches",
      "Lake Charles, LA",
      "Sulphur, LA",
    ],
    industries: [
      "Petrochemical & refining",
      "LNG export terminals",
      "Pipeline & midstream",
      "Heavy industrial fabrication",
      "Maintenance turnarounds",
    ],
    applicationsHighlight: ["NDT", "PMI", "Environmental"],
    intro:
      "Our East Texas hub in Groves serves the Sabine-Neches industrial corridor — Port Arthur, Beaumont, Orange, and the Lake Charles export terminals across the Louisiana line. Local stock for fast turnaround on UT, ET, and PMI rentals; calibration units shuttle to and from La Porte daily.",
    whyHere:
      "Groves is twenty minutes from Port Arthur and Beaumont and an hour from Lake Charles — exactly where the heavy refining + LNG export work is. Having a stocked hub here saves customers the round-trip to Houston when a turnaround needs gear today.",
  },
  marietta: {
    slug: "marietta",
    cityKey: "Marietta",
    hours: "Mon–Fri, 8:00 AM – 5:00 PM Eastern",
    serviceArea: [
      "Marietta",
      "Atlanta",
      "Smyrna",
      "Kennesaw",
      "Dalton",
      "Augusta",
      "Birmingham, AL",
      "Chattanooga, TN",
      "Nashville, TN",
      "Knoxville, TN",
      "Charleston, SC",
    ],
    industries: [
      "Power generation",
      "Pulp & paper",
      "Mining & aggregates",
      "Heavy industrial fabrication",
      "Pipeline & midstream",
    ],
    applicationsHighlight: ["NDT", "RVI", "PMI"],
    intro:
      "Our Southeast hub in Marietta serves the greater Atlanta industrial market plus the surrounding Tennessee, Alabama, and Carolinas region. Stocked for routine NDT, RVI, and PMI work; specialty units ship overnight from La Porte when the job calls for them.",
    whyHere:
      "Atlanta is the logistics center for the Southeast, and Marietta puts us minutes from I-75, I-285, and I-20. Customers in Birmingham, Chattanooga, Nashville, and Charleston are within a one-day drive or one-day freight window.",
  },
};

export function locationContentBySlug(slug: string): LocationContent | undefined {
  return LOCATION_CONTENT[slug as LocationSlug];
}

export function joinLocationContent(loc: Location, content: LocationContent) {
  return { ...loc, ...content };
}
