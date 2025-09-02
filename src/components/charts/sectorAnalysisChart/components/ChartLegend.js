
import React from "react";

const ChartLegend = ({ industries = [], colorOf, isCompact = false }) => {
  if (!industries || !industries.length) return null;

  return (
    <div className={`px-4 pb-4 rounded-lg bg-gray-50 ${isCompact ? "w-48" : ""}`}>
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Sectors</h4>
      <div className={isCompact ? "space-y-2" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2"}>
        {industries.map((industry) => (
          <div key={industry} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: colorOf(industry) }}
            />
            <span className={`text-sm ${isCompact ? "" : "truncate"} text-gray-600`}>
              {industry}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartLegend;
