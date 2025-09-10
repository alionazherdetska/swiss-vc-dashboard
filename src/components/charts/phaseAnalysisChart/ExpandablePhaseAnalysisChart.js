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
    LabelList
} from 'recharts';
import ChartModal from '../../common/ChartModal';
import { AXIS_STROKE, GRID_STROKE } from '../../../lib/constants';
import { sanitizeKey, getChartDims } from '../../../lib/utils';
const downloadIcon = process.env.PUBLIC_URL + '/download.svg';

// This chart visualizes deals grouped by phase, similar to ExpandableQuarterlyAnalysisChart
const ExpandablePhaseAnalysisChart = ({ deals, selectedPhaseCount, totalPhaseCount }) => {
    // State for expansion and chart type
        const [expandedChart, setExpandedChart] = useState(null); // 'volume' | 'count' | null
    const [leftMode, setLeftMode] = useState('line');
    const [rightMode, setRightMode] = useState('line');
    const [showTotal, setShowTotal] = useState(false);
    const [expandedMode, setExpandedMode] = useState('line');
    const [expandedShowTotal, setExpandedShowTotal] = useState(true);

    // Prepare phase/year rows for charting
    const rows = useMemo(() => {
        // { year, [phase]__volume, [phase]__count, __grandTotalVolume, __grandTotalCount }
        const byYear = {};
        deals.forEach(d => {
            if (!d.Phase || !d.Year) return;
            const year = d.Year;
            const phaseKey = sanitizeKey(d.Phase);
            if (!byYear[year]) byYear[year] = { year };
            byYear[year][`${phaseKey}__volume`] = (byYear[year][`${phaseKey}__volume`] || 0) + Number(d.VolumeMChf || 0);
            byYear[year][`${phaseKey}__count`] = (byYear[year][`${phaseKey}__count`] || 0) + 1;
            byYear[year]['__grandTotalVolume'] = (byYear[year]['__grandTotalVolume'] || 0) + Number(d.VolumeMChf || 0);
            byYear[year]['__grandTotalCount'] = (byYear[year]['__grandTotalCount'] || 0) + 1;
        });
        return Object.values(byYear).sort((a, b) => a.year - b.year);
    }, [deals]);

    // Get all phases
    const phases = useMemo(() => {
        return Array.from(new Set(deals.map(d => d.Phase).filter(Boolean)));
    }, [deals]);

    // Color palette for phases
    const PHASE_COLORS = ['#E84A5F', '#2ECC71', '#3498DB', '#A0522D', '#F7931E', '#9B5DE5', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'];
    const colorOf = phase => PHASE_COLORS[phases.indexOf(phase) % PHASE_COLORS.length];

    // Chart dimensions
    const dims = getChartDims(false);
    const expandedDims = getChartDims(true);

    // Chart content (dual charts)
        const ChartContent = ({
            chartType, // 'volume' | 'count'
            modeState,
            showTotalState,
            onModeChange,
            onShowTotalChange,
            isExpandedView = false
        }) => {
            const label = chartType === 'volume' ? 'Investment Volume vs Year' : 'Number of Deals vs Year';
            const yLabel = chartType === 'volume' ? 'Investment Volume CHF (M)' : 'Number of Deals';
            const dataKeySuffix = chartType === 'volume' ? '__volume' : '__count';
            const totalKey = chartType === 'volume' ? '__grandTotalVolume' : '__grandTotalCount';
            const dimsToUse = isExpandedView ? expandedDims : dims;
            // Color for expand button
            const expandColor = chartType === 'volume' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white';
            return (
                <div>
                    <div className='flex items-center mb-2'>
                        <h3 className='text-lg font-bold text-gray-800 mr-2'>{label}</h3>
                        <button
                            className={`h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md ${expandColor} hover:opacity-90 border-none shadow-none transition-colors`}
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
                            <img src={downloadIcon} alt='Download' className='h-5 w-5' />
                        </button>
                    </div>
                    <ResponsiveContainer width='100%' height={dimsToUse.height}>
                        <ComposedChart data={rows} margin={dimsToUse.margin}>
                            <CartesianGrid strokeDasharray='3 3' stroke={GRID_STROKE} />
                            <XAxis dataKey='year' stroke={AXIS_STROKE} fontSize={12} />
                            <YAxis stroke={AXIS_STROKE} fontSize={12} label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: AXIS_STROKE, fontSize: 16 }} />
                            <Tooltip />
                            {phases.map((phase, idx) => {
                                const key = `${sanitizeKey(phase)}${dataKeySuffix}`;
                                return modeState === 'line' ? (
                                    <Line key={key} type='monotone' dataKey={key} stroke={colorOf(phase)} strokeWidth={3} dot={{ r: 4 }} name={phase} />
                                ) : (
                                    <Bar key={key} dataKey={key} fill={colorOf(phase)} name={phase} />
                                );
                            })}
                            {showTotalState && <Line type='monotone' dataKey={totalKey} stroke='#000' strokeWidth={2} dot={false} name='Total' />}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            );
        };

        // Modal chart controls
        const [modalMode, setModalMode] = useState('line');
        const [modalShowTotal, setModalShowTotal] = useState(true);

        return (
            <>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                <div className='mt-4 text-sm text-gray-500'>
                    Showing {selectedPhaseCount} of {totalPhaseCount} phases
                </div>
                <div className='flex flex-wrap gap-4 mt-4'>
                    <span className='font-semibold'>Phases</span>
                    {phases.map((phase, idx) => (
                        <span key={phase} className='flex items-center gap-2 text-sm'>
                            <span style={{ background: colorOf(phase), width: 16, height: 16, borderRadius: 4, display: 'inline-block' }}></span>
                            {phase}
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

export default ExpandablePhaseAnalysisChart;
