// src/components/ExpandableQuarterlyAnalysisChart.jsx
import { useState, useMemo, useRef } from "react";
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  LabelList,
} from "recharts";
import { Maximize2, X } from "lucide-react";

const CHART_MARGIN = { top: 50, right: 50, left: 60, bottom: 60 };
const EXPANDED_CHART_MARGIN = { top: 80, right: 80, left: 80, bottom: 80 };

// Specific color assignments for each industry
const INDUSTRY_COLOR_MAP = {
  Biotech: "#E84A5F",              // Red
  Cleantech: "#2ECC71",            // Green
  "Consumer Products": "#3498DB",  // Blue
  "Deep Tech": "#A0522D",          // Brown
  "Healthcare It": "#F7931E",      // Orange
  ICT: "#9B5DE5",                  // Purple
  Interdisciplinary: "#1ABC9C",    // Teal
  MedTech: "#FFD700",              // Gold
  "Micro / Nano": "#FF1493",       // Deep Pink
  Unknown: "#32CD32",              // Lime Green
};

const ENHANCED_COLOR_PALETTE = [
  "#E84A5F", "#2ECC71", "#3498DB", "#A0522D", "#F7931E",
  "#9B5DE5", "#1ABC9C", "#FFD700", "#FF1493", "#32CD32",
  "#4169E1", "#8B4513", "#FF4500", "#8A2BE2", "#00CED1",
];

// Simple light-only modal
const ChartModal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ====== Helpers ======
const axisStroke = "#4A5568";
const gridStroke = "#E2E8F0";
const tooltipStyle = {
  backgroundColor: "white",
  border: "1px solid #E2E8F0",
  borderRadius: "8px",
  color: "#1F2937",
};

const sanitizeKey = (s) => String(s || "Unknown").replace(/\s+/g, "_").replace(/[^\w]/g, "_");

const makeTicks = (maxVal, step) => {
  const safeMax = Math.max(0, Number(maxVal) || 0);
  const end = Math.ceil(safeMax / step) * step;
  const ticks = [];
  for (let t = 0; t <= end; t += step) ticks.push(t);
  return ticks.length ? ticks : [0];
};

export const ExpandableQuarterlyAnalysisChart = ({
  deals,
  data,
  colorOf: externalColorOf,
  selectedIndustryCount,     // e.g., filters.industries.length
  totalIndustryCount,        // e.g., filterOptions.industries.length
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedChart, setExpandedChart] = useState("volume"); // "volume" | "count"
  const [leftMode, setLeftMode] = useState("line");
  const [rightMode, setRightMode] = useState("line");
  const [showTotal, setShowTotal] = useState(true);
  const [showLabels, setShowLabels] = useState(false); // default OFF

  // Expanded view controls
  const [expandedMode, setExpandedMode] = useState("line");
  const [expandedShowTotal, setExpandedShowTotal] = useState(true);
  const [expandedShowLabels, setExpandedShowLabels] = useState(true);

  // Color management
  function useDistributedColors() {
    const colorMapRef = useRef(new Map());
    const getColor = (name, allIndustries = []) => {
      if (!name) return "#7F8C8D";
      if (!colorMapRef.current.has(name)) {
        if (INDUSTRY_COLOR_MAP[name]) {
          colorMapRef.current.set(name, INDUSTRY_COLOR_MAP[name]);
        } else {
          const idx = allIndustries.indexOf(name);
          const colorIndex = idx >= 0
            ? idx % ENHANCED_COLOR_PALETTE.length
            : colorMapRef.current.size % ENHANCED_COLOR_PALETTE.length;
          colorMapRef.current.set(name, ENHANCED_COLOR_PALETTE[colorIndex]);
        }
      }
      return colorMapRef.current.get(name);
    };
    return getColor;
  }
  const internalColorOf = useDistributedColors();

  const dealsSource = useMemo(() => {
    if (Array.isArray(deals)) return deals;
    if (Array.isArray(data)) return data;
    return [];
  }, [deals, data]);

  // Aggregate by year & industry (skip Unknown + year 2025)
  const { rows, industries, top5, volumeMax, totalVolumeMax, totalCountMax } = useMemo(() => {
    const byYearIndustry = {};
    const industrySet = new Set();
    const yearSet = new Set();
    const industryTotals = {};

    dealsSource.forEach((d) => {
      const year = Number(d.Year ?? d.year);
      if (!year || year === 2025) return;
      const ind = (d.Industry && String(d.Industry).trim()) || "Unknown";
      if (ind === "Unknown") return;

      const amt = typeof d.Amount === "number" && isFinite(d.Amount) ? d.Amount : 0;
      industryTotals[ind] = (industryTotals[ind] || 0) + amt;

      industrySet.add(ind);
      yearSet.add(year);

      byYearIndustry[year] = byYearIndustry[year] || {};
      byYearIndustry[year][ind] = byYearIndustry[year][ind] || { count: 0, volume: 0 };
      byYearIndustry[year][ind].count += 1;
      byYearIndustry[year][ind].volume += amt;
    });

    const years = Array.from(yearSet).sort((a, b) => a - b);
    const inds = Array.from(industrySet).sort();

    const rows = years.map((year) => {
      const entry = { year };
      let totalCount = 0;
      let totalVolume = 0;
      inds.forEach((ind) => {
        const cKey = `${sanitizeKey(ind)}__count`;
        const vKey = `${sanitizeKey(ind)}__volume`;
        const cell = byYearIndustry[year]?.[ind];
        const c = cell ? cell.count : 0;
        const v = cell ? cell.volume : 0;
        entry[cKey] = c;
        entry[vKey] = +v;
        totalCount += c;
        totalVolume += v;
      });
      entry.totalCount = totalCount;
      entry.totalVolume = +totalVolume;
      return entry;
    });

    // Top5 by overall volume (consistent with earlier behavior)
    const top5Industries = Object.entries(industryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([industry]) => industry);

    // Max for single-industry volume in a year (for line/column scaling)
    let volMax = 0;
    rows.forEach((r) => {
      inds.forEach((ind) => {
        const vKey = `${sanitizeKey(ind)}__volume`;
        if (r[vKey] && r[vKey] > volMax) volMax = r[vKey];
      });
    });

    // Max total volume & count per year (for stacked columns)
    let totalVolMax = 0, totalCntMax = 0;
    rows.forEach((r) => {
      if (r.totalVolume > totalVolMax) totalVolMax = r.totalVolume;
      if (r.totalCount > totalCntMax) totalCntMax = r.totalCount;
    });

    return {
      rows,
      industries: inds,
      top5: top5Industries,
      volumeMax: volMax,
      totalVolumeMax: totalVolMax,
      totalCountMax: totalCntMax,
    };
  }, [dealsSource]);

  const colorOf =
    externalColorOf && externalColorOf.useExternal
      ? externalColorOf
      : (name) => internalColorOf(name, industries);

  // Selection awareness (optional precision for "ALL selected")
  const selCount = selectedIndustryCount ?? industries.length;
  const totalCount = totalIndustryCount ?? industries.length;
  const allSelectedKnown = (selectedIndustryCount != null && totalIndustryCount != null);
  const isAllSelected = allSelectedKnown ? selCount === totalCount : false;

  // Rule: fully label lines when <=3 industries are specifically selected
  const shouldFullyLabelLines = showLabels && selCount > 0 && selCount <= 3 && !isAllSelected;

  // Right-end label offset planner for line charts (Top-5 only)
  const makeRightEndOffsetMap = (metricSuffix) => {
    const last = rows[rows.length - 1] || {};
    const arr = industries
      .map((ind) => ({
        ind,
        v: Number(last[`${sanitizeKey(ind)}__${metricSuffix}`]) || 0,
      }))
      .filter((x) => top5.includes(x.ind) && x.v > 0)
      .sort((a, b) => b.v - a.v); // by value, high to low

    // Spread labels around the point: [0, -12, +12, -24, +24]
    const offsets = [0, -12, 12, -24, 24];
    const map = new Map();
    arr.forEach((item, i) => map.set(item.ind, offsets[i] ?? 0));
    return map;
  };
  const rightEndDYVolume = useMemo(() => makeRightEndOffsetMap("volume"), [rows, industries, top5]);
  const rightEndDYCount  = useMemo(() => makeRightEndOffsetMap("count"),  [rows, industries, top5]);

  // ====== Render helpers (per-mode) ======
  const createRenderFunctions = (
    mode,                // "line" | "column"
    metricSuffix,        // "volume" | "count"
    showLabelsEnabled,
    isExpandedView = false
  ) => {
    const totalKey = metricSuffix === "volume" ? "totalVolume" : "totalCount";
    const barSize = isExpandedView ? 48 : 36;

    const formatK = (n) => {
      if (metricSuffix === "count") return `${n ?? 0}`;
      const v = Number(n) || 0;
      if (v >= 1000) {
        const k = v / 1000;
        const kRounded = Math.round(k * 10) / 10;
        return kRounded % 1 === 0 ? `${kRounded.toFixed(0)}k` : `${kRounded.toFixed(1)}k`;
      }
      const rounded = Math.round(v * 10) / 10;
      return rounded % 1 === 0 ? `${rounded.toFixed(0)}` : `${rounded.toFixed(1)}`;
    };

    // ===== Columns =====
    const renderBars = () =>
      industries.map((ind) => {
        const key = `${sanitizeKey(ind)}__${metricSuffix}`;
        return (
          <Bar
            key={key}
            dataKey={key}
            stackId={`stack-${metricSuffix}`}
            fill={colorOf(ind)}
            name={ind}
            barSize={barSize}
            radius={[0, 0, 0, 0]}
          >
            {showLabelsEnabled && (
              <LabelList
                dataKey={key}
                content={({ x, y, width, height, value, index }) => {
                  if (x == null || y == null || width == null || height == null || index == null) return null;
                  const row = rows[index];
                  if (!row) return null;
                  const total = Number(row[totalKey]) || 0;
                  const v = Number(value) || 0;
                  if (total <= 0) return null;

                  const share = v / total;

                  // Label a segment if it's sizable OR part of Top-5 (more permissive)
                  const MIN_SHARE = 0.10;
                  const MIN_PX = 12;
                  const TOP5_MIN_SHARE = 0.06;
                  const TOP5_MIN_PX = 10;

                  const meetsDefault = share >= MIN_SHARE && height >= MIN_PX;
                  const meetsTop5 = top5.includes(ind) && share >= TOP5_MIN_SHARE && height >= TOP5_MIN_PX;
                  if (!(meetsDefault || meetsTop5)) return null;

                  const cx = x + width / 2;
                  const cy = y + height / 2;

                  return (
                    <text
                      x={cx}
                      y={cy}
                      fill="#000000"
                      stroke="none"
                      strokeWidth={0}
                      fontSize={isExpandedView ? 12 : 10}
                      fontWeight="600"
                      textAnchor="middle"
                      alignmentBaseline="central"
                      pointerEvents="none"
                    >
                      {formatK(v)}
                    </text>
                  );
                }}
              />
            )}
          </Bar>
        );
      });

    const renderBarTotalLabels = () => {
      if (!showLabelsEnabled) return null;
      return (
        <Bar
          key={`_totals_${metricSuffix}`}
          dataKey={totalKey}
          fill="transparent"
          stroke="transparent"
          isAnimationActive={false}
          legendType="none"
          shape={() => null}
        >
          <LabelList
            dataKey={totalKey}
            position="top"
            offset={isExpandedView ? 10 : 8}
            content={({ x, y, value }) => {
              if (x == null || y == null) return null;
              return (
                <text
                  x={x}
                  y={y - (isExpandedView ? 6 : 4)}
                  fill="#000000"
                  fontWeight="700"
                  fontSize={isExpandedView ? 14 : 12}
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {formatK(value)}
                </text>
              );
            }}
          />
        </Bar>
      );
    };

    // ===== Lines =====
    const renderLines = () =>
      industries.map((ind, seriesIdx) => {
        const key = `${sanitizeKey(ind)}__${metricSuffix}`;
        const fullyLabel = shouldFullyLabelLines && showLabelsEnabled;

        return (
          <Line
            key={key}
            type="linear"
            dataKey={key}
            stroke={colorOf(ind)}
            strokeWidth={isExpandedView ? 3 : 2}
            dot={{ r: isExpandedView ? 5 : 3 }}
            name={ind}
          >
            {fullyLabel && (
              <LabelList
                dataKey={key}
                content={({ x, y, value }) => {
                  if (x == null || y == null) return null;
                  const v = Number(value) || 0;
                  // small stagger by series (to reduce overlap)
                  const dyTable = isExpandedView ? [-12, 4, 16] : [-8, 4, 12];
                  const dy = dyTable[seriesIdx % dyTable.length];
                  return (
                    <text
                      x={x}
                      y={y + dy}
                      fill="#000000"
                      fontSize={isExpandedView ? 12 : 11}
                      fontWeight="600"
                      textAnchor="middle"
                      alignmentBaseline="central"
                      pointerEvents="none"
                    >
                      {formatK(v)}
                    </text>
                  );
                }}
              />
            )}
          </Line>
        );
      });

    const renderRightEndLabelsForLines = () => {
      if (!showLabelsEnabled || !rows?.length) return null;
      if (shouldFullyLabelLines) return null; // already fully labeled

      const lastIndex = rows.length - 1;
      const dyMap = metricSuffix === "volume" ? rightEndDYVolume : rightEndDYCount;

      // Right-end labels for Top-5 only
      return industries.map((ind) => {
        if (!top5.includes(ind)) return null;
        const key = `${sanitizeKey(ind)}__${metricSuffix}`;
        return (
          <Bar
            key={`_line_labels_${key}`}
            dataKey={key}
            fill="transparent"
            stroke="transparent"
            isAnimationActive={false}
            legendType="none"
            shape={() => null}
          >
            <LabelList
              dataKey={key}
              position="right"
              content={({ x, y, width, value, index }) => {
                if (index !== lastIndex) return null;
                const v = Number(value) || 0;
                if (v <= 0) return null;

                // small horizontal & vertical offsets (pre-computed dy)
                const rightOffset = isExpandedView ? 12 : 0;
                const baseX = x != null ? x + (width || 0) : 0;
                const cx = baseX + rightOffset;
                const lift = dyMap.get(ind) ?? (isExpandedView ? -12 : -8);
                const cy = (y != null ? y : 0) + lift;

                return (
                  <text
                    x={cx}
                    y={cy}
                    fill="#000000"
                    fontSize={isExpandedView ? 12 : 11}
                    fontWeight="600"
                    textAnchor="start"
                    alignmentBaseline="central"
                    pointerEvents="none"
                  >
                    {formatK(v)}
                  </text>
                );
              }}
            />
          </Bar>
        );
      });
    };

    return {
      main: mode === "column" ? renderBars() : renderLines(),
      labels: mode === "column" ? renderBarTotalLabels() : renderRightEndLabelsForLines(),
    };
  };

  // Legend (light-only)
  const CustomLegend = ({ industries, colorOf, isCompact = false, isOverlay = false }) => {
    if (isOverlay) {
      return (
        <div className="absolute -top-4 right-4 p-4 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm border border-gray-200 max-w-80 z-10">
          <h4 className="text-sm font-semibold mb-3 text-left text-gray-700">Sectors</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {industries.map((industry) => (
              <div key={industry} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: colorOf(industry) }} />
                <span className="text-xs text-gray-600">{industry}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className={`p-4 rounded-lg bg-gray-50 ${isCompact ? "w-48" : ""}`}>
        <h4 className="text-sm font-semibold mb-3 text-gray-700">Sectors</h4>
        <div className={isCompact ? "space-y-2" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2"}>
          {industries.map((industry) => (
            <div key={industry} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: colorOf(industry) }} />
              <span className={`text-sm ${isCompact ? "" : "truncate"} text-gray-600`}>{industry}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===== Expanded (modal) content =====
  const ExpandedChartContent = () => {
    const isVolumeChart = expandedChart === "volume";
    const metricSuffix = isVolumeChart ? "volume" : "count";
    const yAxisLabel = isVolumeChart ? "Investment Volume CHF (M)" : "Number of Deals";

    // Granularity
    const domainMax = isVolumeChart
      ? Math.ceil((expandedMode === "column" ? totalVolumeMax : volumeMax) / 500) * 500
      : Math.ceil((expandedMode === "column" ? totalCountMax : totalCountMax) / 50) * 50;
    const ticks = isVolumeChart ? makeTicks(domainMax, 500) : makeTicks(domainMax, 50);

    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Chart Type:</span>
            <select
              value={expandedMode}
              onChange={(e) => setExpandedMode(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
            >
              <option value="line">Line</option>
              <option value="column">Column</option>
            </select>
          </div>

          <label className="flex items-center gap-2 ml-auto">
            <input
              type="checkbox"
              checked={expandedShowLabels}
              onChange={(e) => setExpandedShowLabels(e.target.checked)}
              className="text-red-600 focus:ring-red-500"
            />
            <span className="text-gray-700">Show data labels</span>
          </label>

          {expandedMode === "column" && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={expandedShowTotal}
                onChange={(e) => setExpandedShowTotal(e.target.checked)}
                className="text-red-600 focus:ring-red-500"
              />
              <span className="text-gray-700">Show total line</span>
            </label>
          )}
        </div>

        {/* Expanded chart */}
        <div className="space-y-2">
          <div className="relative">
            <ResponsiveContainer width="100%" height={800}>
              <ComposedChart data={rows} margin={EXPANDED_CHART_MARGIN} style={{ overflow: "visible" }}>
                <defs>
                  <filter id="glow-black-expanded" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="category" dataKey="year" stroke={axisStroke} fontSize={16} padding={{ left: 24, right: 24 }} />
                <YAxis
                  stroke={axisStroke}
                  fontSize={16}
                  domain={[0, ticks[ticks.length - 1] || 0]}
                  ticks={ticks}
                  allowDataOverflow={isVolumeChart}
                  label={{
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    fill: axisStroke,
                    fontSize: 16,
                    dx: "-2.5em",
                    dy: "4.5em",
                    style: { textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  wrapperStyle={{ pointerEvents: "none", zIndex: 9999 }}
                  contentStyle={tooltipStyle}
                  formatter={(v, name) => (isVolumeChart ? [`${(+v).toFixed(1)}M CHF`, name] : [v, name])}
                />

                {createRenderFunctions(expandedMode, metricSuffix, expandedShowLabels, true).main}

                {expandedShowTotal && expandedMode === "column" && (
                  <Line
                    type="linear"
                    dataKey={isVolumeChart ? "totalVolume" : "totalCount"}
                    stroke="#000000"
                    strokeWidth={5}
                    dot={false}
                    name={isVolumeChart ? "Total Volume" : "Total Deals"}
                    filter="url(#glow-black-expanded)"
                  />
                )}

                {createRenderFunctions(expandedMode, metricSuffix, expandedShowLabels, true).labels}
              </ComposedChart>
            </ResponsiveContainer>

            {/* Overlay legend */}
            <div className="absolute top-20 left-40 p-3 rounded-lg shadow-lg bg-white border border-gray-200 max-w-80 z-10">
              <h4 className="text-xs font-semibold mb-2 text-left text-gray-700">Sectors</h4>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {industries.map((industry) => (
                  <div key={industry} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: colorOf(industry) }} />
                    <span className="text-xs text-gray-600">{industry}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== On-page content (two charts) =====
  const ChartContent = ({
    isExpandedView = false,
    leftModeState,
    rightModeState,
    showTotalState,
    showLabelsState,
    onLeftModeChange,
    onRightModeChange,
    onShowTotalChange,
    onShowLabelsChange,
  }) => {
    // Y-axis ticks (granularity) for page view
    const volumeDomainMax = Math.ceil((leftModeState === "column" ? totalVolumeMax : volumeMax) / 500) * 500;
    const volumeTicks = makeTicks(volumeDomainMax, 500);

    const countDomainMax = Math.ceil(totalCountMax / 50) * 50;
    const countTicks = makeTicks(countDomainMax, 50);

    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Left (Volume):</span>
            <select
              value={leftModeState}
              onChange={(e) => onLeftModeChange(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
            >
              <option value="line">Line</option>
              <option value="column">Column</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700">Right (Count):</span>
            <select
              value={rightModeState}
              onChange={(e) => onRightModeChange(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
            >
              <option value="line">Line</option>
              <option value="column">Column</option>
            </select>
          </div>

          {(leftModeState === "column" || rightModeState === "column") && (
            <label className="flex items-center gap-2 ml-auto">
              <input
                type="checkbox"
                checked={showTotalState}
                onChange={(e) => onShowTotalChange(e.target.checked)}
                className="text-red-600 focus:ring-red-500"
              />
              <span className="text-gray-700">Show total line</span>
            </label>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showLabelsState}
              onChange={(e) => onShowLabelsChange(e.target.checked)}
              className="text-red-600 focus:ring-red-500"
            />
            <span className="text-gray-700">Show data labels</span>
          </label>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: Volume */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800">Investment Volume vs Year (CHF M)</h3>
              {!isExpandedView && (
                <button
                  onClick={() => {
                    setExpandedChart("volume");
                    setIsExpanded(true);
                  }}
                  className="p-2 rounded-md transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  title="Expand Volume Chart"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={isExpandedView ? 600 : 420}>
              <ComposedChart data={rows} margin={isExpandedView ? EXPANDED_CHART_MARGIN : CHART_MARGIN} style={{ overflow: "visible" }}>
                <defs>
                  <filter id="glow-black" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="category" dataKey="year" stroke={axisStroke} fontSize={isExpandedView ? 14 : 12}
                       padding={{ left: isExpandedView ? 24 : 18, right: isExpandedView ? 24 : 18 }} />
                <YAxis
                  stroke={axisStroke}
                  fontSize={isExpandedView ? 14 : 12}
                  domain={[0, volumeTicks[volumeTicks.length - 1] || 0]}
                  ticks={volumeTicks}
                  allowDataOverflow
                  label={{
                    value: "Investment Volume CHF (M)",
                    angle: -90,
                    position: "insideLeft",
                    fill: axisStroke,
                    fontSize: isExpandedView ? 14 : 12,
                    dx: isExpandedView ? "-2em" : "-1.5em",
                    dy: isExpandedView ? "4em" : "3em",
                    style: { textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  wrapperStyle={{ pointerEvents: "none", zIndex: 9999 }}
                  contentStyle={tooltipStyle}
                  formatter={(v, name) => [`${(+v).toFixed(1)}M CHF`, name]}
                />

                {createRenderFunctions(leftModeState, "volume", showLabelsState, isExpandedView).main}

                {showTotalState && leftModeState === "column" && (
                  <Line
                    type="linear"
                    dataKey="totalVolume"
                    stroke="#000000"
                    strokeWidth={isExpandedView ? 4 : 3}
                    dot={false}
                    name="Total Volume"
                    filter="url(#glow-black)"
                  />
                )}

                {createRenderFunctions(leftModeState, "volume", showLabelsState, isExpandedView).labels}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* RIGHT: Count */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800">Number of Deals vs Year</h3>
              {!isExpandedView && (
                <button
                  onClick={() => {
                    setExpandedChart("count");
                    setIsExpanded(true);
                  }}
                  className="p-2 rounded-md transition-colors bg-green-600 hover:bg-green-700 text-white shadow-md"
                  title="Expand Count Chart"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={isExpandedView ? 600 : 420}>
              <ComposedChart data={rows} margin={isExpandedView ? EXPANDED_CHART_MARGIN : CHART_MARGIN} style={{ overflow: "visible" }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="category" dataKey="year" stroke={axisStroke} fontSize={isExpandedView ? 14 : 12}
                       padding={{ left: isExpandedView ? 24 : 18, right: isExpandedView ? 24 : 18 }} />
                <YAxis
                  stroke={axisStroke}
                  fontSize={isExpandedView ? 14 : 12}
                  domain={[0, countTicks[countTicks.length - 1] || 0]}
                  ticks={countTicks}
                  label={{
                    value: "Number of Deals",
                    angle: -90,
                    position: "insideLeft",
                    fill: axisStroke,
                    fontSize: isExpandedView ? 14 : 12,
                    dx: isExpandedView ? "-1.8em" : "-1.4em",
                    dy: isExpandedView ? "4em" : "3em",
                    style: { textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  wrapperStyle={{ pointerEvents: "none", zIndex: 9999 }}
                  contentStyle={tooltipStyle}
                  formatter={(v, name) => [v, name]}
                />

                {createRenderFunctions(rightModeState, "count", showLabelsState, isExpandedView).main}

                {showTotalState && rightModeState === "column" && (
                  <Line
                    type="linear"
                    dataKey="totalCount"
                    stroke="#000000"
                    strokeWidth={isExpandedView ? 4 : 3}
                    dot={false}
                    name="Total Deals"
                    filter="url(#glow-black)"
                  />
                )}

                {createRenderFunctions(rightModeState, "count", showLabelsState, isExpandedView).labels}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Centered legend */}
        <div className="flex justify-center">
          <CustomLegend industries={industries} colorOf={colorOf} />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Regular (page) view */}
      <ChartContent
        isExpandedView={false}
        leftModeState={leftMode}
        rightModeState={rightMode}
        showTotalState={showTotal}
        showLabelsState={showLabels}
        onLeftModeChange={setLeftMode}
        onRightModeChange={setRightMode}
        onShowTotalChange={setShowTotal}
        onShowLabelsChange={setShowLabels}
      />

      {/* Expanded modal */}
      <ChartModal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={`Expanded ${expandedChart === "volume" ? "Investment Volume" : "Deal Count"} Chart`}
      >
        <ExpandedChartContent />
      </ChartModal>
    </>
  );
};

export default ExpandableQuarterlyAnalysisChart;
