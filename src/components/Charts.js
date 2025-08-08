import React, { useMemo, useState } from "react";
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
} from "recharts";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { Factory } from "./CustomIcons";

const COLOR_PALETTE = [
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
export const TimelineChart = ({ data, showVolume = false, isDark = false }) => {
  const chartKey = showVolume ? "volume" : "count";
  const chartLabel = showVolume ? "Volume (CHF M)" : "Count";
  
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E84A5F" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#E84A5F" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? "#374151" : "#E2E8F0"} 
          />
          <XAxis
            dataKey="year"
            stroke={isDark ? "#D1D5DB" : "#4A5568"}
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={60}
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
              showVolume ? `${value.toFixed(1)}M CHF` : value,
              chartLabel
            ]}
          />
          <Area
            type="monotone"
            dataKey={chartKey}
            stroke="#E84A5F"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorMetric)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// New Quarterly Analysis Chart
export const QuarterlyAnalysisChart = ({ 
  data, 
  selectedIndustry, 
  setSelectedIndustry, 
  filterOptions, 
  timeInterval = "quarter",
  showVolume = false,
  setShowVolume,
  isDark = false 
}) => {
  const [localTimeInterval, setLocalTimeInterval] = useState(timeInterval);
  
  // Debug logging
  console.log("QuarterlyAnalysisChart - data:", data);
  console.log("QuarterlyAnalysisChart - selectedIndustry:", selectedIndustry);
  
  const chartData = useMemo(() => {
    if (!data || !selectedIndustry) return [];
    
    // Find the selected industry data
    const industryData = data.find(d => d.name === selectedIndustry);
    console.log("Found industryData:", industryData);
    
    if (!industryData || !industryData.data) return [];
    
    // Group data by time interval
    const groupedData = {};
    
    industryData.data.forEach(item => {
      if (!item.year) return;
      
      let timeKey;
      if (localTimeInterval === "quarter" && item.quarter) {
        timeKey = `${item.year} Q${item.quarter}`;
      } else if (localTimeInterval === "half" && item.quarter) {
        const half = item.quarter <= 2 ? 1 : 2;
        timeKey = `${item.year} H${half}`;
      } else {
        timeKey = item.year.toString();
      }
      
      if (!groupedData[timeKey]) {
        groupedData[timeKey] = { 
          period: timeKey, 
          count: 0, 
          volume: 0,
          year: item.year,
          quarter: item.quarter || 1
        };
      }
      
      groupedData[timeKey].count += item.count || 0;
      groupedData[timeKey].volume += item.volume || 0;
    });
    
    const result = Object.values(groupedData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
    
    console.log("Processed chartData:", result);
    return result;
  }, [data, selectedIndustry, localTimeInterval]);
  
  const metric = showVolume ? "volume" : "count";
  const metricLabel = showVolume ? "Volume (CHF M)" : "Count";
  
  // Get available industries from data
  const availableIndustries = data ? data.map(d => d.name).filter(Boolean) : [];
  
  return (
    <div className="space-y-4">
      
      {/* Controls */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Industry:
          </label>
          <select
            value={selectedIndustry || ""}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className={`px-3 py-1 border rounded-md text-sm ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <option value="">Select Industry</option>
            {availableIndustries.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Time Interval:
          </label>
          <select
            value={localTimeInterval}
            onChange={(e) => setLocalTimeInterval(e.target.value)}
            className={`px-3 py-1 border rounded-md text-sm ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <option value="quarter">Quarterly</option>
            <option value="half">Half-Yearly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
        
        {setShowVolume && (
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showVolume}
                onChange={(e) => setShowVolume(e.target.checked)}
                className="text-red-600 focus:ring-red-500"
              />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Show Volume
              </span>
            </label>
          </div>
        )}
      </div>
      
      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? "#374151" : "#E2E8F0"} 
            />
            <XAxis
              dataKey="period"
              stroke={isDark ? "#D1D5DB" : "#4A5568"}
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke={isDark ? "#D1D5DB" : "#4A5568"} 
              fontSize={12}
              label={{
                value: metricLabel,
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
                showVolume ? `${value.toFixed(1)}M CHF` : value,
                metricLabel
              ]}
            />
            <Legend />
            <Bar
              dataKey={metric}
              fill="#3498DB"
              name={`${selectedIndustry} - ${metricLabel}`}
              radius={[4, 4, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke="#E84A5F"
              strokeWidth={2}
              dot={{ r: 4 }}
              name={`${selectedIndustry} Trend`}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>
            {!selectedIndustry 
              ? "Please select an industry to view quarterly analysis" 
              : "No data available for the selected industry"}
          </p>
          {availableIndustries.length > 0 && (
            <p className="text-sm mt-2">
              Available industries: {availableIndustries.slice(0, 5).join(", ")}
              {availableIndustries.length > 5 && "..."}
            </p>
          )}
        </div>
      )}
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