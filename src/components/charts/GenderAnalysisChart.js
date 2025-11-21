import { useMemo } from "react";
import BaseExpandableChart from "./shared/BaseExpandableChart";
import { DualChartLayout } from "./shared/ChartLayouts";
import D3MultiSeriesChart from "./shared/D3MultiSeriesChart";
import { calculateYearlyData, extractCategories, getChartConfig } from "./shared/ChartDataUtils";
import ChartLegend from "./shared/ChartLegend";
import ResponsiveD3Container from "./shared/ResponsiveD3Container";
import { getChartDims } from "../../lib/utils";
import { CHART_MARGIN, EXPANDED_CHART_MARGIN, CEO_GENDER_COLOR_MAP, ENHANCED_COLOR_PALETTE } from "../../lib/constants";

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

const GenderAnalysisChart = ({ deals }) => {
  // Process data
  const { chartData, genders, colorOf } = useMemo(() => {
    if (!deals?.length) return { chartData: [], genders: [], colorOf: () => "#000" };

    // Filter out deals with unknown gender
    const filteredDeals = deals.filter((d) => {
      const gender = d["Gender CEO"];
      return gender && gender.trim() && gender !== "Unknown";
    });

    // Extract unique genders
    const extractedGenders = extractCategories(filteredDeals, (item) => item["Gender CEO"]).sort();

    // Calculate yearly data
    const config = getChartConfig("gender");
    const yearlyData = calculateYearlyData(filteredDeals, {
      ...config,
      categories: extractedGenders,
      getCategoryValue: (item) => item["Gender CEO"],
      includeTotal: true,
    });

    // Color function using gender color map with fallback to palette
    const colorFn = (gender) => CEO_GENDER_COLOR_MAP[gender] || ENHANCED_COLOR_PALETTE[extractedGenders.indexOf(gender) % ENHANCED_COLOR_PALETTE.length];

    return {
      chartData: yearlyData,
      genders: extractedGenders,
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
        <GenderChart
          data={data}
          genders={genders}
          isVolume={true}
          mode={mode}
          margin={currentDims.margin}
          isExpanded={isExpanded}
          colorOf={colorOf}
          showTotal={false}
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
        <GenderChart
          data={data}
          genders={genders}
          isVolume={false}
          mode={mode}
          margin={currentDims.margin}
          isExpanded={isExpanded}
          colorOf={colorOf}
          showTotal={false}
        />
      </ResponsiveD3Container>
    );
  };

  // Expanded chart component with legend on the left
  const ExpandedChart = ({ data, mode, expandedChart, isExpanded }) => {
    const isVolumeChart = expandedChart === "volume";

    return (
      <div className="grid grid-cols-5 items-start">
        {/* Legend on the LEFT - 1/5 */}
        <div className="col-span-1 pt-8">
          <ChartLegend items={genders} colorOf={colorOf} title="Genders" />
        </div>

        {/* Chart on the RIGHT - 4/5 */}
        <div className="col-span-4 min-w-0">
          <ResponsiveD3Container width="100%" height={expandedDims.height}>
            {isVolumeChart ? (
              <GenderChart
                data={data}
                genders={genders}
                isVolume={true}
                mode={mode}
                margin={expandedDims.margin}
                isExpanded={isExpanded}
                colorOf={colorOf}
                showTotal={false}
              />
            ) : (
              <GenderChart
                data={data}
                genders={genders}
                isVolume={false}
                mode={mode}
                margin={expandedDims.margin}
                isExpanded={isExpanded}
                colorOf={colorOf}
                showTotal={false}
              />
            )}
          </ResponsiveD3Container>
        </div>
      </div>
    );
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

export default GenderAnalysisChart;