import BaseExpandableChart from "./shared/BaseExpandableChart";
import { SingleChartLayout } from "./shared/ChartLayouts";
import D3AreaChart from "./shared/D3AreaChart";

const InnerArea = ({ data, dataKey, mode, width, height, margin, yAxisLabel }) => {
  return (
    <D3AreaChart
      data={data}
      dataKey={dataKey}
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
        <InnerArea {...props} data={chartData} dataKey={chartKey} />
      )}
      onExpand={() => onExpand && onExpand(showVolume ? "volume" : "count")}
    />
  );

  const handleExport = (format, expanded) => {
    // TODO: implement export
  };

  return (
    <BaseExpandableChart
      title={headerTitle}
      data={data}
      ChartComponent={ChartComponent}
      ExpandedChartComponent={({ data: d, mode, expandedChart, isExpanded }) => (
        <InnerArea data={d} dataKey={chartKey} mode={mode} width={950} height={350} margin={{ top: 50, right: 50, left: 60, bottom: 60 }} isExpanded={true} />
      )}
      isDualChart={false}
      supportsSingleMode={true}
      supportsTotal={false}
      initialSingleMode="line"
      initialShowTotal={false}
      onExport={handleExport}
    />
  );
};
