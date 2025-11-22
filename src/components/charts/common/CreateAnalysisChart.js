import { useMemo } from "react";
import BaseExpandableChart from "./BaseExpandableChart";
import ResponsiveD3Container from "./ResponsiveD3Container";
import ExpandedChartLayout from "./ExpandedChartLayout";
import { DualChartLayout } from "./ChartLayouts";
import D3MultiSeriesChart from "./D3MultiSeriesChart";
import { calculateYearlyData, extractCategories, getChartConfig } from "./ChartDataUtils";
import { getChartDims } from "../../../lib/utils";
import { CHART_MARGIN, EXPANDED_CHART_MARGIN, ENHANCED_COLOR_PALETTE } from "../../../lib/constants";

const createAnalysisChart = (config) => {
  const {
    chartType,
    title,
    legendTitle,
    categoryField,
    colorMap,
    normalizeCategory = (v) => v,
    filterDeals = (deals) => deals,
  } = config;

  const CategoryChart = ({
    data,
    categories,
    isVolume,
    mode,
    width,
    height,
    margin,
    isExpanded = false,
    colorOf,
    showTotal = false,
    selectedCategories = [],
  }) => {
    const metricSuffix = isVolume ? "__volume" : "__count";
    // intentionally hide the left Y axis label (units shown in UI elsewhere)
    const yAxisLabel = null;
    const displayCategories = selectedCategories.length > 0 ? selectedCategories : categories;

    return (
      <D3MultiSeriesChart
        data={data}
        categories={displayCategories}
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

  const AnalysisChart = ({ deals, selectedCategories = [] }) => {
    const { chartData, categories, colorOf } = useMemo(() => {
      if (!deals?.length) return { chartData: [], categories: [], colorOf: () => "#000" };

      const filteredDeals = filterDeals(deals);

      const getCategoryValue = (item) => normalizeCategory(item[categoryField]);
      const extractedCategories = extractCategories(filteredDeals, getCategoryValue).sort();

      const chartConfig = getChartConfig(chartType);
      const yearlyData = calculateYearlyData(filteredDeals, {
        ...chartConfig,
        categories: extractedCategories,
        getCategoryValue,
        includeTotal: true,
      });

      const colorFn = (category) =>
        colorMap[category] ||
        ENHANCED_COLOR_PALETTE[extractedCategories.indexOf(category) % ENHANCED_COLOR_PALETTE.length];

      return {
        chartData: yearlyData,
        categories: extractedCategories,
        colorOf: colorFn,
      };
    }, [deals]);

    const dims = getChartDims(false, undefined, CHART_MARGIN);
    const expandedDims = getChartDims(true, 440, EXPANDED_CHART_MARGIN);

    const renderChart = (isVolume) => ({ data, mode, isExpanded = false, width, height }) => {
      const currentDims = isExpanded ? expandedDims : dims;
      const finalHeight = typeof height === "number" ? height : currentDims.height;

      return (
        <ResponsiveD3Container width="100%" height={finalHeight}>
          <CategoryChart
            data={data}
            categories={categories}
            isVolume={isVolume}
            mode={mode}
            margin={currentDims.margin}
            isExpanded={isExpanded}
            colorOf={colorOf}
            showTotal={false}
            selectedCategories={selectedCategories}
          />
        </ResponsiveD3Container>
      );
    };

    const VolumeChart = renderChart(true);
    const CountChart = renderChart(false);

    const ExpandedChart = ({ data, mode, expandedChart, isExpanded, showTotal, controls }) => {
      const isVolumeChart = expandedChart === "volume";

      return (
        <ExpandedChartLayout
          legendItems={categories}
          legendTitle={legendTitle}
          colorOf={colorOf}
          height={expandedDims.height}
          controls={controls}
        >
          <CategoryChart
            data={data}
            categories={categories}
            isVolume={isVolumeChart}
            mode={mode}
            margin={expandedDims.margin}
            isExpanded={true}
            colorOf={colorOf}
            showTotal={showTotal}
            selectedCategories={selectedCategories}
          />
        </ExpandedChartLayout>
      );
    };

    return (
      <BaseExpandableChart
        title={title}
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

  AnalysisChart.displayName = `${chartType.charAt(0).toUpperCase() + chartType.slice(1)}AnalysisChart`;

  return AnalysisChart;
};

export default createAnalysisChart;
