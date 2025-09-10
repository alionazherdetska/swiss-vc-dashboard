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
          const rect = svgRef.current.parentElement.getBoundingClientRect();
          tooltip
            .style('opacity', 1)
            .html(
              `<div class="bg-white p-3 border rounded-lg shadow-lg">
                <div class="font-semibold text-gray-800 mb-1">${d.year}</div>
                <div>${isVolume ? 'Exit Value' : 'Exit Count'}:
                  <strong>${d[dataKey]}${isVolume ? 'M CHF' : ''}</strong></div>
              </div>`
            )
            .style('left', `${event.clientX - rect.left + 15}px`)
            .style('top', `${event.clientY - rect.top - 40}px`);
        })
        .on('mouseout', function () {
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

      const line = d3
        .line()
        .x(xCenter)
        .y(d => yScale(d[dataKey]))
        .curve(d3.curveMonotoneX);

      g.append('path').datum(data).attr('fill', `url(#${gradientId})`).attr('d', area);
      g.append('path').datum(data).attr('fill', 'none').attr('stroke', EXIT_COLOR).attr('stroke-width', isExpanded ? 3 : 2).attr('d', line);

      // Dots
      g.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xCenter(d))
        .attr('cy', d => yScale(d[dataKey]))
        .attr('r', 4)
        .attr('fill', EXIT_COLOR);

      // Invisible overlay rects for tooltips
      g.selectAll('.hover-rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'hover-rect')
        .attr('x', d => xScale(d.year))
        .attr('width', xScale.bandwidth())
        .attr('y', 0)
        .attr('height', chartHeight)
        .attr('fill', 'transparent')
        .on('mouseover', function (event, d) {
          const rect = svgRef.current.parentElement.getBoundingClientRect();
          tooltip
            .style('opacity', 1)
            .html(
              `<div class="bg-white p-3 border rounded-lg shadow-lg">
                <div class="font-semibold text-gray-800 mb-1">${d.year}</div>
                <div>${isVolume ? 'Exit Value' : 'Exit Count'}:
                  <strong>${d[dataKey]}${isVolume ? 'M CHF' : ''}</strong></div>
              </div>`
            )
            .style('left', `${event.clientX - rect.left + 15}px`)
            .style('top', `${event.clientY - rect.top - 40}px`);
        })
        .on('mouseout', function () {
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
  }, [years, filteredExits]);

  const dims = getChartDims(false, undefined, CHART_MARGIN);
  const expandedDims = getChartDims(true, 720, EXPANDED_CHART_MARGIN);

  const pageGradId = useMemo(() => `exitsAreaGrad-page-${Math.random().toString(36).slice(2)}`, []);
  const modalGradId = useMemo(() => `exitsAreaGrad-modal-${Math.random().toString(36).slice(2)}`, []);

  return (
    <>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-gray-700">Chart Type:</span>
          <select
            value={chartMode}
            onChange={e => setChartMode(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
          >
            <option value="line">Line</option>
            <option value="column">Column</option>
          </select>
        </div>
        <button
          className="h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200"
          title="Export chart (print or save as PDF)"
        >
          Export
          <img src="/download.svg" alt="Download" className="h-5 w-5" />
        </button>
      </div>

      {/* Title + Expand */}
      <div className="flex items-center gap-2 mb-2 pl-4">
        <h3 className="text-md font-semibold text-gray-800">Number of Exits vs Year</h3>
        <button
          onClick={() => setIsExpanded(true)}
          className="p-2 rounded-md bg-green-600 text-white shadow-md hover:bg-green-700"
          title="Expand Count Chart"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
      </div>

      {/* Page chart */}
      <D3Chart
        data={rows}
        isVolume={false}
        mode={chartMode}
        width={dims.width}
        height={dims.height}
        margin={dims.margin}
        isExpanded={false}
        gradientId={pageGradId}
      />

      {/* Expanded modal */}
      <ChartModal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title="Expanded Exit Count Chart"
        controls={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-gray-700">Chart Type:</span>
              <select
                value={chartMode}
                onChange={e => setChartMode(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
              >
                <option value="line">Line</option>
                <option value="column">Column</option>
              </select>
            </div>
            <button
              className="h-9 px-3 flex items-center gap-2 text-sm font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200"
              title="Export chart (print or save as PDF)"
            >
              Export
              <img src="/download.svg" alt="Download" className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <div className="flex w-full justify-center">
          <D3Chart
            data={rows}
            isVolume={false}
            mode={chartMode}
            width={expandedDims.width}
            height={expandedDims.height}
            margin={expandedDims.margin}
            isExpanded={true}
            gradientId={modalGradId}
          />
        </div>
      </ChartModal>
    </>
  );
};

export default ExpandableExitsAnalysisChart;
