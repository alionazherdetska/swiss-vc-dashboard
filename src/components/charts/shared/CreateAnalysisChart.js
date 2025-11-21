import { useMemo } from "react";
import BaseExpandableChart from "./BaseExpandableChart";
import ResponsiveD3Container from "./ResponsiveD3Container";
import ExpandedChartLayout from "./ExpandedChartLayout";
import { DualChartLayout } from "./ChartLayouts";
import D3MultiSeriesChart from "./D3MultiSeriesChart";
import { calculateYearlyData, extractCategories, getChartConfig } from "./ChartDataUtils";
import { getChartDims } from "../../../lib/utils";
import { CHART_MARGIN, EXPANDED_CHART_MARGIN, ENHANCED_COLOR_PALETTE } from "../../../lib/constants";

/**
 * Factory function to create analysis chart components
 * Eliminates repetition across Canton, Gender, Quarterly, and Phase charts
 * 
 * @param {Object} config - Chart configuration
 * @param {string} config.chartType - Type identifier for getChartConfig (e.g., 'canton', 'gender', 'quarterly')
 * @param {string} config.title - Chart title for BaseExpandableChart
 * @param {string} config.legendTitle - Title for the legend
 * @param {string} config.categoryField - Field name in deal data (e.g., 'Canton', 'Gender CEO', 'Industry')
 * @param {Object} config.colorMap - Color map for categories (e.g., CANTON_COLOR_MAP)
 * @param {Function} [config.normalizeCategory] - Optional function to normalize category values
 * @param {Function} [config.filterDeals] - Optional function to filter deals before processing
 * @param {string} [config.volumeLabel] - Y-axis label for volume chart
 * @param {string} [config.countLabel] - Y-axis label for count chart
 */
const createAnalysisChart = (config) => {
  const {
    chartType,
    title,
    legendTitle,
    categoryField,
    colorMap,
    normalizeCategory = (v) => v,
    filterDeals = (deals) => deals,
    volumeLabel = "Investment Volume CHF (M)",
    countLabel = "Number of Deals",
  } = config;

  // Inner chart component
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
    const yAxisLabel = isVolume ? volumeLabel : countLabel;
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

  // Main analysis chart component
  const AnalysisChart = ({ deals, selectedCategories = [] }) => {
    // Process data
    const { chartData, categories, colorOf } = useMemo(() => {
      if (!deals?.length) return { chartData: [], categories: [], colorOf: () => "#000" };

      // Filter deals if needed
      const filteredDeals = filterDeals(deals);

      // Extract categories with optional normalization
      const getCategoryValue = (item) => normalizeCategory(item[categoryField]);
      const extractedCategories = extractCategories(filteredDeals, getCategoryValue).sort();

      // Calculate yearly data
      const chartConfig = getChartConfig(chartType);
      const yearlyData = calculateYearlyData(filteredDeals, {
        ...chartConfig,
        categories: extractedCategories,
        getCategoryValue,
        includeTotal: true,
      });

      // Color function using color map with fallback to enhanced palette
      const colorFn = (category) =>
        colorMap[category] ||
        ENHANCED_COLOR_PALETTE[extractedCategories.indexOf(category) % ENHANCED_COLOR_PALETTE.length];

      return {
        chartData: yearlyData,
        categories: extractedCategories,
        colorOf: colorFn,
      };
    }, [deals]);

    // Chart dimensions
    const dims = getChartDims(false, undefined, CHART_MARGIN);
    const expandedDims = getChartDims(true, 440, EXPANDED_CHART_MARGIN);

    // Reusable chart renderer
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

    // Expanded chart component using unified layout
    const ExpandedChart = ({ data, mode, expandedChart, isExpanded, showTotal }) => {
      const isVolumeChart = expandedChart === "volume";

      return (
        <ExpandedChartLayout
          legendItems={categories}
          legendTitle={legendTitle}
          colorOf={colorOf}
          height={expandedDims.height}
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