import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Maximize2 } from 'lucide-react';
import ChartModal from '../../common/ChartModal';
import ChartLegend from './components/ChartLegend';
import { AXIS_STROKE, GRID_STROKE, ENHANCED_COLOR_PALETTE, CHART_MARGIN, EXPANDED_CHART_MARGIN } from '../../../lib/constants';
import { sanitizeKey, getChartDims, normalizeCanton } from '../../../lib/utils';
const downloadIcon = process.env.PUBLIC_URL + '/download.svg';

const ExpandableCantonAnalysisChart = ({ deals, selectedCantonCount, totalCantonCount }) => {
    const [expandedChart, setExpandedChart] = useState(null); // 'volume' | 'count' | null
    const [leftMode, setLeftMode] = useState('line');
    const [rightMode, setRightMode] = useState('line');
    const [showTotal, setShowTotal] = useState(false);
    const [modalMode, setModalMode] = useState('line');
    const [modalShowTotal, setModalShowTotal] = useState(true);

    // Normalize canton names and group deals
    const normalizedDeals = useMemo(() => deals.map(d => ({ ...d, Canton: normalizeCanton(d.Canton) || 'Unknown' })), [deals]);
    const cantons = useMemo(() => {
        return Array.from(new Set(normalizedDeals.map(d => d.Canton).filter(c => c && c !== 'Unknown')));
    }, [normalizedDeals]);

    // Color palette for cantons
    const colorOf = canton => ENHANCED_COLOR_PALETTE[cantons.indexOf(canton) % ENHANCED_COLOR_PALETTE.length];

    // D3 Canton Chart Component
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
        showTotal
    }) => {
        const svgRef = useRef();
        const tooltipRef = useRef();

        useEffect(() => {
            if (!data || data.length === 0 || !cantons || cantons.length === 0) return;

            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();

    // Adjust margin for rotated labels and better spacing
    const adjustedMargin = {
      ...margin,
      bottom: isExpanded ? margin.bottom + 30 : margin.bottom + 25,
      left: isExpanded ? margin.left + 20 : margin.left + 10,
      right: isExpanded ? margin.right + 20 : margin.right + 10
    };

    const chartWidth = width - adjustedMargin.left - adjustedMargin.right;
    const chartHeight = height - adjustedMargin.top - adjustedMargin.bottom;

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${adjustedMargin.left},${adjustedMargin.top})`);            const metricSuffix = isVolume ? 'volume' : 'count';

            // Scales
            const xScale = d3.scaleBand()
                .domain(data.map(d => d.year))
                .range([0, chartWidth])
                .padding(0.2);

            // Calculate max value for scale
            let maxValue = 0;
            
            if (mode === 'column') {
                // For stacked columns, find the maximum total for any year
                for (const row of data) {
                    let yearTotal = 0;
                    for (const canton of cantons) {
                        const value = row[`${sanitizeKey(canton)}__${metricSuffix}`] || 0;
                        yearTotal += value;
                    }
                    if (yearTotal > maxValue) maxValue = yearTotal;
                }
            } else {
                // For lines, find max individual canton value
                for (const row of data) {
                    for (const canton of cantons) {
                        const value = row[`${sanitizeKey(canton)}__${metricSuffix}`] || 0;
                        if (value > maxValue) maxValue = value;
                    }
                }
                
                // Only include total line if it's shown and in line mode
                if (showTotal) {
                    const totalMax = d3.max(data, d => d[`__grandTotal${isVolume ? 'Volume' : 'Count'}`]) || 0;
                    maxValue = Math.max(maxValue, totalMax);
                }
            }

            const yScale = d3.scaleLinear()
                .domain([0, maxValue * 1.2])
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
                .style('font-size', isExpanded ? '14px' : '12px')
                .style('fill', AXIS_STROKE)
                .text(isVolume ? 'Investment Volume CHF (M)' : 'Number of Deals');

            // Tooltip
            const tooltip = d3.select(tooltipRef.current);

            if (mode === 'column') {
                // Stacked bar chart
                const stack = d3.stack()
                    .keys(cantons.map(canton => `${sanitizeKey(canton)}__${metricSuffix}`))
                    .order(d3.stackOrderNone)
                    .offset(d3.stackOffsetNone);

                const stackedData = stack(data);

                g.selectAll('.canton-group')
                    .data(stackedData)
                    .enter()
                    .append('g')
                    .attr('class', 'canton-group')
                    .attr('fill', (d, i) => colorOf(cantons[i]))
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
                        const cantonIndex = stackedData.findIndex(series => series.includes(d));
                        const canton = cantons[cantonIndex];
                        const value = d.data[`${sanitizeKey(canton)}__${metricSuffix}`];
                        
                        d3.select(this).attr('opacity', 0.8);
                        tooltip.style('opacity', 1)
                            .html(`<div class="bg-white p-3 border rounded-lg shadow-lg border-gray-300">
                                <div class="font-semibold text-gray-800 mb-1">${d.data.year}</div>
                                <div class="flex items-center gap-2">
                                    <div class="w-3 h-3 rounded" style="background-color: ${colorOf(canton)}"></div>
                                    <span class="text-gray-700">${canton}: <strong>${Math.round(value * 100) / 100}${isVolume ? 'M CHF' : ''}</strong></span>
                                </div>
                            </div>`)
                            .style('left', (event.pageX + 15) + 'px')
                            .style('top', (event.pageY - 15) + 'px');
                    })
                    .on('mouseout', function() {
                        d3.select(this).attr('opacity', 1);
                        tooltip.style('opacity', 0);
                    });
            } else {
                // Line chart
                cantons.forEach(canton => {
                    const lineData = data.map(d => ({
                        year: d.year,
                        value: d[`${sanitizeKey(canton)}__${metricSuffix}`] || 0
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
                        .attr('stroke', colorOf(canton))
                        .attr('stroke-width', isExpanded ? 3 : 2)
                        .attr('d', line);

                    // Draw points
                    g.selectAll(`.dots-${sanitizeKey(canton)}`)
                        .data(lineData)
                        .enter()
                        .append('circle')
                        .attr('class', `dots-${sanitizeKey(canton)}`)
                        .attr('cx', d => xScale(d.year) + xScale.bandwidth() / 2)
                        .attr('cy', d => yScale(d.value))
                        .attr('r', 4)
                        .attr('fill', colorOf(canton))
                        .attr('cursor', 'pointer')
                        .on('mouseover', function(event, d) {
                            d3.select(this).attr('r', 6);
                            tooltip.style('opacity', 1)
                                .html(`<div class="bg-white p-3 border rounded-lg shadow-lg border-gray-300">
                                    <div class="font-semibold text-gray-800 mb-1">${d.year}</div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-3 h-3 rounded" style="background-color: ${colorOf(canton)}"></div>
                                        <span class="text-gray-700">${canton}: <strong>${Math.round(d.value * 100) / 100}${isVolume ? 'M CHF' : ''}</strong></span>
                                    </div>
                                </div>`)
                                .style('left', (event.pageX + 15) + 'px')
                                .style('top', (event.pageY - 15) + 'px');
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
                        value: d[`__grandTotal${isVolume ? 'Volume' : 'Count'}`] || 0
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
                            d3.select(this).attr('r', 7);
                            tooltip.style('opacity', 1)
                                .html(`<div class="bg-white p-3 border rounded-lg shadow-lg border-gray-300">
                                    <div class="font-semibold text-gray-800 mb-1">${d.year}</div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-3 h-3 rounded bg-black"></div>
                                        <span class="text-gray-700">Total: <strong>${Math.round(d.value * 100) / 100}${isVolume ? 'M CHF' : ''}</strong></span>
                                    </div>
                                </div>`)
                                .style('left', (event.pageX + 15) + 'px')
                                .style('top', (event.pageY - 15) + 'px');
                        })
                        .on('mouseout', function() {
                            d3.select(this).attr('r', 5);
                            tooltip.style('opacity', 0);
                        });
                }
            }

        }, [data, cantons, isVolume, mode, width, height, margin, isExpanded, colorOf, showTotal]);

        return (
            <div className="relative">
                <svg ref={svgRef} width={width} height={height}></svg>
                <div ref={tooltipRef} className="absolute pointer-events-none opacity-0 transition-opacity z-50"></div>
            </div>
        );
    };

    // Prepare canton/year rows for charting
    const rows = useMemo(() => {
        const byYear = {};
        normalizedDeals.forEach(d => {
            if (!d.Canton || !d.Year) return;
            const year = d.Year;
            const cantonKey = sanitizeKey(d.Canton);
            if (!byYear[year]) byYear[year] = { year };
            byYear[year][`${cantonKey}__volume`] = (byYear[year][`${cantonKey}__volume`] || 0) + Number(d.VolumeMChf || 0);
            byYear[year][`${cantonKey}__count`] = (byYear[year][`${cantonKey}__count`] || 0) + 1;
            byYear[year]['__grandTotalVolume'] = (byYear[year]['__grandTotalVolume'] || 0) + Number(d.VolumeMChf || 0);
            byYear[year]['__grandTotalCount'] = (byYear[year]['__grandTotalCount'] || 0) + 1;
        });
        const allRows = Object.values(byYear).sort((a, b) => a.year - b.year);
        // Find first year with any non-zero value
        const firstIdx = allRows.findIndex(row => {
            return cantons.some(canton => {
                const v = row[`${sanitizeKey(canton)}__volume`] || 0;
                const c = row[`${sanitizeKey(canton)}__count`] || 0;
                return v > 0 || c > 0;
            });
        });
        return firstIdx >= 0 ? allRows.slice(firstIdx) : allRows;
    }, [normalizedDeals, cantons]);

    const dims = getChartDims(false);
    const expandedDims = getChartDims(true);

    // Chart content (dual charts)
    const ChartContent = ({ chartType, modeState, showTotalState, onModeChange, onShowTotalChange, isExpandedView = false }) => {
        const label = chartType === 'volume' ? 'Investment Volume vs Year' : 'Number of Deals vs Year';
        const dimsToUse = isExpandedView ? expandedDims : dims;
        const chartWidth = isExpandedView ? (dimsToUse.width || 800) : ((dimsToUse.width || 800) / 2 - 20);
        
        return (
            <div>
                <div className='flex items-center mb-2'>
                    <h3 className='text-md font-semibold text-gray-800 mr-2'>{label}</h3>
                    <button
                        className='p-2 rounded-md bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors'
                        title='Expand chart'
                        onClick={() => setExpandedChart(chartType)}
                    >
                        <Maximize2 className='w-5 h-5' />
                    </button>
                    <button
                        className='h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors'
                        title='Export chart (print or save as PDF)'
                    >
                        Export
                        <img src={downloadIcon} alt='Download' className='h-5 w-5' />
                    </button>
                </div>
                <D3CantonChart
                    data={rows}
                    cantons={cantons}
                    isVolume={chartType === 'volume'}
                    mode={modeState}
                    width={chartWidth}
                    height={dimsToUse.height}
                    margin={dimsToUse.margin}
                    isExpanded={isExpandedView}
                    colorOf={colorOf}
                    showTotal={showTotalState}
                />
            </div>
        );
    };

    return (
        <>
            <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50'>
                <div className='flex flex-wrap items-center gap-4'>
                    <span className='text-gray-700'>Left (Value):</span>
                    <select
                        value={leftMode}
                        onChange={e => setLeftMode(e.target.value)}
                        className='px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700'
                    >
                        <option value='line'>Line</option>
                        <option value='column'>Column</option>
                    </select>
                    <span className='text-gray-700'>Right (Count):</span>
                    <select
                        value={rightMode}
                        onChange={e => setRightMode(e.target.value)}
                        className='px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700'
                    >
                        <option value='line'>Line</option>
                        <option value='column'>Column</option>
                    </select>
                    <label className='flex items-center gap-2'>
                        <input
                            type='checkbox'
                            checked={showTotal}
                            onChange={e => setShowTotal(e.target.checked)}
                            className='text-red-600 focus:ring-red-500'
                        />
                        <span className='text-gray-700'>Show total</span>
                    </label>
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2'>
                <div>
                    <ChartContent
                        chartType='volume'
                        modeState={leftMode}
                        showTotalState={showTotal}
                        onModeChange={setLeftMode}
                        onShowTotalChange={setShowTotal}
                        isExpandedView={false}
                    />
                </div>
                <div>
                    <ChartContent
                        chartType='count'
                        modeState={rightMode}
                        showTotalState={showTotal}
                        onModeChange={setRightMode}
                        onShowTotalChange={setShowTotal}
                        isExpandedView={false}
                    />
                </div>
            </div>
            
            <ChartLegend items={cantons} colorOf={colorOf} title="Cantons" />
            
            <ChartModal
                isOpen={!!expandedChart}
                onClose={() => setExpandedChart(null)}
                title={`Expanded ${expandedChart === 'volume' ? 'Investment Volume' : 'Deal Count'} Chart`}
            >
                {expandedChart && (
                    <div className='space-y-4'>
                        <div className='flex flex-wrap items-center gap-4 mb-4'>
                            <div className='flex items-center gap-2'>
                                <span className='text-gray-700'>Chart Type:</span>
                                <select value={modalMode} onChange={e => setModalMode(e.target.value)} className='px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700'>
                                    <option value='line'>Line</option>
                                    <option value='column'>Column</option>
                                </select>
                            </div>
                            <label className='flex items-center gap-2'>
                                <input type='checkbox' checked={modalShowTotal} onChange={e => setModalShowTotal(e.target.checked)} className='text-red-600 focus:ring-red-500' />
                                <span className='text-gray-700'>Show total</span>
                            </label>
                        </div>
                        <ChartContent
                            chartType={expandedChart}
                            modeState={modalMode}
                            showTotalState={modalShowTotal}
                            onModeChange={setModalMode}
                            onShowTotalChange={setModalShowTotal}
                            isExpandedView={true}
                        />
                    </div>
                )}
            </ChartModal>
        </>
    );
};

export default ExpandableCantonAnalysisChart;
