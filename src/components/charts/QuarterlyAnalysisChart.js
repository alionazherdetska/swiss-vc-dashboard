import { useMemo } from "react";
import BaseExpandableChart from "./shared/BaseExpandableChart";
import ChartLegend from "./shared/ChartLegend";
import ResponsiveD3Container from "./shared/ResponsiveD3Container";
import { DualChartLayout } from "./shared/ChartLayouts";
import D3MultiSeriesChart from "./shared/D3MultiSeriesChart";
import { calculateYearlyData, extractCategories, getChartConfig } from "./shared/ChartDataUtils";
import { getChartDims } from "../../lib/utils";
import {
  CHART_MARGIN,
  EXPANDED_CHART_MARGIN,
  INDUSTRY_COLOR_MAP,
  ENHANCED_COLOR_PALETTE,
} from "../../lib/constants";

// Chart component wrapper for quarterly/industry data
const QuarterlyChart = ({
  data,
  industries,
  isVolume,
  mode,
  width,
  height,
  margin,
  isExpanded = false,
  colorOf,
  showTotal = false,
  selectedIndustries = [],
  showDataPoints = true, // Added prop for data points
}) => {
  const metricSuffix = isVolume ? "__volume" : "__count";
  const yAxisLabel = isVolume ? "Investment Volume CHF (M)" : "Number of Deals";

  // Filter industries if selectedIndustries is provided
  const displayIndustries = selectedIndustries.length > 0 ? selectedIndustries : industries;

  return (
    <D3MultiSeriesChart
      data={data}
      categories={displayIndustries}
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
      showDataPoints={showDataPoints} // Pass to D3MultiSeriesChart
    />
  );
};

const QuarterlyAnalysisChart = ({
  deals,
  selectedIndustries = [],
  selectedIndustryCount,
  totalIndustryCount,
}) => {
  // Process data
  const { chartData, industries, colorOf } = useMemo(() => {
    if (!deals?.length) return { chartData: [], industries: [], colorOf: () => "#000" };

    // Extract unique industries
    const extractedIndustries = extractCategories(deals, (item) => item.Industry).sort();

    // Calculate yearly data
    const config = getChartConfig("quarterly");
    const yearlyData = calculateYearlyData(deals, {
      ...config,
      categories: extractedIndustries,
      getCategoryValue: (item) => item.Industry,
      includeTotal: true,
    });

    // Color function using industry color map with fallback to enhanced palette
    const colorFn = (industry) => INDUSTRY_COLOR_MAP[industry] || ENHANCED_COLOR_PALETTE[extractedIndustries.indexOf(industry) % ENHANCED_COLOR_PALETTE.length];

    return {
      chartData: yearlyData,
      industries: extractedIndustries,
      colorOf: colorFn,
    };
  }, [deals]);

  // Chart dimensions
  const dims = getChartDims(false, undefined, CHART_MARGIN);
  // Expanded chart target size inside modal: 700 x 350
  const expandedDimsBase = getChartDims(true, 440, EXPANDED_CHART_MARGIN);
  const expandedDims = { ...expandedDimsBase };

  // Main chart components - wrapped in ResponsiveD3Container for responsive width
  const VolumeChart = ({ data, mode, isExpanded = false, width, height }) => {
    const currentDims = isExpanded ? expandedDims : dims;
    // Use passed width/height if provided (from ResponsiveD3Container), otherwise use defaults
    const finalHeight = typeof height === "number" ? height : currentDims.height;

    return (
      <ResponsiveD3Container width="100%" height={finalHeight}>
        <QuarterlyChart
          data={data}
          industries={industries}
          isVolume={true}
          mode={mode}
          margin={currentDims.margin}
          isExpanded={isExpanded}
          colorOf={colorOf}
          showTotal={false}
          selectedIndustries={selectedIndustries}
          showDataPoints={true}
        />
      </ResponsiveD3Container>
    );
  };

  const CountChart = ({ data, mode, isExpanded = false, width, height }) => {
    const currentDims = isExpanded ? expandedDims : dims;
    // Use passed width/height if provided (from ResponsiveD3Container), otherwise use defaults
    const finalHeight = typeof height === "number" ? height : currentDims.height;

    return (
      <ResponsiveD3Container width="100%" height={finalHeight}>
        <QuarterlyChart
          data={data}
          industries={industries}
          isVolume={false}
          mode={mode}
          margin={currentDims.margin}
          isExpanded={isExpanded}
          colorOf={colorOf}
          showTotal={false}
          selectedIndustries={selectedIndustries}
          showDataPoints={true}
        />
      </ResponsiveD3Container>
    );
  };

  // Expanded chart component with legend on the left
  const ExpandedChart = ({ data, mode, expandedChart, isExpanded, showTotal }) => {
    const isVolumeChart = expandedChart === "volume";
    
    return (
      <div className="grid grid-cols-5 items-start">
        {/* Legend on the LEFT - 1/5 */}
        <div className="col-span-1 pt-8">
          <ChartLegend items={industries} colorOf={colorOf} title="Industries" />
        </div>

        {/* Chart on the RIGHT - 4/5 */}
        <div className="col-span-4 min-w-0">
          <ResponsiveD3Container width="100%" height={expandedDims.height}>
            {isVolumeChart ? (
              <QuarterlyChart
                data={data}
                industries={industries}
                mode={mode}
                isExpanded={isExpanded}
                isVolume={true}
                margin={expandedDims.margin}
                colorOf={colorOf}
                showTotal={showTotal}
                selectedIndustries={selectedIndustries}
                showDataPoints={true}
              />
            ) : (
              <QuarterlyChart
                data={data}
                industries={industries}
                mode={mode}
                isExpanded={isExpanded}
                isVolume={false}
                margin={expandedDims.margin}
                colorOf={colorOf}
                showTotal={showTotal}
                selectedIndustries={selectedIndustries}
                showDataPoints={true}
              />
            )}
          </ResponsiveD3Container>
        </div>
      </div>
    );
  };


  return (
    <BaseExpandableChart
      title="Quarterly Analysis"
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

export default QuarterlyAnalysisChart;