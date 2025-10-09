import React from "react";
import ChartHeader from "./ChartHeader";

/**
 * Layout component for dual charts (volume and count side by side)
 * Provides consistent structure and spacing
 */
const DualChartLayout = ({
  // Chart data and configuration
  volumeData,
  countData,

  // Chart components
  VolumeChart,
  CountChart,

  // Chart props
  volumeProps = {},
  countProps = {},

  // Headers
  volumeTitle = "Investment Volume vs Year",
  countTitle = "Number of Deals vs Year",

  // Action handlers
  onVolumeExpand,
  onCountExpand,
  onVolumeExport,
  onCountExport,

  // Layout configuration
  gridClassName = "grid grid-cols-1 md:grid-cols-2 gap-4",

  children,
}) => {
  return (
    <div className="space-y-4">
      {children}

      <div className={gridClassName}>
        {/* Volume Chart */}
        <div className="space-y-2 relative">
          <div className="pl-4">
            <ChartHeader
              title={volumeTitle}
              showExpandButton={!!onVolumeExpand}
              showExportButton={!!onVolumeExport}
              onExpand={onVolumeExpand}
              onExport={onVolumeExport}
              isVolumeChart={true}
              expandTitle="Expand Volume Chart"
            />
          </div>

          <VolumeChart data={volumeData} isVolume={true} {...volumeProps} />
        </div>

        {/* Count Chart */}
        <div className="space-y-2 relative">
          <div className="pl-4">
            <ChartHeader
              title={countTitle}
              showExpandButton={!!onCountExpand}
              showExportButton={!!onCountExport}
              onExpand={onCountExpand}
              onExport={onCountExport}
              isVolumeChart={false}
              expandTitle="Expand Count Chart"
            />
          </div>

          <CountChart data={countData} isVolume={false} {...countProps} />
        </div>
      </div>
    </div>
  );
};

/**
 * Layout component for single charts
 * Provides consistent structure for standalone charts
 */
const SingleChartLayout = ({
  // Chart data and configuration
  data,

  // Chart component
  ChartComponent,

  // Chart props
  chartProps = {},

  // Header
  title,

  // Action handlers
  onExpand,
  onExport,

  // Configuration
  isVolumeChart = false,

  // Layout
  className = "space-y-4",

  children,
}) => {
  return (
    <div className={className}>
      {children}

      <div className="space-y-2 relative">
        <div className="pl-4">
          <ChartHeader
            title={title}
            showExpandButton={!!onExpand}
            showExportButton={!!onExport}
            onExpand={onExpand}
            onExport={onExport}
            isVolumeChart={isVolumeChart}
            expandTitle={`Expand ${isVolumeChart ? "Volume" : "Count"} Chart`}
          />
        </div>

        <ChartComponent data={data} {...chartProps} />
      </div>
    </div>
  );
};

export { DualChartLayout, SingleChartLayout };
