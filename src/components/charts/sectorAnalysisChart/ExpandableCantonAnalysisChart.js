import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Maximize2 } from 'lucide-react';
import ChartModal from '../../common/ChartModal';
import ChartLegend from './components/ChartLegend';
import { AXIS_STROKE, GRID_STROKE, ENHANCED_COLOR_PALETTE } from '../../../lib/constants';
import { sanitizeKey, getChartDims, normalizeCanton } from '../../../lib/utils';

const downloadIcon = process.env.PUBLIC_URL + '/download.svg';

/* ----------------------
   D3 Canton Chart
----------------------- */
const D3CantonChart = ({
  data,
  cantons,
  isVolume,
  mode,
  width,
  height,
  margin,
  isExpanded,
  colorOf,
  showTotal,
}) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data?.length || !cantons?.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const metricSuffix = isVolume ? '__volume' : '__count';
    const totalKey = isVolume ? '__grandTotalVolume' : '__grandTotalCount';

    // X scale
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.year))
      .range([0, chartWidth])
      .padding(0.1);

    // Y scale max
    let maxValue = 0;
    if (mode === 'column') {
      data.forEach((row) => {
        const total = cantons.reduce(
          (acc, c) => acc + (row[`${sanitizeKey(c)}${metricSuffix}`] || 0),
          0
        );
        maxValue = Math.max(maxValue, total);
      });
    } else {
      data.forEach((row) => {
        cantons.forEach((c) => {
          maxValue = Math.max(maxValue, row[`${sanitizeKey(c)}${metricSuffix}`] || 0);
        });
      });
      if (showTotal) {
        maxValue = Math.max(maxValue, d3.max(data, (d) => d[totalKey]) || 0);
      }
    }

    const yScale = d3.scaleLinear().domain([0, maxValue * 1.2]).range([chartHeight, 0]);

    // Grid
    g.selectAll('.grid-line')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
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
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .style('font-size', isExpanded ? '14px' : '12px')
      .style('fill', AXIS_STROKE);

    // Y label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - chartHeight / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', isExpanded ? '18px' : '12px')
      .style('fill', AXIS_STROKE)
      .text(isVolume ? 'Investment Volume CHF (M)' : 'Number of Deals');

    const tooltip = d3.select(tooltipRef.current);

    if (mode === 'column') {
      // Stacked columns
      const stack = d3.stack().keys(cantons.map((c) => `${sanitizeKey(c)}${metricSuffix}`));
      const stackedData = stack(data);

      g.selectAll('.canton-group')
        .data(stackedData)
        .enter()
        .append('g')
        .attr('fill', (_, i) => colorOf(cantons[i]))
        .selectAll('rect')
        .data((d) => d)
        .enter()
        .append('rect')
        .attr('x', (d) => xScale(d.data.year))
        .attr('y', (d) => yScale(d[1]))
        .attr('height', (d) => yScale(d[0]) - yScale(d[1]))
        .attr('width', xScale.bandwidth())
        .on('mouseover', function (event, d) {
          const year = d.data.year;

          // Build tooltip with only non-zero values
          let html = `<div class="bg-white p-3 border rounded-lg shadow-lg">
            <div class="font-semibold text-gray-800 mb-2">${year}</div>`;
          cantons.forEach((c) => {
            const v = d.data[`${sanitizeKey(c)}${metricSuffix}`] ?? 0;
            if (v > 0) {
              html += `
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 rounded" style="background:${colorOf(c)}"></div>
                  <span class="text-gray-700">${c}: <strong>${
                isVolume ? v.toFixed(1) + 'M CHF' : v
              }</strong></span>
                </div>`;
            }
          });
          html += `</div>`;

          const rect = d3.select(this);
          const barCenterX = +rect.attr('x') + xScale.bandwidth() / 2;
          const barTopY = +rect.attr('y');

          tooltip
            .style('opacity', 1)
            .html(html)
            .style('left', `${margin.left + barCenterX}px`)
            .style('top', `${Math.max(margin.top + barTopY - 48, 10)}px`);
        })
        .on('mouseout', () => tooltip.style('opacity', 0));
    } else {
      // Line chart
      cantons.forEach((c) => {
        const lineData = data.map((d) => ({
          year: d.year,
          value: d[`${sanitizeKey(c)}${metricSuffix}`] || 0,
        }));

        const line = d3
          .line()
          .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
          .y((d) => yScale(d.value))
          .curve(d3.curveMonotoneX);

        // Draw the line
        g.append('path')
          .datum(lineData)
          .attr('fill', 'none')
          .attr('stroke', colorOf(c))
          .attr('stroke-width', isExpanded ? 3 : 2)
          .attr('d', line);

        // Add dots for each data point
        g.selectAll(`.dot-${sanitizeKey(c)}`)
          .data(lineData)
          .enter()
          .append('circle')
          .attr('class', `dot-${sanitizeKey(c)}`)
          .attr('cx', (d) => xScale(d.year) + xScale.bandwidth() / 2)
          .attr('cy', (d) => yScale(d.value))
          .attr('r', isExpanded ? 5 : 4)
          .attr('fill', colorOf(c))
          .attr('stroke', '#ffffff')
          .attr('stroke-width', isExpanded ? 2 : 1.5);
      });

      // Add total line if showTotal is enabled
      if (showTotal) {
        const totalLineData = data.map((d) => ({
          year: d.year,
          value: d[totalKey] || 0,
        }));

        const totalLine = d3
          .line()
          .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
          .y((d) => yScale(d.value))
          .curve(d3.curveMonotoneX);

        // Draw the total line
        g.append('path')
          .datum(totalLineData)
          .attr('fill', 'none')
          .attr('stroke', '#000000')
          .attr('stroke-width', isExpanded ? 4 : 3)
          .attr('stroke-dasharray', '5,5')
          .attr('d', totalLine);

        // Add dots for total line
        g.selectAll('.dot-total')
          .data(totalLineData)
          .enter()
          .append('circle')
          .attr('class', 'dot-total')
          .attr('cx', (d) => xScale(d.year) + xScale.bandwidth() / 2)
          .attr('cy', (d) => yScale(d.value))
          .attr('r', isExpanded ? 6 : 5)
          .attr('fill', '#000000')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', isExpanded ? 2 : 1.5);
      }

      // Year overlays for combined tooltip
      g.selectAll('.year-overlay')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'year-overlay')
        .attr('x', (d) => xScale(d.year))
        .attr('width', xScale.bandwidth())
        .attr('y', 0)
        .attr('height', chartHeight)
        .attr('fill', 'transparent')
        .on('mouseover', function (event, d) {
          let html = `<div class="bg-white p-3 border rounded-lg shadow-lg">
            <div class="font-semibold text-gray-800 mb-2">${d.year}</div>`;
          cantons.forEach((c) => {
            const v = d[`${sanitizeKey(c)}${metricSuffix}`] ?? 0;
            if (v > 0) {
              html += `
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 rounded" style="background:${colorOf(c)}"></div>
                  <span class="text-gray-700">${c}: <strong>${
                isVolume ? v.toFixed(1) + 'M CHF' : v
              }</strong></span>
                </div>`;
            }
          });
          if (showTotal) {
            const total = d[totalKey] || 0;
            if (total > 0) {
              html += `
                <div class="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                  <div class="w-3 h-3 rounded bg-black"></div>
                  <span class="text-gray-700 font-semibold">Total: <strong>${
                isVolume ? total.toFixed(1) + 'M CHF' : total
              }</strong></span>
                </div>`;
            }
          }
          html += `</div>`;

          const centerX = margin.left + xScale(d.year) + xScale.bandwidth() / 2;
          const topY = margin.top + 12;

          tooltip
            .style('opacity', 1)
            .html(html)
            .style('left', `${centerX}px`)
            .style('top', `${Math.max(topY, 10)}px`);
        })
        .on('mouseout', () => tooltip.style('opacity', 0));
    }
  }, [data, cantons, isVolume, mode, width, height, margin, isExpanded, colorOf, showTotal]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height}></svg>
      <div ref={tooltipRef} className="absolute pointer-events-none opacity-0 z-50"></div>
    </div>
  );
};

/* ----------------------
   ExpandableCantonAnalysisChart
----------------------- */
const ExpandableCantonAnalysisChart = ({ deals }) => {
  const [expandedChart, setExpandedChart] = useState(null);
  const [leftMode, setLeftMode] = useState('line');
  const [rightMode, setRightMode] = useState('line');
  const [showTotal, setShowTotal] = useState(false);
  const [modalMode, setModalMode] = useState('line');
  const [modalShowTotal, setModalShowTotal] = useState(true);

  const cantons = useMemo(
    () =>
      Array.from(
        new Set(
          deals
            .map((d) => normalizeCanton(d.Canton))
            .filter((c) => c && c !== 'Unknown')
        )
      ),
    [deals]
  );

  const colorOf = (c) => {
    if (c === 'Total') return '#000000';
    return ENHANCED_COLOR_PALETTE[cantons.indexOf(c) % ENHANCED_COLOR_PALETTE.length];
  };

  // Rows by year
  const rows = useMemo(() => {
    const byYear = {};
    deals.forEach((d) => {
      const c = normalizeCanton(d.Canton);
      if (!c || c === 'Unknown' || !d.Year || d.Year >= 2025) return; // Filter out 2025 and beyond
      const year = d.Year;
      const key = sanitizeKey(c);
      if (!byYear[year]) byYear[year] = { year };
      byYear[year][`${key}__volume`] =
        (byYear[year][`${key}__volume`] || 0) + Number(d.VolumeMChf || 0);
      byYear[year][`${key}__count`] = (byYear[year][`${key}__count`] || 0) + 1;
      byYear[year]['__grandTotalVolume'] =
        (byYear[year]['__grandTotalVolume'] || 0) + Number(d.VolumeMChf || 0);
      byYear[year]['__grandTotalCount'] =
        (byYear[year]['__grandTotalCount'] || 0) + 1;
    });
    return Object.values(byYear).sort((a, b) => a.year - b.year);
  }, [deals]);

  const dims = getChartDims(false, undefined, CHART_MARGIN);
  const expandedDims = getChartDims(true, 650, EXPANDED_CHART_MARGIN);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded bg-gray-50">
        <span className="text-gray-700">Left (Volume):</span>
        <select
          value={leftMode}
          onChange={(e) => setLeftMode(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
        >
          <option value="line">Line</option>
          <option value="column">Column</option>
        </select>
        <span className="text-gray-700">Right (Count):</span>
        <select
          value={rightMode}
          onChange={(e) => setRightMode(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
        >
          <option value="line">Line</option>
          <option value="column">Column</option>
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showTotal}
            onChange={(e) => setShowTotal(e.target.checked)}
          />
          <span className="text-gray-700">Show total</span>
        </label>
      </div>

      {/* Dual charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Volume */}
        <div className="flex flex-col gap-2 mb-2 pl-4">
          <h3 className="text-md font-semibold text-gray-800">
            Investment Volume vs Year
          </h3>
          <div className='flex gap-2'>
            <button
              onClick={() => setExpandedChart('volume')}
              className="p-2 rounded-md bg-blue-600 text-white"
              title="Expand Volume Chart"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
            <button
              className="h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900"
              title="Export chart (print or save as PDF)"
            >
              Export <img src={downloadIcon} alt="Download" className="h-5 w-5" />
            </button>
          </div>
          <D3CantonChart
            data={rows}
            cantons={cantons}
            isVolume={true}
            mode={leftMode}
            width={dims.width / 2}
            height={dims.height}
            margin={dims.margin}
            isExpanded={false}
            colorOf={colorOf}
            showTotal={showTotal}
          />
        </div>

        {/* Count */}
        <div>
          <div className="flex flex-col start gap-2 mb-2">
            <h3 className="text-md font-semibold text-gray-800">
              Number of Deals vs Year
            </h3>
            <div className='flex gap-2'>
              <button
                onClick={() => setExpandedChart('count')}
                className="p-2 rounded-md bg-green-600 text-white"
                title="Expand Count Chart"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
              <button
                className="h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900"
                title="Export chart (print or save as PDF)"
              >
                Export <img src={downloadIcon} alt="Download" className="h-5 w-5" />
              </button>
            </div>
          </div>
          <D3CantonChart
            data={rows}
            cantons={cantons}
            isVolume={false}
            mode={rightMode}
            width={dims.width / 2}
            height={dims.height}
            margin={dims.margin}
            isExpanded={false}
            colorOf={colorOf}
            showTotal={showTotal}
          />
        </div>
      </div>

      <ChartLegend items={cantons} colorOf={colorOf} title="Cantons" />

      {/* Expanded modal */}
      <ChartModal
        isOpen={expandedChart !== null}
        onClose={() => setExpandedChart(null)}
        title={`Expanded ${
          expandedChart === 'volume' ? 'Investment Volume' : 'Deal Count'
        } Chart`}
      >
        {expandedChart && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-gray-700">Chart Type:</span>
              <select
                value={modalMode}
                onChange={(e) => setModalMode(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
              >
                <option value="line">Line</option>
                <option value="column">Column</option>
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modalShowTotal}
                  onChange={(e) => setModalShowTotal(e.target.checked)}
                />
                <span className="text-gray-700">Show total</span>
              </label>
            </div>
          <ChartLegend 
            items={modalShowTotal ? [...cantons, 'Total'] : cantons} 
            colorOf={colorOf} 
            title="Legend" 
          />
            <D3CantonChart
              data={rows}
              cantons={cantons}
              isVolume={expandedChart === 'volume'}
              mode={modalMode}
              width={expandedDims.width}
              height={expandedDims.height}
              margin={expandedDims.margin}
              isExpanded={true}
              colorOf={colorOf}
              showTotal={modalShowTotal}
            />
          </>
        )}
      </ChartModal>
    </div>
  );
};

export default ExpandableCantonAnalysisChart;