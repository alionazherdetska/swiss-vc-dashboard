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
    YAxis
} from 'recharts';
import ChartModal from '../../common/ChartModal';
import { AXIS_STROKE, GRID_STROKE, ENHANCED_COLOR_PALETTE } from '../../../lib/constants';
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
        const yLabel = chartType === 'volume' ? 'Investment Volume CHF (M)' : 'Number of Deals';
        const dataKeySuffix = chartType === 'volume' ? '__volume' : '__count';
        const totalKey = chartType === 'volume' ? '__grandTotalVolume' : '__grandTotalCount';
        const dimsToUse = isExpandedView ? expandedDims : dims;
        const expandColor = chartType === 'volume' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white';
        // Custom tooltip formatter to round values
        const tooltipFormatter = (value, name) => [Math.round(value * 100) / 100, name];
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
                <ResponsiveContainer width='100%' height={dimsToUse.height}>
                    <ComposedChart data={rows} margin={dimsToUse.margin}>
                        <CartesianGrid strokeDasharray='3 3' stroke={GRID_STROKE} />
                        <XAxis dataKey='year' stroke={AXIS_STROKE} fontSize={12} />
                        <YAxis stroke={AXIS_STROKE} fontSize={12} label={{ value: yLabel, angle: -90, style: { textAnchor: 'middle' }, position: 'insideLeft', fill: AXIS_STROKE, fontSize: 13 }} />
                        <Tooltip formatter={tooltipFormatter} />
                        {cantons.map((canton, idx) => {
                            const key = `${sanitizeKey(canton)}${dataKeySuffix}`;
                            return modeState === 'line' ? (
                                
                                <Line key={key} type='monotone' dataKey={key} stroke={colorOf(canton)} strokeWidth={2} dot={false} name={canton} />
                            ) : (
                                <Bar key={key} dataKey={key} fill={colorOf(canton)} name={canton} stackId="canton-stack" />
                            );
                        })}
                        {showTotalState && <Line type='monotone' dataKey={totalKey} stroke='#000' strokeWidth={2} dot={false} name='Total' />}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <>
            <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 mb-6'>
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
            
            <div className='flex flex-wrap gap-4 mt-4'>
                <span className='font-semibold'>Cantons</span>
                        {cantons.map((canton, idx) => (
                            <span key={canton} className='flex items-center gap-2 text-sm'>
                                <span style={{ background: colorOf(canton), width: 16, height: 16, borderRadius: 4, display: 'inline-block' }}></span>
                                {canton}
                            </span>
                        ))}
            </div>
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
