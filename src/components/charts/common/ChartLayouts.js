import ChartHeader from "./ChartHeader";
import styles from "../Charts.module.css";
import utilStyles from "../../../styles/utils.module.css";

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
  volumeTitle = "Invested capital",
  countTitle = "Number of deals",
  // optional subtitles for first/second chart
  volumeSubtitle = "in CHF Mio.",
  countSubtitle = "",

  // Action handlers
  onVolumeExpand,
  onCountExpand,

  // Layout configuration
    gridClassName = `grid grid-cols-1 md:grid-cols-2 ${utilStyles.gridGap15}`,

  children,
}) => {
  return (
    <div className="space-y-4">
      {children}

      <div className={gridClassName}>
        {/* Volume Chart */}
        <div className={styles.chartArea}>
          <div className={styles.chartHeaderOverlay}>
            <ChartHeader
              title={volumeTitle}
              subtitle={volumeSubtitle}
              showExpandButton={!!onVolumeExpand}
              onExpand={onVolumeExpand}
              isVolumeChart={true}
              expandTitle="Expand Volume Chart"
              className="flex items-center justify-between"
            />
          </div>
          <VolumeChart data={volumeData} isVolume={true} {...volumeProps} />
        </div>

        {/* Count Chart */}
        <div className={styles.chartArea}>
          <div className={styles.chartHeaderOverlay}>
            <ChartHeader
              title={countTitle}
              subtitle={countSubtitle}
              showExpandButton={!!onCountExpand}
              onExpand={onCountExpand}
              isVolumeChart={false}
              expandTitle="Expand Count Chart"
              className="flex items-center justify-between"
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

  // Configuration
  isVolumeChart = false,

  // Layout
  className = "space-y-4",

  children,
}) => {
  return (
    <div className={className}>
      {children}

        <div>
          <div className={styles.chartHeaderOverlay}>
            <ChartHeader
              title={title}
              subtitle={""}
              showExpandButton={!!onExpand}
              onExpand={onExpand}
              isVolumeChart={isVolumeChart}
              expandTitle={`Expand ${isVolumeChart ? "Volume" : "Count"} Chart`}
              className="flex items-center justify-between"
            />
          </div>
          <ChartComponent data={data} {...chartProps} />
        </div>
    </div>
  );
};

export { DualChartLayout, SingleChartLayout };
