import { useState } from "react";
import ChartModal from "../../common/ChartModal";
import ChartControls from "./ChartControls";

/**
 * Base expandable chart component that provides common functionality
 * Handles state management, modal behavior, and consistent UI structure
 */
const BaseExpandableChart = ({

  // Data
  data,

  // Chart components
  ChartComponent,
  ExpandedChartComponent,

  // Configuration
  isDualChart = false,
  supportsSingleMode = true,
  supportsTotal = false,

  // Initial state
  initialLeftMode = "line",
  initialRightMode = "line",
  initialSingleMode = "line",
  initialShowTotal = false,

  // Custom handlers
  onExport,
  onDataProcess,

  // Styling
  className = "space-y-6",

  // Additional props to pass to chart components
  chartProps = {},

  children,
}) => {
  // State management
  const [expandedChart, setExpandedChart] = useState(null);
  const [leftMode, setLeftMode] = useState(initialLeftMode);
  const [rightMode, setRightMode] = useState(initialRightMode);
  const [singleMode, setSingleMode] = useState(initialSingleMode);
  const [showTotal, setShowTotal] = useState(initialShowTotal);

  // Modal state for expanded view
  const [modalMode, setModalMode] = useState("line");
  const [modalShowTotal, setModalShowTotal] = useState(true);

  // Handle chart expansion
  const handleExpand = (chartType = "volume") => {
    setExpandedChart(chartType);
  };

  // Handle modal close
  const handleModalClose = () => {
    setExpandedChart(null);
  };

  // Process data if handler provided
  const processedData = onDataProcess ? onDataProcess(data) : data;

  // Common chart props
  const baseChartProps = {
    data: processedData,
    leftMode,
    rightMode,
    singleMode,
    showTotal,
    onExpand: handleExpand,
    onExport,
    ...chartProps,
  };

  // Expanded chart props
  const expandedChartProps = {
    data: processedData,
    mode: modalMode,
    showTotal: modalShowTotal,
    isExpanded: true,
    expandedChart,
    ...chartProps,
  };

  return (
    <div className={className}>
      {/* Chart controls */}
      <ChartControls
        isDualChart={isDualChart}
        leftMode={leftMode}
        rightMode={rightMode}
        singleMode={singleMode}
        onLeftModeChange={setLeftMode}
        onRightModeChange={setRightMode}
        onSingleModeChange={setSingleMode}
        showTotalControl={supportsTotal}
        showTotal={showTotal}
        onShowTotalChange={setShowTotal}
        onExport={onExport}
        showExpandButton={false} // Individual charts have their own expand buttons
      />

      {/* Main chart content */}
      <ChartComponent {...baseChartProps} />

      {/* Custom content */}
      {children}

      {/* Expanded modal */}
      <ChartModal
        isOpen={expandedChart !== null}
        onClose={handleModalClose}
        title={`Expanded ${
          expandedChart === "volume"
            ? "Investment Volume"
            : expandedChart === "count"
              ? "Deal Count"
              : expandedChart || "Chart"
        }`}
      >
        {expandedChart && (
          <div className="space-y-4">
            {/* Modal controls */}
            <ChartControls
              isDualChart={false}
              singleMode={modalMode}
              onSingleModeChange={setModalMode}
              showTotalControl={supportsTotal}
              showTotal={modalShowTotal}
              onShowTotalChange={setModalShowTotal}
              showExpandButton={false}
              onExport={onExport}
            />

            {/* Expanded chart */}
            {ExpandedChartComponent ? (
              <ExpandedChartComponent {...expandedChartProps} />
            ) : (
              <ChartComponent {...expandedChartProps} />
            )}
          </div>
        )}
      </ChartModal>
    </div>
  );
};

export default BaseExpandableChart;
