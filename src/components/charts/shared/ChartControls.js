import ExportButton from "../../common/ExportButton";

// Custom expand icon (16x16) with corner arrows for consistency
const ExpandIcon = ({ className = "", style = {} }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M10 3.5H13.5V7" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="square" />
    <path d="M13.5 3.5L9.5 7.5" stroke="#4A4A4A" strokeWidth="1.5" />
    <path d="M3 9V12.5H6.5" stroke="#4A4A4A" strokeWidth="1.5" strokeLinecap="square" />
    <path d="M6.5 12.5L2.5 8.5" stroke="#4A4A4A" strokeWidth="1.5" />
  </svg>
);

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

  // Expand functionality
  showExpandButton = true,
  onExpand,
  expandButtonColor = "bg-blue-600",
  expandTitle = "Expand chart",

  // Custom controls
  children,

  // Styling
  className = "flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50",
}) => {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-4">
        {/* Mode controls for dual charts */}
        {showModeControls && isDualChart && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Left (Volume):</span>
              <select
                value={leftMode}
                onChange={(e) => onLeftModeChange?.(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
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
                className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
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
            <span className="text-gray-700">Chart Type:</span>
            <select
              value={singleMode}
              onChange={(e) => onSingleModeChange?.(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
            >
              <option value="line">Line</option>
              <option value="column">Column</option>
            </select>
          </div>
        )}

        {/* Show Total checkbox */}
        {showTotalControl && (
          <label className="flex items-center gap-2">
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
        {showExportButton && <ExportButton onClick={onExport} />}

        {showExpandButton && (
          <button
            onClick={onExpand}
            title={expandTitle}
            aria-label={expandTitle}
            style={{
              width: 16,
              height: 16,
              borderRadius: 15,
              border: "1px solid #4A4A4A",
              background: "#FEFEFE",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <ExpandIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChartControls;
