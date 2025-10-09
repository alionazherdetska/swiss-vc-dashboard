import {
  TrendingUp,
  MapPin,
  DollarSign,
  BarChart3,
  Calendar,
  LineChart,
} from "lucide-react";

/* =========================
   Chart layout & styling
   ========================= */
export const CHART_MARGIN = { top: 50, right: 50, left: 60, bottom: 60 };
export const EXPANDED_CHART_MARGIN = {
  top: 80,
  right: 80,
  left: 80,
  bottom: 80,
};

// Axis/grid stroke tokens (UI colors)
export const AXIS_STROKE = "#4A5568";
export const GRID_STROKE = "#E2E8F0";

/* =========================
   Sector colors / palettes
   ========================= */
export const INDUSTRY_COLOR_MAP = {
  Biotech: "#E84A5F",
  Cleantech: "#2ECC71",
  "Consumer Products": "#3498DB",
  "Deep Tech": "#A0522D",
  "Healthcare It": "#F7931E",
  ICT: "#9B5DE5",
  Interdisciplinary: "#1ABC9C",
  MedTech: "#FFD700",
  "Micro / Nano": "#FF1493",
  Unknown: "#32CD32",
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

/* =========================
   Your existing constants
   ========================= */

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

// Volume display options
export const VOLUME_OPTIONS = [
  { key: "count", name: "Count", unit: "" },
  { key: "volume", name: "Volume", unit: "CHF M" },
];
