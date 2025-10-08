import React, { useMemo } from 'react';
import BaseExpandableChart from '../shared/BaseExpandableChart';
import { SingleChartLayout } from '../shared/ChartLayouts';
import D3MultiSeriesChart from '../shared/D3MultiSeriesChart';
import { calculateSimpleYearlyData, getChartConfig } from '../shared/chartDataUtils';
import { getChartDims } from '../../../lib/utils';
import { CHART_MARGIN, EXPANDED_CHART_MARGIN } from '../../../lib/constants';

/**
 * Refactored ExpandableExitsAnalysisChart using new shared architecture
 * Significantly reduced code by leveraging shared components and utilities
 */

// Simple D3 Chart wrapper for exits data
const ExitsChart = ({ data, mode, width, height, margin, isExpanded = false }) => {
  // Transform data for D3MultiSeriesChart
  const chartData = data.map(d => ({
    year: d.year,
    exits: d.exits__count || 0,
    totalCount: d.exits__count || 0
  }));

  const colorOf = () => '#E53E3E'; // EXIT_COLOR

  return (
    <D3MultiSeriesChart
      data={chartData}
      categories={['exits']}
      isVolume={false}
      mode={mode}
      width={width}
      height={height}
      margin={margin}
      isExpanded={isExpanded}
      colorOf={colorOf}
      showTotal={false}
      yAxisLabel="Number of Exits"
      metricSuffix=""
      getSeriesValue={(d, category) => d[category] || 0}
    />
  );
};

const ExpandableExitsAnalysisChart = ({ exits }) => {
  // Process exits data
  const chartData = useMemo(() => {
    const filteredExits = exits.filter(e => e.Year);
    const config = getChartConfig('exits');
    
    return calculateSimpleYearlyData(filteredExits, {
      ...config,
      countField: 'exits__count',
      volumeField: 'exits__volume'
    });
  }, [exits]);

  // Chart dimensions
  const dims = getChartDims(false, undefined, CHART_MARGIN);
  const expandedDims = getChartDims(true, 800, EXPANDED_CHART_MARGIN);

  // Main chart component
  const MainChart = ({ data, mode = 'line', isExpanded = false }) => {
    const currentDims = isExpanded ? expandedDims : dims;
    
    return (
      <ExitsChart
        data={data}
        mode={mode}
        width={currentDims.width}
        height={currentDims.height}
        margin={currentDims.margin}
        isExpanded={isExpanded}
      />
    );
  };

  // Handle expansion
  const handleExpand = () => {
    // Expansion is handled by BaseExpandableChart
  };

  // Handle export
  const handleExport = () => {
    console.log('Export exits chart');
    // TODO: Implement export functionality
  };

  return (
    <BaseExpandableChart
      title="Exit Analysis"
      data={chartData}
      ChartComponent={({ data, singleMode, onExpand }) => (
        <SingleChartLayout
          data={data}
          ChartComponent={MainChart}
          title="Number of Exits vs Year"
          onExpand={() => onExpand('count')}
          onExport={handleExport}
          isVolumeChart={false}
          chartProps={{ mode: singleMode }}
        />
      )}
      ExpandedChartComponent={({ data, mode }) => (
        <MainChart data={data} mode={mode} isExpanded={true} />
      )}
      isDualChart={false}
      supportsSingleMode={true}
      supportsTotal={false}
      initialSingleMode="line"
      onExport={handleExport}
    />
  );
};

export default ExpandableExitsAnalysisChart;