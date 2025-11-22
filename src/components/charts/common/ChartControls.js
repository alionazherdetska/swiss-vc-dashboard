import ExportButton from "../../ui/ExportButton";
import filterStyles from "../../filters/FilterPanel.module.css";
import chartStyles from "../Charts.module.css";

/*
 * Reusable chart controls component
 * Provides consistent UI for chart mode selection, export, and expand functionality
 */
const ChartControls = ({
  showModeControls = true,
  // When true and not a dual chart, render controls in two grid columns
  controlsGrid = false,
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
}) => {
  return (
    <div style={{ marginTop: "30px", marginBottom: "14px" }}>
      {controlsGrid && !isDualChart ? (
        <div className="grid grid-cols-2 items-center gap-4">
          {/* First column: mode select (or placeholder) */}
          <div className="flex items-center gap-2">
            {showModeControls ? (
              <div className={`relative ${chartStyles.controlSelectWrap}`}>
                <select
                  value={singleMode}
                  onChange={(e) => onSingleModeChange?.(e.target.value)}
                  className={`px-3 pr-10 h-9 border rounded-full text-sm bg-white border-gray-300 text-gray-700 focus:outline-none ${chartStyles.controlButton}`}
                >
                  <option value="line">Line</option>
                  <option value="column">Stacked</option>
                </select>
                <img src="/assets/icons/chevron-down.svg" alt="" className={chartStyles.controlSelectIcon} />
              </div>
            ) : (
              <div />
            )}
          </div>

          {/* Second column: Show total and any children */}
          <div className="flex items-center justify-start gap-4">
            {showTotalControl && (
              <label className="flex items-center gap-2 px-3 h-9 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showTotal}
                  onChange={(e) => onShowTotalChange?.(e.target.checked)}
                  className={filterStyles.checkbox}
                />
                <span className="text-gray-700 whitespace-nowrap">Show total</span>
              </label>
            )}

            {children}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          {/* Mode controls for dual charts */}
          {showModeControls && isDualChart && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Left (Volume):</span>
                <div className={`relative ${chartStyles.controlSelectWrap}`}>
                  <select
                    value={leftMode}
                    onChange={(e) => onLeftModeChange?.(e.target.value)}
                    className={`px-3 pr-10 h-9 border rounded-full text-sm bg-white border-gray-300 text-gray-700 focus:outline-none ${chartStyles.controlButton}`}
                  >
                    <option value="line">Line</option>
                    <option value="column">Stacked</option>
                  </select>
                  <img src="/assets/icons/chevron-down.svg" alt="" className={chartStyles.controlSelectIcon} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Right (Count):</span>
                <div className={`relative ${chartStyles.controlSelectWrap}`}>
                  <select
                    value={rightMode}
                    onChange={(e) => onRightModeChange?.(e.target.value)}
                    className={`px-3 pr-10 h-9 border rounded-full text-sm bg-white border-gray-300 text-gray-700 focus:outline-none ${chartStyles.controlButton}`}
                  >
                    <option value="line">Line</option>
                    <option value="column">Stacked</option>
                  </select>
                  <img src="/assets/icons/chevron-down.svg" alt="" className={chartStyles.controlSelectIcon} />
                </div>
              </div>
            </>
          )}

          {/* Mode controls for single charts */}
          {showModeControls && !isDualChart && (
            <div className="flex items-center gap-2">
              <div className={`relative ${chartStyles.controlSelectWrap}`}>
                <select
                  value={singleMode}
                  onChange={(e) => onSingleModeChange?.(e.target.value)}
                  className={`px-3 pr-10 h-9 border rounded-full text-sm bg-white border-gray-300 text-gray-700 focus:outline-none ${chartStyles.controlButton}`}
                >
                  <option value="line">Line</option>
                  <option value="column">Stacked</option>
                </select>
                <img src="/assets/icons/chevron-down.svg" alt="" className={chartStyles.controlSelectIcon} />
              </div>
            </div>
          )}

          {/* Show Total checkbox */}
          {showTotalControl && (
            <label className="flex items-center gap-2 px-3 h-9">
              <input
                type="checkbox"
                checked={showTotal}
                onChange={(e) => onShowTotalChange?.(e.target.checked)}
                className={filterStyles.checkbox}
              />
              <span className="text-gray-700">Show total</span>
            </label>
          )}

          {/* Custom controls */}
          {children}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {showExportButton && (
          <div className="inline-flex items-center gap-2">
            <ExportButton
              label="CSV"
              onClick={() => onExport?.("csv")}
              className={`${chartStyles.controlButton} px-4 h-9 rounded-full border border-gray-300 text-gray-700`}
            />

            <ExportButton
              label="PDF"
              onClick={() => onExport?.("pdf")}
              className={`${chartStyles.controlButton} px-4 h-9 rounded-full border border-gray-300 text-gray-700`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartControls;

