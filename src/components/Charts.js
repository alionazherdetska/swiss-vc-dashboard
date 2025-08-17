import React, {useMemo, useRef, useState} from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Area,
  AreaChart,
  ComposedChart,
    LabelList,
} from "recharts";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { Factory } from "./CustomIcons";
import {FIXED_INDUSTRY_COLORS} from "./colors";

export const COLOR_PALETTE = [
  "#E84A5F", // Primary Red (Swiss theme)
  "#3498DB", // Blue
  "#2ECC71", // Green
  "#F7931E", // Yellow
  "#9B59B6", // Purple
  "#FF6B35", // Orange
  "#1ABC9C", // Teal
  "#7F8C8D", // Gray
  "#E84A5F", // Primary Red (repeat for more items)
  "#3498DB", // Blue (repeat)
  "#2ECC71", // Green (repeat)
  "#F7931E", // Yellow (repeat)
  "#9B59B6", // Purple (repeat)
  "#FF6B35", // Orange (repeat)
  "#1ABC9C", // Teal (repeat)
  "#7F8C8D", // Gray (repeat)
  "#E84A5F", // Primary Red (repeat)
  "#3498DB", // Blue (repeat)
  "#2ECC71", // Green (repeat)
  "#F7931E", // Yellow (repeat)
];

const CHART_MARGIN = { top: 50, right: 50, left: 10, bottom: 10 };

// Updated TimelineChart with Volume option
// Updated TimelineChart (drop-in replacement)
export const TimelineChart = ({
                                data,
                                showVolume = false,
                                isDark = false,
                                title,            // NEW
                                yLabel            // NEW (e.g., "CHF (M)" or "Number of Deals")
                              }) => {
  const chartKey = showVolume ? "volume" : "count";
  const defaultY = showVolume ? "Volume (CHF M)" : "Count";
  const chartLabel = yLabel || defaultY;

  return (
      <div className="space-y-2">
        {title && (
            <h3 className={`text-lg font-bold text-center ${isDark ? "text-gray-200" : "text-gray-800"}`}>
              {title}
            </h3>
        )}
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={CHART_MARGIN}>
            <defs>
              <linearGradient id={`color-${chartKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E84A5F" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#E84A5F" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E2E8F0"} />
            <XAxis
                dataKey="year"
                stroke={isDark ? "#D1D5DB" : "#4A5568"}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
                label={{ value: "Year", position: "insideBottomRight", offset: -5, fill: isDark ? "#D1D5DB" : "#4A5568" }} // NEW
            />
            <YAxis
                stroke={isDark ? "#D1D5DB" : "#4A5568"}
                fontSize={12}
                label={{
                  value: chartLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fill: isDark ? "#D1D5DB" : "#4A5568" }
                }}
            />
            <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#374151" : "white",
                  border: `1px solid ${isDark ? "#4B5563" : "#E2E8F0"}`,
                  borderRadius: "8px",
                  color: isDark ? "#F3F4F6" : "#1F2937"
                }}
                formatter={(value) => [
                  showVolume ? `${Number(value).toFixed(1)}M CHF` : value,
                  chartLabel
                ]}
            />
            <Area
                type="monotone"
                dataKey={chartKey}
                stroke="#E84A5F"
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color-${chartKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
  );
};
// New QuarterlyAnalysisChart (drop-in)
export const QuarterlyAnalysisChart = ({
                                           deals,                 // <— preferred: pass filteredDeals here
                                           data,                  // fallback: if you still pass "data", it will try to use it as deals
                                           isDark = false,
                                       }) => {
    // Modes and total overlay
    const [leftMode, setLeftMode] = useState("line");   // "line" | "column"
    const [rightMode, setRightMode] = useState("line"); // "line" | "column"
    const [showTotal, setShowTotal] = useState(true);
    const [showLabels, setShowLabels] = useState(false); // Fixed: Changed to false by default

    // ---- helpers ----
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

    function useIndustryColor() {
        const colorMapRef = useRef(new Map(Object.entries(FIXED_INDUSTRY_COLORS)));

        const getColor = (name) => {
            if (!name) return "#7F8C8D";
            if (!colorMapRef.current.has(name)) {
                const next = COLOR_PALETTE[colorMapRef.current.size % COLOR_PALETTE.length];
                colorMapRef.current.set(name, next);
            }
            return colorMapRef.current.get(name);
        };

        return getColor;
    }
    
    // Pick source: prefer "deals", else try "data"
    const dealsSource = useMemo(() => {
        if (Array.isArray(deals)) return deals;
        if (Array.isArray(data)) return data; // if you still pass filteredDeals via "data"
        return [];
    }, [deals, data]);

    // Build Year x Industry aggregates (count, volume in CHF M)
    const { rows, industries } = useMemo(() => {
        const byYearIndustry = {}; // { [year]: { [industry]: {count, volume} } }
        const industrySet = new Set();
        const yearSet = new Set();

        dealsSource.forEach((d) => {
            const year = Number(d.Year ?? d.year);
            if (!year) return;

            const ind = (d.Industry && String(d.Industry).trim()) || "Unknown";
            industrySet.add(ind);
            yearSet.add(year);

            byYearIndustry[year] = byYearIndustry[year] || {};
            byYearIndustry[year][ind] = byYearIndustry[year][ind] || { count: 0, volume: 0 };

            const amt = typeof d.Amount === "number" && isFinite(d.Amount) ? d.Amount : 0; // already CHF M from your utils
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

        return { rows, industries: inds };
    }, [dealsSource]);

    const colorOf = useIndustryColor();

    // Fixed renderers - removed LabelList from inside
    const renderStackedBars = (metricSuffix) =>
        industries.map((ind) => {
            const key = `${sanitizeKey(ind)}__${metricSuffix}`;
            return (
                <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={colorOf(ind)}
                    name={ind}
                    radius={[3, 3, 0, 0]}
                />
            );
        });

    const renderLines = (metricSuffix) =>
        industries.map((ind) => {
            const key = `${sanitizeKey(ind)}__${metricSuffix}`;
            return (
                <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colorOf(ind)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={ind}
                />
            );
        });

    // Separate label renderers
  const renderStackedBarLabels = (metricSuffix) =>
    industries.map((ind) => {
      const key = `${sanitizeKey(ind)}__${metricSuffix}`;
      return (
        <Bar
          key={`${key}__labels`}
          dataKey={key}
          stackId="a"
          fill="transparent"
          stroke="transparent"
          isAnimationActive={false}
          legendType="none"
        >
          <LabelList
            dataKey={key}
            position="top"
            offset={6}
            style={{
              fontSize: 10,
              fill: isDark ? "#E5E7EB" : "#374151",
              pointerEvents: "none"
            }}
            formatter={(v) => (metricSuffix === "volume" ? (+v).toFixed(1) : v)}
          />
        </Bar>
      );
    });

  const renderLineLabels = (metricSuffix) =>
    industries.map((ind) => {
      const key = `${sanitizeKey(ind)}__${metricSuffix}`;
      return (
        <Line
          key={`${key}__labels`}
          type="monotone"
          dataKey={key}
          stroke="transparent"
          dot={false}
          isAnimationActive={false}
          legendType="none"
        >
          <LabelList
            dataKey={key}
            position="top"
            offset={6}
            style={{
              fontSize: 10,
              fill: isDark ? "#E5E7EB" : "#374151",
              pointerEvents: "none"
            }}
            formatter={(v) => (metricSuffix === "volume" ? (+v).toFixed(1) : v)}
          />
        </Line>
      );
    });

  // Calculate max for Y axis: if showTotal is on, use totalVolume, else use max of all industry volumes
  const volumeMax = React.useMemo(() => {
    if (showTotal) {
      return Math.max(0, ...rows.map(r => r.totalVolume || 0));
    } else {
      // Find max of all industry volumes
      let max = 0;
      for (const r of rows) {
        for (const ind of industries) {
          const vKey = `${sanitizeKey(ind)}__volume`;
          if (r[vKey] && r[vKey] > max) max = r[vKey];
        }
      }
      return max;
    }
  }, [rows, industries, showTotal]);

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div
                className={`flex flex-wrap items-center gap-4 p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2">
                    <span className={isDark ? "text-gray-200" : "text-gray-700"}>Left (Volume):</span>
                    <select
                        value={leftMode}
                        onChange={(e) => setLeftMode(e.target.value)}
                        className={`px-3 py-1 border rounded-md text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"}`}
                    >
                        <option value="line">Line</option>
                        <option value="column">Column</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className={isDark ? "text-gray-200" : "text-gray-700"}>Right (Count):</span>
                    <select
                        value={rightMode}
                        onChange={(e) => setRightMode(e.target.value)}
                        className={`px-3 py-1 border rounded-md text-sm ${isDark ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"}`}
                    >
                        <option value="line">Line</option>
                        <option value="column">Column</option>
                    </select>
                </div>

                <label className="flex items-center gap-2 ml-auto">
                    <input
                        type="checkbox"
                        checked={showTotal}
                        onChange={(e) => setShowTotal(e.target.checked)}
                        className="text-red-600 focus:ring-red-500"
                    />
                    <span className={isDark ? "text-gray-200" : "text-gray-700"}>Show total line</span>
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={showLabels}
                        onChange={(e) => setShowLabels(e.target.checked)}
                        className="text-red-600 focus:ring-red-500"
                    />
                    <span className={isDark ? "text-gray-200" : "text-gray-700"}>Show data labels</span>
                </label>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT: Volume vs Year (CHF M) */}
                <div className="space-y-2">
                    <h3 className={`text-lg font-semibold text-center ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                        Investment Volume vs Year (CHF M)
                    </h3>
                    <ResponsiveContainer width="100%" height={420}>
                        <ComposedChart data={rows} margin={CHART_MARGIN} style={{ overflow: "visible" }}>
                            <defs>
                                <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke}/>
                            <XAxis dataKey="year" stroke={axisStroke}/>
                            <YAxis 
                              stroke={axisStroke}
                              domain={[0, Math.ceil(volumeMax * 1.1)]}
                              allowDataOverflow
                              label={{
                                  value: "Investment Volume CHF (M)",
                                  angle: -90,
                                  position: "insideLeft",
                                  fill: axisStroke,
                                  dx: "-1.5em",
                                  dy: "3em", // Move label down
                                  style: { textAnchor: 'middle' }
                              }} 
                          />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(v, name) => [`${(+v).toFixed(1)}M CHF`, name]}
                            />
                            <Legend/>
                            
                            {/* Main chart elements */}
                            {leftMode === "column" ? renderStackedBars("volume") : renderLines("volume")}
                            
                            {/* Total line */}
                            {showTotal && (
                                <Line
                                    type="monotone"
                                    dataKey="totalVolume"
                                    stroke={isDark ? "#FCA5A5" : "#DC2626"}
                                    strokeWidth={3}
                                    dot={false}
                                    name="Total Volume"
                                    filter="url(#glow-red)"
                                />
                            )}
                            
                            {/* Labels only when enabled */}
                            {showLabels && (leftMode === "column"
                                ? renderStackedBarLabels("volume")
                                : renderLineLabels("volume"))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* RIGHT: Number of Deals vs Year */}
                <div className="space-y-2">
                    <h3 className={`text-lg font-semibold text-center ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                    Number of Deals vs Year
                    </h3>
                    <ResponsiveContainer width="100%" height={420}>
                        <ComposedChart data={rows} margin={CHART_MARGIN} style={{ overflow: "visible" }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="year" stroke={axisStroke} />
                            <YAxis
                                stroke={axisStroke}
                                label={{ 
                                    value: "Number of Deals", 
                                    angle: -90, 
                                    position: "insideLeft", 
                                    fill: axisStroke, 
                                    dx: "-1.4em",
                                    dy: "3em", // Move label down
                                    style: { textAnchor: 'middle' } 
                                }}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(v, name) => [v, name]}
                            />
                            <Legend />
                            
                            {/* Main chart elements */}
                            {rightMode === "column" ? renderStackedBars("count") : renderLines("count")}
                            
                            {/* Total line */}
                            {showTotal && (
                                <Line
                                    type="monotone"
                                    dataKey="totalCount"
                                    stroke={isDark ? "#FCA5A5" : "#DC2626"}
                                    strokeWidth={3}
                                    dot={false}
                                    name="Total Deals"
                                    filter="url(#glow-red)"
                                />
                            )}
                            
                            {/* Labels only when enabled - fixed to use rightMode instead of leftMode */}
                            {showLabels && (rightMode === "column"
                                ? renderStackedBarLabels("count")
                                : renderLineLabels("count"))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export const IndustryDistributionChart = ({ data, activeTab, isDark = false }) => {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return [...data]
      .sort((a, b) => b.value - a.value)
      .map((item) => ({
        name: item.name || "Unknown",
        value: item.value || 0,
      }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>
            No {activeTab === "companies" ? "industry" : "deal type"} data
            available
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={isDark ? "#374151" : "#E2E8F0"} 
        />
        <XAxis
          dataKey="name"
          type="category" 
          stroke={isDark ? "#D1D5DB" : "#4A5568"}
          fontSize={12}
          label={{
            value: activeTab === "companies" ? "Industry" : "Deal Type",
            position: "insideBottomRight",
            offset: -10,
            fill: isDark ? "#D1D5DB" : "#4A5568",
            fontSize: 12,
          }}
        />
        <YAxis
    stroke={isDark ? "#D1D5DB" : "#4A5568"}
    fontSize={12}
    label={{
      value: activeTab === "companies"
        ? "Number of Companies"
        : "Deal Volume (CHF M)",
      angle: -90,
      position: "insideLeft",
      fill: isDark ? "#D1D5DB" : "#4A5568",
      fontSize: 12,
    }}
  />
  <Tooltip
    contentStyle={{
      backgroundColor: isDark ? "#374151" : "white",
      border: `1px solid ${isDark ? "#4B5563" : "#E2E8F0"}`,
      borderRadius: "8px",
      color: isDark ? "#F3F4F6" : "#1F2937"
    }}
    formatter={(value) =>
      activeTab === "companies"
        ? [value, "Companies"]
        : [`${value.toFixed(1)}M CHF`, "Volume"]
    }
  />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3498DB"
          strokeWidth={3}
          dot={{ r: 5 }}
          name={activeTab === "companies" ? "Companies" : "Deals"}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const GeographicDistributionChart = ({ data, isDark = false }) => {
  const cantonData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.slice(0, 8).map((item) => ({
      name: item.name || "Unknown",
      value: item.value || 0,
    }));
  }, [data]);

  if (!cantonData || cantonData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No geographic data available</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={cantonData}
          cx="50%"
          cy="50%"
          outerRadius={120}
          innerRadius={40}
          dataKey="value"
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(1)}%`
          }
          labelLine={false}
        >
          {cantonData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} 
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value}`, "Count"]}
          contentStyle={{
            backgroundColor: isDark ? "#374151" : "white",
            border: `1px solid ${isDark ? "#4B5563" : "#E2E8F0"}`,
            borderRadius: "8px",
            color: isDark ? "#F3F4F6" : "#1F2937"
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const TopIndustriesBarChart = ({ data, isDark = false }) => {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return [...data]
      .sort((a, b) => b.value - a.value)
      .map((item) => ({
        name: item.name || "Unknown",
        value: item.value || 0,
      }));
  }, [data]);

  if (!chartData.length) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No industry data available</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 40 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={isDark ? "#374151" : "#E2E8F0"} 
        />
        <XAxis 
          dataKey="name" 
          stroke={isDark ? "#D1D5DB" : "#4A5568"} 
        />
        <YAxis 
          stroke={isDark ? "#D1D5DB" : "#4A5568"} 
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#374151" : "white",
            border: `1px solid ${isDark ? "#4B5563" : "#E2E8F0"}`,
            borderRadius: "8px",
            color: isDark ? "#F3F4F6" : "#1F2937"
          }}
        />
        <Legend />
        <Bar dataKey="value" fill="#3498DB" name="Companies" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const IndustryTrendsChart = ({
  data,
  filters,
  filterOptions,
  selectedIndustries = [],
  activeTab,
  isDark = false,
}) => {
  const MAX_INDUSTRIES = 3;
  const { chartData, topIndustries } = useMemo(() => {
    if (!data || !Array.isArray(data)) return { chartData: [], topIndustries: [] };
    
    const totals = data.map(ind => ({
      name: ind.name,
      total: ind.data.reduce((sum, d) => sum + d.value, 0),
      data: ind.data,
    }));
    
    const sorted = totals.sort((a, b) => b.total - a.total).slice(0, MAX_INDUSTRIES);
    
    const years = Array.from(
      new Set(sorted.flatMap(ind => ind.data.map(d => d.year)))
    ).sort((a, b) => a - b);
    
    const chartData = years.map(year => {
      const entry = { year };
      sorted.forEach(ind => {
        entry[ind.name] = ind.data.find(d => d.year === year)?.value || 0;
      });
      return entry;
    });
    
    return { chartData, topIndustries: sorted.map(ind => ind.name) };
  }, [data]);

  const industriesToShow = selectedIndustries.length > 0 ? selectedIndustries : topIndustries;

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Factory className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No trend data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[470px] w-full">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={CHART_MARGIN}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? "#374151" : "#f0f0f0"} 
          />
          <XAxis 
            dataKey="year" 
            stroke={isDark ? "#D1D5DB" : "#4A5568"} 
          />
          <YAxis 
            stroke={isDark ? "#D1D5DB" : "#4A5568"} 
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#374151" : "white",
              border: `1px solid ${isDark ? "#4B5563" : "#E2E8F0"}`,
              borderRadius: "8px",
              color: isDark ? "#F3F4F6" : "#1F2937"
            }}
          />
          <Legend />
          {topIndustries.map((industry, idx) => (
            <Line
              key={industry}
              type="monotone"
              dataKey={industry}
              name={industry}
              stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const FundingAnalysisChart = ({ data, activeTab, isDark = false }) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    if (activeTab === "companies") {
      return data;
    }
    return data || [];
  }, [data, activeTab]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No funding data available</p>
        </div>
      </div>
    );
  }

  if (activeTab === "companies") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={120}
            dataKey="value"
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(1)}%`
            }
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.name === "Funded" ? "#2ECC71" : "#E84A5F"}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#374151" : "white",
              border: `1px solid ${isDark ? "#4B5563" : "#E2E8F0"}`,
              borderRadius: "8px",
              color: isDark ? "#F3F4F6" : "#1F2937"
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  } else {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={CHART_MARGIN}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? "#374151" : "#E2E8F0"} 
          />
          <XAxis 
            dataKey="x" 
            name="Amount (CHF M)" 
            stroke={isDark ? "#D1D5DB" : "#4A5568"} 
          />
          <YAxis 
            dataKey="y" 
            name="Valuation (CHF M)" 
            stroke={isDark ? "#D1D5DB" : "#4A5568"} 
          />
          <Tooltip
            formatter={(value, name) => [
              `${value}M CHF`,
              name === "x" ? "Amount" : "Valuation",
            ]}
            contentStyle={{
              backgroundColor: isDark ? "#374151" : "white",
              border: `1px solid ${isDark ? "#4B5563" : "#E2E8F0"}`,
              borderRadius: "8px",
              color: isDark ? "#F3F4F6" : "#1F2937"
            }}
          />
          <Scatter name="Deals" data={chartData} fill="#E84A5F" />
          <Legend />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }
};

export const PhaseAnalysisChart = ({ data, isDark = false }) => {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((item) => ({
      name: item.name || "Unknown",
      value: item.value || 0,
    }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No phase data available</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={CHART_MARGIN}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={isDark ? "#374151" : "#E2E8F0"} 
        />
        <XAxis
          dataKey="name"
          stroke={isDark ? "#D1D5DB" : "#4A5568"}
          angle={-45}
          textAnchor="end"
          height={80}
        />
         <YAxis
    stroke={isDark ? "#D1D5DB" : "#4A5568"}
    label={{
      value: "Deal Volume (CHF M)",
      angle: -90,
      position: "insideLeft",
      fill: isDark ? "#D1D5DB" : "#4A5568"
    }}
  />
  <Tooltip
    formatter={(value) => [`${value.toFixed(1)}M CHF`, "Volume"]}
    contentStyle={{
      backgroundColor: isDark ? "#374151" : "white",
      border: `1px solid ${isDark ? "#4B5563" : "#E2E8F0"}`,
      borderRadius: "8px",
      color: isDark ? "#F3F4F6" : "#1F2937"
    }}
  />
        <Bar
          dataKey="value"
          fill="#F7931E"
          radius={[4, 4, 0, 0]}
          name="Deals"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};