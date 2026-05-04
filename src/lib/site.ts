export const SITE = {
  name: "Burton NDT Rentals",
  shortName: "Burton NDT",
  url: "https://bndt-showcase.vercel.app",
  description:
    "Industrial inspection equipment rental, sales, calibration & repair. 35+ years serving NDT, RVI, PMI, X-Ray, and environmental monitoring across the U.S. with offices in La Porte TX, Groves TX, and Marietta GA.",
  tagline: "Industrial Inspection Equipment — Rental, Sales, Calibration & Repair",
  yearsInBusiness: 35,
  founded: 1990,
  email: "information@bndtrentals.com",
  primaryPhone: "281-941-4311",
  primaryPhoneTel: "+12819414311",
} as const;

export type Location = {
  city: string;
  state: string;
  region: string;
  street: string;
  cityState: string;
  zip: string;
  phone: string;
  phoneTel: string;
  isHq?: boolean;
  mapsQuery: string;
};

export const LOCATIONS: Location[] = [
  {
    city: "La Porte",
    state: "TX",
    region: "Gulf Coast HQ",
    street: "832 S. Broadway St.",
    cityState: "La Porte, Texas",
    zip: "77571",
    phone: "281-941-4311",
    phoneTel: "+12819414311",
    isHq: true,
    mapsQuery: "832 S Broadway St, La Porte, TX 77571",
  },
  {
    city: "Groves",
    state: "TX",
    region: "East Texas",
    street: "2929 W Parkway St.",
    cityState: "Groves, TX",
    zip: "77619",
    phone: "409-433-8158",
    phoneTel: "+14094338158",
    mapsQuery: "2929 W Parkway St, Groves, TX 77619",
  },
  {
    city: "Marietta",
    state: "GA",
    region: "Southeast",
    street: "1710 Cumberland Point, Suite 10",
    cityState: "Marietta, GA",
    zip: "30067",
    phone: "470-633-0212",
    phoneTel: "+14706330212",
    mapsQuery: "1710 Cumberland Point Dr SE Suite 10, Smyrna, GA 30067",
  },
];

export const NAV_PRIMARY = [
  { label: "Equipment", href: "/equipment" },
  { label: "Applications", href: "/applications" },
  { label: "Calibration", href: "/calibration" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const NAV_EQUIPMENT = [
  { label: "NDT", href: "/equipment/ndt" },
  { label: "RVI", href: "/equipment/rvi" },
  { label: "PMI", href: "/equipment/pmi" },
  { label: "X-Ray", href: "/equipment/x-ray" },
  { label: "Environmental", href: "/equipment/environmental" },
  { label: "Accessories", href: "/equipment/accessories" },
  { label: "Consumables", href: "/equipment/consumables" },
];

export const NAV_FOOTER_LEGAL = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Sitemap", href: "/sitemap.xml" },
];

export const SOCIAL_PROOF = {
  yearsInBusiness: 35,
  locationCount: 3,
  equipmentCount: 100,
  industriesServed: 10,
};
