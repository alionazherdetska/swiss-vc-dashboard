import BaseExpandableChart from "./shared/BaseExpandableChart";
import { SingleChartLayout } from "./shared/ChartLayouts";
import D3AreaChart from "./shared/D3AreaChart";
import ResponsiveD3Container from "./shared/ResponsiveD3Container";
import ChartLegend from "./shared/ChartLegend";
import { getChartDims } from "../../lib/utils";
import { CHART_MARGIN, EXPANDED_CHART_MARGIN } from "../../lib/constants";

const InnerArea = ({ data, dataKey, mode, width, height, margin, yAxisLabel }) => {
  return (
    <D3AreaChart
      data={data}
      dataKey={dataKey}
      width={width}
      height={height}
      margin={margin}
      mode={mode}
      strokeColor="#E84A5F"
      strokeWidth={2}
      fillColor="#E84A5F"
      fillOpacity={0.8}
      gridColor="#E2E8F0"
      axisColor="#4A5568"
      yAxisLabel={yAxisLabel}
    />
  );
};

export const TimelineChart = ({ data, showVolume = false, title }) => {
  const chartKey = showVolume ? "volume" : "count";
  const defaultY = showVolume ? "Volume (CHF M)" : "Count";
  const headerTitle = title || (showVolume ? "Invested capital" : "Number of deals");

  // Chart dimensions
  const dims = getChartDims(false, undefined, CHART_MARGIN);
  const expandedDims = getChartDims(true, 440, EXPANDED_CHART_MARGIN);

  const ChartComponent = ({ data: chartData, singleMode, onExpand }) => (
    <SingleChartLayout
      title={headerTitle}
      ChartComponent={(props) => (
        <ResponsiveD3Container width="100%" height={dims.height}>
          <InnerArea
            {...props}
            data={chartData}
            dataKey={chartKey}
            margin={dims.margin}
            yAxisLabel={defaultY}
          />
        </ResponsiveD3Container>
      )}
      onExpand={() => onExpand && onExpand(showVolume ? "volume" : "count")}
    />
  );

  return (
    <BaseExpandableChart
      title={headerTitle}
      data={data}
      ChartComponent={ChartComponent}
      ExpandedChartComponent={({ data: d, mode, expandedChart, isExpanded }) => {
        return (
          <div className="grid grid-cols-5 items-start">
            <div className="col-span-1 pt-8">
              <ChartLegend items={[headerTitle]} colorOf={() => "#E84A5F"} title={"Series"} />
            </div>

            <div className="col-span-4 min-w-0">
              <ResponsiveD3Container width="100%" height={expandedDims.height}>
                <InnerArea
                  data={d}
                  dataKey={chartKey}
                  mode={mode}
                  margin={expandedDims.margin}
                  isExpanded={true}
                  yAxisLabel={defaultY}
                />
              </ResponsiveD3Container>
            </div>
          </div>
        );
      }}
      isDualChart={false}
      supportsSingleMode={true}
      supportsTotal={false}
      initialSingleMode="line"
      initialShowTotal={false}
    />
  );
};

export default TimelineChart;