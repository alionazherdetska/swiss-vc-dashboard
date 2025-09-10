import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Maximize2 } from 'lucide-react';
import ChartModal from '../../common/ChartModal';

import ChartLegend from './components/ChartLegend';

import prepareQuarterlyRows from './helpers/PrepareQuarterlyRows';

import {
  CHART_MARGIN,
  EXPANDED_CHART_MARGIN,
  INDUSTRY_COLOR_MAP,
  ENHANCED_COLOR_PALETTE,
  AXIS_STROKE,
  GRID_STROKE,
} from '../../../lib/constants';

import {
  sanitizeKey,
  getChartDims,
  makeDistributedColorFn,
} from '../../../lib/utils';

/* -------------------- D3MultiSeriesChart -------------------- */
const D3MultiSeriesChart = ({ 
  data, 
  industries, 
  isVolume, 
  mode, 
  width, 
  height, 
  margin, 
  isExpanded, 
  colorOf, 
  showTotal,
  selectedIndustries = []
}) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || !industries || industries.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const adjustedMargin = {
      ...margin,
      bottom: isExpanded ? margin.bottom + 20 : margin.bottom + 15
    };

    const chartWidth = width - adjustedMargin.left - adjustedMargin.right;
    const chartHeight = height - adjustedMargin.top - adjustedMargin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${adjustedMargin.left},${adjustedMargin.top})`);

    const visibleIndustries = selectedIndustries.length > 0 ? selectedIndustries : industries;
    const metricSuffix = isVolume ? 'volume' : 'count';

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.year))
      .range([0, chartWidth])
      .padding(0.1);

    // Y max
    let maxValue = 0;
    if (mode === 'column') {
      maxValue = d3.max(data, d => d[`total${isVolume ? 'Volume' : 'Count'}`]) || 0;
    } else {
      for (const row of data) {
        for (const industry of visibleIndustries) {
          const value = row[`${sanitizeKey(industry)}__${metricSuffix}`] || 0;
          if (value > maxValue) maxValue = value;
        }
      }
      if (showTotal) {
        const totalMax = d3.max(data, d => d[`total${isVolume ? 'Volume' : 'Count'}`]) || 0;
        maxValue = Math.max(maxValue, totalMax);
      }
    }

    const yScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([chartHeight, 0]);

    // Grid
    g.selectAll('.grid-line')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', GRID_STROKE)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.6);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', isExpanded ? '14px' : '12px')
      .style('fill', AXIS_STROKE)
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .style('font-size', isExpanded ? '14px' : '12px')
      .style('fill', AXIS_STROKE);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - adjustedMargin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', isExpanded ? '18px' : '12px')
      .style('fill', AXIS_STROKE)
      .text(isVolume ? 'Investment Volume CHF (M)' : 'Number of Deals');

    const tooltip = d3.select(tooltipRef.current);

    /* ----- column or line chart drawing omitted for brevity (unchanged) ----- */
    // (keep your column, line, points, and tooltip logic exactly as is)
  }, [data, industries, isVolume, mode, width, height, margin, isExpanded, colorOf, showTotal, selectedIndustries]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height}></svg>
      <div ref={tooltipRef} className="absolute pointer-events-none opacity-0 transition-opacity z-50"></div>
    </div>
  );
};

/* -------------------- ExpandableQuarterlyAnalysisChart -------------------- */
const ExpandableQuarterlyAnalysisChart = ({
  deals,
  data,
  selectedIndustries = [],
  colorOf: externalColorOf,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedChart, setExpandedChart] = useState('volume');
  const [leftMode, setLeftMode] = useState('line');
  const [rightMode, setRightMode] = useState('line');
  const [showTotal, setShowTotal] = useState(false);
  const [expandedMode, setExpandedMode] = useState('line');
  const [expandedShowTotal, setExpandedShowTotal] = useState(true);

  const colorFn = makeDistributedColorFn(INDUSTRY_COLOR_MAP, ENHANCED_COLOR_PALETTE);

  const dealsSource = useMemo(() => {
    if (Array.isArray(deals)) return deals;
    if (Array.isArray(data)) return data;
    return [];
  }, [deals, data]);

  const { rows, industries } = useMemo(() => prepareQuarterlyRows(dealsSource), [dealsSource]);

  const colorOf =
    externalColorOf && externalColorOf.useExternal
      ? externalColorOf
      : (name) => colorFn(name, industries);

  /* ---------- Page charts ---------- */
  const ChartContent = () => {
    const dims = getChartDims(false, undefined, CHART_MARGIN);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT: Volume */}
          <div className="space-y-2 relative">
            <div className="flex gap-2 mb-2 pl-4 items-center">
              <h3 className="text-md font-semibold text-gray-800">Investment Volume vs Year</h3>
              <button
                onClick={() => { setExpandedChart('volume'); setIsExpanded(true); }}
                className="p-2 rounded-md bg-blue-600 text-white shadow-md hover:bg-blue-700"
                title="Expand Volume Chart"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
            <D3MultiSeriesChart
              data={rows}
              industries={industries}
              isVolume={true}
              mode={leftMode}
              width={dims.width ? dims.width / 2 - 20 : 400}
              height={dims.height}
              margin={dims.margin}
              isExpanded={false}
              colorOf={colorOf}
              showTotal={showTotal}
              selectedIndustries={selectedIndustries}
            />
          </div>

          {/* RIGHT: Count */}
          <div className="space-y-2 relative">
            <div className="flex gap-2 mb-2 pl-4 items-center">
              <h3 className="text-md font-semibold text-gray-800">Number of Deals vs Year</h3>
              <button
                onClick={() => { setExpandedChart('count'); setIsExpanded(true); }}
                className="p-2 rounded-md bg-green-600 text-white shadow-md hover:bg-green-700"
                title="Expand Count Chart"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
            <D3MultiSeriesChart
              data={rows}
              industries={industries}
              isVolume={false}
              mode={rightMode}
              width={dims.width ? dims.width / 2 - 20 : 400}
              height={dims.height}
              margin={dims.margin}
              isExpanded={false}
              colorOf={colorOf}
              showTotal={showTotal}
              selectedIndustries={selectedIndustries}
            />
          </div>
        </div>
        <div className="flex justify-center">
          <ChartLegend industries={industries} colorOf={colorOf} />
        </div>
      </div>
    );
  };

  return (
    <>
      <ChartContent />
      <ChartModal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={`Expanded ${expandedChart === 'volume' ? 'Investment Volume' : 'Deal Count'} Chart`}
      >
        {/* Expanded content (unchanged) */}
      </ChartModal>
    </>
  );
};

export default ExpandableQuarterlyAnalysisChart;
