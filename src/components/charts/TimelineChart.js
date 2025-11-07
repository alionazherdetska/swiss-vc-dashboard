import D3AreaChart from "./shared/D3AreaChart";
import ResponsiveD3Container from "./shared/ResponsiveD3Container";

export const TimelineChart = ({ data, showVolume = false, title, yLabel }) => {
  const chartKey = showVolume ? "volume" : "count";
  const defaultY = showVolume ? "Volume (CHF M)" : "Count";
  const chartLabel = yLabel || defaultY;

  return (
    <div className="space-y-2">
      <div className="flex items-center mb-2">
        {title && (
          <h3 className="text-md font-semibold text-gray-800 mr-2">{title}</h3>
        )}
      </div>
      <ResponsiveD3Container width="100%" height={400}>
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
      </ResponsiveD3Container>
    </div>
  );
};
