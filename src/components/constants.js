// constants.js
import {
  TrendingUp,
  MapPin,
  DollarSign,
  BarChart3,
  Factory,
} from "lucide-react";

// Official Swiss cantons in correct order with codes
export const OFFICIAL_CANTONS = [
  { name: "Zürich", code: "ZH" },
  { name: "Bern", code: "BE" },
  { name: "Luzern", code: "LU" },
  { name: "Uri", code: "UR" },
  { name: "Schwyz", code: "SZ" },
  { name: "Obwalden", code: "OW" },
  { name: "Nidwalden", code: "NW" },
  { name: "Glarus", code: "GL" },
  { name: "Zug", code: "ZG" },
  { name: "Fribourg", code: "FR" },
  { name: "Solothurn", code: "SO" },
  { name: "Basel-Stadt", code: "BS" },
  { name: "Basel-Landschaft", code: "BL" },
  { name: "Schaffhausen", code: "SH" },
  { name: "Appenzell Ausserrhoden", code: "AR" },
  { name: "Appenzell Innerrhoden", code: "AI" },
  { name: "St. Gallen", code: "SG" },
  { name: "Graubünden", code: "GR" },
  { name: "Aargau", code: "AG" },
  { name: "Thurgau", code: "TG" },
  { name: "Ticino", code: "TI" },
  { name: "Vaud", code: "VD" },
  { name: "Valais", code: "VS" },
  { name: "Neuchâtel", code: "NE" },
  { name: "Genève", code: "GE" },
  { name: "Jura", code: "JU" },
];

// Mapping for variant names and cities to official cantons
export const CANTON_MAP = {
  // Handle duplicates and variants
  Freiburg: "Fribourg",
  "Fribourg / Freiburg": "Fribourg",
  Wallis: "Valais",
  "Basel-Land": "Basel-Landschaft",
  "Basel-City": "Basel-Stadt",

  // Handle cities/regions
  Lausanne: "Vaud",
  Winterthur: "Zürich",
  Zentralschweiz: null, // Exclude regional groupings
  Abroad: null, // Exclude non-Swiss entries
};

// Swiss VC Report color scheme
export const COLORS = [
  "#E53E3E", // Red (primary brand color from report)
  "#3182CE", // Blue
  "#38A169", // Green
  "#D69E2E", // Yellow/Orange
  "#805AD5", // Purple
  "#DD6B20", // Orange
  "#319795", // Teal
  "#E53E3E", // Red variant
  "#4A5568", // Gray
  "#ED64A6", // Pink
];

// Chart type options
export const getChartOptions = (activeTab) =>
  [
    { key: "timeline", name: "Timeline Trends", icon: TrendingUp },
    {
      key: "industry-distribution",
      name: activeTab === "companies" ? "Industries" : "Deal Types",
      icon: Factory,
    },
    {
      key: "geographic-distribution",
      name: "Geographic Distribution",
      icon: MapPin,
    },
    {
      key: "funding-analysis",
      name:
        activeTab === "companies" ? "Funding Status" : "Amount vs Valuation",
      icon: DollarSign,
    },
    ...(activeTab === "deals"
      ? [
          {
            key: "phase-analysis",
            name: "Funding Phases",
            icon: BarChart3,
          },
        ]
      : []),
  ].filter(Boolean);

// Sample data fallback
export const SAMPLE_DATA = {
  Companies: [
    {
      Code: "CHE-384.775.108",
      Title: "Noury AG",
      Industry: "Other",
      Vertical: "",
      Canton: "Bern",
      "Spin-offs": "",
      City: "Bern",
      Year: "2021",
      Highlights: "",
      "Gender CEO": "",
      OOB: "FALSE",
      Funded: "FALSE",
      Comment: "",
    },
  ],
  Deals: [
    {
      Id: "S4126",
      Investors: "Elastic",
      Comment: "",
      URL: "https://www.elastic.co/de/about/press/elastic-and-optimyze-join-forces",
      Confidential: "FALSE",
      "Amount confidential": "FALSE",
      "Date of the funding round": "10/14/21",
      Type: "EXIT",
      Phase: "Exit",
      Canton: "Zürich",
      Company: "optimyze.cloud AG",
      "Gender CEO": "Male",
    },
  ],
};
