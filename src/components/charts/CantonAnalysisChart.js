import { useMemo } from "react";
import BaseExpandableChart from "./shared/BaseExpandableChart";
import ChartLegend from "./shared/ChartLegend";
import { DualChartLayout } from "./shared/ChartLayouts";
import D3MultiSeriesChart from "./shared/D3MultiSeriesChart";
import { calculateYearlyData, extractCategories, getChartConfig } from "./shared/ChartDataUtils";
import { getChartDims, normalizeCanton } from "../../lib/utils";
import { CHART_MARGIN, EXPANDED_CHART_MARGIN, ENHANCED_COLOR_PALETTE, CANTON_COLOR_MAP } from "../../lib/constants";

/**
 * Refactored ExpandableCantonAnalysisChart using new shared architecture
 * Demonstrates significant code reduction through shared components
 */

// Chart component wrapper for canton data
const CantonChart = ({
  data,
  cantons,
  isVolume,
  mode,
  width,
  height,
  margin,
  isExpanded = false,
  colorOf,
  showTotal = false,
}) => {
  const metricSuffix = isVolume ? "__volume" : "__count";
  const yAxisLabel = isVolume ? "Investment Volume CHF (M)" : "Number of Deals";

  return (
    <D3MultiSeriesChart
      data={data}
      categories={cantons}
      isVolume={isVolume}
      mode={mode}
      width={width}
      height={height}
      margin={margin}
      isExpanded={isExpanded}
      colorOf={colorOf}
      showTotal={showTotal}
      yAxisLabel={yAxisLabel}
      metricSuffix={metricSuffix}
    />
  );
};

const CantonAnalysisChart = ({ deals }) => {
  // Process data
  const { chartData, cantons, colorOf } = useMemo(() => {
    if (!deals?.length) return { chartData: [], cantons: [], colorOf: () => "#000" };

    // Extract and normalize cantons
    const extractedCantons = extractCategories(deals, (item) =>
      normalizeCanton(item.Canton)
    ).sort();

    // Calculate yearly data
    const config = getChartConfig("canton");
    const yearlyData = calculateYearlyData(deals, {
      ...config,
      categories: extractedCantons,
      getCategoryValue: (item) => normalizeCanton(item.Canton),
      includeTotal: true,
    });

    // Color function using canton color map with fallback to enhanced palette
    const colorFn = (canton) => CANTON_COLOR_MAP[canton] || ENHANCED_COLOR_PALETTE[extractedCantons.indexOf(canton) % ENHANCED_COLOR_PALETTE.length];

    return {
      chartData: yearlyData,
      cantons: extractedCantons,
      colorOf: colorFn,
    };
  }, [deals]);

  // Chart dimensions
  const dims = getChartDims(false, undefined, CHART_MARGIN);
  // Expanded chart target size inside modal: 700 x 350
  const expandedDimsBase = getChartDims(true, 450, EXPANDED_CHART_MARGIN);
  const expandedDims = { ...expandedDimsBase, width: 950 };

  // Main chart components
  const VolumeChart = ({ data, mode, isExpanded = false }) => {
    const currentDims = isExpanded
      ? expandedDims
      : {
          ...dims,
          width: dims.width / 2,
        };

    return (
      <CantonChart
        data={data}
        cantons={cantons}
        isVolume={true}
        mode={mode}
        width={currentDims.width}
        height={currentDims.height}
        margin={currentDims.margin}
        isExpanded={isExpanded}
        colorOf={colorOf}
        showTotal={false}
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
      <CantonChart
        data={data}
        cantons={cantons}
        isVolume={false}
        mode={mode}
        width={currentDims.width}
        height={currentDims.height}
        margin={currentDims.margin}
        isExpanded={isExpanded}
        colorOf={colorOf}
        showTotal={false}
      />
    );
  };

  // Expanded chart component with legend on the left
  const ExpandedChart = ({ data, mode, expandedChart, isExpanded }) => {
    const isVolumeChart = expandedChart === "volume";
    
    return (
      <div className="flex gap-6 items-start">
        {/* Legend on the LEFT */}
        <div className="flex-shrink-0 pt-8">
          <ChartLegend items={cantons} colorOf={colorOf} title="Cantons" />
        </div>

        {/* Chart on the RIGHT */}
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
      title="Canton Analysis"
      data={chartData}
      ChartComponent={({ data, leftMode, rightMode, showTotal, onExpand }) => (
        <DualChartLayout
          volumeData={data}
          countData={data}
          VolumeChart={VolumeChart}
          CountChart={CountChart}
          volumeProps={{ mode: leftMode }}
          countProps={{ mode: rightMode }}
          onVolumeExpand={() => onExpand("volume")}
          onCountExpand={() => onExpand("count")}
        />
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

export default CantonAnalysisChart;