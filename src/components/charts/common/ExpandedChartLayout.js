import ChartLegend from "./ChartLegend";
import ResponsiveD3Container from "./ResponsiveD3Container";

/**
 * Unified layout for expanded charts in modal view
 * Provides consistent structure: legend on left (1/5), chart on right (4/5)
 * No background styling - modal provides the container
 */
const ExpandedChartLayout = ({
  // Legend configuration
  legendItems = [],
  legendTitle = "Legend",
  colorOf,

  // Chart configuration
  height = 440,
  children, // The chart component to render
}) => {
  return (
    <div className="grid grid-cols-5 items-start">
      {/* Legend on the LEFT - 1/5 */}
      <div className="col-span-1 pt-8">
        <ChartLegend items={legendItems} colorOf={colorOf} title={legendTitle} />
      </div>

      {/* Chart on the RIGHT - 4/5 */}
      <div className="col-span-4 min-w-0">
        <ResponsiveD3Container width="100%" height={height}>
          {children}
        </ResponsiveD3Container>
      </div>
    </div>
  );
};

export default ExpandedChartLayout;
