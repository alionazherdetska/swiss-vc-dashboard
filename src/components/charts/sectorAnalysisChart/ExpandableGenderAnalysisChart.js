import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Maximize2 } from 'lucide-react';
import ChartModal from '../../common/ChartModal';
import ChartLegend from '../sectorAnalysisChart/components/ChartLegend';
import {
  AXIS_STROKE,
  GRID_STROKE,
  ENHANCED_COLOR_PALETTE,
  CHART_MARGIN,
  EXPANDED_CHART_MARGIN,
} from '../../../lib/constants';
import { sanitizeKey, getChartDims, makeDistributedColorFn } from '../../../lib/utils';

const downloadIcon = process.env.PUBLIC_URL + '/download.svg';

// Gender color map
const GENDER_COLOR_MAP = {
  Male: '#3182CE',
  Female: '#E53E3E',
  Other: '#38A169',
};

/* -------------------------------
   D3 Chart Component
-------------------------------- */
const D3GenderChart = ({
  data,
  genders,
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
    if (!data || !data.length || !genders.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const adjustedMargin = {
      ...margin,
      bottom: isExpanded ? margin.bottom + 30 : margin.bottom + 20,
      left: margin.left + 10,
      right: margin.right + 10,
    };

    const chartWidth = width - adjustedMargin.left - adjustedMargin.right;
    const chartHeight = height - adjustedMargin.top - adjustedMargin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${adjustedMargin.left},${adjustedMargin.top})`);

    const metricSuffix = isVolume ? 'volume' : 'count';
    const totalKey = `__grandTotal${isVolume ? 'Volume' : 'Count'}`;

    // scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.year))
      .range([0, chartWidth])
      .padding(0.2);

    // Calculate max value considering both individual genders and total
    let maxValue = 0;
    if (mode === 'column') {
      // For stacked columns, max is the total
      maxValue = d3.max(data, (d) => d[totalKey]) || 0;
    } else {
      // For line charts, consider both individual gender values and total
      data.forEach((d) => {
        genders.forEach((g) => {
          maxValue = Math.max(maxValue, d[`${sanitizeKey(g)}__${metricSuffix}`] || 0);
        });
        if (showTotal) {
          maxValue = Math.max(maxValue, d[totalKey] || 0);
        }
      });
    }

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([chartHeight, 0]);

    // grid
    g.selectAll('.grid-line')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', GRID_STROKE)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.6);

    // axes
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
      .call(d3.axisLeft(yScale).ticks(10))
      .selectAll('text')
      .style('font-size', isExpanded ? '14px' : '12px')
      .style('fill', AXIS_STROKE);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - adjustedMargin.left)
      .attr('x', 0 - chartHeight / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', isExpanded ? '18px' : '12px')
      .style('fill', AXIS_STROKE)
      .text(isVolume ? 'Investment Volume CHF (M)' : 'Number of Deals');

    const tooltip = d3.select(tooltipRef.current);

    if (mode === 'column') {
      // stacked bar
      const stack = d3
        .stack()
        .keys(genders.map((g) => `${sanitizeKey(g)}__${metricSuffix}`));

      const stackedData = stack(data);

      g.selectAll('.gender-group')
        .data(stackedData)
        .enter()
        .append('g')
        .attr('fill', (d, i) => colorOf(genders[i]))
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
          let html = `<div class="bg-white p-3 border rounded-lg shadow-lg">
            <div class="font-semibold text-gray-800 mb-2">${year}</div>`;

          genders.forEach((g) => {
            const value = d.data[`${sanitizeKey(g)}__${metricSuffix}`] || 0;
            if (value > 0) {
              html += `
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 rounded" style="background:${colorOf(g)}"></div>
                  <span class="text-gray-700">${g}: <strong>${
                isVolume ? value.toFixed(1) + 'M CHF' : value
              }</strong></span>
                </div>`;
            }
          });

          if (showTotal) {
            const total = d.data[totalKey] || 0;
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

          const rect = d3.select(this);
          const barCenterX = +rect.attr('x') + xScale.bandwidth() / 2;
          const barTopY = +rect.attr('y');

          tooltip
            .style('opacity', 1)
            .html(html)
            .style('left', `${adjustedMargin.left + barCenterX}px`)
            .style('top', `${Math.max(adjustedMargin.top + barTopY - 48, 10)}px`);
        })
        .on('mouseout', () => tooltip.style('opacity', 0));
    } else {
      // line chart
      genders.forEach((gender) => {
        const lineData = data.map((d) => ({
          year: d.year,
          value: d[`${sanitizeKey(gender)}__${metricSuffix}`] || 0,
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
          .attr('stroke', colorOf(gender))
          .attr('stroke-width', isExpanded ? 3 : 2)
          .attr('d', line);

        // Add dots for each data point
        g.selectAll(`.dot-${sanitizeKey(gender)}`)
          .data(lineData)
          .enter()
          .append('circle')
          .attr('class', `dot-${sanitizeKey(gender)}`)
          .attr('cx', (d) => xScale(d.year) + xScale.bandwidth() / 2)
          .attr('cy', (d) => yScale(d.value))
          .attr('r', isExpanded ? 5 : 4)
          .attr('fill', colorOf(gender))
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

      // year overlays for tooltips (only for line chart)
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

          genders.forEach((g) => {
            const value = d[`${sanitizeKey(g)}__${metricSuffix}`] || 0;
            if (value > 0) {
              html += `
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 rounded" style="background:${colorOf(g)}"></div>
                  <span class="text-gray-700">${g}: <strong>${
                isVolume ? value.toFixed(1) + 'M CHF' : value
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

          // position above year center
          const x = adjustedMargin.left + xScale(d.year) + xScale.bandwidth() / 2;
          const y = adjustedMargin.top - 10;

          tooltip
            .style('opacity', 1)
            .html(html)
            .style('left', `${x}px`)
            .style('top', `${y}px`);
        })
        .on('mouseout', () => tooltip.style('opacity', 0));
    }
  }, [data, genders, isVolume, mode, width, height, margin, isExpanded, colorOf, showTotal]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height}></svg>
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity z-50"
      ></div>
    </div>
  );
};

/* -------------------------------
   Expandable Gender Analysis Chart
-------------------------------- */
const ExpandableGenderAnalysisChart = ({ deals }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedChart, setExpandedChart] = useState('volume');
  const [leftMode, setLeftMode] = useState('line');
  const [rightMode, setRightMode] = useState('line');
  const [showTotal, setShowTotal] = useState(false);
  const [expandedMode, setExpandedMode] = useState('line');
  const [expandedShowTotal, setExpandedShowTotal] = useState(true);

  // filter out deals without gender
  const filteredDeals = useMemo(
  () => deals.filter((d) => d['Gender CEO'] && d['Gender CEO'] !== 'Unknown' && Number(d.Year) < 2025),
  [deals]
);

  const years = useMemo(
    () => Array.from(new Set(filteredDeals.map((d) => Number(d.Year)))).sort((a, b) => a - b),
    [filteredDeals]
  );

  const genders = useMemo(
    () => Array.from(new Set(filteredDeals.map((d) => d['Gender CEO']))),
    [filteredDeals]
  );

  const rows = useMemo(() => {
    return years.map((year) => {
      const entry = { year };
      let totalCount = 0;
      let totalVolume = 0;
      genders.forEach((g) => {
        const dealsForGender = filteredDeals.filter(
          (d) => Number(d.Year) === year && d['Gender CEO'] === g
        );
        const count = dealsForGender.length;
        const volume = dealsForGender.reduce((sum, d) => sum + (d.VolumeMChf || 0), 0);
        entry[`${sanitizeKey(g)}__count`] = count;
        entry[`${sanitizeKey(g)}__volume`] = Math.round(volume * 10) / 10;
        totalCount += count;
        totalVolume += volume;
      });
      entry.__grandTotalCount = totalCount;
      entry.__grandTotalVolume = Math.round(totalVolume * 10) / 10;
      return entry;
    });
  }, [years, genders, filteredDeals]);

  const colorFn = makeDistributedColorFn(GENDER_COLOR_MAP, ENHANCED_COLOR_PALETTE);
  const colorOf = (g) => {
    if (g === 'Total') return '#000000';
    return colorFn(g, genders);
  };

  const dims = getChartDims(false, undefined, CHART_MARGIN);
  const expandedDims = getChartDims(true, 690, EXPANDED_CHART_MARGIN);

  const ChartContent = ({ chartType, mode, showTotalState, onModeChange }) => {
    const isVolumeChart = chartType === 'volume';
    const dimsToUse = chartType === expandedChart && isExpanded ? expandedDims : dims;
    const chartWidth =
      chartType === expandedChart && isExpanded
        ? dimsToUse.width || 800
        : (dimsToUse.width || 800) / 2 - 20;

    return (
      <div>
        {/* Only show header with buttons when not expanded */}
        {!(chartType === expandedChart && isExpanded) && (
          <div className="flex flex-col gap-2 mb-2 pl-4">
            <h3 className="text-md font-semibold text-gray-800">
              {isVolumeChart ? 'Investment Volume vs Year' : 'Number of Deals vs Year'}
            </h3>
            <div className='flex gap-2'>
              <button
                className={`p-2 rounded-md ${
                  isVolumeChart ? 'bg-blue-600' : 'bg-green-600'
                } text-white shadow-md hover:opacity-90`}
                title="Expand chart"
                onClick={() => {
                  setExpandedChart(chartType);
                  setIsExpanded(true);
                }}
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                className="h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200"
                title="Export chart"
              >
                Export
                <img src={downloadIcon} alt="Download" className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        <D3GenderChart
          data={rows}
          genders={genders}
          isVolume={isVolumeChart}
          mode={mode}
          width={chartWidth}
          height={dimsToUse.height}
          margin={dimsToUse.margin}
          isExpanded={chartType === expandedChart && isExpanded}
          colorOf={colorOf}
          showTotal={showTotalState}
        />
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-gray-700">Left (Volume):</span>
          <select
            value={leftMode}
            onChange={(e) => setLeftMode(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
          >
            <option value="line">Line</option>
            <option value="column">Column</option>
          </select>
          <span className="text-gray-700">Right (Count):</span>
          <select
            value={rightMode}
            onChange={(e) => setRightMode(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
          >
            <option value="line">Line</option>
            <option value="column">Column</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showTotal}
              onChange={(e) => setShowTotal(e.target.checked)}
              className="text-red-600 focus:ring-red-500"
            />
            <span className="text-gray-700">Show total</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartContent
          chartType="volume"
          mode={leftMode}
          showTotalState={showTotal}
          onModeChange={setLeftMode}
        />
        <ChartContent
          chartType="count"
          mode={rightMode}
          showTotalState={showTotal}
          onModeChange={setRightMode}
        />
      </div>

      <ChartLegend 
        items={showTotal ? [...genders, 'Total'] : genders} 
        colorOf={colorOf} 
        title="Genders" 
      />

      <ChartModal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={`Expanded ${expandedChart === 'volume' ? 'Investment Volume' : 'Deal Count'} Chart`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Chart Type:</span>
              <select
                value={expandedMode}
                onChange={(e) => setExpandedMode(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
              >
                <option value="line">Line</option>
                <option value="column">Column</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={expandedShowTotal}
                onChange={(e) => setExpandedShowTotal(e.target.checked)}
                className="text-red-600 focus:ring-red-500"
              />
              <span className="text-gray-700">Show total</span>
            </label>
          </div>
            <ChartLegend 
              items={expandedShowTotal ? [...genders, 'Total'] : genders} 
              colorOf={colorOf} 
              title="Legend" 
            />
          <ChartContent
            chartType={expandedChart}
            mode={expandedMode}
            showTotalState={expandedShowTotal}
            onModeChange={setExpandedMode}
          />
        </div>
      </ChartModal>
    </>
  );
};

export default ExpandableGenderAnalysisChart;