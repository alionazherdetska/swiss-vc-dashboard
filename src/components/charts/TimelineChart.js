import BaseExpandableChart from "./common/BaseExpandableChart";
import ChartHeader from "./common/ChartHeader";
import D3AreaChart from "./common/D3AreaChart";
import ResponsiveD3Container from "./common/ResponsiveD3Container";
import ExpandedChartLayout from "./common/ExpandedChartLayout";
import { getChartDims } from "../../lib/utils";
import { CHART_MARGIN, EXPANDED_CHART_MARGIN } from "../../lib/constants";
import styles from "./Charts.module.css";

/**
 * Timeline Chart - Shows investment volume or deal count over time
 * Uses same pattern as other analysis charts for consistency
 */
export const TimelineChart = ({ data, showVolume = false, title, yTickCount = null, yTickValues = null }) => {
  const chartKey = showVolume ? "volume" : "count";
  const headerTitle = title || (showVolume ? "Invested capital" : "Number of deals");
  const chartColor = "#E84A5F";

  const dims = getChartDims(false, undefined, CHART_MARGIN);
  const expandedMargin = { ...EXPANDED_CHART_MARGIN, top: 60, right: 30 };
  const expandedDims = getChartDims(true, 460, expandedMargin);

  const MainChart = ({ data: chartData, isExpanded = false, onExpand }) => {
    const currentDims = isExpanded ? expandedDims : dims;

    return (
      <div className={styles.chartArea}>
        <div className={styles.chartHeaderOverlay}>
          <ChartHeader
            title={headerTitle}
            subtitle={showVolume ? "in CHF Mio." : ""}
            showExpandButton={true}
            onExpand={() => onExpand && onExpand(isExpanded ? (showVolume ? "volume" : "count") : (showVolume ? "volume" : "count"))}
            className="flex items-center justify-between"
            titleClassName="text-md font-semibold text-gray-800"
          />
        </div>
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
            yTickCount={yTickCount}
            yTickValues={yTickValues}
          />
        </ResponsiveD3Container>
      </div>
    );
  };

  const ExpandedChart = ({ data: chartData, controls }) => (
    <ExpandedChartLayout
      legendItems={[headerTitle]}
      legendTitle={null}
      showLegend={false}
      colorOf={() => chartColor}
      height={expandedDims.height}
      controls={controls}
    >
      <D3AreaChart
        data={chartData}
        dataKey={chartKey}
        margin={expandedDims.margin}
        strokeColor={chartColor}
        strokeWidth={2}
        fillColor={chartColor}
        fillOpacity={0.8}
        gridColor="#E2E8F0"
        axisColor="#4A5568"
        yTickCount={yTickCount}
        yTickValues={yTickValues}
      />
    </ExpandedChartLayout>
  );

  return (
    <BaseExpandableChart
      title={headerTitle}
      data={data}
      ChartComponent={({ data: chartData, onExpand }) => (
        <MainChart data={chartData} onExpand={onExpand} />
      )}
      ExpandedChartComponent={ExpandedChart}
      isDualChart={false}
      supportsSingleMode={false}
      supportsTotal={false}
      initialSingleMode="line"
      initialShowTotal={false}
    />
  );
};

export default TimelineChart;