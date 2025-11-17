import { useState, useCallback, useMemo } from "react";
import ChartModal from "../../common/ChartModal";
import ChartControls from "./ChartControls";

const BaseExpandableChart = ({
  data,
  ChartComponent,
  ExpandedChartComponent,
  supportsTotal = false,
  initialLeftMode = "line",
  initialRightMode = "line",
  initialSingleMode = "line",
  initialShowTotal = false,
  onExport,
  onDataProcess,
  chartProps = {},
  children,
}) => {
  const [chartState, setChartState] = useState({
    expanded: null,
    leftMode: initialLeftMode,
    rightMode: initialRightMode,
    singleMode: initialSingleMode,
    showTotal: initialShowTotal,
    modalMode: "line",
    modalShowTotal: true,
  });

  const updateChartState = useCallback((updates) => {
    setChartState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleExpand = useCallback(
    (chartType = "volume") => {
      updateChartState({ expanded: chartType });
    },
    [updateChartState]
  );

  const handleModalClose = useCallback(() => {
    updateChartState({ expanded: null });
  }, [updateChartState]);

  const handleModalModeChange = useCallback(
    (mode) => {
      updateChartState({ modalMode: mode });
    },
    [updateChartState]
  );

  const handleModalShowTotalChange = useCallback(
    (show) => {
      updateChartState({ modalShowTotal: show });
    },
    [updateChartState]
  );

  const handleExport = useCallback(
    (format) => {
      if (onExport) {
        onExport(format, chartState.expanded);
      }
    },
    [onExport, chartState.expanded]
  );

  const processedData = useMemo(
    () => (onDataProcess ? onDataProcess(data) : data),
    [data, onDataProcess]
  );

  const baseChartProps = useMemo(
    () => ({
      data: processedData,
      leftMode: chartState.leftMode,
      rightMode: chartState.rightMode,
      singleMode: chartState.singleMode,
      showTotal: chartState.showTotal,
      onExpand: handleExpand,
      onExport,
      ...chartProps,
    }),
    [
      processedData,
      chartState.leftMode,
      chartState.rightMode,
      chartState.singleMode,
      chartState.showTotal,
      handleExpand,
      onExport,
      chartProps,
    ]
  );

  const expandedChartProps = useMemo(
    () => ({
      data: processedData,
      mode: chartState.modalMode,
      showTotal: chartState.modalShowTotal,
      isExpanded: true,
      expandedChart: chartState.expanded,
      ...chartProps,
    }),
    [processedData, chartState, chartProps]
  );

  const modalTitle = useMemo(() => {
    const typeLabels = {
      volume: "Investment Volume",
      count: "Deal Count",
    };
    return `Expanded ${typeLabels[chartState.expanded] || "Chart"}`;
  }, [chartState.expanded]);

  return (
    <div>
      <ChartComponent {...baseChartProps} />

      {children}

      <ChartModal
        isOpen={chartState.expanded !== null}
        onClose={handleModalClose}
        title={modalTitle}
        onExport={handleExport}
      >
        {chartState.expanded && (
          <div className="space-y-4">
            <ChartControls
              isDualChart={false}
              singleMode={chartState.modalMode}
              onSingleModeChange={handleModalModeChange}
              showTotalControl={supportsTotal}
              showTotal={chartState.modalShowTotal}
              onShowTotalChange={handleModalShowTotalChange}
              showExpandButton={false}
              showExportButton={false}
            />

            {/* Changed layout here - flex instead of default stacking */}
            <div className="flex gap-6 items-start">
              {/* This is where your legend/labels should go - LEFT SIDE */}
              <div className="flex-shrink-0 pt-8">
                {/* Legend will be rendered by your chart component */}
              </div>

              {/* Chart container - RIGHT SIDE */}
              <div className="flex-1 min-w-0">
                {ExpandedChartComponent ? (
                  <ExpandedChartComponent {...expandedChartProps} />
                ) : (
                  <ChartComponent {...expandedChartProps} />
                )}
              </div>
            </div>
          </div>
        )}
      </ChartModal>
    </div>
  );
};

BaseExpandableChart.displayName = "BaseExpandableChart";

export default BaseExpandableChart;