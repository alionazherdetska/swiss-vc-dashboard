import React, { useState, useMemo, useRef } from "react";
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  LabelList,
} from "recharts";
import { Maximize2, X } from "lucide-react";

const CHART_MARGIN = { top: 50, right: 50, left: 60, bottom: 60 };
const EXPANDED_CHART_MARGIN = { top: 80, right: 80, left: 80, bottom: 80 };

// Specific color assignments for each industry
const INDUSTRY_COLOR_MAP = {
  "Biotech": "#E84A5F",        // Red
  "Cleantech": "#2ECC71",      // Green
  "Consumer Products": "#3498DB", // Blue
  "Deep Tech": "#A0522D",      // Brown
  "Healthcare It": "#F7931E",  // Orange
  "ICT": "#9B5DE5",           // Purple
  "Interdisciplinary": "#1ABC9C", // Teal
  "MedTech": "#FFD700",       // Gold
  "Micro / Nano": "#FF1493",  // Deep Pink
  "Unknown": "#32CD32",       // Lime Green
};

const ENHANCED_COLOR_PALETTE = [
  "#E84A5F", "#2ECC71", "#3498DB", "#A0522D", "#F7931E", 
  "#9B5DE5", "#1ABC9C", "#FFD700", "#FF1493", "#32CD32", 
  "#4169E1", "#8B4513", "#FF4500", "#8A2BE2", "#00CED1",
];

// Modal Component
const ChartModal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Expandable QuarterlyAnalysisChart
export const ExpandableQuarterlyAnalysisChart = ({
  deals,
  data,
  isDark = false,
  colorOf: externalColorOf,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedChart, setExpandedChart] = useState("volume"); // "volume" or "count"
  const [leftMode, setLeftMode] = useState("line");
  const [rightMode, setRightMode] = useState("line");
  const [showTotal, setShowTotal] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  // For expanded view, always show labels
  const [expandedMode, setExpandedMode] = useState("line");
  const [expandedShowTotal, setExpandedShowTotal] = useState(true);
  const [expandedShowLabels, setExpandedShowLabels] = useState(true);

  const sanitizeKey = (s) =>
    String(s || "Unknown").replace(/\s+/g, "_").replace(/[^\w]/g, "_");

  const axisStroke = isDark ? "#D1D5DB" : "#4A5568";
  const gridStroke = isDark ? "#374151" : "#E2E8F0";
  const tooltipStyle = {
    backgroundColor: isDark ? "#374151" : "white",
    border: `1px solid ${isDark ? "#4B5563" : "#E2E8F0"}`,
    borderRadius: "8px",
    color: isDark ? "#F3F4F6" : "#1F2937",
  };

  function useDistributedColors() {
    const colorMapRef = useRef(new Map());
    
    const getColor = (name, allIndustries = []) => {
      if (!name) return "#7F8C8D";
      
      if (!colorMapRef.current.has(name)) {
        if (INDUSTRY_COLOR_MAP[name]) {
          colorMapRef.current.set(name, INDUSTRY_COLOR_MAP[name]);
        } else {
          const industryIndex = allIndustries.indexOf(name);
          const colorIndex = industryIndex >= 0 
            ? industryIndex % ENHANCED_COLOR_PALETTE.length
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

  const { rows, industries, top5 } = useMemo(() => {
    const byYearIndustry = {};
    const industrySet = new Set();
    const yearSet = new Set();
    const industryTotals = {}; // Track total volume per industry

    // First pass: calculate totals for each industry and exclude 2025
    dealsSource.forEach((d) => {
      const year = Number(d.Year ?? d.year);
      if (!year || year === 2025) return; // Skip 2025 data

      const ind = (d.Industry && String(d.Industry).trim()) || "Unknown";
      if (ind === "Unknown") return; // Skip Unknown entries
      
      const amt = typeof d.Amount === "number" && isFinite(d.Amount) ? d.Amount : 0;
      industryTotals[ind] = (industryTotals[ind] || 0) + amt;
    });

    // Get top 5 industries by total volume
    const top5Industries = Object.entries(industryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([industry]) => industry);

    // Second pass: process all industries (we'll still highlight top5 via labels)
    dealsSource.forEach((d) => {
      const year = Number(d.Year ?? d.year);
      if (!year || year === 2025) return; // Skip 2025 data

      const ind = (d.Industry && String(d.Industry).trim()) || "Unknown";
      // include all industries in the dataset; labels will be limited to top5 later
      
      industrySet.add(ind);
      yearSet.add(year);

      byYearIndustry[year] = byYearIndustry[year] || {};
      byYearIndustry[year][ind] = byYearIndustry[year][ind] || { count: 0, volume: 0 };

      const amt = typeof d.Amount === "number" && isFinite(d.Amount) ? d.Amount : 0;
      byYearIndustry[year][ind].count += 1;
      byYearIndustry[year][ind].volume += amt;
    });

    const years = Array.from(yearSet).sort((a, b) => a - b);
    const inds = Array.from(industrySet).sort();

    const 
    rows = years.map((year) => {
      const entry = { year };
      let totalCount = 0;
      let totalVolume = 0;
      inds.forEach((ind) => {
        const cKey = `${sanitizeKey(ind)}__count`;
        const vKey = `${sanitizeKey(ind)}__volume`;
        const cell = byYearIndustry[year][ind];
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

  return { rows, industries: inds, top5: top5Industries };
  }, [dealsSource]);

  const colorOf = externalColorOf && externalColorOf.useExternal 
    ? externalColorOf 
    : (name) => internalColorOf(name, industries);

  const volumeMax = React.useMemo(() => {
    // For individual industry lines/bars, we want to scale to the max individual value
    let industryMax = 0;
    for (const r of rows) {
      for (const ind of industries) {
        const vKey = `${sanitizeKey(ind)}__volume`;
        if (r[vKey] && r[vKey] > industryMax) industryMax = r[vKey];
      }
    }
    return industryMax;
  }, [rows, industries]);

  // Chart rendering functions
  const createRenderFunctions = (mode, metricSuffix, showLabelsEnabled, isExpandedView = false) => {
    const renderBars = () =>
      industries.map((ind) => {
        const key = `${sanitizeKey(ind)}__${metricSuffix}`;
        return (
          <Bar
            key={key}
            dataKey={key}
            // grouped bars (no stacking) for column mode
            fill={colorOf(ind)}
            name={ind}
            barSize={isExpandedView ? 24 : 16}
            radius={[0, 0, 0, 0]}
          />
        );
      });

    const renderLines = () =>
      industries.map((ind) => {
        const key = `${sanitizeKey(ind)}__${metricSuffix}`;
        return (
          <Line
            key={key}
            type="linear"
            dataKey={key}
            stroke={colorOf(ind)}
            strokeWidth={isExpandedView ? 3 : 2}
            dot={{ r: isExpandedView ? 5 : 3 }}
            name={ind}
          />
        );
      });

    const renderBarLabels = () => {
      // show labels only for the selected label year (prefer 2024, else last year)
      const lastYear = rows && rows.length ? rows[rows.length - 1].year : undefined;
      const labelYearPreferred = 2024;
      const labelYear = rows && rows.some(r => r.year === labelYearPreferred) ? labelYearPreferred : lastYear;
      const top5Set = new Set((typeof top5 !== 'undefined' && top5) ? top5 : []);
      return industries.map((ind) => {
        const key = `${sanitizeKey(ind)}__${metricSuffix}`;
        return (
          <Bar
            key={`${key}__labels`}
            dataKey={key}
            fill="transparent"
            stroke="transparent"
            isAnimationActive={false}
            legendType="none"
            // prevent the Bar geometry from rendering; we only want the labels
            shape={() => null}
          >
            <LabelList
              dataKey={key}
              // custom renderer to place the label to the right of the bar and align vertically
              content={(props) => {
                const { x, y, value, index, payload } = props;
                // robust year extraction: prefer payload, fall back to rows[index]
                const candidateYear = (payload && (payload.year ?? payload.Year));
                const fallbackYear = (typeof index === 'number' && rows && rows[index]) ? rows[index].year : undefined;
                const payloadYear = Number(candidateYear ?? fallbackYear);
                // only render labels for industries in top5 and for the chosen labelYear
                if (!top5Set.has(ind) || labelYear === undefined || payloadYear !== Number(labelYear)) return null;
                const display = metricSuffix === "volume" ? (Number(value) || 0).toFixed(1) : (value != null ? String(value) : "");
                const tx = (x || 0) + (isExpandedView ? 8 : 6);
                const ty = (y || 0);
                const fill = isDark ? "#E5E7EB" : "#374151";
                return (
                  <text x={tx} y={ty} fill={fill} fontSize={isExpandedView ? 12 : 10} textAnchor="start" alignmentBaseline="middle">
                    {display}
                  </text>
                );
              }}
            />
          </Bar>
        );
      });
    };

    const renderLineLabels = () => {
      const lastYear = rows && rows.length ? rows[rows.length - 1].year : undefined;
      const labelYearPreferred = 2024;
      const labelYear = rows && rows.some(r => r.year === labelYearPreferred) ? labelYearPreferred : lastYear;
      const top5Set = new Set((typeof top5 !== 'undefined' && top5) ? top5 : []);
      return industries.map((ind) => {
        const key = `${sanitizeKey(ind)}__${metricSuffix}`;
        return (
          <Line
            key={`${key}__labels`}
            type="linear"
            dataKey={key}
            stroke="transparent"
            dot={false}
            isAnimationActive={false}
            legendType="none"
          >
            <LabelList
              dataKey={key}
              content={(props) => {
                const { x, y, value, index, payload } = props;
                const candidateYear = (payload && (payload.year ?? payload.Year));
                const fallbackYear = (typeof index === 'number' && rows && rows[index]) ? rows[index].year : undefined;
                const payloadYear = Number(candidateYear ?? fallbackYear);
                if (!top5Set.has(ind) || labelYear === undefined || payloadYear !== Number(labelYear)) return null;
                const display = metricSuffix === "volume" ? (Number(value) || 0).toFixed(1) : (value != null ? String(value) : "");
                const tx = (x || 0) + (isExpandedView ? 8 : 6);
                const ty = (y || 0);
                const fill = isDark ? "#E5E7EB" : "#374151";
                return (
                  <text x={tx} y={ty} fill={fill} fontSize={isExpandedView ? 12 : 10} textAnchor="start" alignmentBaseline="middle">
                    {display}
                  </text>
                );
              }}
            />
          </Line>
        );
      });
    };

    return {
      main: mode === "column" ? renderBars() : renderLines(),
      labels: showLabelsEnabled 
        ? (mode === "column" ? renderBarLabels() : renderLineLabels())
        : null
    };
  };

  const ExpandedChartContent = () => {
    const isVolumeChart = expandedChart === "volume";
    const metricSuffix = isVolumeChart ? "volume" : "count";
    const chartTitle = isVolumeChart ? "Investment Volume vs Year (CHF M)" : "Number of Deals vs Year";
    const yAxisLabel = isVolumeChart ? "Investment Volume CHF (M)" : "Number of Deals";
    const totalDataKey = isVolumeChart ? "totalVolume" : "totalCount";
    const formatter = isVolumeChart 
      ? (v, name) => [`${(+v).toFixed(1)}M CHF`, name]
      : (v, name) => [v, name];

    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className={`flex flex-wrap items-center gap-4 p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
          <div className="flex items-center gap-2">
            <span className={isDark ? "text-gray-200" : "text-gray-700"}>Chart Type:</span>
            <select
              value={expandedMode}
              onChange={(e) => setExpandedMode(e.target.value)}
              className={`px-3 py-1 border rounded-md text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"}`}
            >
              <option value="line">Line</option>
              <option value="column">Column</option>
            </select>
          </div>

          <label className="flex items-center gap-2 ml-auto">
            <input
              type="checkbox"
              checked={expandedShowTotal}
              onChange={(e) => setExpandedShowTotal(e.target.checked)}
              className="text-red-600 focus:ring-red-500"
            />
            <span className={isDark ? "text-gray-200" : "text-gray-700"}>Show total line</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={expandedShowLabels}
              onChange={(e) => setExpandedShowLabels(e.target.checked)}
              className="text-red-600 focus:ring-red-500"
            />
            <span className={isDark ? "text-gray-200" : "text-gray-700"}>Show data labels</span>
          </label>
        </div>

        {/* Expanded Chart */}
        <div className="space-y-2">
          <h3 className={`text-xl font-bold text-center ${isDark ? "text-gray-200" : "text-gray-800"}`}>
            {chartTitle}
          </h3>
          <ResponsiveContainer width="100%" height={700}>
            <ComposedChart 
              data={rows} 
              margin={{ top: 80, right: 80, left: 80, bottom: 80 }}
              style={{ overflow: "visible" }}
            >
              <defs>
                <filter id="glow-black-expanded" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/>
              <XAxis 
                dataKey="year" 
                stroke={axisStroke}
                fontSize={16}
              />
              <YAxis 
                stroke={axisStroke}
                fontSize={16}
                domain={isVolumeChart ? [0, Math.ceil(volumeMax * 1.1)] : undefined}
                allowDataOverflow={isVolumeChart}
                label={{
                  value: yAxisLabel,
                  angle: -90,
                  position: "insideLeft",
                  fill: axisStroke,
                  fontSize: 16,
                  dx: "-2.5em",
                  dy: "4.5em",
                  style: { textAnchor: 'middle' }
                }} 
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={formatter}
              />
              <Legend/>
              
              {createRenderFunctions(expandedMode, metricSuffix, expandedShowLabels, true).main}
              
              {expandedShowTotal && (
                <Line
                  type="linear"
                  dataKey={totalDataKey}
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
        </div>
      </div>
    );
  };

  const ChartContent = ({ 
    isExpandedView = false, 
    leftModeState, 
    rightModeState, 
    showTotalState, 
    showLabelsState,
    onLeftModeChange,
    onRightModeChange,
    onShowTotalChange,
    onShowLabelsChange
  }) => (
    <div className="space-y-4">
      {/* Controls */}
      <div className={`flex flex-wrap items-center gap-4 p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
        <div className="flex items-center gap-2">
          <span className={isDark ? "text-gray-200" : "text-gray-700"}>Left (Volume):</span>
          <select
            value={leftModeState}
            onChange={(e) => onLeftModeChange(e.target.value)}
            className={`px-3 py-1 border rounded-md text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"}`}
          >
            <option value="line">Line</option>
            <option value="column">Column</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className={isDark ? "text-gray-200" : "text-gray-700"}>Right (Count):</span>
          <select
            value={rightModeState}
            onChange={(e) => onRightModeChange(e.target.value)}
            className={`px-3 py-1 border rounded-md text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"}`}
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
          <span className={isDark ? "text-gray-200" : "text-gray-700"}>Show total line</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showLabelsState}
            onChange={(e) => onShowLabelsChange(e.target.checked)}
            className="text-red-600 focus:ring-red-500"
          />
          <span className={isDark ? "text-gray-200" : "text-gray-700"}>Show data labels</span>
        </label>

        {!isExpandedView && (
          <>
            <button
              onClick={() => {
                setExpandedChart("volume");
                setIsExpanded(true);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isDark 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Maximize2 className="h-4 w-4" />
              Expand Volume Chart
            </button>
            <button
              onClick={() => {
                setExpandedChart("count");
                setIsExpanded(true);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isDark 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              <Maximize2 className="h-4 w-4" />
              Expand Count Chart
            </button>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Volume Chart */}
        <div className="space-y-2 relative">
          <h3 className={`text-lg font-semibold text-center ${isDark ? "text-gray-200" : "text-gray-800"}`}>
            Investment Volume vs Year (CHF M)
          </h3>
          <ResponsiveContainer width="100%" height={isExpandedView ? 600 : 420}>
            <ComposedChart 
              data={rows} 
              margin={isExpandedView ? EXPANDED_CHART_MARGIN : CHART_MARGIN}
              style={{ overflow: "visible" }}
            >
              <defs>
                <filter id="glow-black" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/>
              <XAxis 
                dataKey="year" 
                stroke={axisStroke}
                fontSize={isExpandedView ? 14 : 12}
              />
              <YAxis 
                stroke={axisStroke}
                fontSize={isExpandedView ? 14 : 12}
                domain={[0, Math.ceil(volumeMax * 1.1)]}
                allowDataOverflow
                label={{
                  value: "Investment Volume CHF (M)",
                  angle: -90,
                  position: "insideLeft",
                  fill: axisStroke,
                  fontSize: isExpandedView ? 14 : 12,
                  dx: isExpandedView ? "-2em" : "-1.5em",
                  dy: isExpandedView ? "4em" : "3em",
                  style: { textAnchor: 'middle' }
                }} 
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => [`${(+v).toFixed(1)}M CHF`, name]}
              />
              <Legend/>
              
              {createRenderFunctions(leftModeState, "volume", showLabelsState, isExpandedView).main}
              
              {showTotalState && (
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

        {/* RIGHT: Count Chart */}
        <div className="space-y-2 relative">
          <h3 className={`text-lg font-semibold text-center ${isDark ? "text-gray-200" : "text-gray-800"}`}>
            Number of Deals vs Year
          </h3>
          <ResponsiveContainer width="100%" height={isExpandedView ? 600 : 420}>
            <ComposedChart 
              data={rows} 
              margin={isExpandedView ? EXPANDED_CHART_MARGIN : CHART_MARGIN}
              style={{ overflow: "visible" }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis 
                dataKey="year" 
                stroke={axisStroke}
                fontSize={isExpandedView ? 14 : 12}
              />
              <YAxis
                stroke={axisStroke}
                fontSize={isExpandedView ? 14 : 12}
                label={{ 
                  value: "Number of Deals", 
                  angle: -90, 
                  position: "insideLeft", 
                  fill: axisStroke,
                  fontSize: isExpandedView ? 14 : 12, 
                  dx: isExpandedView ? "-1.8em" : "-1.4em",
                  dy: isExpandedView ? "4em" : "3em",
                  style: { textAnchor: 'middle' } 
                }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => [v, name]}
              />
              <Legend />
              
              {createRenderFunctions(rightModeState, "count", showLabelsState, isExpandedView).main}
              
              {showTotalState && (
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
    </div>
  );

  return (
    <>
      {/* Regular Chart */}
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

      {/* Expanded Modal */}
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