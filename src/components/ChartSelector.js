import React from "react";
import { BarChart3 } from "lucide-react";
import { getChartOptions } from "./constants";

const ChartSelector = ({ activeTab, activeChartType, setActiveChartType }) => {
  const chartOptions = getChartOptions(activeTab);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
        <BarChart3 className="h-5 w-5 mr-2" />
        Visualizations
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {chartOptions.map((option) => {
          const IconComponent = option.icon;
          const isActive = activeChartType === option.key;

          return (
            <button
              key={option.key}
              onClick={() => setActiveChartType(option.key)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                isActive
                  ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <IconComponent className="h-4 w-4 mx-auto mb-1" />
              <div className="text-xs leading-tight">{option.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChartSelector;
