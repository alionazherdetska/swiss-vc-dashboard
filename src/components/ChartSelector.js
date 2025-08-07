import React from "react";
import { BarChart3 } from "lucide-react";
import { getChartOptions } from "./constants";

const ChartSelector = ({ activeTab, activeChartType, setActiveChartType }) => {
  const chartOptions = getChartOptions(activeTab);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2" />
        Visualizations
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {chartOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.key}
              onClick={() => setActiveChartType(option.key)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                activeChartType === option.key
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
