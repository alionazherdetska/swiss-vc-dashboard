import { useState, useCallback, useMemo } from "react";
import ChartModal from "../../common/ChartModal";
import ChartControls from "./ChartControls";

const BaseExpandableChart = ({
  data,
  ChartComponent,
  ExpandedChartComponent,
  isDualChart = false,
  supportsTotal = false,
  initialLeftMode = "line",
  initialRightMode = "line",
  initialSingleMode = "line",
  initialShowTotal = false,
  onExport,
  onDataProcess,
  className = "space-y-6",
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

  const handleExpand = useCallback((chartType = "volume") => {
    updateChartState({ expanded: chartType });
  }, [updateChartState]);

  const handleModalClose = useCallback(() => {
    updateChartState({ expanded: null });
  }, [updateChartState]);

  const handleLeftModeChange = useCallback((mode) => {
    updateChartState({ leftMode: mode });
  }, [updateChartState]);

  const handleRightModeChange = useCallback((mode) => {
    updateChartState({ rightMode: mode });
  }, [updateChartState]);

  const handleSingleModeChange = useCallback((mode) => {
    updateChartState({ singleMode: mode });
  }, [updateChartState]);

  const handleModalModeChange = useCallback((mode) => {
    updateChartState({ modalMode: mode });
  }, [updateChartState]);

  const handleShowTotalChange = useCallback((show) => {
    updateChartState({ showTotal: show });
  }, [updateChartState]);

  const handleModalShowTotalChange = useCallback((show) => {
    updateChartState({ modalShowTotal: show });
  }, [updateChartState]);

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
    <div className={className}>
      {/* Removed ChartControls from preview - controls only in modal */}

      <ChartComponent {...baseChartProps} />

      {children}

      <ChartModal
        isOpen={chartState.expanded !== null}
        onClose={handleModalClose}
        title={modalTitle}
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
              onExport={onExport}
            />

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

BaseExpandableChart.displayName = "BaseExpandableChart";

export default BaseExpandableChart;