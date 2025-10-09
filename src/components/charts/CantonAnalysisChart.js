import React, { useMemo } from "react";
import BaseExpandableChart from "./shared/BaseExpandableChart";
import { DualChartLayout } from "./shared/ChartLayouts";
import D3MultiSeriesChart from "./shared/D3MultiSeriesChart";
import ChartLegend from "./components/ChartLegend";
import {
  calculateYearlyData,
  extractCategories,
  getChartConfig,
} from "./shared/chartDataUtils";
import {
  getChartDims,
  normalizeCanton,
  makeDistributedColorFn,
} from "../../lib/utils";
import {
  CHART_MARGIN,
  EXPANDED_CHART_MARGIN,
  ENHANCED_COLOR_PALETTE,
} from "../../lib/constants";

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

// Legend component
const CantonLegend = ({ cantons, colorOf }) => (
  <ChartLegend items={cantons} colorOf={colorOf} title="Cantons" />
);

const CantonAnalysisChart = ({ deals }) => {
  // Process data
  const { chartData, cantons, colorOf } = useMemo(() => {
    if (!deals?.length)
      return { chartData: [], cantons: [], colorOf: () => "#000" };

    // Extract and normalize cantons
    const extractedCantons = extractCategories(deals, (item) =>
      normalizeCanton(item.Canton),
    ).sort();

    // Calculate yearly data
    const config = getChartConfig("canton");
    const yearlyData = calculateYearlyData(deals, {
      ...config,
      categories: extractedCantons,
      getCategoryValue: (item) => normalizeCanton(item.Canton),
      includeTotal: true,
    });

    // Color function
    const colorFn = makeDistributedColorFn(
      extractedCantons,
      ENHANCED_COLOR_PALETTE,
    );

    return {
      chartData: yearlyData,
      cantons: extractedCantons,
      colorOf: colorFn,
    };
  }, [deals]);

  // Chart dimensions
  const dims = getChartDims(false, undefined, CHART_MARGIN);
  const expandedDims = getChartDims(true, 660, EXPANDED_CHART_MARGIN);

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

  // Expanded chart component
  const ExpandedChart = ({ data, mode, expandedChart, isExpanded }) => {
    const isVolumeChart = expandedChart === "volume";

    return isVolumeChart ? (
      <VolumeChart data={data} mode={mode} isExpanded={isExpanded} />
    ) : (
      <CountChart data={data} mode={mode} isExpanded={isExpanded} />
    );
  };

  // Handle export
  const handleExport = () => {
    console.log("Export canton chart");
    // TODO: Implement export functionality
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
          onVolumeExport={handleExport}
          onCountExport={handleExport}
        />
      )}
      ExpandedChartComponent={ExpandedChart}
      LegendComponent={() => (
        <CantonLegend cantons={cantons} colorOf={colorOf} />
      )}
      isDualChart={true}
      supportsSingleMode={false}
      supportsTotal={true}
      initialLeftMode="line"
      initialRightMode="line"
      initialShowTotal={false}
      onExport={handleExport}
    />
  );
};

export default CantonAnalysisChart;
