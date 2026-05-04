export type ApplicationDetail = {
  abbr: string;
  name: string;
  fullName?: string;
  blurb: string;
  longDescription: string;
  techniques?: { code: string; name: string; applications: string[] }[];
  equipment?: { name: string; manufacturer?: string; image?: string }[];
  applications?: string[];
  sectors?: string[];
};

export type ApplicationHubItem = {
  slug: string;
  abbr: string;
  name: string;
  blurb: string;
  image: string;
  href: string;
};

export const APP_HUB: ApplicationHubItem[] = [
  {
    slug: "ndt",
    abbr: "NDT",
    name: "Non-Destructive Testing",
    blurb:
      "Inspect or measure without doing harm. Ultrasonic, eddy current, radiographic, magnetic particle, penetrant, and visual testing across pressure vessels, welds, and pipelines.",
    image: "ndt-img.jpg",
    href: "/applications/ndt",
  },
  {
    slug: "rvi",
    abbr: "RVI",
    name: "Remote Visual Inspection",
    blurb:
      "Robotic crawlers, videoscopes, and push cameras let you inspect pipes, vessels, and confined spaces from a safe distance. No man-entry permit required.",
    image: "rvi-img.jpg",
    href: "/applications/rvi",
  },
  {
    slug: "pmi",
    abbr: "PMI",
    name: "Positive Material Identification",
    blurb:
      "Quick, non-destructive analysis of alloy composition. XRF, OES, and LIBS analyzers verify materials, check carbon content, and screen incoming stock.",
    image: "pmi-img.jpg",
    href: "/applications/pmi",
  },
];

export const APPLICATIONS: Record<string, ApplicationDetail> = {
  ndt: {
    abbr: "NDT",
    name: "Non-Destructive Testing",
    fullName: "Non-Destructive Testing (NDT) / Non-Destructive Evaluation (NDE)",
    blurb:
      "Inspect or measure without doing harm. Six core techniques cover everything from weld inspection to corrosion monitoring.",
    longDescription:
      "Non-Destructive Testing (NDT), also called Non-Destructive Evaluation (NDE), uses noninvasive techniques to determine the integrity of a material, component, or structure — or quantitatively measure some characteristic of an object. There are different NDT techniques used across industry, each ideal for different applications.",
    techniques: [
      {
        code: "UT",
        name: "Ultrasonic Testing",
        applications: [
          "Lamination scans",
          "Crack detection",
          "Weld Inspection",
          "Corrosion Monitoring",
          "Inspection of pressure vessels and storage tanks",
        ],
      },
      {
        code: "ET",
        name: "Eddy Current Testing",
        applications: [
          "Tube inspection",
          "Corrosion monitoring",
          "Heat treat verification",
          "Thin material thickness",
          "Coating thickness",
          "Surface breaking cracks",
          "Material conductivity assessment",
        ],
      },
      {
        code: "RT",
        name: "Radiographic Testing",
        applications: [
          "Weld Inspection",
          "Product Inspection",
          "Pipelines",
        ],
      },
      {
        code: "MT",
        name: "Magnetic Particle Testing",
        applications: [
          "Surface and near-surface flaw detection",
          "Weld inspection",
          "Forgings and castings",
        ],
      },
      {
        code: "PT",
        name: "Penetrant Testing",
        applications: [
          "Surface flaw detection on non-porous materials",
          "Aerospace component inspection",
          "Welds and castings",
        ],
      },
      {
        code: "VT",
        name: "Visual Testing",
        applications: [
          "First-line inspection technique",
          "Surface condition assessment",
          "Documentation of welds, coatings, and corrosion",
        ],
      },
      {
        code: "HT",
        name: "Hardness Testing",
        applications: [
          "Examining material properties",
          "Measuring wear resistance",
          "Damage assessment",
        ],
      },
    ],
    sectors: [
      "Oil & Gas",
      "Pipelines",
      "Petroleum Refining",
      "Chemical",
      "Power Generation",
      "Aviation",
      "Pulp & Paper",
      "Manufacturing",
    ],
  },

  rvi: {
    abbr: "RVI",
    name: "Remote Visual Inspection",
    fullName: "Remote Visual Inspection (RVI)",
    blurb:
      "Inspect equipment and structures from a safe distance using cameras, crawlers, and videoscopes — no man-entry required.",
    longDescription:
      "Remote Visual Inspection (RVI) is an inspection technique that uses tools and technology to remotely examine equipment and structures such as pipelines, large vessels, sewer lines, air ducts, reactors, and more. With RVI, inspectors can take a look at the required areas from a distance without putting themselves in harm's way — especially in narrow and confined spaces that may have hazardous environments.",
    equipment: [
      { name: "Olympus IPLEX MX II / LX", manufacturer: "Olympus", image: "Olympus_IPLEX_MX_II.jpg" },
      { name: "Pearpoint P542", manufacturer: "Pearpoint", image: "pro-2.png" },
      { name: "Wohler VIS 350", manufacturer: "Wohler", image: "Wohler-VIS-350.jpg" },
      { name: "RIDGID SeeSnake", manufacturer: "RIDGID", image: "pro9.jpg" },
      { name: "Pearpoint P550 Crawler", manufacturer: "Pearpoint", image: "pro-1.png" },
      { name: "Inuktun VT150", manufacturer: "Eddyfi Inuktun", image: "Inuktun-VT-150.png" },
      { name: "FLIR Thermal Camera", manufacturer: "FLIR", image: "MicrosoftTeams-imag.jpeg" },
    ],
    applications: [
      "Sewer and storm drain inspections",
      "Hydroelectric pipe and infrastructure",
      "Tanks and pressure vessels",
      "Oil & gas refineries and pipelines",
      "Railroad tank cars",
      "Steam headers",
      "Pulp and paper",
    ],
    sectors: [
      "Oil & Gas",
      "Pipelines",
      "Municipalities",
      "Power Generation",
      "Pulp & Paper",
      "Refining",
    ],
  },

  pmi: {
    abbr: "PMI",
    name: "Positive Material Identification",
    fullName: "Positive Material Identification (PMI)",
    blurb:
      "Quick, non-destructive composition analysis. XRF for most alloys, OES for carbon-bearing steels, LIBS for the lightest elements.",
    longDescription:
      "Positive Material Identification (PMI) is a quick, non-destructive analysis technique to determine the composition of materials — especially alloys and crystalline structures. There are three main PMI techniques used to measure product and determine the constituents of materials.",
    techniques: [
      {
        code: "XRF",
        name: "X-Ray Fluorescence",
        applications: [
          "Metal alloy verification",
          "Lead paint analysis",
          "Soil contaminant screening",
          "Scrap metal sorting",
        ],
      },
      {
        code: "OES",
        name: "Optical Emission Spectrometry",
        applications: [
          "Carbon content measurement (low-level C)",
          "Steel grade verification",
          "Detecting elements XRF can't see (Be, Li, B)",
        ],
      },
      {
        code: "LIBS",
        name: "Laser-Induced Breakdown Spectroscopy",
        applications: [
          "Lightest-element detection (H, Li, Be, B, C)",
          "Carbon equivalency for weld procedures",
          "Field alloy verification with no radiation source",
        ],
      },
    ],
    equipment: [
      { name: "Thermo Scientific Niton XL3t", manufacturer: "Thermo Scientific", image: "Thermo_Niton_XL3T.jpg" },
      { name: "Thermo Scientific Niton XL2 980 GOLDD", manufacturer: "Thermo Scientific", image: "Niton-XL2-980-Gold.jpg" },
      { name: "Olympus DELTA Professional", manufacturer: "Olympus", image: "Delta-box-item.jpg" },
      { name: "SciAps Z-Series Handheld LIBS", manufacturer: "SciAps", image: "SciAps-Z-Series-HH-LIBS-600x744-1.jpg" },
    ],
    applications: [
      "Material verification / Identification",
      "Chemical composition",
      "Soil Analysis",
      "Alloy Analysis",
      "Lead paint Analysis",
      "Carbon content",
    ],
    sectors: [
      "Oil & Gas",
      "Refining",
      "Power Generation",
      "Aerospace",
      "Manufacturing",
      "Scrap & Recycling",
    ],
  },
};
