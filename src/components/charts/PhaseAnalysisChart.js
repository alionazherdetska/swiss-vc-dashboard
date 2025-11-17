import { useMemo, useState } from "react";
import D3ComposedChart from "./shared/D3ComposedChart";
import ChartLegend from "./shared/ChartLegend";
import ChartHeader from "./shared/ChartHeader";
import ResponsiveD3Container from "./shared/ResponsiveD3Container";
import ChartModal from "../common/ChartModal";
import { AXIS_STROKE, GRID_STROKE, ENHANCED_COLOR_PALETTE, STAGE_COLOR_MAP } from "../../lib/constants";
import { sanitizeKey, getChartDims } from "../../lib/utils";
import styles from "./Charts.module.css";

const PhaseAnalysisChart = ({ deals }) => {
  const [expandedChart, setExpandedChart] = useState(null); // 'volume' | 'count' | null
  const [leftMode, setLeftMode] = useState("line");
  const [rightMode, setRightMode] = useState("line");
  const [modalMode, setModalMode] = useState("line");

  // Extract phases from deals
  const phases = useMemo(() => {
    return Array.from(new Set(deals.map((d) => d.Phase).filter((p) => p && p.trim()))).sort();
  }, [deals]);

  // Color palette for phases (use STAGE_COLOR_MAP for consistency with legend)
  const colorOf = (phase) => STAGE_COLOR_MAP[phase] || ENHANCED_COLOR_PALETTE[phases.indexOf(phase) % ENHANCED_COLOR_PALETTE.length];

  // Prepare phase/year rows for charting
  const rows = useMemo(() => {
    const byYear = {};
    deals.forEach((d) => {
      if (!d.Phase || !d.Year) return;
      const year = d.Year;
      const phaseKey = sanitizeKey(d.Phase);
      if (!byYear[year]) byYear[year] = { year };
      byYear[year][`${phaseKey}__volume`] =
        (byYear[year][`${phaseKey}__volume`] || 0) + Number(d.Amount || 0);
      byYear[year][`${phaseKey}__count`] = (byYear[year][`${phaseKey}__count`] || 0) + 1;
      byYear[year]["__grandTotalVolume"] =
        (byYear[year]["__grandTotalVolume"] || 0) + Number(d.Amount || 0);
      byYear[year]["__grandTotalCount"] = (byYear[year]["__grandTotalCount"] || 0) + 1;
    });
    const allRows = Object.values(byYear).sort((a, b) => a.year - b.year);
    // Find first year with any non-zero value
    const firstIdx = allRows.findIndex((row) => {
      return phases.some((phase) => {
        const v = row[`${sanitizeKey(phase)}__volume`] || 0;
        const c = row[`${sanitizeKey(phase)}__count`] || 0;
        return v > 0 || c > 0;
      });
    });
    return firstIdx >= 0 ? allRows.slice(firstIdx) : allRows;
  }, [deals, phases]);

  const dims = getChartDims(false);
  // Expanded chart target size inside modal: 700 x 350
  const expandedDimsBase = getChartDims(true, 450);
  const expandedDims = { ...expandedDimsBase, width: 950 };

  // Chart content (dual charts)
  const ChartContent = ({ chartType, modeState, onModeChange, isExpandedView = false }) => {
    const isVolume = chartType === "volume";
    const yLabel = isVolume ? "Investment Volume CHF (M)" : "Number of Deals";
    const dataKeySuffix = chartType === "volume" ? "__volume" : "__count";
    const dimsToUse = isExpandedView ? expandedDims : dims;

    // Custom tooltip formatter to round values
    const tooltipFormatter = (value, name) => [Math.round(value * 100) / 100, name];

    return (
      <div className={styles.chartArea}>
        <ChartHeader
          title={isVolume ? "Investment Volume vs Year" : "Number of Deals vs Year"}
          subtitle={isVolume ? "by Phase" : "by Phase"}
          showExpandButton={!isExpandedView}
          onExpand={() => setExpandedChart(chartType)}
          expandTitle={isVolume ? "Expand Volume Chart" : "Expand Count Chart"}
          className="flex items-start gap-4 mb-2"
          titleClassName="text-md font-semibold text-gray-800"
          subtitleClassName="text-xs text-gray-500"
        />
        <ResponsiveD3Container width="100%" height={dimsToUse.height}>
          <D3ComposedChart
            data={rows}
            categories={phases}
            mode={modeState}
            margin={dimsToUse.margin}
            strokeWidth={2}
            gridColor={GRID_STROKE}
            axisColor={AXIS_STROKE}
            yAxisLabel={yLabel}
            colorOf={colorOf}
            dataKeySuffix={dataKeySuffix}
            tooltipFormatter={tooltipFormatter}
          />
        </ResponsiveD3Container>
      </div>
    );
  };

  const ExpandedModalContent = () => {
    const chartType = expandedChart;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={modalMode}
              onChange={(e) => setModalMode(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
            >
              <option value="line">Line</option>
              <option value="column">Column</option>
            </select>
          </div>
        </div>
        
        {/* Legend on the LEFT, Chart on the RIGHT */}
        <div className="flex gap-6 items-start">
          {/* Legend on the LEFT */}
          <div className="flex-shrink-0 pt-8">
            <ChartLegend items={phases} colorOf={colorOf} title="Phases" />
          </div>

          {/* Chart on the RIGHT */}
          <div className="flex-1 min-w-0">
            <ChartContent
              chartType={chartType}
              modeState={modalMode}
              onModeChange={setModalMode}
              isExpandedView={true}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Removed controls from preview - controls only in modal */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartContent chartType="volume" modeState={leftMode} onModeChange={setLeftMode} />
        <ChartContent chartType="count" modeState={rightMode} onModeChange={setRightMode} />
      </div>

      <ChartModal
        isOpen={expandedChart !== null}
        onClose={() => setExpandedChart(null)}
        title={`Expanded ${expandedChart === "volume" ? "Investment Volume" : "Deal Count"} by Phase Chart`}
      >
        <ExpandedModalContent />
      </ChartModal>
    </div>
  );
};

export default PhaseAnalysisChart;