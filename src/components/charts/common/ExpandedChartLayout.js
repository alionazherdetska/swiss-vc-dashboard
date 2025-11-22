import ChartLegend from "./ChartLegend";
import ResponsiveD3Container from "./ResponsiveD3Container";

/**
 * Unified layout for expanded charts in modal view
 * Provides consistent structure: legend on left (1/5), chart on right (4/5)
 * No background styling - modal provides the container
 */
const ExpandedChartLayout = ({
  legendItems = [],
  legendTitle = "Legend",
  colorOf,
  height = 420,
  children,
  // optional controls to render above the legend in the left column
  controls = null,
  // optional controls to render at the far right (e.g. Show total in modal header)
  rightControls = null,
}) => {
  return (
    <div>
      {rightControls && <div className="flex justify-end mb-3">{rightControls}</div>}

      <div className="grid grid-cols-5 items-start" style={{ minHeight: height }}>
        {/* Legend on the LEFT - 1/5 */}
        <div className="col-span-1">
          {controls && <div className="mb-4">{controls}</div>}
          <ChartLegend items={legendItems} colorOf={colorOf} title={legendTitle} />
        </div>

        {/* Chart on the RIGHT - 4/5 */}
        <div className="col-span-4 min-w-0" style={{ height: height }}>
          <ResponsiveD3Container width="100%" height={height}>
            {children}
          </ResponsiveD3Container>
        </div>
      </div>
    </div>
  );
};

export default ExpandedChartLayout;
