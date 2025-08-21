import React from "react";

const CustomLegend = ({
  industries,
  colorOf,
  isCompact = false,
  isOverlay = false,
}) => {
  if (isOverlay) {
    return (
      <div className="absolute -top-4 right-4 p-4 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm border border-gray-200 max-w-80 z-10">
        <h4 className="text-sm font-semibold mb-3 text-left text-gray-700">
          Sectors
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {industries.map((industry) => (
            <div key={industry} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: colorOf(industry) }}
              />
              <span className="text-xs text-gray-600">{industry}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-gray-50 ${isCompact ? "w-48" : ""}`}>
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Sectors</h4>
      <div
        className={
          isCompact
            ? "space-y-2"
            : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2"
        }
      >
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

export default CustomLegend;
