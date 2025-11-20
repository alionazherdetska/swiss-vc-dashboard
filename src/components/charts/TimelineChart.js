import BaseExpandableChart from "./shared/BaseExpandableChart";
import { SingleChartLayout } from "./shared/ChartLayouts";
import D3AreaChart from "./shared/D3AreaChart";
import ResponsiveD3Container from "./shared/ResponsiveD3Container";
import ChartLegend from "./shared/ChartLegend";

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

  const ChartComponent = ({ data: chartData, singleMode, onExpand }) => (
    <SingleChartLayout
      title={headerTitle}
      ChartComponent={(props) => (
        <InnerArea {...props} data={chartData} dataKey={chartKey} yAxisLabel={defaultY} />
      )}
      onExpand={() => onExpand && onExpand(showVolume ? "volume" : "count")}
    />
  );

  return (
    <BaseExpandableChart
      title={headerTitle}
      data={data}
      ChartComponent={ChartComponent}
      ExpandedChartComponent={({ data: d, mode, expandedChart, isExpanded }) => (
        <div className="grid grid-cols-5 items-start h-[400px]">
          <div className="col-span-1 pt-8">
            <ChartLegend items={[headerTitle]} colorOf={() => "#E84A5F"} title={"Series"} />
          </div>

          <div className="col-span-4 min-w-0">
            <ResponsiveD3Container height={350}>
              <InnerArea
                data={d}
                dataKey={chartKey}
                mode={mode}
                height={350}
                isExpanded={true}
                yAxisLabel={defaultY}
              />
            </ResponsiveD3Container>
          </div>
        </div>
      )}
      isDualChart={false}
      supportsSingleMode={true}
      supportsTotal={false}
      initialSingleMode="line"
      initialShowTotal={false}
    />
  );
};
