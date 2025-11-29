import { TrendingUp, MapPin, DollarSign, BarChart3, Calendar, LineChart } from "lucide-react";

/* =========================
   Chart layout & styling
   ========================= */
export const CHART_MARGIN = { top: 18, right: 20, left: 60, bottom: 60 };
export const EXPANDED_CHART_MARGIN = {
  top: 90,
  right: 10,
  left: 50,
  bottom: 50,
};

// Axis/grid stroke tokens (UI colors)
export const AXIS_STROKE = "#4A5568";
export const GRID_STROKE = "#E2E8F0";

/* =========================
   Sector colors / palettes
   ========================= */
export const INDUSTRY_COLOR_MAP = {
  Biotech: "#5185B4",
  Cleantech: "#CAC7B0",
  "Consumer Products": "#6E5247",
  "Deep Tech": "#A0522D",
  "Healthcare It": "#AFCAE2",
  ICT: "#E28E04",
  Interdisciplinary: "#1ABC9C",
  MedTech: "#A6BA3C",
  "Micro / Nano": "#2596be",
};

export const ENHANCED_COLOR_PALETTE = [
  "#E84A5F",
  "#2ECC71",
  "#3498DB",
  "#A0522D",
  "#F7931E",
  "#9B5DE5",
  "#1ABC9C",
  "#FFD700",
  "#FF1493",
  "#32CD32",
  "#4169E1",
  "#8B4513",
  "#FF4500",
  "#8A2BE2",
  "#00CED1",
];

// Label spacing presets when ≤3 industries are visible
export const SMALLSET_LABEL_BASE_LIFT = { regular: -4, expanded: -8 };
export const SMALLSET_LABEL_DY = {
  regular: [-6, 1, 6],
  expanded: [-10, 1, 10],
};

export const CANTON_COLOR_MAP = {
  Zürich: "#5185B4",
  Bern: "#A6BA3C",
  Luzern: "#FFC86D",
  Uri: "#FF4500",
  Schwyz: "#B9AFE2",
  Obwalden: "#00CED1",
  Nidwalden: "#FF1493",
  Glarus: "#32CD32",
  Zug: "#A0522D",
  Fribourg: "#FFAEF9",
  Solothurn: "#D452BF",
  "Basel-Stadt": "#EE2E64",
  "Basel-Landschaft": "#4BA7C9",
  Schaffhausen: "#B7A728",
  "Appenzell Ausserrhoden": "#3498DB",
  "Appenzell Innerrhoden": "#E84A5F",
  "St. Gallen": "#D8F443",
  Graubünden: "#3498DB",
  Aargau: "#6B8E23",
  Thurgau: "#E8676C",
  Ticino: "#98E5FD",
  Vaud: "#CAC7B0",
  Valais: "#DFC1AB",
  Neuchâtel: "#77E05A",
  Genève: "#B0C8DE",
  Jura: "#B67CE5",
    "Other": "#6B7280",
};

export const CEO_GENDER_COLOR_MAP = {
  Female: "#FFAEF9",
  Male: "#5185B4",
  Other: "#B67CE5",
};

export const STAGE_COLOR_MAP = {
  Seed: "#2ECC71",
  "Early Stage": "#F7931E",
  "Later Stage": "#3498DB",
};

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

// Expose commonly used canton groupings for UI and charts
export const PRIMARY_CANTON_ORDER_CODES = ["ZH", "VD", "ZG", "GE", "BS", "BE"];

export const OTHER_CANTON_CODES = [
  "SG",
  "TI",
  "LU",
  "AG",
  "SZ",
  "VS",
  "FR",
  "BL",
  "NE",
  "SO",
  "SH",
  "TG",
  "JU",
  "GR",
  "AR",
  "OW",
  "NW",
  "UR",
  "GL",
  "AI",
];

// Mapping for variant names and cities to official cantons
export const CANTON_MAP = {
  Freiburg: "Fribourg",
  "Fribourg / Freiburg": "Fribourg",
  Wallis: "Valais",
  "Basel-Land": "Basel-Landschaft",
  "Basel-City": "Basel-Stadt",

  Lausanne: "Vaud",
  Winterthur: "Zürich",
  Zentralschweiz: null,
  Abroad: null,
};

// Chart type options (cleaned up)
export const getChartOptions = (activeTab) =>
  [
    { key: "timeline", name: "Timeline Trends", icon: TrendingUp },
    ...(activeTab === "companies"
      ? [
          {
            key: "industry-trends",
            name: "Top Industry Trends",
            icon: LineChart,
          },
          { key: "funding-analysis", name: "Funding Status", icon: DollarSign },
        ]
      : []),
    ...(activeTab === "deals"
      ? [
          {
            key: "quarterly-analysis",
            name: "Sector Analysis",
            icon: Calendar,
          },
          { key: "phase-analysis", name: "Funding Phases", icon: BarChart3 },
        ]
      : []),
    {
      key: "geographic-distribution",
      name: "Geographic Distribution",
      icon: MapPin,
    },
  ].filter(Boolean);

export const VOLUME_OPTIONS = [
  { key: "count", name: "Count", unit: "" },
  { key: "volume", name: "Volume", unit: "CHF M" },
];
