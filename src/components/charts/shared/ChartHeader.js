import { Maximize2 } from "lucide-react";

/**
 * Reusable chart header component
 * Provides consistent styling and functionality for chart titles with action buttons
 */
const ChartHeader = ({
  title,
  showExpandButton = false,
  onExpand,
  expandTitle = "Expand chart",
  isVolumeChart = false,

  // Custom content
  children,

  // Styling
  className = "flex items-center gap-2 mb-2",
  titleClassName = "text-md font-semibold text-gray-800",
}) => {
  return (
    <div className={className}>
      <h3 className={titleClassName}>{title}</h3>

      {/* Action buttons */}
      {(showExpandButton || children) && (
        <div className="flex gap-2 ml-auto">
          {showExpandButton && (
            <button
              onClick={onExpand}
              className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
              title={expandTitle}
              style={{ fontSize: "0.875rem" }}
            >
              <span>expand</span>
              <Maximize2 className="h-4 w-4" />
            </button>
          )}

          {/* Custom buttons */}
          {children}
        </div>
      )}
    </div>
  );
};

export default ChartHeader;
