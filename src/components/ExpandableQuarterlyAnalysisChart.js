import React, { useState, useMemo, useRef } from "react";
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
import { Maximize2 } from "lucide-react";
import ChartModal from "./ChartModal";

/* -------------------- Layout -------------------- */
const CHART_MARGIN = { top: 50, right: 50, left: 60, bottom: 60 };
const EXPANDED_CHART_MARGIN = { top: 80, right: 80, left: 80, bottom: 80 };

/* -------------------- Colors -------------------- */
const INDUSTRY_COLOR_MAP = {
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

const ENHANCED_COLOR_PALETTE = [
  "#E84A5F", "#2ECC71", "#3498DB", "#A0522D", "#F7931E",
  "#9B5DE5", "#1ABC9C", "#FFD700", "#FF1493", "#32CD32",
  "#4169E1", "#8B4513", "#FF4500", "#8A2BE2", "#00CED1",
];

/* -------------------- Label spacing (ONLY for ≤3 industries on line charts) -------------------- */
const SMALLSET_LABEL_BASE_LIFT = { regular: -4, expanded: -8 }; // vertical baseline lift
const SMALLSET_LABEL_DY = {
  regular: [-6, 1, 6],   // vertical stagger
  expanded: [-10, 1, 10],
};

/* -------------------- Utils -------------------- */
const sanitizeKey = (s) =>
  String(s || "Unknown").replace(/\s+/g, "_").replace(/[^\w]/g, "_");

const getChartDims = (isExpandedView, forcedHeight) => ({
  height: forcedHeight ?? (isExpandedView ? 600 : 420),
  margin: isExpandedView ? EXPANDED_CHART_MARGIN : CHART_MARGIN,
});

const clampY = (y, { height, margin }, pad = 8) => {
  const innerTop = (margin?.top ?? 0) + pad;
  const innerBottom = height - (margin?.bottom ?? 0) - pad;
  return Math.max(innerTop, Math.min(y, innerBottom));
};

const ceilToStep = (max, step) => Math.ceil(max / step) * step;
const getTicks = (min, max, step) => {
  const end = ceilToStep(max, step);
  const out = [];
  for (let v = min; v <= end; v += step) out.push(v);
  return out;
};

/* -------------------- Tooltip -------------------- */
const SortedTooltip = ({ active, payload, label, isVolume }) => {
  if (!active || !payload || !payload.length) return null;

  const norm = (s) =>
    String(s || "")
      .replace(/(__|_)?(count|volume)$/i, "")
      .replace(/_/g, " ")
      .trim();

  const byBase = new Map();
  for (const p of payload) {
    const rawName = p?.name ?? p?.dataKey ?? "";
    if (!rawName) continue;
    if (String(rawName).startsWith("__helper__")) continue;

    const base = norm(rawName);
    const value = +p?.value || 0;
    const color = p?.color || p?.stroke || p?.fill || "#888";

    const prev = byBase.get(base);
    if (!prev || value > prev.value) byBase.set(base, { name: base, value, color });
  }

  const rows = Array.from(byBase.values())
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const box = {
    backgroundColor: "white",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    color: "#1F2937",
    minWidth: 180,
    boxSizing: "border-box",
  };
  const header = {
    padding: "8px 12px",
    borderBottom: "1px solid #E2E8F0",
    fontWeight: 700,
  };
  const rowStyle = {
    padding: "6px 12px",
    display: "flex",
    gap: 8,
    alignItems: "center",
  };

  return (
    <div style={box}>
      <div style={header}>{label}</div>
      <div>
        {rows.map((it) => (
          <div key={it.name} style={rowStyle}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: it.color }} />
            <div style={{ fontSize: 13 }}>
              <span style={{ color: it.color, fontWeight: 600 }}>{it.name}</span>
              <span style={{ marginLeft: 8 }}>
                : {isVolume ? `${it.value.toFixed(1)}M CHF` : it.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
   Expandable Quarterly / Sector Analysis (light only)
   ============================================================ */
const ExpandableQuarterlyAnalysisChart = ({
  deals,
  data,
  selectedIndustries = [],
  colorOf: externalColorOf,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedChart, setExpandedChart] = useState("volume"); // "volume" | "count"
  const [leftMode, setLeftMode] = useState("line");
  const [rightMode, setRightMode] = useState("line");
  const [showTotal, setShowTotal] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  const [expandedMode, setExpandedMode] = useState("line");
  const [expandedShowTotal, setExpandedShowTotal] = useState(true);
  const [expandedShowLabels, setExpandedShowLabels] = useState(true);

  const axisStroke = "#4A5568";
  const gridStroke = "#E2E8F0";

  function useDistributedColors() {
    const colorMapRef = useRef(new Map());
    const getColor = (name, allIndustries = []) => {
      if (!name) return "#7F8C8D";
      if (!colorMapRef.current.has(name)) {
        if (INDUSTRY_COLOR_MAP[name]) {
          colorMapRef.current.set(name, INDUSTRY_COLOR_MAP[name]);
        } else {
          const idx = allIndustries.indexOf(name);
          const pick =
            (idx >= 0 ? idx : colorMapRef.current.size) %
            ENHANCED_COLOR_PALETTE.length;
          colorMapRef.current.set(name, ENHANCED_COLOR_PALETTE[pick]);
        }
      }
      return colorMapRef.current.get(name);
    };
    return getColor;
  }
  const internalColorOf = useDistributedColors();

  /* ---------- Normalize input ---------- */
  const dealsSource = useMemo(() => {
    if (Array.isArray(deals)) return deals;
    if (Array.isArray(data)) return data;
    return [];
  }, [deals, data]);

  const { rows, industries, top5 } = useMemo(() => {
    const byYearIndustry = {};
    const yearSet = new Set();
    const industrySet = new Set();
       const totals = {};

    dealsSource.forEach((d) => {
      const year = Number(d.Year ?? d.year);
      if (!year || year === 2025) return;
      const ind = (d.Industry && String(d.Industry).trim()) || "Unknown";
      if (!ind) return;

      yearSet.add(year);
      industrySet.add(ind);
      byYearIndustry[year] ??= {};
      byYearIndustry[year][ind] ??= { count: 0, volume: 0 };

      const amt = typeof d.Amount === "number" && isFinite(d.Amount) ? d.Amount : 0;
      byYearIndustry[year][ind].count += 1;
      byYearIndustry[year][ind].volume += amt;

      totals[ind] = (totals[ind] || 0) + amt;
    });

    const years = Array.from(yearSet).sort((a, b) => a - b);
    const inds = Array.from(industrySet).sort();

    const rows = years.map((year) => {
      const entry = { year };
      let tc = 0;
      let tv = 0;
      inds.forEach((ind) => {
        const cKey = `${sanitizeKey(ind)}__count`;
        const vKey = `${sanitizeKey(ind)}__volume`;
        const cell = byYearIndustry[year]?.[ind];
        const c = cell ? cell.count : 0;
        const v = cell ? cell.volume : 0;
        entry[cKey] = c;
        entry[vKey] = +v;
        tc += c;
        tv += v;
      });
      entry.totalCount = tc;
      entry.totalVolume = +tv;
      return entry;
    });

    const top5 = Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    return { rows, industries: inds, top5 };
  }, [dealsSource]);

  const colorOf =
    externalColorOf && externalColorOf.useExternal
      ? externalColorOf
      : (name) => internalColorOf(name, industries);

  /* ---------- Axis maxima & ticks ---------- */
  const volumeMaxPerIndustry = useMemo(() => {
    let m = 0;
    for (const r of rows) {
      for (const ind of industries) {
        const v = r[`${sanitizeKey(ind)}__volume`] || 0;
        if (v > m) m = v;
      }
    }
    return m;
  }, [rows, industries]);

  const totalVolumeMax = useMemo(
    () => (rows.length ? Math.max(...rows.map((r) => r.totalVolume || 0)) : 0),
    [rows]
  );

  const totalCountMax = useMemo(
    () => (rows.length ? Math.max(...rows.map((r) => r.totalCount || 0)) : 0),
    [rows]
  );

  const countMaxPerIndustry = useMemo(() => {
    let m = 0;
    for (const r of rows) {
      for (const ind of industries) {
        const v = r[`${sanitizeKey(ind)}__count`] || 0;
        if (v > m) m = v;
      }
    }
    return m;
  }, [rows, industries]);

  const volumeTicksLine = getTicks(0, volumeMaxPerIndustry, 500);
  const volumeTicksStack = getTicks(0, totalVolumeMax, 500);
  const countTicksStack = getTicks(0, totalCountMax, 50);
  const countTicksLine = getTicks(0, countMaxPerIndustry, 50);

  // add a bit of headroom to prevent clipping
  const padPct = 0.04;
  const volumeDomainStack = [0, Math.ceil(totalVolumeMax * (1 + padPct))];
  const countDomainStack = [0, Math.ceil(totalCountMax * (1 + padPct))];
  const volumeDomainLine = [0, Math.ceil(volumeMaxPerIndustry * (1 + padPct))];
  const countDomainLine = [0, Math.ceil(countMaxPerIndustry * (1 + padPct))];

  // ---- include TOTAL when drawing line charts (used conditionally)
  const withTotalMax = {
    volume: Math.max(volumeMaxPerIndustry, totalVolumeMax),
    count: Math.max(countMaxPerIndustry, totalCountMax),
  };
  const volumeTicksLineWithTotal = getTicks(0, withTotalMax.volume, 500);
  const countTicksLineWithTotal = getTicks(0, withTotalMax.count, 50);
  const volumeDomainLineWithTotal = [0, Math.ceil(withTotalMax.volume * (1 + padPct))];
  const countDomainLineWithTotal = [0, Math.ceil(withTotalMax.count * (1 + padPct))];

  /* ---------- Custom shifted line (keeps values but moves path up in px) ---------- */
  const ShiftedLine = ({ points, stroke, strokeWidth = 3, offset = 8 }) => {
    if (!points || !points.length) return null;
    const d = points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y - offset}`).join(" ");
    return (
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    );
  };

  /* ---------- Labeling rules ---------- */
  const effectiveSelectedCount =
    Array.isArray(selectedIndustries) && selectedIndustries.length > 0
      ? selectedIndustries.length
      : industries.length;
  const shouldFullyLabelLines = effectiveSelectedCount <= 3;

  const latestYear = useMemo(
    () => (rows.length ? Math.max(...rows.map((r) => Number(r.year) || 0)) : 0),
    [rows]
  );
  const latestRow = useMemo(
    () => rows.find((r) => Number(r.year) === latestYear),
    [rows, latestYear]
  );

  const visibleIndustrySet = useMemo(
    () => new Set((selectedIndustries?.length ? selectedIndustries : industries) ?? []),
    [selectedIndustries, industries]
  );

  const top3For2024 = useMemo(() => {
    const out = { volume: new Set(), count: new Set() };
    if (!latestRow || latestYear !== 2024) return out;

    const pickTop3 = (metricSuffix) => {
      const scored = industries
        .filter((ind) => visibleIndustrySet.has(ind))
        .map((ind) => ({
          ind,
          v: Number(latestRow[`${sanitizeKey(ind)}__${metricSuffix}`] || 0),
        }))
        .filter(({ v }) => v > 0)
        .sort((a, b) => b.v - a.v)
        .slice(0, 3)
        .map(({ ind }) => ind);
      return new Set(scored);
    };

    out.volume = pickTop3("volume");
    out.count = pickTop3("count");
    return out;
  }, [industries, latestRow, latestYear, visibleIndustrySet]);

  /* ---------- Renderers ---------- */
  const createRenderFunctions = (
    mode,
    metricSuffix,
    showLabelsEnabled,
    isExpandedView = false,
    chartDims
  ) => {
    const totalKey = metricSuffix === "volume" ? "totalVolume" : "totalCount";
    const barSize = isExpandedView ? 48 : 36;

    const MIN_SHARE = 0.1;
    const MIN_PX = 12;
    const TOP5_MIN_SHARE = 0.06;
    const TOP5_MIN_PX = 10;

    const formatK = (n) => {
      if (metricSuffix === "count") return `${n ?? 0}`;
      const v = Number(n) || 0;
      if (v >= 1000) {
        const k = v / 1000;
        const kr = Math.round(k * 10) / 10;
        return kr % 1 === 0 ? `${kr.toFixed(0)}k` : `${kr.toFixed(1)}k`;
      }
      const r = Math.round(v * 10) / 10;
      return r % 1 === 0 ? `${r.toFixed(0)}` : `${r.toFixed(1)}`;
    };

    /* ----- Bars (stacked) ----- */
    const renderBars = () =>
      industries.map((ind, idx) => {
        const key = `${sanitizeKey(ind)}__${metricSuffix}`;
        const isLastStack = idx === industries.length - 1;

        return (
          <Bar
            key={key}
            dataKey={key}
            stackId={`stack-${metricSuffix}`}
            fill={colorOf(ind)}
            name={ind}
            barSize={barSize}
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

                  if (metricSuffix === "volume" && v < 5) return null;
                  if (metricSuffix === "count" && v < 2) return null;

                  const share = v / total;
                  const meetsDefault = share >= MIN_SHARE && height >= MIN_PX;
                  const meetsTop5 =
                    Array.isArray(top5) &&
                    top5.includes(ind) &&
                    share >= TOP5_MIN_SHARE &&
                    height >= TOP5_MIN_PX;
                  if (!(meetsDefault || meetsTop5)) return null;

                  const cx = x + width / 2;
                  const cy = clampY(y + height / 2, chartDims, 10);

                  return (
                    <text
                      x={cx}
                      y={cy}
                      fill="#000"
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

            {showLabelsEnabled && isLastStack && (
              <LabelList
                dataKey={totalKey}
                position="top"
                offset={isExpandedView ? 18 : 14}
                content={({ x, y, width, value }) => {
                  if (x == null || y == null || width == null) return null;
                  const cx = x + width / 2;
                  const ySafe = clampY(y - (isExpandedView ? 14 : 10), chartDims, 10);
                  return (
                    <text
                      x={cx}
                      y={ySafe}
                      fill="#000"
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
            )}
          </Bar>
        );
      });

    /* ----- Lines ----- */

    // Only-right-end labels for TOP-3 in 2024 when >3 sectors
    const renderRightEndLabelsForLines = () =>
      industries.map((ind, idx) => {
        const key = `${sanitizeKey(ind)}__${metricSuffix}`;
        if (shouldFullyLabelLines || !showLabelsEnabled) return null;

        const top3Set = metricSuffix === "volume" ? top3For2024.volume : top3For2024.count;
        const shouldConsider = latestYear === 2024 && top3Set.has(ind);
        if (!shouldConsider) return null;

        return (
          <Bar
            key={`_line_labels_${key}`}
            dataKey={key}
            name="__helper__"
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
                if (index !== rows.length - 1) return null;
                if (Number(rows[index]?.year) !== 2024) return null;

                const v = Number(value) || 0;
                if (metricSuffix === "volume" && v < 5) return null;
                if (metricSuffix === "count" && v < 2) return null;

                const rightOffset = isExpandedView ? 8 : 4;
                const baseX = x != null ? x + (width || 0) : 0;
                const cx = baseX + rightOffset;

                const lift = [-12, -6, -18][idx % 3];
                const cy = clampY((y ?? 0) + lift, chartDims, 10);

                return (
                  <text
                    x={cx}
                    y={cy}
                    fill="#000"
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

    // Full point labels (when ≤3 industries). Uses configurable base lift & stagger.
    const renderFullPointLabelsForLines = () =>
      industries.map((ind, seriesIdx) => {
        const key = `${sanitizeKey(ind)}__${metricSuffix}`;
        if (!shouldFullyLabelLines || !showLabelsEnabled) return null;

        const lastYByX = new Map();

        return (
          <Bar
            key={`_line_full_labels_${key}`}
            dataKey={key}
            name="__helper__"
            fill="transparent"
            stroke="transparent"
            isAnimationActive={false}
            legendType="none"
            shape={() => null}
          >
            <LabelList
              dataKey={key}
              content={({ x, y, value }) => {
                if (x == null || y == null) return null;
                const v = Number(value) || 0;
                if (metricSuffix === "volume" && v < 1) return null;
                if (metricSuffix === "count" && v < 1) return null;

                const dyTable = isExpandedView ? SMALLSET_LABEL_DY.expanded : SMALLSET_LABEL_DY.regular;
                const baseLift = isExpandedView ? SMALLSET_LABEL_BASE_LIFT.expanded : SMALLSET_LABEL_BASE_LIFT.regular;

                let ySafe = clampY(y + baseLift + dyTable[seriesIdx % dyTable.length], chartDims, 10);

                const keyX = Math.round(Number(x));
                const prevY = lastYByX.get(keyX);
                if (prevY != null && Math.abs(prevY - ySafe) < 12) {
                  ySafe = ySafe - 12;
                }
                lastYByX.set(keyX, ySafe);

                return (
                  <text
                    x={x}
                    y={ySafe}
                    fill="#000"
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
          </Bar>
        );
      });

    const renderLines = () => (
      <>
        {industries.map((ind) => {
          const key = `${sanitizeKey(ind)}__${metricSuffix}`;
          return (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colorOf(ind)}
              strokeWidth={isExpandedView ? 3 : 2}
              dot={{ r: isExpandedView ? 5 : 3 }}
              name={ind}
            />
          );
        })}
        {renderRightEndLabelsForLines()}
        {renderFullPointLabelsForLines()}
      </>
    );

    return {
      main: mode === "column" ? renderBars() : renderLines(),
      labels: null,
    };
  };

  /* ---------- Legend ---------- */
  const Legend = ({ industries, colorOf, isCompact = false }) => (
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

  /* ---------- Expanded content ---------- */
  const ExpandedChartContent = () => {
    const isVolumeChart = expandedChart === "volume";
    const metricSuffix = isVolumeChart ? "volume" : "count";
    const yAxisLabel = isVolumeChart ? "Investment Volume CHF (M)" : "Number of Deals";
    const totalDataKey = isVolumeChart ? "totalVolume" : "totalCount";

    const dims = getChartDims(true, 800);

    const volTicks =
      expandedMode === "column"
        ? volumeTicksStack
        : expandedShowTotal
        ? volumeTicksLineWithTotal
        : volumeTicksLine;

    const cntTicks =
      expandedMode === "column"
        ? countTicksStack
        : expandedShowTotal
        ? countTicksLineWithTotal
        : countTicksLine;

    const domain = isVolumeChart
      ? expandedMode === "column"
        ? volumeDomainStack
        : expandedShowTotal
        ? volumeDomainLineWithTotal
        : volumeDomainLine
      : expandedMode === "column"
      ? countDomainStack
      : expandedShowTotal
      ? countDomainLineWithTotal
      : countDomainLine;

    return (
      <div className="space-y-4">
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

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={expandedShowTotal}
              onChange={(e) => setExpandedShowTotal(e.target.checked)}
              className="text-red-600 focus:ring-red-500"
            />
            <span className="text-gray-700">Show total</span>
          </label>

          <label className="flex items-center gap-2 ml-auto">
            <input
              type="checkbox"
              checked={expandedShowLabels}
              onChange={(e) => setExpandedShowLabels(e.target.checked)}
              className="text-red-600 focus:ring-red-500"
            />
            <span className="text-gray-700">Show data labels</span>
          </label>
        </div>

        <ResponsiveContainer width="100%" height={800}>
          <ComposedChart data={rows} margin={dims.margin} style={{ overflow: "visible" }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              type="category"
              dataKey="year"
              stroke={axisStroke}
              fontSize={16}
              padding={{ left: 24, right: 24 }}
              tickMargin={12}
              height={60}
            />
            <YAxis
              stroke={axisStroke}
              fontSize={16}
              ticks={isVolumeChart ? volTicks : cntTicks}
              domain={domain}
              allowDecimals={false}
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
              content={<SortedTooltip isVolume={isVolumeChart} />}
            />

            {expandedShowTotal &&
              (expandedMode === "column" ? (
                <Line
                  type="monotone"
                  dataKey={totalDataKey}
                  stroke="#000"
                  strokeWidth={3}
                  dot={false}
                  name="Total"
                  shape={(props) => <ShiftedLine {...props} offset={12} />}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey={totalDataKey}
                  stroke="#000"
                  strokeWidth={3}
                  dot={false}
                  name="Total"
                />
              ))}

            {createRenderFunctions(expandedMode, metricSuffix, expandedShowLabels, true, { ...dims }).main}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  /* ---------- Page charts (dual) ---------- */
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
    const dims = getChartDims(isExpandedView);

    return (
      <div className="space-y-4">
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

          <label className="flex items-center gap-2 ml-auto">
            <input
              type="checkbox"
              checked={showTotalState}
              onChange={(e) => onShowTotalChange(e.target.checked)}
              className="text-red-600 focus:ring-red-500"
            />
            <span className="text-gray-700">Show total</span>
          </label>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: Volume */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800">
                Investment Volume vs Year (CHF M)
              </h3>
              {!isExpandedView && (
                <button
                  onClick={() => {
                    setExpandedChart("volume");
                    setIsExpanded(true);
                  }}
                  className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  title="Expand Volume Chart"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={dims.height}>
              <ComposedChart data={rows} margin={dims.margin} style={{ overflow: "visible" }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  type="category"
                  dataKey="year"
                  stroke={axisStroke}
                  fontSize={12}
                  padding={{ left: 18, right: 18 }}
                  tickMargin={12}
                  height={60}
                />
                <YAxis
                  stroke={axisStroke}
                  fontSize={12}
                  ticks={
                    leftModeState === "column"
                      ? volumeTicksStack
                      : showTotalState
                      ? volumeTicksLineWithTotal
                      : volumeTicksLine
                  }
                  domain={
                    leftModeState === "column"
                      ? volumeDomainStack
                      : showTotalState
                      ? volumeDomainLineWithTotal
                      : volumeDomainLine
                  }
                  allowDecimals={false}
                  allowDataOverflow
                  label={{
                    value: "Investment Volume CHF (M)",
                    angle: -90,
                    position: "insideLeft",
                    fill: axisStroke,
                    fontSize: 12,
                    dx: "-1.5em",
                    dy: "3em",
                    style: { textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  wrapperStyle={{ pointerEvents: "none", zIndex: 9999 }}
                  content={<SortedTooltip isVolume />}
                />

                {showTotalState &&
                  (leftModeState === "column" ? (
                    <Line
                      type="linear"
                      dataKey="totalVolume"
                      stroke="#000"
                      strokeWidth={isExpandedView ? 4 : 3}
                      dot={false}
                      name="Total"
                      shape={(props) => <ShiftedLine {...props} offset={8} />}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="totalVolume"
                      stroke="#000"
                      strokeWidth={isExpandedView ? 4 : 3}
                      dot={false}
                      name="Total"
                    />
                  ))}

                {createRenderFunctions(leftModeState, "volume", showLabelsState, isExpandedView, { ...dims }).main}
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
                  className="p-2 rounded-md bg-green-600 hover:bg-green-700 text-white shadow-md"
                  title="Expand Count Chart"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={dims.height}>
              <ComposedChart data={rows} margin={dims.margin} style={{ overflow: "visible" }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  type="category"
                  dataKey="year"
                  stroke={axisStroke}
                  fontSize={12}
                  padding={{ left: 18, right: 18 }}
                  tickMargin={12}
                  height={60}
                />
                <YAxis
                  stroke={axisStroke}
                  fontSize={12}
                  ticks={
                    rightModeState === "column"
                      ? countTicksStack
                      : showTotalState
                      ? countTicksLineWithTotal
                      : countTicksLine
                  }
                  domain={
                    rightModeState === "column"
                      ? countDomainStack
                      : showTotalState
                      ? countDomainLineWithTotal
                      : countDomainLine
                  }
                  allowDecimals={false}
                  label={{
                    value: "Number of Deals",
                    angle: -90,
                    position: "insideLeft",
                    fill: axisStroke,
                    fontSize: 12,
                    dx: "-1.4em",
                    dy: "3em",
                    style: { textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  wrapperStyle={{ pointerEvents: "none", zIndex: 9999 }}
                  content={<SortedTooltip isVolume={false} />}
                />

                {showTotalState &&
                  (rightModeState === "column" ? (
                    <Line
                      type="linear"
                      dataKey="totalCount"
                      stroke="#000"
                      strokeWidth={isExpandedView ? 4 : 3}
                      dot={false}
                      name="Total"
                      shape={(props) => <ShiftedLine {...props} offset={8} />}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="totalCount"
                      stroke="#000"
                      strokeWidth={isExpandedView ? 4 : 3}
                      dot={false}
                      name="Total"
                    />
                  ))}

                {createRenderFunctions(rightModeState, "count", showLabelsState, isExpandedView, { ...dims }).main}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex justify-center">
          <Legend industries={industries} colorOf={colorOf} />
        </div>
      </div>
    );
  };

  return (
    <>
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
