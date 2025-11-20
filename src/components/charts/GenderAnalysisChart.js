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
  const expandedDimsBase = getChartDims(true, 450, EXPANDED_CHART_MARGIN);
  const expandedDims = { ...expandedDimsBase };

  // Main chart components
  const VolumeChart = ({ data, mode, isExpanded = false, width, height }) => {
    const computedDims = isExpanded
      ? expandedDims
      : {
          ...dims,
          width: dims.width / 2,
        };

    const currentDims = {
      ...computedDims,
      width: typeof width === "number" ? width : computedDims.width,
      height: typeof height === "number" ? height : computedDims.height,
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

  const CountChart = ({ data, mode, isExpanded = false, width, height }) => {
    const computedDims = isExpanded
      ? expandedDims
      : {
          ...dims,
          width: dims.width / 2,
        };

    const currentDims = {
      ...computedDims,
      width: typeof width === "number" ? width : computedDims.width,
      height: typeof height === "number" ? height : computedDims.height,
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

  // Expanded chart component with legend on the left
  const ExpandedChart = ({ data, mode, expandedChart, isExpanded }) => {
    const isVolumeChart = expandedChart === "volume";

    return (
      <div className="grid grid-cols-5 gap-6 items-start">
        {/* Legend on the LEFT - 1/5 */}
        <div className="col-span-1 pt-8">
          <ChartLegend items={genders} colorOf={colorOf} title="Genders" />
        </div>

        {/* Chart on the RIGHT - 4/5 */}
        <div className="col-span-4 min-w-0">
          <ResponsiveD3Container width="100%" height={expandedDims.height}>
            {isVolumeChart ? (
              <VolumeChart data={data} mode={mode} isExpanded={isExpanded} />
            ) : (
              <CountChart data={data} mode={mode} isExpanded={isExpanded} />
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