import React, { useMemo } from 'react';
import BaseExpandableChart from './shared/BaseExpandableChart';
import { DualChartLayout } from './shared/ChartLayouts';
import D3MultiSeriesChart from './shared/D3MultiSeriesChart';
import ChartLegend from './components/ChartLegend';
import { calculateYearlyData, extractCategories, getChartConfig } from './shared/chartDataUtils';
import { getChartDims, makeDistributedColorFn } from '../../lib/utils';
import { CHART_MARGIN, EXPANDED_CHART_MARGIN, INDUSTRY_COLOR_MAP, ENHANCED_COLOR_PALETTE } from '../../lib/constants';

/**
 * Refactored ExpandableQuarterlyAnalysisChart using new shared architecture
 * Reduces code by ~75% by leveraging shared components and utilities
 */

// Chart component wrapper for quarterly/industry data
const QuarterlyChart = ({ 
  data, 
  industries, 
  isVolume, 
  mode, 
  width, 
  height, 
  margin, 
  isExpanded = false, 
  colorOf,
  showTotal = false,
  selectedIndustries = []
}) => {
  const metricSuffix = isVolume ? '__volume' : '__count';
  const yAxisLabel = isVolume ? 'Investment Volume CHF (M)' : 'Number of Deals';

  // Filter industries if selectedIndustries is provided
  const displayIndustries = selectedIndustries.length > 0 ? selectedIndustries : industries;

  return (
    <D3MultiSeriesChart
      data={data}
      categories={displayIndustries}
      isVolume={isVolume}
      mode={mode}
      width={width}
      height={height}
      margin={margin}
      isExpanded={isExpanded}
      colorOf={colorOf}
      showTotal={showTotal}
      yAxisLabel={yAxisLabel}
      metricSuffix={metricSuffix}
    />
  );
};

// Legend component
const IndustryLegend = ({ industries, colorOf }) => (
  <ChartLegend items={industries} colorOf={colorOf} title="Industries" />
);

const ExpandableQuarterlyAnalysisChart = ({ 
  deals, 
  selectedIndustries = [], 
  selectedIndustryCount,
  totalIndustryCount 
}) => {
  // Process data
  const { chartData, industries, colorOf } = useMemo(() => {
    if (!deals?.length) return { chartData: [], industries: [], colorOf: () => '#000' };

    // Extract unique industries
    const extractedIndustries = extractCategories(
      deals, 
      item => item.Industry
    ).sort();

    // Calculate yearly data
    const config = getChartConfig('quarterly');
    const yearlyData = calculateYearlyData(deals, {
      ...config,
      categories: extractedIndustries,
      getCategoryValue: item => item.Industry,
      includeTotal: true
    });

    // Color function using industry color map with fallback to enhanced palette
    const colorFn = makeDistributedColorFn(INDUSTRY_COLOR_MAP, ENHANCED_COLOR_PALETTE);

    return {
      chartData: yearlyData,
      industries: extractedIndustries,
      colorOf: colorFn
    };
  }, [deals]);

  // Chart dimensions
  const dims = getChartDims(false, undefined, CHART_MARGIN);
  const expandedDims = getChartDims(true, 720, EXPANDED_CHART_MARGIN);

  // Main chart components
  const VolumeChart = ({ data, mode, isExpanded = false }) => {
    const currentDims = isExpanded ? expandedDims : { 
      ...dims, 
      width: dims.width / 2 
    };
    
    return (
      <QuarterlyChart
        data={data}
        industries={industries}
        isVolume={true}
        mode={mode}
        width={currentDims.width}
        height={currentDims.height}
        margin={currentDims.margin}
        isExpanded={isExpanded}
        colorOf={colorOf}
        showTotal={false}
        selectedIndustries={selectedIndustries}
      />
    );
  };

  const CountChart = ({ data, mode, isExpanded = false }) => {
    const currentDims = isExpanded ? expandedDims : { 
      ...dims, 
      width: dims.width / 2 
    };
    
    return (
      <QuarterlyChart
        data={data}
        industries={industries}
        isVolume={false}
        mode={mode}
        width={currentDims.width}
        height={currentDims.height}
        margin={currentDims.margin}
        isExpanded={isExpanded}
        colorOf={colorOf}
        showTotal={false}
        selectedIndustries={selectedIndustries}
      />
    );
  };

  // Expanded chart component
  const ExpandedChart = ({ data, mode, expandedChart, isExpanded, showTotal }) => {
    const isVolumeChart = expandedChart === 'volume';
    
    return isVolumeChart ? (
      <QuarterlyChart 
        data={data} 
        industries={industries}
        mode={mode} 
        isExpanded={isExpanded}
        isVolume={true}
        width={expandedDims.width}
        height={expandedDims.height}
        margin={expandedDims.margin}
        colorOf={colorOf}
        showTotal={showTotal}
        selectedIndustries={selectedIndustries}
      />
    ) : (
      <QuarterlyChart 
        data={data} 
        industries={industries}
        mode={mode} 
        isExpanded={isExpanded}
        isVolume={false}
        width={expandedDims.width}
        height={expandedDims.height}
        margin={expandedDims.margin}
        colorOf={colorOf}
        showTotal={showTotal}
        selectedIndustries={selectedIndustries}
      />
    );
  };

  // Handle export
  const handleExport = () => {
    console.log('Export quarterly chart');
    // TODO: Implement export functionality
  };

  return (
    <BaseExpandableChart
      title="Quarterly Analysis"
      data={chartData}
      ChartComponent={({ data, leftMode, rightMode, showTotal, onExpand }) => (
        <DualChartLayout
          volumeData={data}
          countData={data}
          VolumeChart={VolumeChart}
          CountChart={CountChart}
          volumeProps={{ mode: leftMode }}
          countProps={{ mode: rightMode }}
          onVolumeExpand={() => onExpand('volume')}
          onCountExpand={() => onExpand('count')}
          onVolumeExport={handleExport}
          onCountExport={handleExport}
        />
      )}
      ExpandedChartComponent={ExpandedChart}
      LegendComponent={() => <IndustryLegend industries={industries} colorOf={colorOf} />}
      isDualChart={true}
      supportsSingleMode={false}
      supportsTotal={true}
      initialLeftMode="line"
      initialRightMode="line"
      initialShowTotal={false}
      onExport={handleExport}
    />
  );
};

export default ExpandableQuarterlyAnalysisChart;