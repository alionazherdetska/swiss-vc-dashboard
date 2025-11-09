import D3AreaChart from "./shared/D3AreaChart";
import ChartHeader from "./shared/ChartHeader";

export const TimelineChart = ({ data, showVolume = false, title, yLabel }) => {
  const chartKey = showVolume ? "volume" : "count";
  const defaultY = showVolume ? "Volume (CHF M)" : "Count";
  const chartLabel = yLabel || defaultY;
  const headerTitle = title || (showVolume ? "Invested capital" : "Number of deals");
  const subTitle = showVolume ? "in CHF Mio." : "";

  return (
    <div>
      <div className="pl-4 mb-2">
        <ChartHeader title={headerTitle} />
        {subTitle ? (
          <div className="text-xs text-gray-500 -mt-1">{subTitle}</div>
        ) : null}
      </div>
      <D3AreaChart
        data={data}
        dataKey={chartKey}
        margin={{ top: 50, right: 50, left: 60, bottom: 60 }}
        strokeColor="#E84A5F"
        strokeWidth={2}
        fillColor="#E84A5F"
        fillOpacity={0.8}
        gridColor="#E2E8F0"
        axisColor="#4A5568"
        yAxisLabel={chartLabel}
        showVolume={showVolume}
      />
    </div>
  );
};
