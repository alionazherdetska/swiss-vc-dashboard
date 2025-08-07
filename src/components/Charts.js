import React, { useMemo } from "react";
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
} from "recharts";
import { BarChart3 } from "lucide-react";
import { Factory } from "./CustomIcons";
import { COLORS } from "./constants";

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

const CHART_MARGIN = { top: 20, right: 30, left: 40, bottom: 80 };

export const TimelineChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={400}>
    <AreaChart data={data} margin={CHART_MARGIN}>
      <defs>
        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#E84A5F" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#E84A5F" stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
      <XAxis
        dataKey="year"
        stroke="#4A5568"
        fontSize={12}
        angle={-45}
        textAnchor="end"
        height={60}
      />
      <YAxis stroke="#4A5568" fontSize={12} />
      <Tooltip
        contentStyle={{
          backgroundColor: "white",
          border: "1px solid #E2E8F0",
          borderRadius: "8px",
        }}
      />
      <Area
        type="monotone"
        dataKey="count"
        stroke="#E84A5F"
        strokeWidth={2}
        fillOpacity={1}
        fill="url(#colorCount)"
      />
    </AreaChart>
  </ResponsiveContainer>
);

export const IndustryDistributionChart = ({ data, activeTab }) => {
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
      <LineChart
        data={chartData}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="name"
          type="category" 
          stroke="#4A5568"
          fontSize={12}
          label={{
            value:
              activeTab === "companies"
                ? "Industry"
                : "Deal Type",
            position: "insideBottomRight",
            offset: -10,
            fill: "#4A5568",
            fontSize: 12,
          }}
        />
        <YAxis
          stroke="#4A5568"
          fontSize={12}
          label={{
            value:
              activeTab === "companies"
                ? "Number of Companies"
                : "Number of Deals",
            angle: -90,
            position: "insideLeft",
            fill: "#4A5568",
            fontSize: 12,
          }}
        />
        <Tooltip />
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

export const GeographicDistributionChart = ({ data }) => {
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
            <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value}`, "Count"]}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const IndustryTrendsChart = ({
  data,
  filters,
  filterOptions,
  activeTab,
}) => {
  const MAX_VISIBLE_INDUSTRIES = 6;

  const { filteredData, chartDataArray } = useMemo(() => {
    if (!data || !Array.isArray(data))
      return { filteredData: [], chartDataArray: [] };

    let filtered = data;

    if (activeTab === "companies" && filters?.industries?.length > 0) {
      filtered = data.filter((industry) =>
        filters.industries.includes(industry.name)
      );
    } else if (activeTab === "deals" && filters?.dealTypes?.length > 0) {
      filtered = data.filter((dealType) =>
        filters.dealTypes.includes(dealType.name)
      );
    }

    if (
      filtered.length === 0 ||
      (filters?.industries?.length === 0 && filters?.dealTypes?.length === 0)
    ) {
      filtered = data
        .slice(0, MAX_VISIBLE_INDUSTRIES)
        .sort((a, b) => b.total - a.total);
    }

    const chartData = {};
    filtered.forEach((industry) => {
      industry.data.forEach(({ year, value }) => {
        if (!chartData[year]) chartData[year] = { year };
        chartData[year][industry.name] = value;
      });
    });

    return {
      filteredData: filtered,
      chartDataArray: Object.values(chartData).sort((a, b) => a.year - b.year),
    };
  }, [data, filters, activeTab]);

  if (!filteredData || filteredData.length === 0) {
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
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartDataArray} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            tick={{ fill: "#555" }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: "#555" }}
            label={{
              value:
                activeTab === "companies"
                  ? "Companies Founded"
                  : "Deals Closed",
              angle: -90,
              position: "insideLeft",
              fill: "#555",
            }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(255, 255, 255, 0.96)",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "12px",
            }}
          />
          <Legend />
          {filteredData.map((industry, index) => (
            <Line
              key={industry.name}
              type="monotone"
              dataKey={industry.name}
              name={industry.name}
              stroke={COLOR_PALETTE[index % COLOR_PALETTE.length]}
              strokeWidth={2.5}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const FundingAnalysisChart = ({ data, activeTab }) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    if (activeTab === "companies") {
      // data is an array of { name: "Funded"/"Not Funded", value: N }
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
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  } else {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="x" name="Amount (CHF M)" stroke="#4A5568" />
          <YAxis dataKey="y" name="Valuation (CHF M)" stroke="#4A5568" />
          <Tooltip
            formatter={(value, name) => [
              `${value}M CHF`,
              name === "x" ? "Amount" : "Valuation",
            ]}
          />
          <Scatter name="Deals" data={chartData} fill="#E84A5F" />
          <Legend />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }
};

export const PhaseAnalysisChart = ({ data }) => {
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
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="name"
          stroke="#4A5568"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#4A5568" />
        <Tooltip formatter={(value) => [`${value}`, "Count"]} />
        <Bar
          dataKey="value"
          fill="#F7931E"
          radius={[4, 4, 0, 0]}
          name="Deals"
        />
        <Legend />
      </BarChart>
    </ResponsiveContainer>
  );
};