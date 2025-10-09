import { useMemo, useState } from "react";
import { Maximize2 } from "lucide-react";
import D3ComposedChart from "./shared/D3ComposedChart";
import ResponsiveD3Container from "./shared/ResponsiveD3Container";
import ChartModal from "../common/ChartModal";
import ExportButton from "../common/ExportButton";
import {
  AXIS_STROKE,
  GRID_STROKE,
  ENHANCED_COLOR_PALETTE,
} from "../../lib/constants";
import { sanitizeKey, getChartDims } from "../../lib/utils";

const PhaseAnalysisChart = ({ deals, selectedPhaseCount, totalPhaseCount }) => {
  const [expandedChart, setExpandedChart] = useState(null); // 'volume' | 'count' | null
  const [leftMode, setLeftMode] = useState("line");
  const [rightMode, setRightMode] = useState("line");
  const [modalMode, setModalMode] = useState("line");

  // Extract phases from deals
  const phases = useMemo(() => {
    return Array.from(
      new Set(deals.map((d) => d.Phase).filter((p) => p && p.trim())),
    ).sort();
  }, [deals]);

  // Color palette for phases
  const colorOf = (phase) =>
    ENHANCED_COLOR_PALETTE[
      phases.indexOf(phase) % ENHANCED_COLOR_PALETTE.length
    ];

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
      byYear[year][`${phaseKey}__count`] =
        (byYear[year][`${phaseKey}__count`] || 0) + 1;
      byYear[year]["__grandTotalVolume"] =
        (byYear[year]["__grandTotalVolume"] || 0) + Number(d.Amount || 0);
      byYear[year]["__grandTotalCount"] =
        (byYear[year]["__grandTotalCount"] || 0) + 1;
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
  const expandedDims = getChartDims(true);

  // Chart content (dual charts)
  const ChartContent = ({
    chartType,
    modeState,
    onModeChange,
    isExpandedView = false,
  }) => {
    const label =
      chartType === "volume"
        ? "Investment Volume vs Year"
        : "Number of Deals vs Year";
    const yLabel =
      chartType === "volume" ? "Investment Volume CHF (M)" : "Number of Deals";
    const dataKeySuffix = chartType === "volume" ? "__volume" : "__count";
    const dimsToUse = isExpandedView ? expandedDims : dims;
    const expandColor =
      chartType === "volume"
        ? "bg-blue-600 text-white"
        : "bg-green-600 text-white";

    // Custom tooltip formatter to round values
    const tooltipFormatter = (value, name) => [
      Math.round(value * 100) / 100,
      name,
    ];

    return (
      <div>
        <div className="flex items-center mb-2">
          <h3 className="text-md font-semibold text-gray-800 mr-2">{label}</h3>
          {!isExpandedView && (
            <>
              <button
                className={`p-2 rounded-md bg-blue-600 text-white shadow-md ${expandColor} hover:opacity-90 border-none shadow-none transition-colors`}
                title="Expand chart"
                onClick={() => setExpandedChart(chartType)}
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <ExportButton />
            </>
          )}
        </div>
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
            <span className="text-gray-700">Chart Type:</span>
            <select
              value={modalMode}
              onChange={(e) => setModalMode(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
            >
              <option value="line">Line</option>
              <option value="column">Column</option>
            </select>
          </div>
          <ExportButton />
        </div>
        <ChartContent
          chartType={chartType}
          modeState={modalMode}
          onModeChange={setModalMode}
          isExpandedView={true}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-gray-700">Left (Volume):</span>
          <select
            value={leftMode}
            onChange={(e) => setLeftMode(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
          >
            <option value="line">Line</option>
            <option value="column">Column</option>
          </select>
          <span className="text-gray-700">Right (Count):</span>
          <select
            value={rightMode}
            onChange={(e) => setRightMode(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
          >
            <option value="line">Line</option>
            <option value="column">Column</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <ChartContent
          chartType="volume"
          modeState={leftMode}
          onModeChange={setLeftMode}
        />
        <ChartContent
          chartType="count"
          modeState={rightMode}
          onModeChange={setRightMode}
        />
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
