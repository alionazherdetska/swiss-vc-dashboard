import ExportButton from "../../common/ExportButton";


/**
 * Reusable chart controls component
 * Provides consistent UI for chart mode selection, export, and expand functionality
 */
const ChartControls = ({
  showModeControls = true,
  leftMode,
  rightMode,
  singleMode,
  onLeftModeChange,
  onRightModeChange,
  onSingleModeChange,

  // Layout type
  isDualChart = false,

  // Show total checkbox
  showTotalControl = false,
  showTotal,
  onShowTotalChange,

  // Export functionality
  showExportButton = true,
  onExport,

  expandTitle = "Expand chart",

  children,

  // Styling
}) => {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        {/* Mode controls for dual charts */}
        {showModeControls && isDualChart && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Left (Volume):</span>
              <select
                value={leftMode}
                onChange={(e) => onLeftModeChange?.(e.target.value)}
                className="px-3 h-9 border rounded-full text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
              >
                <option value="line">Line</option>
                <option value="column">Column</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Right (Count):</span>
              <select
                value={rightMode}
                onChange={(e) => onRightModeChange?.(e.target.value)}
                className="px-3 h-9 border rounded-full text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
              >
                <option value="line">Line</option>
                <option value="column">Column</option>
              </select>
            </div>
          </>
        )}

        {/* Mode controls for single charts */}
        {showModeControls && !isDualChart && (
          <div className="flex items-center gap-2">
            <select
              value={singleMode}
              onChange={(e) => onSingleModeChange?.(e.target.value)}
              className="px-3 h-9 border rounded-full text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
            >
              <option value="line">Line</option>
              <option value="column">Column</option>
            </select>
          </div>
        )}

        {/* Show Total checkbox */}
        {showTotalControl && (
          <label className="flex items-center gap-2 px-3 h-9">
            <input
              type="checkbox"
              checked={showTotal}
              onChange={(e) => onShowTotalChange?.(e.target.checked)}
            />
            <span className="text-gray-700">Show total</span>
          </label>
        )}

        {/* Custom controls */}
        {children}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {showExportButton && (
          <div className="inline-flex items-center gap-2">
            <ExportButton
              label="CSV"
              onClick={() => onExport?.("csv")}
              className="!px-4 !h-9 !rounded-full !border !border-gray-400 !bg-white !text-gray-700 hover:!bg-gray-50"
            />

            <ExportButton
              label="PDF"
              onClick={() => onExport?.("pdf")}
              className="!px-4 !h-9 !rounded-full !border !border-gray-400 !bg-white !text-gray-700 hover:!bg-gray-50"
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default ChartControls;
