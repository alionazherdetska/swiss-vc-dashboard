import React, { useMemo, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import {
    CartesianGrid,
    ComposedChart,
    Line,
    Bar,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import ChartModal from '../../common/ChartModal';
import { AXIS_STROKE, GRID_STROKE, ENHANCED_COLOR_PALETTE } from '../../../lib/constants';
import { sanitizeKey, getChartDims } from '../../../lib/utils';

const ExpandablePhaseAnalysisChart = ({ deals, selectedPhaseCount, totalPhaseCount }) => {
    const [expandedChart, setExpandedChart] = useState(null); // 'volume' | 'count' | null
    const [leftMode, setLeftMode] = useState('line');
    const [rightMode, setRightMode] = useState('line');
    const [modalMode, setModalMode] = useState('line');

    // Extract phases from deals
    const phases = useMemo(() => {
        return Array.from(new Set(deals.map(d => d.Phase).filter(p => p && p.trim()))).sort();
    }, [deals]);

    // Color palette for phases
    const colorOf = phase => ENHANCED_COLOR_PALETTE[phases.indexOf(phase) % ENHANCED_COLOR_PALETTE.length];

    // Prepare phase/year rows for charting
    const rows = useMemo(() => {
        const byYear = {};
        deals.forEach(d => {
            if (!d.Phase || !d.Year) return;
            const year = d.Year;
            const phaseKey = sanitizeKey(d.Phase);
            if (!byYear[year]) byYear[year] = { year };
            byYear[year][`${phaseKey}__volume`] = (byYear[year][`${phaseKey}__volume`] || 0) + Number(d.Amount || 0);
            byYear[year][`${phaseKey}__count`] = (byYear[year][`${phaseKey}__count`] || 0) + 1;
            byYear[year]['__grandTotalVolume'] = (byYear[year]['__grandTotalVolume'] || 0) + Number(d.Amount || 0);
            byYear[year]['__grandTotalCount'] = (byYear[year]['__grandTotalCount'] || 0) + 1;
        });
        const allRows = Object.values(byYear).sort((a, b) => a.year - b.year);
        // Find first year with any non-zero value
        const firstIdx = allRows.findIndex(row => {
            return phases.some(phase => {
                const v = row[`${sanitizeKey(phase)}__volume`] || 0;
                const c = row[`${sanitizeKey(phase)}__count`] || 0;
                return v > 0 || c > 0;
            });
        });
        return firstIdx >= 0 ? allRows.slice(firstIdx) : allRows;
    }, [deals, phases]);

    const dims = getChartDims(false);
    const expandedDims = getChartDims(true);

    // Chart content (dual charts)
    const ChartContent = ({ chartType, modeState, onModeChange, isExpandedView = false }) => {
        const label = chartType === 'volume' ? 'Investment Volume by Phase vs Year' : 'Number of Deals by Phase vs Year';
        const yLabel = chartType === 'volume' ? 'Investment Volume CHF (M)' : 'Number of Deals';
        const dataKeySuffix = chartType === 'volume' ? '__volume' : '__count';
        const dimsToUse = isExpandedView ? expandedDims : dims;
        const expandColor = chartType === 'volume' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white';
        
        // Custom tooltip formatter to round values
        const tooltipFormatter = (value, name) => [Math.round(value * 100) / 100, name];
        
        return (
            <div>
                <div className='flex items-center mb-2'>
                    <h3 className='text-lg font-bold text-gray-800 mr-2'>{label}</h3>
                    {!isExpandedView && (
                        <>
                            <button
                                className={`h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md ${expandColor} hover:opacity-90 border-none shadow-none transition-colors mr-2`}
                                style={{ minHeight: '40px' }}
                                title='Expand chart'
                                onClick={() => setExpandedChart(chartType)}
                            >
                                <Maximize2 className='w-5 h-5' />
                            </button>
                            <button
                                className='h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors'
                                style={{ minHeight: '40px' }}
                                title='Export chart (print or save as PDF)'
                            >
                                Export
                                <img src='/download.svg' alt='Download' className='h-5 w-5' />
                            </button>
                        </>
                    )}
                </div>
                <ResponsiveContainer width='100%' height={dimsToUse.height}>
                    <ComposedChart data={rows} margin={dimsToUse.margin}>
                        <CartesianGrid strokeDasharray='3 3' stroke={GRID_STROKE} />
                        <XAxis dataKey='year' stroke={AXIS_STROKE} fontSize={12} />
                        <YAxis stroke={AXIS_STROKE} fontSize={12} label={{ 
                            value: yLabel, 
                            angle: -90, 
                            position: 'insideLeft', 
                            fill: AXIS_STROKE, 
                            fontSize: 16 
                        }} />
                        <Tooltip formatter={tooltipFormatter} />
                        {phases.map(phase => {
                            const dataKey = `${sanitizeKey(phase)}${dataKeySuffix}`;
                            const color = colorOf(phase);
                            return modeState === 'column' ? (
                                <Bar key={dataKey} dataKey={dataKey} fill={color} name={phase} stackId="phase-stack" />
                            ) : (
                                <Line 
                                    key={dataKey} 
                                    type="monotone" 
                                    dataKey={dataKey} 
                                    stroke={color} 
                                    strokeWidth={2} 
                                    dot={false} 
                                    name={phase} 
                                />
                            );
                        })}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const ExpandedModalContent = () => {
        const chartType = expandedChart;
        return (
            <div className='space-y-4'>
                <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50'>
                    <div className='flex flex-wrap items-center gap-4'>
                        <span className='text-gray-700'>Chart Type:</span>
                        <select
                            value={modalMode}
                            onChange={e => setModalMode(e.target.value)}
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
                <ChartContent 
                    chartType={chartType} 
                    modeState={modalMode} 
                    onModeChange={setModalMode} 
                    isExpandedView={true} 
                />
            </div>
        );
    };

    return (
        <div className='space-y-6'>

            <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50'>
                <div className='flex flex-wrap items-center gap-4'>
                    <span className='text-gray-700'>Left (Volume):</span>
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
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2'>
                <ChartContent 
                    chartType='volume' 
                    modeState={leftMode} 
                    onModeChange={setLeftMode} 
                />
                <ChartContent 
                    chartType='count' 
                    modeState={rightMode} 
                    onModeChange={setRightMode} 
                />
            </div>

            <div className='flex flex-wrap gap-4 mt-4'>
                <span className='font-semibold'>Phases</span>
                {phases.map((phase, idx) => (
                    <span key={phase} className='flex items-center gap-2 text-sm'>
                        <span style={{ 
                            background: colorOf(phase), 
                            width: 16, 
                            height: 16, 
                            borderRadius: 4, 
                            display: 'inline-block' 
                        }}></span>
                        {phase}
                    </span>
                ))}
            </div>

            <ChartModal
                isOpen={expandedChart !== null}
                onClose={() => setExpandedChart(null)}
                title={`Expanded ${expandedChart === 'volume' ? 'Investment Volume' : 'Deal Count'} by Phase Chart`}
            >
                <ExpandedModalContent />
            </ChartModal>
        </div>
    );
};

export default ExpandablePhaseAnalysisChart;
