// Burton NDT Rentals equipment catalog.
// Sourced from the live site (www.bndtrentals.com) — names, manufacturers, image filenames preserved verbatim.
// Spec-sheet PDFs scraped from the live site live in /public/pdfs/.

export type Product = {
  slug: string;
  name: string;
  manufacturer?: string;
  image: string;
  description?: string;
  applications?: string[];
  pdf?: string;
};

export type Subcategory = {
  name: string;
  description?: string;
  products: Product[];
};

export type EquipmentCategory = {
  slug: string;
  short: string;
  name: string;
  tagline: string;
  description: string;
  applications: string[];
  heroImage?: string;
  subcategories: Subcategory[];
};

export const CATEGORIES: EquipmentCategory[] = [
  {
    slug: "ndt",
    short: "NDT",
    name: "Non-Destructive Testing",
    tagline: "Eddy current, ultrasonic, hardness, magnetic particle, ACFM, vacuum boxes & tank floor scanning.",
    description:
      "The largest and deepest part of our fleet — flaw detectors, thickness gauges, hardness testers, ultrasonic scanners, and inspection accessories from Olympus, Eddyfi, Sonatest, Fischer, Parker Research, Spectroline, GE, Proceq, Promag, and FARO.",
    applications: [
      "Lamination scans",
      "Crack detection",
      "Weld inspection",
      "Corrosion monitoring",
      "Pressure vessel & storage tank inspection",
      "Heat treat verification",
      "Surface-breaking crack detection",
      "Material conductivity assessment",
    ],
    subcategories: [
      {
        name: "Eddy Current Flaw Detectors",
        products: [
          {
            slug: "eddyfi-ectane-2",
            name: "Eddyfi Ectane 2",
            manufacturer: "Eddyfi",
            image: "eddyfi.jpg",
            description: "Multi-technology eddy current and electromagnetic test instrument. Supports conventional ET, ECA, NFA, NFT, and PEC for tube, surface, and corrosion applications.",
            applications: ["Heat exchanger tube inspection", "Surface crack detection", "Pulsed eddy current corrosion under insulation"],
            pdf: "201908_Eddyfi-ECTANE2-specification-sheet_8_5x11-01.pdf",
          },
          {
            slug: "olympus-nortec-600",
            name: "Olympus NORTEC 600",
            manufacturer: "Olympus",
            image: "Olympus-Nortec-600.jpg",
            description: "Portable eddy current flaw detector with mixed-channel imaging, conductivity & coating thickness, and large color display. Built for surface and weld crack detection.",
            applications: ["Surface and weld crack detection", "Conductivity measurement", "Coating thickness"],
            pdf: "Olympus-Nortec-600-Eddy-Current-Flaw-Detector-Brochure.pdf",
          },
          {
            slug: "eddyfi-lyft",
            name: "Eddyfi Lyft",
            manufacturer: "Eddyfi",
            image: "pro4.jpg",
            description: "Pulsed eddy current (PEC) instrument designed to detect corrosion under insulation, fireproofing, marine growth, and concrete coatings without removing the cover.",
            applications: ["Corrosion under insulation (CUI)", "Corrosion under fireproofing", "Marine growth screening"],
            pdf: "LYFT.pdf",
          },
          {
            slug: "eddyfi-reddy",
            name: "Eddyfi Reddy",
            manufacturer: "Eddyfi",
            image: "eddyfireddy.png",
            description: "Compact handheld eddy current and ECA flaw detector. Touchscreen interface, surface array probes, and weld scanning capability in one unit.",
            applications: ["Surface crack inspection", "Weld inspection (ECA)", "Bolt hole inspection"],
            pdf: "Eddyfi_Reddy_Specification_Sheet_1-1.pdf",
          },
        ],
      },
      {
        name: "Ultrasonic Thickness Gauges",
        products: [
          {
            slug: "olympus-38dl-plus",
            name: "Olympus 38DL Plus",
            manufacturer: "Olympus",
            image: "olympus-38DL.jpg",
            description: "Industry-standard ultrasonic thickness gauge with corrosion measurement and through-coating thickness. Datalogger built in, color VGA display.",
            applications: ["Corrosion thickness", "Through-coat measurement", "High-temperature thickness"],
            pdf: "Olympus-38DL-PLUS-Thickness-Gauge-Brochure.pdf",
          },
          {
            slug: "sonatest-tgage-v",
            name: "Sonatest T-Gage V Series",
            manufacturer: "Sonatest",
            image: "pro5.jpg",
            description: "Rugged ultrasonic thickness gauge for corrosion, casting, and pipe wall measurement. Through-coat capability and A-scan display options.",
            applications: ["Corrosion mapping", "Casting thickness", "Pipe wall measurement"],
            pdf: "Sonatest_V-Gage.pdf",
          },
          {
            slug: "cygnus-1-is-ut-meter",
            name: "Cygnus Intrinsically Safe UT Meter",
            manufacturer: "Cygnus",
            image: "C1-with-certificates-web.png",
            description: "ATEX/IECEx intrinsically safe ultrasonic thickness gauge for use in Zone 0, 1, and 2 hazardous areas. Multi-echo measurement ignores coatings.",
            applications: ["Hazardous area thickness", "Through-coat measurement", "Offshore inspection"],
            pdf: "cygnus-1-intrinsically-safe-datasheet-iss6.pdf",
          },
        ],
      },
      {
        name: "Hardness Testers",
        products: [
          {
            slug: "teleweld-telebrineller-kit",
            name: "Teleweld Telebrineller Kit",
            manufacturer: "Teleweld",
            image: "TELEBRINELLER-PIC.jpg",
            description: "Brinell hardness comparison test kit. Compares the impression made on the test piece to a calibrated standard bar — fast, repeatable, no batteries.",
            applications: ["Field Brinell hardness testing", "Weld procedure qualification", "PWHT verification"],
            pdf: "Teleweld-Teleweld-Tellebrineller-Kit-Spec-Sheet.pdf",
          },
          {
            slug: "ge-mic-10",
            name: "GE MIC-10",
            manufacturer: "GE",
            image: "GE-Mic-10-Hardness-Tester.jpg",
            description: "UCI ultrasonic hardness tester for forged, heat-treated, and welded components. Handheld, fast, and works on small or thin parts that defy Brinell.",
            applications: ["Welded joints", "Heat-treated parts", "Small or curved surfaces"],
            pdf: "GE-MIC-10-Hardness-Meter-Brochure.pdf",
          },
          {
            slug: "proceq-equotip-3",
            name: "Proceq Equotip 3",
            manufacturer: "Proceq",
            image: "Proceq_Equotip_3.jpg",
            description: "Leeb-rebound portable hardness tester with multiple impact devices for any surface condition or size. Reads in HL, HV, HB, HRC, HRB, HS, MPa.",
            applications: ["Field hardness testing", "Heavy castings & forgings", "Heat treat verification"],
            pdf: "Proceq_Equotip3_Brochure.pdf",
          },
          {
            slug: "sonodur-3",
            name: "SonoDur 3",
            manufacturer: "NewSonic",
            image: "SonoDur-3.png",
            description: "UCI ultrasonic hardness tester. Excellent for welds, HAZ inspection, and small parts. Color touchscreen and onboard reporting.",
            applications: ["Weld and HAZ hardness", "Small geometry testing", "Surface-treatment verification"],
            pdf: "NewSonic_SonoDur3_Flyer_A4_8S_EN.pdf",
          },
        ],
      },
      {
        name: "Ultrasonic Flaw Detectors",
        products: [
          {
            slug: "accutrak-lt-12",
            name: "Accutrack LT-12",
            manufacturer: "Accutrak",
            image: "accutrack-LT-12.jpg",
            description: "Portable ultrasonic flaw detector for general weld inspection, corrosion monitoring, and bond testing. Lightweight design for in-the-field use.",
            applications: ["Weld inspection", "Corrosion monitoring", "Lamination scanning"],
            pdf: "2021-AccuTrak-Brochure.pdf",
          },
          {
            slug: "olympus-epoch-650",
            name: "Olympus EPOCH 650",
            manufacturer: "Olympus",
            image: "Olympus-Epoch-650.jpg",
            description: "Industry-leading conventional UT flaw detector with full inspection feature set, AWS D1.1/D1.5 weld inspection, and DGS/AVG sizing.",
            applications: ["Weld inspection", "AWS D1.1 / D1.5 sizing", "Composite inspection"],
            pdf: "Olympus_EPOCH_650_Flaw_Detector_Brochure.pdf",
          },
          {
            slug: "olympus-omniscan-mx2",
            name: "Olympus OmniScan MX2",
            manufacturer: "Olympus",
            image: "Olympus-Omniscan-MX2.jpg",
            description: "Phased-array UT and ECA modular flaw detector. The PA workhorse for code inspection, corrosion mapping, and complex weld geometries.",
            applications: ["Phased-array weld inspection", "Corrosion mapping", "TFM imaging"],
            pdf: "Olympus_OmniScan_MX2_Brochure.pdf",
          },
          {
            slug: "olympus-omniscan-x3",
            name: "Olympus OmniScan X3",
            manufacturer: "Olympus",
            image: "OMNIX3.jpg",
            description: "Next-gen phased-array flaw detector with Total Focusing Method (TFM) and 32:128 standard. Faster setup, easier reporting, advanced imaging.",
            applications: ["Advanced PA / TFM", "Code-compliant weld inspection", "Real-time imaging"],
            pdf: "olympus-omniscan-x3-data-sheet.pdf",
          },
          {
            slug: "sonatest-sitescan-d-plus",
            name: "Sonatest Sitescan D+",
            manufacturer: "Sonatest",
            image: "Sonatest_Sitescan_D.jpg",
            description: "Rugged UT flaw detector built for the field. Excellent battery life, sunlight-readable display, and AWS / API setup wizards.",
            applications: ["Field weld inspection", "Corrosion monitoring", "Forging inspection"],
            pdf: "Sitescan_D_Series_brochure.pdf",
          },
          {
            slug: "aut-weldscan",
            name: "AUT Weldscan",
            manufacturer: "AUT",
            image: "weldscan-pic.jpg",
            description: "Automated ultrasonic weld inspection scanner. Magnetic crawler with phased-array probes for pipeline girth weld coverage.",
            applications: ["Pipeline girth weld AUT", "Process pipe inspection", "Code-compliant scanning"],
            pdf: "AUT-Spec-sheet.pdf",
          },
        ],
      },
      {
        name: "3D Laser Scanners",
        products: [
          {
            slug: "faro-focus-laser-scanner",
            name: "FARO Focus Laser Scanner",
            manufacturer: "FARO",
            image: "pro8.jpg",
            description: "High-speed 3D terrestrial laser scanner. Captures detail on plant and structural assets for as-built modeling and dimensional verification.",
            applications: ["As-built scanning", "Tank dimensional capture", "Plant 3D modeling"],
            pdf: "FARO-Focus-S-Series-Technical-Specifications.pdf",
          },
          {
            slug: "gssi-mini-xt-concrete-scanner",
            name: "GSSI MINI XT Concrete Scanner",
            manufacturer: "GSSI",
            image: "GSSI-MINI-XT-CONCRETE-SCANNER-PIC.jpg",
            description: "Ground penetrating radar (GPR) for concrete inspection. Locates rebar, post-tension cables, conduits, and voids before drilling or coring.",
            applications: ["Rebar / PT cable location", "Concrete slab inspection", "Pre-coring scanning"],
          },
        ],
      },
      {
        name: "Coating & Paint Inspection",
        products: [
          {
            slug: "fischer-fmp30-deltascope",
            name: "Fischer FMP30 Deltascope",
            manufacturer: "Fischer",
            image: "Fischer_FMP30_Deltascope.JPG.jpg",
            description: "Coating thickness gauge for non-magnetic coatings on steel substrates. Magnetic-induction measuring principle, calibrated probes.",
            applications: ["Paint thickness on steel", "Galvanized coating thickness", "Powder coat inspection"],
            pdf: "Fischer_FMP30_Deltascope_Coating_Thickness_Meter_Brochure.pdf",
          },
        ],
      },
      {
        name: "Ferrite Content Testing",
        products: [
          {
            slug: "fischer-fmp30-feritscope",
            name: "Fischer FMP30 Feritscope",
            manufacturer: "Fischer",
            image: "Fischer_FMP30_Feritescope.JPG.jpg",
            description: "Measures ferrite content in austenitic and duplex stainless steel weld deposits. Reads in WRC ferrite number (FN) or % Fe.",
            applications: ["Stainless duplex weld FN testing", "Cladding ferrite measurement", "Ferrite mapping"],
            pdf: "BROC_FMP30_FERITSCOPE.pdf",
          },
        ],
      },
      {
        name: "ACFM Systems",
        products: [
          {
            slug: "eddyfi-tsc-amigo-2",
            name: "Eddyfi TSC Amigo 2",
            manufacturer: "Eddyfi",
            image: "pro1.jpg",
            description: "Portable ACFM (Alternating Current Field Measurement) system. Detects and sizes surface-breaking cracks through paint and coatings — no surface prep.",
            applications: ["Through-coating crack detection", "Offshore weld inspection", "Refinery turnaround inspection"],
            pdf: "AMIGO2.pdf",
          },
        ],
      },
      {
        name: "Magnetic Particle Inspection",
        products: [
          {
            slug: "parker-research-tb-10",
            name: "Parker Research TB-10 (10lb Weight)",
            manufacturer: "Parker Research",
            image: "Parker_Research_10LB_Weight_-_No_background_.jpg",
            description: "10-lb portable magnetic yoke for AC/DC magnetic particle inspection. ASTM E709 compliant, lifts 10 lbs (DC) for verification.",
            applications: ["MT field inspection", "Weld inspection", "Crack detection"],
            pdf: "Parker_Research_10lb_Weight_Brochure.pdf",
          },
          {
            slug: "spectroline-vintage-365",
            name: "Spectroline Vintage 365 (Blacklight)",
            manufacturer: "Spectroline",
            image: "Spectroline-Vintage365-2.jpg",
            description: "High-intensity 365 nm UV-A blacklight for fluorescent magnetic particle and dye penetrant inspection. ASTM E1417 / E1444 compliant.",
            applications: ["Fluorescent MT", "Fluorescent PT", "ASTM E1417 / E1444 inspection"],
            pdf: "Black-Light-SPECTROLINE-VINTAGE-365-LED-UV-BLACKLIGHT-BROCHURE.pdf",
          },
          {
            slug: "parker-research-b-100",
            name: "Parker Research B-100 (Yoke)",
            manufacturer: "Parker Research",
            image: "pro-4.png",
            description: "AC magnetic particle yoke for portable inspection. Lightweight, articulating legs, ASTM E709 compliant.",
            applications: ["AC magnetic particle", "Weld inspection", "Surface crack detection"],
            pdf: "Parker_Research_B-100_AC_Yoke_Brochure.pdf",
          },
          {
            slug: "spectroline-dlm-1000",
            name: "Spectroline DLM-1000 White Light Meter",
            manufacturer: "Spectroline",
            image: "DLM1000.jpg",
            description: "Combination UV-A and white-light meter. Measures intensity for ASTM E1417/E1444/E3022 quality assurance.",
            applications: ["UV intensity verification", "White-light measurement", "QA documentation"],
            pdf: "TECHNICAL-DATA-MODEL-DLM-1000.pdf",
          },
          {
            slug: "spectroline-365-blacklight",
            name: "Spectroline 365 Series Blacklight",
            manufacturer: "Spectroline",
            image: "365-PIC.jpg",
            description: "Standard-series UV-A blacklight for fluorescent inspection. Multiple form factors for shop and field use.",
            applications: ["Fluorescent MT/PT", "Shop inspection", "Field crack detection"],
            pdf: "UV-365-Standard-Series-Flyer_A18025-6.pdf",
          },
          {
            slug: "optilux-365-flashlight",
            name: "OptiLUX 365 Flashlight",
            manufacturer: "Spectroline",
            image: "OptiLUX-365-Flashlight-pic.jpg",
            description: "High-intensity 365 nm UV-A flashlight with rechargeable lithium-ion battery. Compact, lightweight, ASTM-compliant for FPI/MPI.",
            applications: ["Field FPI inspection", "Confined space PT", "Quick-access crack detection"],
          },
          {
            slug: "labino-apollo-2-standard",
            name: "Labino Apollo 2.0 Standard Kit",
            manufacturer: "Labino",
            image: "Labino-Apollo-2.0-Standard-Kit-with-Case_475x316.jpg",
            description: "High-output UV-A LED lamp kit for fluorescent magnetic particle and dye penetrant inspection. Includes case, filter, and accessories.",
            applications: ["High-intensity fluorescent inspection", "Aerospace FPI/MPI", "Critical-component inspection"],
          },
          {
            slug: "promag-magnetic-yoke",
            name: "Promag Magnetic Yoke",
            manufacturer: "Promag",
            image: "Promag-Magnetic-Yoke.jpg",
            description: "Promag Y-2 AC/DC magnetic particle yoke. Articulating legs, rugged construction, AC/DC switchable.",
            applications: ["MT inspection", "Field weld inspection", "Crack detection"],
            pdf: "PROMAG_Magnetic_Yoke.pdf",
          },
          {
            slug: "promag-blacklight",
            name: "Promag Blacklight",
            manufacturer: "Promag",
            image: "Promag-Blacklight.jpg",
            description: "UV-A LED blacklight for fluorescent inspection. Battery and corded options.",
            applications: ["Fluorescent MT", "Fluorescent PT", "Shop and field inspection"],
            pdf: "PROMAG_Victory_Blacklight.pdf",
          },
          {
            slug: "magnaflux-yokes",
            name: "Magnaflux Y-7 / Y-8 Yokes",
            manufacturer: "Magnaflux",
            image: "Magnaflux-Products.png",
            description: "Magnaflux AC and AC/DC magnetic particle yokes — industry-standard articulating-leg design for portable MPI.",
            applications: ["MT field inspection", "Weld inspection", "Crack detection"],
            pdf: "y-2_yoke_product-data-sheet.pdf",
          },
          {
            slug: "apollo-digital-light",
            name: "Apollo Digital Light",
            manufacturer: "Labino",
            image: "Labino-Apollo-2.0-Standard-Kit-with-Case_475x316.jpg",
            description: "Labino Apollo digital UV-A inspection light. Onboard intensity readout, swappable battery.",
            applications: ["Fluorescent MT/PT", "Aerospace inspection", "Critical-component inspection"],
          },
        ],
      },
      {
        name: "Vacuum Boxes",
        products: [
          {
            slug: "vacuum-box-30-flat",
            name: "30-inch Flat Vacuum Box",
            image: "VACUUM-BOX-30-FLAT.jpg",
            description: "30-inch flat-area vacuum box for soap-bubble leak testing of weld seams. Tempered glass viewing window, gauge, and hose.",
            applications: ["Bubble leak test (LT)", "Tank floor weld inspection", "Pipe weld inspection"],
            pdf: "FUG-InstructionSheet-VacuumBoxes.pdf",
          },
          {
            slug: "vacuum-box-30-corner",
            name: "30-inch Corner Vacuum Box",
            image: "VACUUM-BOX-CORNER.jpg",
            description: "30-inch corner/angle vacuum box for testing weld seams at floor-to-shell intersections.",
            applications: ["Tank floor-to-shell joint testing", "Corner weld leak detection"],
            pdf: "FUG-InstructionSheet-VacuumBoxes-1.pdf",
          },
          {
            slug: "vacuum-box-18-corner",
            name: "18-inch Corner Vacuum Box",
            image: "18-in-Corner-vacuum-box.jpg",
            description: "Compact 18-inch corner vacuum box for tight-access weld leak testing.",
            applications: ["Confined-space leak testing", "Compact joint inspection"],
          },
        ],
      },
      {
        name: "Tank Floor Scanner",
        products: [
          {
            slug: "tank-floor-scanner",
            name: "Tank Floor Scanner",
            image: "picture-1.jpg",
            description: "Magnetic flux leakage (MFL) tank floor scanner for above-ground storage tank floor inspection. Detects topside and underside corrosion.",
            applications: ["AST floor inspection (API 653)", "MFL floor scanning", "Topside / underside corrosion mapping"],
            pdf: "Tank-floor-scanner-Spec-sheet.pdf",
          },
        ],
      },
    ],
  },

  {
    slug: "rvi",
    short: "RVI",
    name: "Remote Visual Inspection",
    tagline: "Robotic crawlers, videoscopes, push cameras, and tank inspection systems.",
    description:
      "Inspect pipelines, tanks, vessels, ducts, and confined spaces from a safe distance. Crawlers and tractors for 6\" diameter pipes and larger; videoscopes and push cameras for tighter inspections; thermal imaging for elevated-temperature work.",
    applications: [
      "Sewer and storm drain inspections",
      "Hydroelectric pipe and infrastructure",
      "Tank and pressure vessel inspection",
      "Oil & gas refineries and pipelines",
      "Railroad tank cars",
      "Steam headers",
      "Pulp and paper",
    ],
    subcategories: [
      {
        name: "Robotic Crawlers",
        products: [
          {
            slug: "eddyfi-inuktun-versatrax-150",
            name: "Eddyfi Inuktun Versatrax 150",
            manufacturer: "Eddyfi Inuktun",
            image: "Inuktun-VT-150.png",
            description: "Magnetic-tracked robotic crawler for inspections in 6\" diameter pipes and larger. Submersible to 100m, modular camera and tooling payloads.",
            applications: ["Pipe internal inspection", "Tank floor / wall inspection", "Submersed pipe inspection"],
            pdf: "Eddyfi_Inuktun-Versatrax-150-Specifications-01-1.pdf",
          },
          {
            slug: "pearpoint-flexitrax-p550c",
            name: "Pearpoint flexitrax P550C",
            manufacturer: "Pearpoint",
            image: "pro-1.png",
            description: "Heavy-duty pipeline crawler system for 6\"–48\" pipes. Pan/tilt/zoom camera, on-board lighting, modular wheel sets for varying pipe diameters.",
            applications: ["Sewer line inspection", "Storm drain inspection", "Pipeline condition assessment"],
            pdf: "Pearpoint_flexitrax-p550c-brochure-02.pdf",
          },
        ],
      },
      {
        name: "Videoscopes & Borescopes",
        products: [
          {
            slug: "olympus-iplex-mx-ii",
            name: "Olympus IPLEX MX II",
            manufacturer: "Olympus",
            image: "Olympus_IPLEX_MX_II.jpg",
            description: "High-image-quality industrial videoscope. Articulating tip, multiple insertion tube diameters and lengths, measurement capability.",
            applications: ["Aerospace engine inspection", "Heat exchanger tube inspection", "Internal turbine inspection"],
            pdf: "Olympus_IPLEX_MX2_2010-1.pdf",
          },
          {
            slug: "olympus-iplex-lx",
            name: "Olympus IPLEX LX",
            manufacturer: "Olympus",
            image: "pro-5.png",
            description: "Premium portable videoscope with articulating tip, stereo measurement, and excellent image quality. Field-ready for confined-space inspection.",
            applications: ["Field videoscope inspection", "Stereo measurement", "Pressure vessel internal inspection"],
            pdf: "Olympus_Industrial_Videoscope_IPEX_LX__LT.pdf",
          },
          {
            slug: "wohler-vis-350",
            name: "Wohler VIS 350",
            manufacturer: "Wohler",
            image: "Wohler-VIS-350.jpg",
            description: "Pushrod videoscope for chimney, duct, and pipe inspection. Self-leveling color camera, on-screen meter counter, recordable video.",
            applications: ["Chimney inspection", "HVAC duct inspection", "Drain & vent inspection"],
            pdf: "Wohler-VIS-350-Pushrod-Inspection-System-Brochure.pdf",
          },
        ],
      },
      {
        name: "Pushrod Cameras",
        products: [
          {
            slug: "pearpoint-flexiprobe-p540c",
            name: "Pearpoint flexiprobe P540c",
            manufacturer: "Pearpoint",
            image: "pro-2.png",
            description: "Mid-size pushrod CCTV system for laterals, building drains, and small mainlines. Color self-leveling camera, sonde, integrated reel.",
            applications: ["Lateral line inspection", "Building drain inspection", "Sewer mainline inspection"],
            pdf: "Pearpoint_P540C_Brochure.pdf",
          },
          {
            slug: "forbest-pushrod-camera",
            name: "Forbest Pushrod Camera",
            manufacturer: "Forbest",
            image: "forbest-pic.jpg",
            description: "Affordable pushrod CCTV for plumbers and small contractors. Color camera, multiple rod lengths.",
            applications: ["Plumbing inspection", "Drain and lateral inspection", "Quick-look field surveys"],
          },
          {
            slug: "ridgid-seesnake-microreel",
            name: "RIDGID SeeSnake microReel",
            manufacturer: "RIDGID",
            image: "pro9.jpg",
            description: "Portable mid-range pushrod camera with built-in transmitter. 100ft and 200ft reel options.",
            applications: ["Service lateral inspection", "Plumbing pipe inspection", "Quick-deploy inspection"],
            pdf: "RIDGID-SEASNAKE.pdf",
          },
          {
            slug: "pearpoint-p374-is",
            name: "Pearpoint P374 I/S (Intrinsically Safe)",
            manufacturer: "Pearpoint",
            image: "pro11.jpg",
            description: "Intrinsically safe pushrod inspection system for hazardous-area use. ATEX/IECEx certified for Zone 1 and Zone 2.",
            applications: ["Hazardous area inspection", "Refinery drain inspection", "Petrochemical pipe inspection"],
            pdf: "PearPoint-P374-INTRINSICALLY.pdf",
          },
          {
            slug: "vevor-sewer-camera",
            name: "VEVOR Sewer Camera",
            manufacturer: "VEVOR",
            image: "VEVOR-Sewer-Camera.jpg",
            description: "Budget pushrod sewer camera with monitor and DVR. Good for short-runs and casual inspection.",
            applications: ["Light-duty sewer inspection", "Drain camera inspection"],
            pdf: "Vevor_Sewer_Camera.pdf",
          },
          {
            slug: "spartan-traveler-3",
            name: "Spartan Traveler 3 Camera w/ iPad",
            manufacturer: "Spartan",
            image: "Spartan-Traveler-3-Camera.jpg",
            description: "WiFi-enabled pushrod camera that streams to an iPad for viewing and recording.",
            applications: ["Plumbing & drain inspection", "Mobile pushrod inspection", "iPad-based recording"],
            pdf: "Spartan_Traveler3_Camera.pdf",
          },
        ],
      },
      {
        name: "Tank & Vessel Inspection Cameras",
        products: [
          {
            slug: "tank-vessel-inspection-camera",
            name: "Tank & Vessel Inspection Camera",
            image: "Pic.jpg",
            description: "Pole-mounted inspection camera for tank, vessel, and pit interiors. No man-entry required.",
            applications: ["Tank top-side inspection", "Vessel internal inspection", "Pit inspection"],
          },
          {
            slug: "ishot-camera",
            name: "iShot Camera",
            manufacturer: "iShot",
            image: "IShot_Camera.jpg",
            description: "High-temperature inspection camera for boilers, furnaces, and process equipment. Operates at temperatures up to 2000°F.",
            applications: ["Boiler inspection (online)", "Furnace inspection", "Refractory monitoring"],
          },
        ],
      },
      {
        name: "FOSAR — Foreign Object Search & Retrieval",
        products: [
          {
            slug: "sensor-networks-jaws-2",
            name: "Sensor Networks JAWS 2.0",
            manufacturer: "Sensor Networks",
            image: "pro12.jpg",
            description: "Magnetic foreign object retrieval tool. Recovers dropped tools, bolts, and debris from pipework, vessels, and tanks during turnarounds.",
            applications: ["Tool & part recovery", "Turnaround FOSAR", "Vessel cleanout"],
          },
        ],
      },
      {
        name: "Thermal Imaging Cameras",
        products: [
          {
            slug: "flir-thermal-camera",
            name: "FLIR Thermal Camera",
            manufacturer: "FLIR",
            image: "MicrosoftTeams-imag.jpeg",
            description: "Infrared thermography camera for predictive maintenance, electrical inspection, and refractory monitoring.",
            applications: ["Electrical hot-spot detection", "Refractory inspection", "Mechanical / motor inspection"],
          },
        ],
      },
    ],
  },

  {
    slug: "pmi",
    short: "PMI",
    name: "Positive Material Identification",
    tagline: "XRF, OES, and LIBS analyzers for alloy verification, chemical composition, and carbon content.",
    description:
      "Quick, non-destructive analysis of material composition. XRF, OES, and LIBS analyzers from Thermo Niton, Olympus, SciAps, and Hitachi for material verification, alloy analysis, lead paint analysis, and carbon content measurement.",
    applications: [
      "Material verification & identification",
      "Chemical composition analysis",
      "Alloy analysis",
      "Soil analysis",
      "Lead paint analysis",
      "Carbon content measurement",
    ],
    subcategories: [
      {
        name: "PMI Analyzers (XRF)",
        products: [
          {
            slug: "thermo-niton-xl3t",
            name: "Thermo Scientific Niton XL3t",
            manufacturer: "Thermo Scientific",
            image: "Thermo_Niton_XL3T.jpg",
            description: "Field-proven XRF analyzer for metals identification, soil analysis, and lead paint inspection. Color touchscreen, integrated camera.",
            applications: ["Alloy identification", "Soil heavy metals", "Lead paint inspection"],
            pdf: "Thermo_Niton-XL3t-Spec-Sheet.pdf",
          },
          {
            slug: "thermo-niton-xl2-980-goldd",
            name: "Thermo Scientific Niton XL2 980 GOLDD",
            manufacturer: "Thermo Scientific",
            image: "Niton-XL2-980-Gold.jpg",
            description: "GOLDD (Geometrically Optimized Large area Drift Detector) XRF analyzer with low-Z element capability. Fast metals and light-element analysis.",
            applications: ["Light-element alloy analysis", "Sulfur in petroleum", "RoHS / consumer goods"],
            pdf: "Thermo_Niton_XL2_GOLDD_Brochure.pdf",
          },
          {
            slug: "thermo-niton-xl5",
            name: "Thermo Scientific Niton XL5",
            manufacturer: "Thermo Scientific",
            image: "NITON-XL5-PIC.jpg",
            description: "Compact, lightweight XRF analyzer with high-resolution color touchscreen. Front-of-screen camera, micro-focus optics.",
            applications: ["Field alloy verification", "Scrap sorting", "Quality control"],
            pdf: "niton-xl5-plus-spec-sheet.pdf",
          },
          {
            slug: "olympus-delta-professional",
            name: "Olympus Delta Professional",
            manufacturer: "Olympus",
            image: "Delta-box-item.jpg",
            description: "High-performance XRF analyzer for alloy identification and grade matching. Integrated camera, rugged construction.",
            applications: ["Alloy ID", "Grade matching", "Scrap sorting"],
            pdf: "DELTA-Pro-spec-sheet-1.pdf",
          },
          {
            slug: "sciaps-x-550",
            name: "SciAps X-550",
            manufacturer: "SciAps",
            image: "SciAps-X-550.jpg",
            description: "Handheld XRF analyzer with Si-PIN detector. Compact, fast, and cost-effective for field PMI.",
            applications: ["Field alloy ID", "Scrap sorting", "QA verification"],
            pdf: "SciAps_X-550_SpecSheet_FEB23.pdf",
          },
          {
            slug: "sciaps-x-903",
            name: "SciAps X-903",
            manufacturer: "SciAps",
            image: "SciAps-X-903.jpg",
            description: "Premium handheld XRF with SDD detector. Excellent light-element performance, fast analysis times, integrated camera.",
            applications: ["Light-element alloy analysis", "RoHS testing", "Field PMI"],
          },
        ],
      },
      {
        name: "OES — Optical Emission Spectrometry",
        products: [
          {
            slug: "hitachi-pmi-master-pro",
            name: "Hitachi PMI-Master Pro",
            manufacturer: "Hitachi",
            image: "Hitachi_PMI_Master_Pr.jpeg",
            description: "Mobile arc/spark OES instrument. Measures carbon, sulfur, phosphorus, and nitrogen content — elements XRF cannot detect.",
            applications: ["Carbon content measurement", "L-grade vs standard SS verification", "Steel grade ID"],
          },
        ],
      },
      {
        name: "LIBS — Laser-Induced Breakdown Spectroscopy",
        products: [
          {
            slug: "sciaps-z-series-libs",
            name: "SciAps Z-Series Handheld LIBS",
            manufacturer: "SciAps",
            image: "SciAps-Z-Series-HH-LIBS-600x744-1.jpg",
            description: "Handheld LIBS analyzer for the lightest elements (H, Li, Be, B, C). Carbon equivalency for weld procedures, no radiation source — Z-900 series.",
            applications: ["Carbon equivalency for welding", "Light-element alloy analysis", "Field LIBS PMI"],
            pdf: "SciAps_Z-900_Series.pdf",
          },
        ],
      },
    ],
  },

  {
    slug: "x-ray",
    short: "X-Ray",
    name: "Industrial X-Ray Radiography",
    tagline: "Computed and digital radiography systems for weld inspection and product imaging.",
    description:
      "Digital radiography systems for industrial inspection — high-resolution imaging for welds, pipes, castings, and complex assemblies.",
    applications: [
      "Weld inspection",
      "Product inspection",
      "Pipelines",
      "Casting verification",
      "Corrosion under insulation",
    ],
    subcategories: [
      {
        name: "Computed Radiography",
        products: [
          {
            slug: "durr-cr-flex",
            name: "DÜRR NDT CR Flex",
            manufacturer: "DÜRR NDT",
            image: "CRxFlex-image.jpg",
            description: "Flexible computed radiography (CR) plate scanner for field NDT. Class A and B IP plate support, weatherproof case.",
            applications: ["Weld inspection (RT)", "Pipe corrosion under insulation", "Field digital RT"],
            pdf: "CRxFlex-Brochure.pdf",
          },
          {
            slug: "durr-cr-vision",
            name: "DÜRR NDT CR Vision",
            manufacturer: "DÜRR NDT",
            image: "image001.png",
            description: "High-resolution CR plate scanner for shop and lab inspection. Compatible with Class A, Class B, and Class C IP plates.",
            applications: ["Shop digital RT", "Casting & component inspection", "Aerospace RT"],
            pdf: "CR-Vision.pdf",
          },
        ],
      },
    ],
  },

  {
    slug: "environmental",
    short: "Environmental",
    name: "Environmental Monitoring",
    tagline: "Single & multi-gas monitors, VOC monitors, and coating pinhole detectors.",
    description:
      "H2S, O2, CO, LEL, and VOC monitoring for confined-space entry and refinery work. Plus pinhole detectors for coating integrity testing.",
    applications: [
      "Confined space entry monitoring",
      "Refinery turnaround safety",
      "VOC detection",
      "Pipeline leak detection",
      "Coating pinhole inspection",
    ],
    subcategories: [
      {
        name: "Single & Multi-Gas Monitors",
        products: [
          {
            slug: "honeywell-bw-microclip-xl",
            name: "Honeywell BW GasAlert MicroClip XL",
            manufacturer: "Honeywell BW",
            image: "Honeywell_BW_Microclip_XL.jpg",
            description: "Compact 4-gas monitor (H2S, CO, O2, LEL) for confined space entry. 2-year operating life, IP66/68 rated.",
            applications: ["Confined space entry", "Refinery turnaround safety", "Pre-entry monitoring"],
            pdf: "Honeywell_BW_MicroClip_XL_Brochure.pdf",
          },
          {
            slug: "honeywell-bw-clip-h2s-o2",
            name: "Honeywell BW Clip H2S / O2 (Single Gas)",
            manufacturer: "Honeywell BW",
            image: "pro15.jpg",
            description: "Maintenance-free 2- or 3-year single-gas monitor. No charging, no calibration, no sensor replacement — just clip and go.",
            applications: ["H2S monitoring", "O2 monitoring", "Worker personal monitoring"],
            pdf: "BWClip_Datasheet20150108-02-EN.pdf",
          },
          {
            slug: "honeywell-rae-arearae",
            name: "Honeywell RAE AreaRAE",
            manufacturer: "Honeywell RAE",
            image: "RAE_AreaRae_..jpg",
            description: "Wireless area gas monitor with up to 5 gas sensors (PID + 4 toxic/LEL). Real-time wireless reporting to base station.",
            applications: ["Perimeter monitoring", "HazMat response", "Refinery turnaround perimeter"],
            pdf: "RAE_AreaRAE_Spec_Sheet.pdf",
          },
          {
            slug: "spx-radiodetection-mgd-2002",
            name: "SPX Radiodetection MGD-2002 Leak Detector",
            manufacturer: "SPX Radiodetection",
            image: "Radiodetection_MGD2002_Leak_Detector.jpg",
            description: "Hand-held methane leak detector with semiconductor sensor. Audible & visual alarms, headphone output.",
            applications: ["Natural gas leak detection", "Pipeline survey", "Above-ground leak survey"],
            pdf: "Radiodetection_MGD2002_Leak_Detector_Spec_Sheet.pdf",
          },
        ],
      },
      {
        name: "VOC Monitors (Volatile Organic Compounds)",
        products: [
          {
            slug: "honeywell-rae-minirae-3000",
            name: "Honeywell RAE MiniRAE 3000",
            manufacturer: "Honeywell RAE",
            image: "rae_minirae_3000_2x.jpg",
            description: "Handheld photoionization detector (PID) for VOC measurement from low ppb to high ppm. 10.6 eV bulb, datalogging.",
            applications: ["VOC monitoring", "HazMat response", "Industrial hygiene"],
            pdf: "RAE_Minirae_3000.pdf",
          },
        ],
      },
      {
        name: "Coating Pinhole Detectors",
        products: [
          {
            slug: "defelsko-positest-lpd",
            name: "Defelsko PosiTest LPD Pinhole Detector",
            manufacturer: "Defelsko",
            image: "Pinhole-Detector.png",
            description: "Low-voltage wet sponge holiday/pinhole detector for coatings up to 20 mils. ASTM D5162 compliant.",
            applications: ["Coating holiday detection", "Tank lining inspection", "Pipeline coating inspection"],
            pdf: "PosiTestLPD.pdf",
          },
        ],
      },
    ],
  },

  {
    slug: "accessories",
    short: "Accessories",
    name: "Accessories & Calibration Blocks",
    tagline: "Calibration blocks, transducers, cables, and weld inspection kits.",
    description:
      "All the accessories you need to keep your inspection equipment producing reliable results — calibration standards, contact transducers, BNC cables, gas monitors, and complete weld inspection kits.",
    applications: [
      "Equipment calibration",
      "UT transducer replacement",
      "Cable & accessory rentals",
      "On-site H2S monitoring",
    ],
    subcategories: [
      {
        name: "Calibration Blocks",
        products: [
          {
            slug: "ut-thickness-5-step-block",
            name: "U.T Thickness 5-Step Calibration Block",
            image: "U.T_THICKNESS_BLOCK_-_5-STEP_BLOCK.jpg",
            description: "5-step ultrasonic thickness calibration block. Carbon steel, calibrated steps from 0.100\" to 0.500\".",
            applications: ["UT thickness gauge calibration", "Field reference standard"],
          },
          {
            slug: "shearwave-iiw-type-1",
            name: "Shearwave IIW Type 1 Block",
            image: "Shearwave-IIW-type-1-block-pic.jpg",
            description: "International Institute of Welding (IIW) Type 1 calibration block. Used for shear wave probe calibration on UT flaw detectors.",
            applications: ["Shear wave probe calibration", "Beam exit point setup", "Sensitivity calibration"],
          },
          {
            slug: "dsc-calibration-block",
            name: "DSC Calibration Block",
            image: "DSC-Calibration-block.png",
            description: "Distance / sensitivity calibration block for ultrasonic flaw detectors. Compact form factor for field calibration.",
            applications: ["UT flaw detector calibration", "Field DAC setup"],
          },
          {
            slug: "dc-test-block",
            name: "DC Test Block",
            image: "DC-test-block.png",
            description: "DC magnetic field test block for verifying yoke lift and field strength on magnetic particle inspection equipment.",
            applications: ["MT yoke verification", "DC field strength testing"],
          },
          {
            slug: "aws-wedges",
            name: "AWS Wedges",
            image: "AWS-Wedges.png",
            description: "AWS angle-beam wedges for ultrasonic shear wave inspection. 45°, 60°, and 70° options for code-compliant weld inspection.",
            applications: ["AWS D1.1 weld inspection", "Shear wave UT", "Angle beam inspection"],
          },
        ],
      },
      {
        name: "Power & Generators",
        products: [
          {
            slug: "ryobi-generator",
            name: "Ryobi Portable Generator",
            manufacturer: "Ryobi",
            image: "IMG_0321-225x300.jpg",
            description: "Portable inverter generator for field power. Pairs with any rental that needs AC power on remote job sites.",
            applications: ["Remote site power", "Field-equipment AC source", "Portable inspection power"],
          },
          {
            slug: "batteries",
            name: "Replacement Batteries",
            image: "Batteries-Pic.png",
            description: "Replacement and spare batteries for our rental fleet. Add to any order to keep crews working a full shift.",
            applications: ["Field equipment battery swap", "Spare battery rental"],
          },
        ],
      },
      {
        name: "Transducers & Cables",
        products: [
          {
            slug: "contact-transducers",
            name: "Contact Transducers",
            image: "Contact-Transducers.jpg",
            description: "Replacement contact UT transducers in standard frequencies and diameters (2.25, 5, 10 MHz; 0.25\", 0.5\").",
            applications: ["UT thickness measurement", "UT flaw inspection", "Replacement / rental transducers"],
          },
          {
            slug: "bnc-bnc-cable",
            name: "BNC to BNC Cable",
            image: "bnc-to-bnc.jpg",
            description: "Replacement BNC-to-BNC ultrasonic transducer cables. Standard lengths.",
            applications: ["UT transducer connection", "Replacement cable rentals"],
          },
        ],
      },
      {
        name: "Weld Inspection Kits",
        products: [
          {
            slug: "olympus-et-weld-kit",
            name: "Olympus ET Weld Inspection Kit",
            manufacturer: "Olympus",
            image: "pro18.jpg",
            description: "Complete eddy current weld inspection kit. Includes weld probes, accessories, and case.",
            applications: ["ET weld inspection", "Surface crack detection on welds"],
            pdf: "Olympus_Weld_Probe_Kit.pdf",
          },
          {
            slug: "shear-wave-kit",
            name: "Shear Wave Kit",
            image: "Shear-wave-kit-picture.jpeg",
            description: "Shear wave UT inspection kit including angle beam wedges, shear wave transducers, and reference block.",
            applications: ["AWS D1.1 weld inspection", "Shear wave thickness setup"],
          },
        ],
      },
      {
        name: "Gas Monitors",
        products: [
          {
            slug: "h2s-monitor-accessory",
            name: "H2S Monitor",
            image: "H2S-Monitor-Pic.jpg",
            description: "Add-on H2S single-gas monitor for confined space and field work. Pairs with rentals as a quick-add safety accessory.",
            applications: ["Worker safety", "Pre-entry H2S monitoring"],
          },
        ],
      },
      {
        name: "Locators",
        products: [
          {
            slug: "radiodetection-rd8000",
            name: "Radiodetection RD8000",
            manufacturer: "Radiodetection",
            image: "radiodetection-rd8000.jpg",
            description: "Underground utility locator. Locates buried cables, pipes, sondes, and tracers with multi-frequency precision.",
            applications: ["Underground utility location", "Cable locating", "Sonde tracing"],
            pdf: "RD8000brochureV10.pdf",
          },
          {
            slug: "radiodetection-locator-transmitter",
            name: "Radiodetection Locator + Transmitter Set",
            manufacturer: "Radiodetection",
            image: "radiodetection-rd8000.jpg",
            description: "Complete locator + transmitter set for active line tracing. Pair the receiver with a multi-frequency transmitter to clip on or induce signal onto buried lines.",
            applications: ["Active line tracing", "Pipe and cable identification", "Multi-frequency surveys"],
            pdf: "RD8000brochureV10.pdf",
          },
        ],
      },
    ],
  },

  {
    slug: "consumables",
    short: "Consumables",
    name: "Consumables & PPE",
    tagline: "Magnaflux developer, penetrant, cleaner, couplant, dry-method particles, and PPE.",
    description:
      "Restock-as-you-go consumables for magnetic particle, dye penetrant, and ultrasonic testing — plus the PPE your team needs in the field.",
    applications: [
      "Magnetic particle inspection",
      "Dye penetrant inspection",
      "Ultrasonic testing couplant",
      "Confined-space PPE",
    ],
    subcategories: [
      {
        name: "Magnaflux Aerosols",
        products: [
          {
            slug: "magnaflux-black-ink",
            name: "Magnaflux Black Ink — 12 × 16 Aerosol Cans",
            manufacturer: "Magnaflux",
            image: "Magnaflux-Products.png",
            description: "Visible black magnetic ink in aerosol form for wet-method MPI. Sold by the case (16 cans).",
            applications: ["Wet visible MPI"],
          },
          {
            slug: "magnaflux-developer",
            name: "Magnaflux Developer — 10 × 16 & 12 × 16 Aerosol Cans",
            manufacturer: "Magnaflux",
            image: "Magnaflux-Developer-10-X-16-12-X-16-Aerosol-Cans.jpg",
            description: "ASTM E165 / E1417 compliant non-aqueous wet developer for dye penetrant inspection.",
            applications: ["Dye penetrant inspection", "PT developer application"],
          },
          {
            slug: "magnaflux-penetrant",
            name: "Magnaflux Penetrant — 10 × 16 & 12 × 16 Aerosol Cans",
            manufacturer: "Magnaflux",
            image: "Developer.jpg",
            description: "Visible red dye penetrant for surface flaw inspection. ASTM E165 / E1417 compliant.",
            applications: ["Visible dye penetrant inspection", "Field PT"],
          },
          {
            slug: "magnaflux-cleaner",
            name: "Magnaflux Cleaner — 12 × 16 Aerosol Cans",
            manufacturer: "Magnaflux",
            image: "MagnafluxCleaner.jpg",
            description: "Solvent cleaner / remover for dye penetrant and post-inspection cleanup.",
            applications: ["Pre-inspection cleaning", "Penetrant removal"],
          },
        ],
      },
      {
        name: "Couplants",
        products: [
          {
            slug: "magnaflux-ultrasonic-couplant",
            name: "Magnaflux Ultrasonic Couplant — 2 × 1 Gallon",
            manufacturer: "Magnaflux",
            image: "Magnaflux-Ultrasonic-Couplant-2-X-1-Gallon-Containers.jpg",
            description: "General-purpose ultrasonic couplant in gallon containers. For UT thickness, flaw detection, and PA scanning.",
            applications: ["UT thickness measurement", "Flaw detection couplant", "PA scanning couplant"],
          },
          {
            slug: "ut-x-couplant-powder",
            name: "UT-X Couplant Powder Mix — 3.66 oz / 18.3 oz Bags",
            image: "UT-X-Powder-mix-couplant-powder-3.66oz-and-18.3oz-bags.jpg",
            description: "Powdered UT couplant — mix with water for high-temperature, vertical surface, and overhead inspection.",
            applications: ["High-temperature UT", "Vertical/overhead UT", "Custom-viscosity couplant"],
          },
        ],
      },
      {
        name: "Dry Method Magnetic Particles",
        products: [
          {
            slug: "magnaflux-yellow-dry-particles",
            name: "Magnaflux Yellow Dry Method Visible Particles",
            manufacturer: "Magnaflux",
            image: "Dry-Method-Visible-Magnetic-Particles-Yellow.jpg",
            description: "High-visibility yellow dry magnetic particles for visible MPI on dark surfaces.",
            applications: ["Dry visible MPI", "Field MPI on welds"],
          },
          {
            slug: "magnaflux-2-yellow-mix-45lb",
            name: "Magnaflux #2 Yellow Dry Method Mix — 45 lb Bucket",
            manufacturer: "Magnaflux",
            image: "Dry-Method-Visible-Magnetic-Particles-1.jpg",
            description: "45 lb bucket of yellow dry magnetic particles for high-volume inspection programs.",
            applications: ["High-volume MPI", "Shop inspection"],
          },
        ],
      },
      {
        name: "Personal Protective Equipment",
        products: [
          {
            slug: "safety-glasses",
            name: "Safety Glasses",
            image: "Safety_Glasses.jpg",
            description: "ANSI Z87.1 safety glasses. Add to any rental order.",
            applications: ["Eye protection in the field"],
          },
          {
            slug: "high-heat-gloves",
            name: "High Heat Gloves",
            image: "High-Heat-Gloves-scaled.jpg",
            description: "High-temperature inspection gloves for hot-surface UT and visual inspection.",
            applications: ["Hot surface UT", "Furnace / refractory inspection"],
          },
          {
            slug: "n95-masks",
            name: "N-95 Masks",
            image: "N-95-Mask-scaled.jpg",
            description: "NIOSH-certified N-95 respirators. Sold by the box.",
            applications: ["Particulate respiratory protection", "Field PPE"],
          },
          {
            slug: "ppe-kit",
            name: "Personal Protective Equipment (PPE) Kit",
            image: "PPE-Picture.png",
            description: "Field PPE kit: glasses, gloves, mask, hard hat. One-stop add-on for site mobilization.",
            applications: ["Site mobilization", "Tech onboarding"],
          },
        ],
      },
      {
        name: "RVI Consumables",
        products: [
          {
            slug: "wohler-domes",
            name: "Wohler Domes",
            manufacturer: "Wohler",
            image: "7802_5.jpg",
            description: "Replacement protective domes for Wohler VIS pushrod inspection cameras.",
            applications: ["Wohler VIS protection", "Field replacement"],
          },
        ],
      },
    ],
  },
];

export const CATEGORY_BY_SLUG: Record<string, EquipmentCategory> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
);

export function totalProductCount(): number {
  return CATEGORIES.reduce(
    (n, c) => n + c.subcategories.reduce((m, s) => m + s.products.length, 0),
    0
  );
}

// Lookup a single product by category slug + product slug.
export function findProduct(catSlug: string, productSlug: string):
  | { category: EquipmentCategory; subcategory: Subcategory; product: Product }
  | null {
  const cat = CATEGORY_BY_SLUG[catSlug];
  if (!cat) return null;
  for (const sub of cat.subcategories) {
    const p = sub.products.find((x) => x.slug === productSlug);
    if (p) return { category: cat, subcategory: sub, product: p };
  }
  return null;
}

// Flat list of every (category, subcategory, product) — for sitemap, related, search, etc.
export function allProducts(): Array<{ category: EquipmentCategory; subcategory: Subcategory; product: Product }> {
  const out: Array<{ category: EquipmentCategory; subcategory: Subcategory; product: Product }> = [];
  for (const cat of CATEGORIES) {
    for (const sub of cat.subcategories) {
      for (const product of sub.products) {
        out.push({ category: cat, subcategory: sub, product });
      }
    }
  }
  return out;
}
