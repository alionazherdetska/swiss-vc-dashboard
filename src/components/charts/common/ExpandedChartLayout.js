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
  controls = null,
  rightControls = null,
  // when true, legend will render selectable checkboxes (used for canton expanded view)
  legendSelectable = false,
  selectedLegendItems = [],
  onToggleLegend = null,
}) => {
  return (
    <div>
      {rightControls && <div className="flex justify-end mb-3">{rightControls}</div>}

      <div className="grid grid-cols-5 items-start" style={{ minHeight: height }}>
        {/* Legend on the LEFT - 1/5 */}
        <div className="col-span-1 flex flex-col" style={{ height: height }}>
          {controls && <div className="mb-4 flex-shrink-0">{controls}</div>}
          <div style={{ overflowY: "auto", flex: "1 1 auto", paddingRight: 6 }}>
            <ChartLegend
              items={legendItems}
              colorOf={colorOf}
              title={legendTitle}
              showCheckboxes={legendSelectable}
              checkedItems={selectedLegendItems}
              onToggle={onToggleLegend}
            />
          </div>
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