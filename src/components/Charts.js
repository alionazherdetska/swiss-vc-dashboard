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