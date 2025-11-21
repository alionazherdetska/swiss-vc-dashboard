import BaseExpandableChart from "./shared/BaseExpandableChart";
import ChartHeader from "./shared/ChartHeader";
import D3AreaChart from "./shared/D3AreaChart";
import ResponsiveD3Container from "./shared/ResponsiveD3Container";
import ChartLegend from "./shared/ChartLegend";
import { getChartDims } from "../../lib/utils";
import { CHART_MARGIN, EXPANDED_CHART_MARGIN } from "../../lib/constants";
import styles from "./Charts.module.css";

/**
 * Timeline Chart - Shows investment volume or deal count over time
 * Uses same pattern as other analysis charts for consistency
 */
export const TimelineChart = ({ data, showVolume = false, title }) => {
  const chartKey = showVolume ? "volume" : "count";
  const defaultY = showVolume ? "Volume (CHF M)" : "Count";
  const headerTitle = title || (showVolume ? "Invested capital" : "Number of deals");
  const chartColor = "#E84A5F";

  // Chart dimensions - same as other charts
  const dims = getChartDims(false, undefined, CHART_MARGIN);
  const expandedDims = getChartDims(true, 440, EXPANDED_CHART_MARGIN);

  // Main chart component - matches pattern from PhaseAnalysisChart
  const MainChart = ({ data: chartData, isExpanded = false }) => {
    const currentDims = isExpanded ? expandedDims : dims;

    return (
      <div className={styles.chartArea}>
        <ResponsiveD3Container width="100%" height={currentDims.height}>
          <D3AreaChart
            data={chartData}
            dataKey={chartKey}
            margin={currentDims.margin}
            strokeColor={chartColor}
            strokeWidth={2}
            fillColor={chartColor}
            fillOpacity={0.8}
            gridColor="#E2E8F0"
            axisColor="#4A5568"
            yAxisLabel={defaultY}
          />
        </ResponsiveD3Container>
      </div>
    );
  };

  // Expanded chart with legend
  const ExpandedChart = ({ data: chartData }) => (
    <div className="grid grid-cols-5 items-start">
      <div className="col-span-1 pt-8">
        <ChartLegend items={[headerTitle]} colorOf={() => chartColor} title="Series" />
      </div>
      <div className="col-span-4 min-w-0">
        <MainChart data={chartData} isExpanded={true} />
      </div>
    </div>
  );

  return (
    <BaseExpandableChart
      title={headerTitle}
      data={data}
      ChartComponent={({ data: chartData, onExpand }) => (
        <div>
          <div className="pl-4">
            <ChartHeader
              title={headerTitle}
              showExpandButton={true}
              onExpand={() => onExpand && onExpand(showVolume ? "volume" : "count")}
              expandTitle="Expand Chart"
              className="flex items-start gap-4 mb-2"
              titleClassName="text-md font-semibold text-gray-800"
            />
          </div>
          <MainChart data={chartData} />
        </div>
      )}
      ExpandedChartComponent={ExpandedChart}
      isDualChart={false}
      supportsSingleMode={true}
      supportsTotal={false}
      initialSingleMode="line"
      initialShowTotal={false}
    />
  );
};

export default TimelineChart;