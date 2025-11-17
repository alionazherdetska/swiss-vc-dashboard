import { useMemo } from "react";
import BaseExpandableChart from "./shared/BaseExpandableChart";
import D3ComposedChart from "./shared/D3ComposedChart";
import ChartLegend from "./shared/ChartLegend";
import ChartHeader from "./shared/ChartHeader";
import ResponsiveD3Container from "./shared/ResponsiveD3Container";
import { AXIS_STROKE, GRID_STROKE, ENHANCED_COLOR_PALETTE, STAGE_COLOR_MAP } from "../../lib/constants";
import { sanitizeKey, getChartDims } from "../../lib/utils";
import styles from "./Charts.module.css";

const PhaseChart = ({ data, phases, isVolume, mode, width, height, margin, isExpanded = false, colorOf }) => {
  const dataKeySuffix = isVolume ? "__volume" : "__count";
  const yLabel = isVolume ? "Investment Volume CHF (M)" : "Number of Deals";

  return (
    <div className={styles.chartArea}>
      <ResponsiveD3Container width="100%" height={height}>
        <D3ComposedChart
          data={data}
          categories={phases}
          mode={mode}
          margin={margin}
          strokeWidth={2}
          gridColor={GRID_STROKE}
          axisColor={AXIS_STROKE}
          yAxisLabel={yLabel}
          colorOf={colorOf}
          dataKeySuffix={dataKeySuffix}
        />
      </ResponsiveD3Container>
    </div>
  );
};

const PhaseAnalysisChart = ({ deals }) => {
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
  const expandedDimsBase = getChartDims(true, 450);
  const expandedDims = { ...expandedDimsBase, width: 950 };

  const VolumeChart = ({ data, mode, isExpanded = false }) => {
    const currentDims = isExpanded
      ? expandedDims
      : {
          ...dims,
          width: dims.width / 2,
        };

    return (
      <PhaseChart
        data={data}
        phases={phases}
        isVolume={true}
        mode={mode}
        width={currentDims.width}
        height={currentDims.height}
        margin={currentDims.margin}
        isExpanded={isExpanded}
        colorOf={colorOf}
      />
    );
  };

  const CountChart = ({ data, mode, isExpanded = false }) => {
    const currentDims = isExpanded
      ? expandedDims
      : {
          ...dims,
          width: dims.width / 2,
        };

    return (
      <PhaseChart
        data={data}
        phases={phases}
        isVolume={false}
        mode={mode}
        width={currentDims.width}
        height={currentDims.height}
        margin={currentDims.margin}
        isExpanded={isExpanded}
        colorOf={colorOf}
      />
    );
  };

  const ExpandedChart = ({ data, mode, expandedChart, isExpanded }) => {
    const isVolumeChart = expandedChart === "volume";

    return (
      <div className="flex gap-6 items-start">
        <div className="flex-shrink-0 pt-8">
          <ChartLegend items={phases} colorOf={colorOf} title="Phases" />
        </div>

        <div className="flex-1 min-w-0">
          {isVolumeChart ? (
            <VolumeChart data={data} mode={mode} isExpanded={isExpanded} />
          ) : (
            <CountChart data={data} mode={mode} isExpanded={isExpanded} />
          )}
        </div>
      </div>
    );
  };

  return (
    <BaseExpandableChart
      title="Phase Analysis"
      data={rows}
      ChartComponent={({ data, leftMode, rightMode, showTotal, onExpand }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="pl-4">
              <ChartHeader
                title={"Investment Volume vs Year"}
                subtitle={"by Phase"}
                showExpandButton={true}
                onExpand={() => onExpand && onExpand("volume")}
                expandTitle="Expand Volume Chart"
                className="flex items-start gap-4 mb-2"
                titleClassName="text-md font-semibold text-gray-800"
                subtitleClassName="text-xs text-gray-500"
              />
            </div>
            <VolumeChart data={data} mode={leftMode} />
          </div>

          <div>
            <div className="pl-4">
              <ChartHeader
                title={"Number of Deals vs Year"}
                subtitle={"by Phase"}
                showExpandButton={true}
                onExpand={() => onExpand && onExpand("count")}
                expandTitle="Expand Count Chart"
                className="flex items-start gap-4 mb-2"
                titleClassName="text-md font-semibold text-gray-800"
                subtitleClassName="text-xs text-gray-500"
              />
            </div>
            <CountChart data={data} mode={rightMode} />
          </div>
        </div>
      )}
      ExpandedChartComponent={ExpandedChart}
      isDualChart={true}
      supportsSingleMode={false}
      supportsTotal={true}
      initialLeftMode="line"
      initialRightMode="line"
      initialShowTotal={false}
    />
  );
};

export default PhaseAnalysisChart;