import React from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const CHART_MARGIN = { top: 50, right: 50, left: 10, bottom: 10 };

/** Timeline (deals) */
export const TimelineChart = ({
  data,
  showVolume = false,
  title,
  yLabel,
}) => {
  const chartKey = showVolume ? "volume" : "count";
  const defaultY = showVolume ? "Volume (CHF M)" : "Count";
  const chartLabel = yLabel || defaultY;

  return (
    <div className="space-y-2">
      <div className="flex items-center mb-2">
        {title && (
          <h3 className="text-lg font-bold text-gray-800 mr-2">
            {title}
          </h3>
        )}
        <button
          className="h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors"
          style={{ minHeight: '40px' }}
          title="Export chart (print or save as PDF)"
        >
          Export
          <img src="/download.svg" alt="Download" className="h-5 w-5" />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id={`color-${chartKey}`} x1="0" y1="0" x2="0" y2="1">
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
          <YAxis
            stroke="#4A5568"
            fontSize={12}
            label={{
              value: chartLabel,
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fill: "#4A5568" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              color: "#1F2937",
            }}
            formatter={(value) => [
              showVolume ? `${Number(value).toFixed(1)}M CHF` : value,
              chartLabel,
            ]}
            sorter={(a, b) => b.value - a.value}
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