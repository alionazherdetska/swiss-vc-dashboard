import { useMemo, useState, useEffect } from "react";
import BaseExpandableChart from "./BaseExpandableChart";
import ResponsiveD3Container from "./ResponsiveD3Container";
import ExpandedChartLayout from "./ExpandedChartLayout";
import { DualChartLayout } from "./ChartLayouts";
import D3MultiSeriesChart from "./D3MultiSeriesChart";
import { calculateYearlyData, extractCategories, getChartConfig } from "./ChartDataUtils";
import { getChartDims } from "../../../lib/utils";
import {
  CHART_MARGIN,
  EXPANDED_CHART_MARGIN,
  ENHANCED_COLOR_PALETTE,
  OFFICIAL_CANTONS,
  PRIMARY_CANTON_ORDER_CODES,
  OTHER_CANTON_CODES,
} from "../../../lib/constants";

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
    const displayCategories = selectedCategories.length > 0 ? selectedCategories : categories;

    return (
      <D3MultiSeriesChart
        data={data}
        categories={displayCategories}
        allCategories={categories}
        isVolume={isVolume}
        mode={mode}
        width={width}
        height={height}
        margin={margin}
        isExpanded={isExpanded}
        colorOf={colorOf}
        showTotal={showTotal}
        yAxisLabel={null}
        metricSuffix={metricSuffix}
      />
    );
  };

  const AnalysisChart = ({ deals, allDeals, selectedCategories = [] }) => {
    const { chartData, categories, colorOf, expandedCategories } = useMemo(() => {
      if (!deals?.length) return { chartData: [], categories: [], colorOf: () => "#000" };

      const filteredDeals = filterDeals(deals);
      const allFilteredDeals = allDeals ? filterDeals(allDeals) : filteredDeals;

      // Base getter maps raw item -> normalized category name
      const baseGetCategoryValue = (item) => normalizeCategory(item[categoryField]);

      // Special handling for canton charts: compact view collapses many cantons into a single 'Other' series,
      // expanded view exposes a larger selectable set (primary + many others) and groups the rest as 'Other'.
      if (chartType === "canton") {
        const codeToName = OFFICIAL_CANTONS.reduce((acc, c) => {
          acc[c.code] = c.name;
          return acc;
        }, {});

        const primaryNames = PRIMARY_CANTON_ORDER_CODES.map((code) => codeToName[code]).filter(Boolean);
        const otherNamesCompact = OTHER_CANTON_CODES.map((code) => codeToName[code]).filter(Boolean);

        // Define the expanded selection order (explicit list requested)
        const EXPANDED_ORDER_CODES = [
          ...PRIMARY_CANTON_ORDER_CODES,
          "SG",
          "TI",
          "LU",
          "AG",
          "SZ",
          "VS",
          "FR",
          "BL",
          "NE",
          "SO",
          "SH",
          "TG",
          "JU",
        ];
        const expandedNames = EXPANDED_ORDER_CODES.map((code) => codeToName[code]).filter(Boolean);

        // Names that are NOT explicitly exposed in expandedNames will be grouped into 'Other' in expanded view
        // eslint-disable-next-line no-unused-vars
        const otherNamesForExpanded = OFFICIAL_CANTONS.map((c) => c.name).filter((n) => !expandedNames.includes(n));

        // Build category mapping for expanded data: map anything not in expandedNames -> 'Other'
        const getCategoryValueExpanded = (item) => {
          const val = baseGetCategoryValue(item);
          if (!val) return val;
          return expandedNames.includes(val) ? val : "Other";
        };

        // Expanded categories always in this order
        const expandedExtractedCategories = [...expandedNames, "Other"];

        // Compute the yearly data for expanded categories (this dataset will include all series fields)
        const chartConfig = getChartConfig(chartType);
        // For canton charts the "total" should reflect the sum of the currently
        // filtered/selected canton series (not the unfiltered universe). Use
        // `filteredDeals` as `allData` so grand totals equal the stacked sum.
        const yearlyDataExpanded = calculateYearlyData(filteredDeals, {
          ...chartConfig,
          categories: expandedExtractedCategories,
          getCategoryValue: getCategoryValueExpanded,
          includeTotal: true,
          allData: filteredDeals,
        });

        // Now compute compact categories (for the small view): primary + Other only when present
        const presentNames = extractCategories(filteredDeals, baseGetCategoryValue);
        const presentSet = new Set();
        presentNames.forEach((name) => {
          if (otherNamesCompact.includes(name)) presentSet.add("Other");
          else if (primaryNames.includes(name)) presentSet.add(name);
          else presentSet.add(name);
        });
        const compactExtractedCategories = [
          ...primaryNames.filter((n) => presentSet.has(n)),
          ...(presentSet.has("Other") ? ["Other"] : []),
        ];

        // Color mapping uses presence in the expanded dataset (so indices align)
        const allPresentNames = extractCategories(allFilteredDeals, getCategoryValueExpanded).sort();
        const colorFn = (category) =>
          colorMap[category] ||
          ENHANCED_COLOR_PALETTE[allPresentNames.indexOf(category) % ENHANCED_COLOR_PALETTE.length];

        return {
          chartData: yearlyDataExpanded,
          categories: compactExtractedCategories,
          expandedCategories: expandedExtractedCategories,
          colorOf: colorFn,
        };
      }

      const getCategoryValue = (item) => baseGetCategoryValue(item);
      const extractedCategories = extractCategories(filteredDeals, getCategoryValue).sort();
      const allExtractedCategories = extractCategories(allFilteredDeals, getCategoryValue).sort();

      const chartConfig = getChartConfig(chartType);
      const yearlyData = calculateYearlyData(filteredDeals, {
        ...chartConfig,
        categories: extractedCategories,
        getCategoryValue,
        includeTotal: true,
        allData: allFilteredDeals,
      });

      const colorFn = (category) =>
        colorMap[category] ||
        ENHANCED_COLOR_PALETTE[
          allExtractedCategories.indexOf(category) % ENHANCED_COLOR_PALETTE.length
        ];

      return {
        chartData: yearlyData,
        categories: extractedCategories,
        colorOf: colorFn,
      };
    }, [deals, allDeals]);

    const dims = getChartDims(false, undefined, CHART_MARGIN);
    const expandedDims = getChartDims(true, 440, EXPANDED_CHART_MARGIN);

    const renderChart =
      (isVolume) =>
      ({ data, mode, isExpanded = false, width, height, showTotal = false }) => {
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
            showTotal={showTotal}
              selectedCategories={selectedCategories}
            />
          </ResponsiveD3Container>
        );
      };

    const VolumeChart = renderChart(true);
    const CountChart = renderChart(false);

    const ExpandedChart = ({ data, mode, expandedChart, isExpanded, showTotal, controls }) => {
      const isVolumeChart = expandedChart === "volume";
      // local selection state for expanded legend (allows checkboxes in expanded view)
      const [modalSelectedCategories, setModalSelectedCategories] = useState(
        expandedCategories || categories
      );

      // eslint-disable-next-line react-hooks/exhaustive-deps
      useEffect(() => {
        setModalSelectedCategories(expandedCategories || categories);
      }, [expandedCategories, categories]);

      const toggleModalCategory = (cat) => {
        setModalSelectedCategories((prev) => {
          if (!prev) return [cat];
          if (prev.includes(cat)) return prev.filter((c) => c !== cat);
          return [...prev, cat];
        });
      };

      return (
        <ExpandedChartLayout
          legendItems={expandedCategories || categories}
          legendTitle={legendTitle}
          colorOf={colorOf}
          height={expandedDims.height}
          controls={controls}
          // Enable checkboxes for canton expanded view
          legendSelectable={chartType === "canton"}
          selectedLegendItems={modalSelectedCategories}
          onToggleLegend={toggleModalCategory}
        >
          <CategoryChart
            data={data}
            categories={expandedCategories || categories}
            isVolume={isVolumeChart}
            mode={mode}
            margin={expandedDims.margin}
            isExpanded={true}
            colorOf={colorOf}
            showTotal={showTotal}
            selectedCategories={modalSelectedCategories}
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
            volumeProps={{ mode: leftMode, showTotal }}
            countProps={{ mode: rightMode, showTotal }}
            onVolumeExpand={() => onExpand("volume")}
            onCountExpand={() => onExpand("count")}
          />
        )}
        ExpandedChartComponent={ExpandedChart}
        isDualChart={true}
        supportsSingleMode={true}
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