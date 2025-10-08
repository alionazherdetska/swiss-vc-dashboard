import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Maximize2 } from 'lucide-react';
import ChartModal from '../../common/ChartModal';
import {
  CHART_MARGIN,
  EXPANDED_CHART_MARGIN,
  AXIS_STROKE,
  GRID_STROKE,
} from '../../../lib/constants';
import { getChartDims } from '../../../lib/utils';
import { getChartDims } from '../../../lib/utils';

const EXIT_COLOR = '#E53E3E';
const HOVER_COLOR = '#C53030';

/* ===========================
   D3 Chart for Exits
   =========================== */
const D3Chart = ({ data, isVolume, mode, width, height, margin, isExpanded, gradientId }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const adjustedMargin = {
      ...margin,
      bottom: isExpanded ? margin.bottom + 20 : margin.bottom + 15,
    };

    const chartWidth = width - adjustedMargin.left - adjustedMargin.right;
    const chartHeight = height - adjustedMargin.top - adjustedMargin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${adjustedMargin.left},${adjustedMargin.top})`);

    const dataKey = isVolume ? 'exits__volume' : 'exits__count';

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map(d => d.year))
      .range([0, chartWidth])
      .padding(0.1);

    const maxValue = d3.max(data, d => d[dataKey]) || 0;
    const yMaxRounded = Math.max(10, Math.ceil(maxValue / 10) * 10);
    const yScale = d3.scaleLinear().domain([0, yMaxRounded]).range([chartHeight, 0]);
    const tickValues = d3.range(0, yMaxRounded + 1, 10);

    // Grid
    g.selectAll('.grid-line')
      .data(tickValues)
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
      .call(d3.axisLeft(yScale).tickValues(tickValues))
      .selectAll('text')
      .style('font-size', isExpanded ? '14px' : '12px')
      .style('fill', AXIS_STROKE);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - adjustedMargin.left)
      .attr('x', 0 - chartHeight / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', isExpanded ? '16px' : '12px')
      .style('fill', AXIS_STROKE)
      .text(isVolume ? 'Exit Value CHF (M)' : 'Number of Exits');

    // Tooltip
    const tooltip = d3.select(tooltipRef.current);

    if (mode === 'column') {
      // Bars
      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.year))
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(d[dataKey]))
        .attr('height', d => chartHeight - yScale(d[dataKey]))
        .attr('fill', EXIT_COLOR)
        .on('mouseover', function (event, d) {
          d3.select(this).attr('fill', HOVER_COLOR);
          
          // Get the SVG container position for relative positioning
          const containerRect = svgRef.current.parentElement.getBoundingClientRect();
          
          // Calculate position relative to the chart container
          const x = event.clientX - containerRect.left;
          const y = event.clientY - containerRect.top;
          
          tooltip.style('opacity', 1)
            .html(`<div class="bg-white p-3 border rounded-lg shadow-lg border-gray-300">
              <div class="font-semibold text-gray-800 mb-1">${d.year}</div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded" style="background-color: ${EXIT_COLOR}"></div>
                <span class="text-gray-700">${isVolume ? 'Exit Value' : 'Exit Count'}: <strong>${d[dataKey]}${isVolume ? 'M CHF' : ''}</strong></span>
              </div>
            </div>`)
            .style('left', Math.min(x + 15, width - 200) + 'px')
            .style('top', Math.max(y - 60, 10) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this).attr('fill', EXIT_COLOR);
          tooltip.style('opacity', 0);
        });
    } else {
      // Line + area
      const defs = svg.append('defs');
      const grad = defs
        .append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', 1);

      grad.append('stop').attr('offset', '0%').attr('stop-color', EXIT_COLOR).attr('stop-opacity', 0.28);
      grad.append('stop').attr('offset', '100%').attr('stop-color', EXIT_COLOR).attr('stop-opacity', 0.05);

      const xCenter = d => xScale(d.year) + xScale.bandwidth() / 2;

      const area = d3
        .area()
        .x(xCenter)
        .y0(chartHeight)
        .y1(d => yScale(d[dataKey]))
        .curve(d3.curveMonotoneX);

      // Add gradient definition
      const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', 'areaGradient')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', 0).attr('y2', chartHeight);

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', EXIT_COLOR)
        .attr('stop-opacity', 0.3);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', EXIT_COLOR)
        .attr('stop-opacity', 0.05);

      // Add area fill
      g.append('path')
        .datum(data)
        .attr('fill', 'url(#areaGradient)')
        .attr('d', area);

      // Add line
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', EXIT_COLOR)
        .attr('stroke-width', isExpanded ? 3 : 2)
        .attr('d', line);

      // Add invisible overlay for area hover detection
      g.selectAll('.area-hover')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'area-hover')
        .attr('x', d => xScale(d.year))
        .attr('width', xScale.bandwidth())
        .attr('y', 0)
        .attr('height', chartHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          // Get the SVG container position for relative positioning
          const containerRect = svgRef.current.parentElement.getBoundingClientRect();
          
          // Calculate position relative to the chart container
          const x = event.clientX - containerRect.left;
          const y = event.clientY - containerRect.top;
          
          tooltip.style('opacity', 1)
            .html(`<div class="bg-white p-3 border rounded-lg shadow-lg border-gray-300">
              <div class="font-semibold text-gray-800 mb-1">${d.year}</div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded" style="background-color: ${EXIT_COLOR}"></div>
                <span class="text-gray-700">${isVolume ? 'Exit Value' : 'Exit Count'}: <strong>${d[dataKey]}${isVolume ? 'M CHF' : ''}</strong></span>
              </div>
            </div>`)
            .style('left', Math.min(x + 15, width - 200) + 'px')
            .style('top', Math.max(y - 60, 10) + 'px');
        })
        .on('mouseout', function() {
          tooltip.style('opacity', 0);
        });

      // Data points
      g.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.year) + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d[dataKey]))
        .attr('r', 4)
        .attr('fill', EXIT_COLOR)
        .attr('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', 6).attr('fill', HOVER_COLOR);
          
          // Get the SVG container position for relative positioning
          const containerRect = svgRef.current.parentElement.getBoundingClientRect();
          
          // Calculate position relative to the chart container
          const x = event.clientX - containerRect.left;
          const y = event.clientY - containerRect.top;
          
          tooltip.style('opacity', 1)
            .html(`<div class="bg-white p-3 border rounded-lg shadow-lg border-gray-300">
              <div class="font-semibold text-gray-800 mb-1">${d.year}</div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded" style="background-color: ${EXIT_COLOR}"></div>
                <span class="text-gray-700">${isVolume ? 'Exit Value' : 'Exit Count'}: <strong>${d[dataKey]}${isVolume ? 'M CHF' : ''}</strong></span>
              </div>
            </div>`)
            .style('left', Math.min(x + 15, width - 200) + 'px')
            .style('top', Math.max(y - 60, 10) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 4).attr('fill', EXIT_COLOR);
          tooltip.style('opacity', 0);
        });
    }
  }, [data, isVolume, mode, width, height, margin, isExpanded, gradientId]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height}></svg>
      <div ref={tooltipRef} className="absolute pointer-events-none opacity-0"></div>
    </div>
  );
};

/* ===========================
   ExpandableExitsAnalysisChart
   =========================== */
const ExpandableExitsAnalysisChart = ({ exits }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chartMode, setChartMode] = useState('line');

const filteredExits = useMemo(() => 
    exits.filter(e => e.Year && Number(e.Year) < 2025), 
    [exits]
  );
  const years = useMemo(
    () => Array.from(new Set(filteredExits.map(e => Number(e.Year)))).sort((a, b) => a - b),
    [filteredExits]
  );

  const rows = useMemo(() => {
    return years.map(year => {
      const items = filteredExits.filter(e => Number(e.Year) === year);
      const count = items.length;
      const volume = items.reduce((sum, e) => sum + (e.VolumeMChf || 0), 0);
      return {
        year,
        exits__count: count,
        exits__volume: Math.round(volume * 10) / 10,
      };
    });
    console.log('ExpandableExitsAnalysisChart - Chart rows:', result); // Debug log
    console.log('ExpandableExitsAnalysisChart - Total exits for all years:', result.reduce((sum, r) => sum + r.exits__count, 0)); // Debug log
    return result;
  }, [visibleYears, filteredExits]);

  // Expanded modal chart (only count chart)
  const ExpandedChartContent = () => {
    const dims = getChartDims(true, 720, EXPANDED_CHART_MARGIN);
    
    return (
      <div className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50'>
          <div className='flex flex-wrap items-center gap-4'>
            <span className='text-gray-700'>Chart Type:</span>
            <select
              value={chartMode}
              onChange={e => setChartMode(e.target.value)}
              className='px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700'
            >
              <option value='line'>Line</option>
              <option value='column'>Column</option>
            </select>
          </div>
          <button
            className='h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors'
            style={{ minHeight: '40px' }}
            title='Export chart (print or save as PDF)'
          >
            Export
            <img src='/download.svg' alt='Download' className='h-5 w-5' />
          </button>
        </div>
        <D3Chart
          data={rows}
          isVolume={false}
          mode={chartMode}
          width={dims.width || 800}
          height={dims.height}
          margin={dims.margin}
          isExpanded={true}
        />
      </div>
    );
  };

  // Single chart (page view) - Only Number of Exits
  const ChartContent = () => {
    const dims = getChartDims(false, undefined, CHART_MARGIN);
    const chartWidth = dims.width || 800;
    
    return (
      <div className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50'>
          <div className='flex flex-wrap items-center gap-4'>
            <span className='text-gray-700'>Chart Type:</span>
            <select
              value={rightMode}
              onChange={e => setRightMode(e.target.value)}
              className='px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700'
            >
              <option value='line'>Line</option>
              <option value='column'>Column</option>
            </select>
          </div>
        </div>
        <div className='space-y-2 relative'>
          <div className='flex items-center gap-2 mb-2'>
            <h3 className='text-md font-semibold text-gray-800'>Number of Exits vs Year</h3>
            <button
              onClick={() => setIsExpanded(true)}
              className='p-2 rounded-md bg-green-600 text-white shadow-md hover:bg-green-700 transition-colors'
              title='Expand Count Chart'
            >
              <Maximize2 className='h-5 w-5' />
            </button>
            <button
              className='h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors'
              style={{ minHeight: '40px' }}
              title='Export chart (print or save as PDF)'
            >
              Export
              <img src='/download.svg' alt='Download' className='h-5 w-5' />
            </button>
          </div>
          <D3Chart
            data={rows}
            isVolume={false}
            mode={rightMode}
            width={chartWidth}
            height={dims.height}
            margin={dims.margin}
            isExpanded={false}
          />
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
        title="Expanded Exit Count Chart"
      >
        <ExpandedChartContent />
      </ChartModal>
    </>
  );
};

export default ExpandableExitsAnalysisChart;
