import { useState, useCallback, useMemo } from "react";
import ChartModal from "../../common/ChartModal";
import ChartControls from "./ChartControls";
import { exportCSV, exportPDF } from "../../../lib/exportUtils";

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
  const defaultExport = useCallback((format, expanded) => {
    if (!processedData || !processedData.length) return;
    if (format === "csv") {
      exportCSV(processedData, `chart-export.csv`);
      return;
    }

    if (format === "pdf") {
      // Build simple HTML table for printable PDF
      const keys = Object.keys(processedData[0]);
      const header = keys.map((k) => `<th style="padding:6px;border:1px solid #ddd;text-align:left">${k}</th>`).join("");
      const rows = processedData
        .map(
          (r) =>
            `<tr>${keys
              .map((k) => `<td style="padding:6px;border:1px solid #ddd">${r[k] == null ? "" : String(r[k])}</td>`)
              .join("")}</tr>`
        )
        .join("");
      const table = `<div><h2>${expanded ? `Expanded ${expanded}` : "Chart Export"}</h2><table style="border-collapse:collapse;border:1px solid #ddd"> <thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
      exportPDF(table, `chart-export.pdf`);
      return;
    }

    // Unknown format: fallback to CSV
    exportCSV(processedData, `chart-export.csv`);
  }, [processedData]);

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


  const baseChartProps = useMemo(
    () => {
      // Controls element to be rendered inside Chart layouts (they typically
      // render children at the top of the chart area). We include the
      // shared ChartControls here so all charts get consistent controls.
      const controls = (
        <ChartControls
          isDualChart={isDualChart}
          showModeControls={true}
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

          // Keep expand buttons on per-chart headers; don't show here.
          showExpandButton={false}
        />
      );

      // If consumer provided children in chartProps, preserve them after controls
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
    },
    [
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
          ExpandedChartComponent ? (
            // If chart provides its own expanded layout, render it as-is
            <ExpandedChartComponent {...expandedChartProps} />
          ) : (
            // Otherwise render a 5-column grid where the chart occupies 4/5
            // and the controls live in the right 1/5 column
            <div className="grid grid-cols-5 gap-6 items-start">
              <div className="col-span-4 min-w-0">
                <ChartComponent {...expandedChartProps} />
              </div>

              <div className="col-span-1 pt-8">
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
              </div>
            </div>
          )
        )}
      </ChartModal>
    </div>
  );
};

BaseExpandableChart.displayName = "BaseExpandableChart";

export default BaseExpandableChart;