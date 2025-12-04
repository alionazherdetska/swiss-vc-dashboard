import { useId } from "react";
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
  const id = useId();
  return (
    <div style={{ marginTop: "30px", marginBottom: "14px" }}>
      {controlsGrid && !isDualChart ? (
        <div className="grid grid-cols-2 items-center gap-4">
          {/* First column: mode select (or placeholder) */}
          <div className="flex items-center gap-2">
            {showModeControls ? (
              (() => {
                const uid = id + "-single";
                return (
                  <div className="flex items-center gap-3">
                    <label className={`${filterStyles.itemLabel} items-center`}>
                      <input
                        type="radio"
                        name={uid}
                        value="line"
                        checked={singleMode === "line"}
                        onChange={() => onSingleModeChange?.("line")}
                        className={filterStyles.radio}
                      />
                      <span className={filterStyles.labelText}>Line</span>
                    </label>
                    <label className={`${filterStyles.itemLabel} items-center`}>
                      <input
                        type="radio"
                        name={uid}
                        value="column"
                        checked={singleMode === "column"}
                        onChange={() => onSingleModeChange?.("column")}
                        className={filterStyles.radio}
                      />
                      Stacked
                    </label>
                  </div>
                );
              })()
            ) : (
              <div />
            )}
          </div>

          {/* Second column: children on the left, Show total aligned to the right */}
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-4">{children}</div>

            {showTotalControl && (
              <label className="flex items-center gap-2 px-3 h-9 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showTotal}
                  onChange={(e) => onShowTotalChange?.(e.target.checked)}
                  className={filterStyles.checkbox}
                />
                <span className={filterStyles.showTotalLabel}>Show total</span>
              </label>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          {/* Mode controls for dual charts */}
          {showModeControls && isDualChart && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Left (Volume):</span>
                {(() => {
                  const uidL = id + "-left";
                  return (
                    <div className="flex items-center gap-3">
                      <label className={`${filterStyles.itemLabel} items-center`}>
                        <input
                          type="radio"
                          name={uidL}
                          value="line"
                          checked={leftMode === "line"}
                          onChange={() => onLeftModeChange?.("line")}
                          className={filterStyles.radio}
                        />
                        <span className={filterStyles.labelText}>Line</span>
                      </label>
                      <label className={`${filterStyles.itemLabel} items-center`}>
                        <input
                          type="radio"
                          name={uidL}
                          value="column"
                          checked={leftMode === "column"}
                          onChange={() => onLeftModeChange?.("column")}
                          className={filterStyles.radio}
                        />
                      Stacked
                      </label>
                    </div>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Right (Count):</span>
                {(() => {
                  const uidR = id + "-right";
                  return (
                    <div className="flex items-center gap-3">
                      <label className={`${filterStyles.itemLabel} items-center`}>
                        <input
                          type="radio"
                          name={uidR}
                          value="line"
                          checked={rightMode === "line"}
                          onChange={() => onRightModeChange?.("line")}
                          className={filterStyles.radio}
                        />
                        <span className={filterStyles.labelText}>Line</span>
                      </label>
                      <label className={`${filterStyles.itemLabel} items-center`}>
                        <input
                          type="radio"
                          name={uidR}
                          value="column"
                          checked={rightMode === "column"}
                          onChange={() => onRightModeChange?.("column")}
                          className={filterStyles.radio}
                        />
                        Stacked
                      </label>
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {/* Mode controls for single charts */}
          {showModeControls && !isDualChart && (
            <div className="flex items-center gap-2">
              {(() => {
                const uid2 = id + "-single-2";
                return (
                  <div className="flex items-center gap-3">
                    <label className={`${filterStyles.itemLabel} items-center`}>
                      <input
                        type="radio"
                        name={uid2}
                        value="line"
                        checked={singleMode === "line"}
                        onChange={() => onSingleModeChange?.("line")}
                        className={filterStyles.radio}
                      />
                      <span className={filterStyles.labelText}>Line</span>
                    </label>
                    <label className={`${filterStyles.itemLabel} items-center`}>
                      <input
                        type="radio"
                        name={uid2}
                        value="column"
                        checked={singleMode === "column"}
                        onChange={() => onSingleModeChange?.("column")}
                        className={filterStyles.radio}
                      />
                      Stacked
                    </label>
                  </div>
                );
              })()}
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
              <span className={filterStyles.showTotalLabel}>Show total</span>
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
