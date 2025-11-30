import { useState, useCallback, useMemo } from "react";
import ChartModal from "../../ui/ChartModal";
import ChartControls from "./ChartControls";
import filterStyles from "../../filters/FilterPanel.module.css";
import { exportCSV, exportPDF } from "../../../lib/exportUtils";

const BaseExpandableChart = ({
  data,
  ChartComponent,
  ExpandedChartComponent,
  supportsTotal = false,
  // whether single-chart controls (Line / Stacked) are supported
  supportsSingleMode = true,
  initialLeftMode = "line",
  initialRightMode = "line",
  initialSingleMode = "line",
  initialShowTotal = false,
  onExport,
  onDataProcess,
  chartProps = {},
  children,
  // layout type: dual or single
  isDualChart = false,
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

  const processedData = useMemo(
    () => (onDataProcess ? onDataProcess(data) : data),
    [data, onDataProcess]
  );

  // Default export handler when parent doesn't supply one
  const defaultExport = useCallback(
    (format, expanded) => {
      if (!processedData || !processedData.length) return;
      if (format === "csv") {
        exportCSV(processedData, `chart-export.csv`);
        return;
      }

      if (format === "pdf") {
        const keys = Object.keys(processedData[0]);
        const header = keys
          .map((k) => `<th style="padding:6px;border:1px solid #ddd;text-align:left">${k}</th>`)
          .join("");
        const rows = processedData
          .map(
            (r) =>
              `<tr>${keys
                .map(
                  (k) =>
                    `<td style="padding:6px;border:1px solid #ddd">${r[k] == null ? "" : String(r[k])}</td>`
                )
                .join("")}</tr>`
          )
          .join("");
        const table = `<div><h2>${expanded ? `Expanded ${expanded}` : "Chart Export"}</h2><table style="border-collapse:collapse;border:1px solid #ddd"> <thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
        exportPDF(table, `chart-export.pdf`);
        return;
      }

      exportCSV(processedData, `chart-export.csv`);
    },
    [processedData]
  );

  const handleExport = useCallback(
    (format) => {
      if (onExport) {
        onExport(format, chartState.expanded);
      } else {
        defaultExport(format, chartState.expanded);
      }
    },
    [onExport, chartState.expanded, defaultExport]
  );

  const baseChartProps = useMemo(() => {
    const controls = (
      <ChartControls
        isDualChart={isDualChart}
        showModeControls={supportsSingleMode}
        leftMode={chartState.leftMode}
        rightMode={chartState.rightMode}
        singleMode={chartState.singleMode}
        onLeftModeChange={(mode) => updateChartState({ leftMode: mode })}
        onRightModeChange={(mode) => updateChartState({ rightMode: mode })}
        onSingleModeChange={(mode) => updateChartState({ singleMode: mode })}
        showTotalControl={supportsTotal}
        showTotal={chartState.showTotal}
        onShowTotalChange={(show) => updateChartState({ showTotal: show })}
        showExportButton={true}
        onExport={(format) => handleExport(format)}
        showExpandButton={false}
      />
    );

    const mergedChildren = chartProps.children ? (
      <>
        {controls}
        {chartProps.children}
      </>
    ) : (
      controls
    );

    return {
      data: processedData,
      leftMode: chartState.leftMode,
      rightMode: chartState.rightMode,
      singleMode: chartState.singleMode,
      showTotal: chartState.showTotal,
      onExpand: handleExpand,
      onExport: handleExport,
      ...chartProps,
      children: mergedChildren,
    };
  }, [
    processedData,
    chartState.leftMode,
    chartState.rightMode,
    chartState.singleMode,
    chartState.showTotal,
    handleExpand,
    handleExport,
    updateChartState,
    chartProps,
    isDualChart,
    supportsTotal,
    supportsSingleMode,
  ]);

  const expandedChartProps = useMemo(
    () => ({
      data: processedData,
      mode: chartState.modalMode,
      showTotal: chartState.modalShowTotal,
      isExpanded: true,
      expandedChart: chartState.expanded,
      // pass controls into expanded chart layout so they render in left column
      controls: (
        <ChartControls
          isDualChart={false}
          controlsGrid={true}
          showModeControls={supportsSingleMode}
          singleMode={chartState.modalMode}
          onSingleModeChange={handleModalModeChange}
          // Do not render the showTotal checkbox in the left column for expanded mode
          showTotalControl={false}
          showExpandButton={false}
          showExportButton={false}
        />
      ),
      ...chartProps,
    }),
    [processedData, chartState, chartProps, handleModalModeChange, supportsSingleMode]
  );

  const modalTitle = useMemo(() => {
    // For the volume expanded view we want the modal title to read
    // "Invested capital" (no "Expanded" prefix). Other expanded
    // chart types keep the "Expanded <Label>" format.
    if (chartState.expanded === "volume") return "Invested capital";

    const typeLabels = {
      volume: "Invested capital",
      count: "Number of deals",
    };

    // For count expanded view return plain label (no 'Expanded' prefix)
    if (chartState.expanded === "count") return typeLabels.count;

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
        subtitle={chartState.expanded === "volume" ? "in CHF Mio." : ""}
        onExport={handleExport}
        headerRight={
          supportsTotal ? (
            <label className="flex items-center gap-2 px-3 h-9 whitespace-nowrap">
              <input
                type="checkbox"
                checked={chartState.modalShowTotal}
                onChange={(e) => handleModalShowTotalChange(e.target.checked)}
                className={filterStyles.checkbox}
              />
              <span className="text-gray-700 whitespace-nowrap">Show total</span>
            </label>
          ) : null
        }
      >
        {chartState.expanded && (
          <div>
            {ExpandedChartComponent ? (
              <div className="h-full min-h-0">
                <ExpandedChartComponent {...expandedChartProps} />
              </div>
            ) : (
              <div className="h-full min-h-0">
                <div className="min-w-0 h-full min-h-0">
                  <ChartComponent {...expandedChartProps} />
                </div>
              </div>
            )}
          </div>
        )}
      </ChartModal>
    </div>
  );
};

BaseExpandableChart.displayName = "BaseExpandableChart";

export default BaseExpandableChart;
