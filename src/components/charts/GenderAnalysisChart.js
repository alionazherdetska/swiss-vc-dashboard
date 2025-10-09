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
import { getChartDims } from "../../lib/utils";
import { CHART_MARGIN, EXPANDED_CHART_MARGIN } from "../../lib/constants";

/**
 * Refactored ExpandableGenderAnalysisChart using new shared architecture
 * Reduces code by ~70% by leveraging shared components and utilities
 */

// Gender color map
const GENDER_COLOR_MAP = {
  Male: "#3182CE",
  Female: "#E53E3E",
  Other: "#38A169",
};

// Chart component wrapper for gender data
const GenderChart = ({
  data,
  genders,
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
      categories={genders}
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
const GenderLegend = ({ genders, colorOf }) => (
  <ChartLegend items={genders} colorOf={colorOf} title="Gender" />
);

const GenderAnalysisChart = ({ deals }) => {
  // Process data
  const { chartData, genders, colorOf } = useMemo(() => {
    if (!deals?.length)
      return { chartData: [], genders: [], colorOf: () => "#000" };

    // Filter out deals with unknown gender
    const filteredDeals = deals.filter((d) => {
      const gender = d["Gender CEO"];
      return gender && gender.trim() && gender !== "Unknown";
    });

    // Extract unique genders
    const extractedGenders = extractCategories(
      filteredDeals,
      (item) => item["Gender CEO"],
    ).sort();

    // Calculate yearly data
    const config = getChartConfig("gender");
    const yearlyData = calculateYearlyData(filteredDeals, {
      ...config,
      categories: extractedGenders,
      getCategoryValue: (item) => item["Gender CEO"],
      includeTotal: true,
    });

    // Color function using gender color map
    const colorFn = (gender) => GENDER_COLOR_MAP[gender] || "#666666";

    return {
      chartData: yearlyData,
      genders: extractedGenders,
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
      <GenderChart
        data={data}
        genders={genders}
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
      <GenderChart
        data={data}
        genders={genders}
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
    console.log("Export gender chart");
    // TODO: Implement export functionality
  };

  return (
    <BaseExpandableChart
      title="Gender Analysis"
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
        <GenderLegend genders={genders} colorOf={colorOf} />
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

export default GenderAnalysisChart;
