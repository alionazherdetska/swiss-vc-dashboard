import React from "react";

const ChartLegend = ({
  items = [],
  colorOf,
  isCompact = false,
  title = "Items",
  // Legacy support for industries prop
  industries = [],
}) => {
  // Use industries prop if provided for backward compatibility
  const dataItems = industries.length > 0 ? industries : items;
  const legendTitle = industries.length > 0 ? "Sectors" : title;

  if (!dataItems || !dataItems.length) return null;

  return (
    <div className={`px-4 rounded-lg bg-gray-50 ${isCompact ? "w-48" : ""}`}>
      <h4 className="text-sm font-semibold mb-3 text-gray-700">
        {legendTitle}
      </h4>
      <div
        className={
          isCompact
            ? "space-y-2"
            : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2"
        }
      >
        {dataItems.map((item) => (
          <div key={item} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: colorOf(item) }}
            />
            <span
              className={`text-sm ${isCompact ? "" : "truncate"} text-gray-600`}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartLegend;
