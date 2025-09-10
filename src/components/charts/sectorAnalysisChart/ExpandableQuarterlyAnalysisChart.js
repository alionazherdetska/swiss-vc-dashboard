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

// D3 Multi-Series Chart Component
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

    // Adjust margin for rotated labels
    const adjustedMargin = {
      ...margin,
      bottom: isExpanded ? margin.bottom + 20 : margin.bottom + 15
    };

    const chartWidth = width - adjustedMargin.left - adjustedMargin.right;
    const chartHeight = height - adjustedMargin.top - adjustedMargin.bottom;

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${adjustedMargin.left},${adjustedMargin.top})`);

    // Filter industries based on selection
    const visibleIndustries = selectedIndustries.length > 0 ? selectedIndustries : industries;
    const metricSuffix = isVolume ? 'volume' : 'count';

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.year))
      .range([0, chartWidth])
      .padding(0.1);

    // Calculate max value for scale
    let maxValue = 0;
    if (mode === 'column') {
      // For stacked columns, use total values
      maxValue = d3.max(data, d => d[`total${isVolume ? 'Volume' : 'Count'}`]) || 0;
    } else {
      // For lines, find max individual industry value
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

    // Grid lines
    const yTicks = yScale.ticks(5);
    g.selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', GRID_STROKE)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.6);

    // X axis
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

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .style('font-size', isExpanded ? '14px' : '12px')
      .style('fill', AXIS_STROKE);

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - adjustedMargin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', isExpanded ? '18px' : '12px')
      .style('fill', AXIS_STROKE)
      .text(isVolume ? 'Investment Volume CHF (M)' : 'Number of Deals');

    // Tooltip
    const tooltip = d3.select(tooltipRef.current);

    if (mode === 'column') {
      // Stacked bar chart
      const stack = d3.stack()
        .keys(visibleIndustries.map(ind => `${sanitizeKey(ind)}__${metricSuffix}`))
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const stackedData = stack(data);

      g.selectAll('.industry-group')
        .data(stackedData)
        .enter()
        .append('g')
        .attr('class', 'industry-group')
        .attr('fill', (d, i) => colorOf(visibleIndustries[i]))
        .selectAll('rect')
        .data(d => d)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.data.year))
        .attr('y', d => yScale(d[1]))
        .attr('height', d => yScale(d[0]) - yScale(d[1]))
        .attr('width', xScale.bandwidth())
        .attr('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          const industryIndex = stackedData.findIndex(series => series.includes(d));
          const industry = visibleIndustries[industryIndex];
          const value = d.data[`${sanitizeKey(industry)}__${metricSuffix}`];
          const roundedValue = isVolume ? Math.round(value * 10) / 10 : Math.round(value);
          
          // Get the SVG container position for relative positioning
          const svgRect = svgRef.current.getBoundingClientRect();
          const containerRect = svgRef.current.parentElement.getBoundingClientRect();
          
          // Calculate position relative to the chart container
          const x = event.clientX - containerRect.left;
          const y = event.clientY - containerRect.top;
          
          d3.select(this).attr('opacity', 0.8);
          tooltip.style('opacity', 1)
            .html(`<div class="bg-white p-3 border rounded-lg shadow-lg border-gray-300">
              <div class="font-semibold text-gray-800 mb-1">${d.data.year}</div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded" style="background-color: ${colorOf(industry)}"></div>
                <span class="text-gray-700">${industry}: <strong>${roundedValue}${isVolume ? 'M CHF' : ''}</strong></span>
              </div>
            </div>`)
            .style('left', Math.min(x + 15, width - 200) + 'px')
            .style('top', Math.max(y - 60, 10) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 1);
          tooltip.style('opacity', 0);
        });
    } else {
      // Line chart
      visibleIndustries.forEach(industry => {
        const lineData = data.map(d => ({
          year: d.year,
          value: d[`${sanitizeKey(industry)}__${metricSuffix}`] || 0
        })).filter(d => d.value > 0);

        if (lineData.length === 0) return;

        const line = d3.line()
          .x(d => xScale(d.year) + xScale.bandwidth() / 2)
          .y(d => yScale(d.value))
          .curve(d3.curveMonotoneX);

        // Draw line
        g.append('path')
          .datum(lineData)
          .attr('fill', 'none')
          .attr('stroke', colorOf(industry))
          .attr('stroke-width', isExpanded ? 3 : 2)
          .attr('d', line);

        // Draw points
        g.selectAll(`.dots-${sanitizeKey(industry)}`)
          .data(lineData)
          .enter()
          .append('circle')
          .attr('class', `dots-${sanitizeKey(industry)}`)
          .attr('cx', d => xScale(d.year) + xScale.bandwidth() / 2)
          .attr('cy', d => yScale(d.value))
          .attr('r', 4)
          .attr('fill', colorOf(industry))
          .attr('cursor', 'pointer')
          .on('mouseover', function(event, d) {
            // Get the SVG container position for relative positioning
            const svgRect = svgRef.current.getBoundingClientRect();
            const containerRect = svgRef.current.parentElement.getBoundingClientRect();
            
            // Calculate position relative to the chart container
            const x = event.clientX - containerRect.left;
            const y = event.clientY - containerRect.top;
            
            const roundedValue = isVolume ? Math.round(d.value * 10) / 10 : Math.round(d.value);
            
            d3.select(this).attr('r', 6);
            tooltip.style('opacity', 1)
              .html(`<div class="bg-white p-3 border rounded-lg shadow-lg border-gray-300">
                <div class="font-semibold text-gray-800 mb-1">${d.year}</div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded" style="background-color: ${colorOf(industry)}"></div>
                  <span class="text-gray-700">${industry}: <strong>${roundedValue}${isVolume ? 'M CHF' : ''}</strong></span>
                </div>
              </div>`)
              .style('left', Math.min(x + 15, width - 200) + 'px')
              .style('top', Math.max(y - 60, 10) + 'px');
          })
          .on('mouseout', function() {
            d3.select(this).attr('r', 4);
            tooltip.style('opacity', 0);
          });
      });

      // Show total line if enabled
      if (showTotal) {
        const totalData = data.map(d => ({
          year: d.year,
          value: d[`total${isVolume ? 'Volume' : 'Count'}`] || 0
        }));

        const totalLine = d3.line()
          .x(d => xScale(d.year) + xScale.bandwidth() / 2)
          .y(d => yScale(d.value))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(totalData)
          .attr('fill', 'none')
          .attr('stroke', '#000')
          .attr('stroke-width', isExpanded ? 4 : 3)
          .attr('stroke-dasharray', '5,5')
          .attr('d', totalLine);

        g.selectAll('.total-dots')
          .data(totalData)
          .enter()
          .append('circle')
          .attr('class', 'total-dots')
          .attr('cx', d => xScale(d.year) + xScale.bandwidth() / 2)
          .attr('cy', d => yScale(d.value))
          .attr('r', 5)
          .attr('fill', '#000')
          .attr('cursor', 'pointer')
          .on('mouseover', function(event, d) {
            // Get the SVG container position for relative positioning
            const svgRect = svgRef.current.getBoundingClientRect();
            const containerRect = svgRef.current.parentElement.getBoundingClientRect();
            
            // Calculate position relative to the chart container
            const x = event.clientX - containerRect.left;
            const y = event.clientY - containerRect.top;
            
            const roundedValue = isVolume ? Math.round(d.value * 10) / 10 : Math.round(d.value);
            
            d3.select(this).attr('r', 7);
            tooltip.style('opacity', 1)
              .html(`<div class="bg-white p-3 border rounded-lg shadow-lg border-gray-300">
                <div class="font-semibold text-gray-800 mb-1">${d.year}</div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded bg-black"></div>
                  <span class="text-gray-700">Total: <strong>${roundedValue}${isVolume ? 'M CHF' : ''}</strong></span>
                </div>
              </div>`)
              .style('left', Math.min(x + 15, width - 200) + 'px')
              .style('top', Math.max(y - 60, 10) + 'px');
          })
          .on('mouseout', function() {
            d3.select(this).attr('r', 5);
            tooltip.style('opacity', 0);
          });
      }

      // Add invisible overlay for comprehensive year tooltip in line mode
      g.selectAll('.year-overlay')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'year-overlay')
        .attr('x', d => xScale(d.year))
        .attr('width', xScale.bandwidth())
        .attr('y', 0)
        .attr('height', chartHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          // Get the SVG container position for relative positioning
          const svgRect = svgRef.current.getBoundingClientRect();
          const containerRect = svgRef.current.parentElement.getBoundingClientRect();
          
          // Calculate position relative to the chart container
          const x = event.clientX - containerRect.left;
          const y = event.clientY - containerRect.top;
          
          // Create comprehensive tooltip showing all industries for this year
          let tooltipContent = `<div class="bg-white p-3 border rounded-lg shadow-lg border-gray-300">
            <div class="font-semibold text-gray-800 mb-2">${d.year}</div>`;
          
          // Add each visible industry
          visibleIndustries.forEach(industry => {
            const value = d[`${sanitizeKey(industry)}__${metricSuffix}`] || 0;
            if (value > 0) {
              const roundedValue = isVolume ? Math.round(value * 10) / 10 : Math.round(value);
              tooltipContent += `<div class="flex items-center gap-2 mb-1">
                <div class="w-3 h-3 rounded" style="background-color: ${colorOf(industry)}"></div>
                <span class="text-gray-700 text-sm">${industry}: <strong>${roundedValue}${isVolume ? 'M CHF' : ''}</strong></span>
              </div>`;
            }
          });
          
          // Add total if enabled
          if (showTotal) {
            const totalValue = d[`__grandTotal${isVolume ? 'Volume' : 'Count'}`] || 0;
            const roundedTotal = isVolume ? Math.round(totalValue * 10) / 10 : Math.round(totalValue);
            tooltipContent += `<div class="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
              <div class="w-3 h-3 rounded bg-black"></div>
              <span class="text-gray-700 font-semibold">Total: <strong>${roundedTotal}${isVolume ? 'M CHF' : ''}</strong></span>
            </div>`;
          }
          
          tooltipContent += '</div>';
          
          tooltip.style('opacity', 1)
            .html(tooltipContent)
            .style('left', Math.min(x + 15, width - 250) + 'px')
            .style('top', Math.max(y - 80, 10) + 'px');
        })
        .on('mouseout', function() {
          tooltip.style('opacity', 0);
        });
    }

  }, [data, industries, isVolume, mode, width, height, margin, isExpanded, colorOf, showTotal, selectedIndustries]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height}></svg>
      <div ref={tooltipRef} className="absolute pointer-events-none opacity-0 transition-opacity z-50"></div>
    </div>
  );
};

/* ===========================
   ExpandableQuarterlyAnalysisChart
   =========================== */
const ExpandableQuarterlyAnalysisChart = ({
  deals,
  data,
  selectedIndustries = [],
  colorOf: externalColorOf,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedChart, setExpandedChart] = useState('volume'); // "volume" | "count"

  const [leftMode, setLeftMode] = useState('line');
  const [rightMode, setRightMode] = useState('line');
  const [showTotal, setShowTotal] = useState(false);

  const [expandedMode, setExpandedMode] = useState('line');
  const [expandedShowTotal, setExpandedShowTotal] = useState(true);

  const colorFn = makeDistributedColorFn(
    INDUSTRY_COLOR_MAP,
    ENHANCED_COLOR_PALETTE
  );

  /* Data source */
  const dealsSource = useMemo(() => {
    if (Array.isArray(deals)) return deals;
    if (Array.isArray(data)) return data;
    return [];
  }, [deals, data]);

  const { rows, industries, top5 } = useMemo(
    () => prepareQuarterlyRows(dealsSource),
    [dealsSource]
  );

  const colorOf =
    externalColorOf && externalColorOf.useExternal
      ? externalColorOf
      : (name) => colorFn(name, industries);

  /* ---------- Expanded (modal) content ---------- */
  const ExpandedChartContent = () => {
    const isVolumeChart = expandedChart === 'volume';
    const dims = getChartDims(true, 620, EXPANDED_CHART_MARGIN);

    return (
      <div className='space-y-4'>
        <div className='flex justify-center'>
          <ChartLegend industries={industries} colorOf={colorOf} />
        </div>

        <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-2'>
              <span className='text-gray-700'>Chart Type:</span>
              <select
                value={expandedMode}
                onChange={(e) => setExpandedMode(e.target.value)}
                className='px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700'
              >
                <option value='line'>Line</option>
                <option value='column'>Column</option>
              </select>
            </div>

            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={expandedShowTotal}
                onChange={(e) => setExpandedShowTotal(e.target.checked)}
                className='text-red-600 focus:ring-red-500'
              />
              <span className='text-gray-700'>Show total</span>
            </label>
          </div>

          <button
            className='h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors'
            style={{ minHeight: '40px' }}
            title='Export chart (print or save as PDF)'
          >
            Export
            <img src="/download.svg" alt="Download" className="h-5 w-5" />
          </button>
        </div>

        <D3MultiSeriesChart
          data={rows}
          industries={industries}
          isVolume={isVolumeChart}
          mode={expandedMode}
          width={dims.width || 800}
          height={dims.height}
          margin={dims.margin}
          isExpanded={true}
          colorOf={colorOf}
          showTotal={expandedShowTotal}
          selectedIndustries={selectedIndustries}
        />
      </div>
    );
  };

  /* ---------- Page charts (dual) ---------- */
  const ChartContent = ({
    isExpandedView = false,
    leftModeState,
    rightModeState,
    showTotalState,
    onLeftModeChange,
    onRightModeChange,
    onShowTotalChange,
  }) => {
    const dims = getChartDims(
      isExpandedView,
      undefined,
      isExpandedView ? EXPANDED_CHART_MARGIN : CHART_MARGIN
    );

    const chartWidth = dims.width ? dims.width / 2 - 20 : 400;

    return (
      <div className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-2'>
              <span className='text-gray-700'>Left (Volume):</span>
              <select
                value={leftModeState}
                onChange={(e) => onLeftModeChange(e.target.value)}
                className='px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700'
              >
                <option value='line'>Line</option>
                <option value='column'>Column</option>
              </select>
            </div>

            <div className='flex items-center gap-2'>
              <span className='text-gray-700'>Right (Count):</span>
              <select
                value={rightModeState}
                onChange={(e) => onRightModeChange(e.target.value)}
                className='px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700'
              >
                <option value='line'>Line</option>
                <option value='column'>Column</option>
              </select>
            </div>

            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={showTotalState}
                onChange={(e) => onShowTotalChange(e.target.checked)}
                className='text-red-600 focus:ring-red-500'
              />
              <span className='text-gray-700'>Show total</span>
            </label>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* LEFT: Volume */}
          <div className='space-y-2 relative'>
            <div className='flex items-center gap-2 mb-2'>
              <h3 className='text-md font-semibold text-gray-800'>
                Investment Volume vs Year
              </h3>
              {!isExpandedView && (
                <>
                  <button
                    onClick={() => {
                      setExpandedChart('volume');
                      setIsExpanded(true);
                    }}
                    className='p-2 rounded-md bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors'
                    title='Expand Volume Chart'
                  >
                    <Maximize2 className='h-5 w-5' />
                  </button>
                  <button
                    className='h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors'
                    style={{ minHeight: '40px' }}
                    title='Export chart (print or save as PDF)'
                  >
                    Export
                    <img src="/download.svg" alt="Download" className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <D3MultiSeriesChart
              data={rows}
              industries={industries}
              isVolume={true}
              mode={leftModeState}
              width={dims.width ? dims.width / 2 - 20 : 400}
              height={dims.height}
              margin={dims.margin}
              isExpanded={false}
              colorOf={colorOf}
              showTotal={showTotalState}
              selectedIndustries={selectedIndustries}
            />
          </div>

          {/* RIGHT: Count */}
          <div className='space-y-2 relative'>
            <div className='flex items-center gap-2 mb-2'>
              <h3 className='text-md font-semibold text-gray-800'>
                Number of Deals vs Year
              </h3>
              {!isExpandedView && (
                <>
                  <button
                    onClick={() => {
                      setExpandedChart('count');
                      setIsExpanded(true);
                    }}
                    className='p-2 rounded-md bg-green-600 text-white shadow-md hover:bg-green-700 transition-colors'
                    title='Expand Count Chart'
                  >
                    <Maximize2 className='h-5 w-5' />
                  </button>
                  <button
                    className="h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors"
                    style={{ minHeight: '40px' }}
                    title='Export chart (print or save as PDF)'
                  >
                    Export
                    <img src="/download.svg" alt="Download" className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <D3MultiSeriesChart
              data={rows}
              industries={industries}
              isVolume={false}
              mode={rightModeState}
              width={dims.width ? dims.width / 2 - 20 : 400}
              height={dims.height}
              margin={dims.margin}
              isExpanded={false}
              colorOf={colorOf}
              showTotal={showTotalState}
              selectedIndustries={selectedIndustries}
            />
          </div>
        </div>

        <div className='flex justify-center'>
          <ChartLegend industries={industries} colorOf={colorOf} />
        </div>
      </div>
    );
  };

  return (
    <>
      <ChartContent
        isExpandedView={false}
        leftModeState={leftMode}
        rightModeState={rightMode}
        showTotalState={showTotal}
        onLeftModeChange={setLeftMode}
        onRightModeChange={setRightMode}
        onShowTotalChange={setShowTotal}
      />
      <ChartModal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={`Expanded ${expandedChart === 'volume' ? 'Investment Volume' : 'Deal Count'} Chart`}
      >
        <ExpandedChartContent />
      </ChartModal>
    </>
  );
};

export default ExpandableQuarterlyAnalysisChart;