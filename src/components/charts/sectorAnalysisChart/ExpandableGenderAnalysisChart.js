
import React, { useMemo, useState } from 'react';
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
import { Maximize2 } from 'lucide-react';
import ChartModal from '../../common/ChartModal';
import ChartLegend from '../sectorAnalysisChart/components/ChartLegend';
import SortedTooltip from '../sectorAnalysisChart/components/SortedTooltip';
import ShiftedLine from '../sectorAnalysisChart/components/ShiftedLine';
import {
    CHART_MARGIN,
    EXPANDED_CHART_MARGIN,
    ENHANCED_COLOR_PALETTE,
    AXIS_STROKE,
    GRID_STROKE,
} from '../../../lib/constants';
import {
    sanitizeKey,
    getChartDims,
    getTicks,
    makeDistributedColorFn,
} from '../../../lib/utils';

// Gender color map
const GENDER_COLOR_MAP = {
    Male: '#3182CE',
    Female: '#E53E3E',
    Other: '#38A169',
};

const ExpandableGenderAnalysisChart = ({ deals }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedChart, setExpandedChart] = useState('volume'); // 'volume' | 'count'
    const [leftMode, setLeftMode] = useState('line');
    const [rightMode, setRightMode] = useState('line');
    const [showTotal, setShowTotal] = useState(false);
    const [expandedMode, setExpandedMode] = useState('line');
    const [expandedShowTotal] = useState(true);

    // Filter out deals with unknown gender
    const filteredDeals = useMemo(() => deals.filter(d => {
        const gender = d['Gender CEO'];
        return gender && gender !== 'Unknown';
    }), [deals]);

    // Get all years and genders
    const yearSet = useMemo(() => {
        const set = new Set();
        filteredDeals.forEach(d => {
            if (d.Year) set.add(Number(d.Year));
        });
        return set;
    }, [filteredDeals]);

    const genderSet = useMemo(() => {
        const set = new Set();
        filteredDeals.forEach(d => {
            set.add(d['Gender CEO']);
        });
        return set;
    }, [filteredDeals]);

    const years = useMemo(() => Array.from(yearSet).sort((a, b) => a - b), [yearSet]);
    const genders = useMemo(() => Array.from(genderSet), [genderSet]);

    // Start from first year with data
    const firstYearWithData = useMemo(() => {
        for (const y of years) {
            if (filteredDeals.some(d => Number(d.Year) === y)) return y;
        }
        return years[0];
    }, [years, filteredDeals]);
    const visibleYears = useMemo(() => years.filter(y => y >= firstYearWithData), [years, firstYearWithData]);

    // Prepare chart rows: { year, gender__count, gender__volume, totalCount, totalVolume }
    const rows = useMemo(() => {
        return visibleYears.map(year => {
            const entry = { year };
            let tc = 0;
            let tv = 0;
            genders.forEach(gender => {
                const dealsForGender = filteredDeals.filter(d => Number(d.Year) === year && d['Gender CEO'] === gender);
                const cKey = `${sanitizeKey(gender)}__count`;
                const vKey = `${sanitizeKey(gender)}__volume`;
                const count = dealsForGender.length;
                const volume = dealsForGender.reduce((sum, d) => sum + (d.VolumeMChf || 0), 0);
                entry[cKey] = count;
                entry[vKey] = Math.round(volume * 10) / 10;
                tc += count;
                tv += volume;
            });
            entry.totalCount = tc;
            entry.totalVolume = Math.round(tv * 10) / 10;
            entry.__grandTotalCount = tc;
            entry.__grandTotalVolume = Math.round(tv * 10) / 10;
            return entry;
        });
    }, [visibleYears, genders, filteredDeals]);

    // Color function
    const colorFn = makeDistributedColorFn(GENDER_COLOR_MAP, ENHANCED_COLOR_PALETTE);
    const colorOf = (gender) => colorFn(gender, genders);

    // Axis maxima and ticks
    const volumeMax = useMemo(() => rows.length ? Math.max(...rows.map(r => r.totalVolume || 0)) : 0, [rows]);
    const countMax = useMemo(() => rows.length ? Math.max(...rows.map(r => r.totalCount || 0)) : 0, [rows]);
    const volumeTicks = getTicks(0, volumeMax, 5);
    const countTicks = getTicks(0, countMax, 2);
    const padPct = 0.04;
    const volumeDomain = [0, Math.ceil(volumeMax * (1 + padPct))];
    const countDomain = [0, Math.ceil(countMax * (1 + padPct))];

    // Chart legend
    const Legend = () => (
        <div className='flex start'>
            <ChartLegend items={genders} colorOf={colorOf} title="Genders" />
        </div>
    );

    // Expanded modal chart
    const ExpandedChartContent = () => {
        const isVolumeChart = expandedChart === 'volume';
        const dims = getChartDims(true, 720, EXPANDED_CHART_MARGIN);
        const ticks = isVolumeChart ? volumeTicks : countTicks;
        const domain = isVolumeChart ? volumeDomain : countDomain;
            return (
                <div className='space-y-4'>
                    <Legend />
                    <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50'>
                        <div className='flex flex-wrap items-center gap-4'>
                            <span className='text-gray-700'>Chart Type:</span>
                            <select
                                value={expandedMode}
                                onChange={e => setExpandedMode(e.target.value)}
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
                    <ResponsiveContainer width='100%' height={dims.height}>
                        <ComposedChart data={rows} margin={dims.margin} style={{ overflow: 'visible' }}>
                            <CartesianGrid strokeDasharray='3 3' stroke={GRID_STROKE} />
                            <XAxis
                                type='category'
                                dataKey='year'
                                stroke={AXIS_STROKE}
                                fontSize={16}
                                padding={{ left: 24, right: 24 }}
                                tickMargin={12}
                                height={60}
                            />
                            <YAxis
                                stroke={AXIS_STROKE}
                                fontSize={16}
                                ticks={ticks}
                                domain={domain}
                                allowDecimals={false}
                                label={{
                                    value: isVolumeChart ? 'Investment Volume CHF (M)' : 'Number of Deals',
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: AXIS_STROKE,
                                    fontSize: 16,
                                    style: { textAnchor: 'middle' },
                                }}
                            />
                            <Tooltip wrapperStyle={{ pointerEvents: 'none', zIndex: 9999 }} content={<SortedTooltip isVolume={isVolumeChart} />} />
                            {expandedMode === 'column'
                                ? genders.map(gender => (
                                        <Bar
                                            key={gender}
                                            dataKey={`${sanitizeKey(gender)}__${isVolumeChart ? 'volume' : 'count'}`}
                                            stackId={`stack-${isVolumeChart ? 'volume' : 'count'}`}
                                            fill={colorOf(gender)}
                                            legendType='none'
                                        />
                                    ))
                                : genders.map(gender => (
                                        <Line
                                            key={gender}
                                            type='monotone'
                                            dataKey={`${sanitizeKey(gender)}__${isVolumeChart ? 'volume' : 'count'}`}
                                            stroke={colorOf(gender)}
                                            strokeWidth={3}
                                            dot={false}
                                            legendType='none'
                                        />
                                    ))}
                            {expandedShowTotal && (
                                expandedMode === 'column' ? (
                                    <Line
                                        type='monotone'
                                        dataKey={isVolumeChart ? '__grandTotalVolume' : '__grandTotalCount'}
                                        stroke='#000'
                                        strokeWidth={3}
                                        dot={false}
                                        legendType='none'
                                        shape={props => <ShiftedLine {...props} offset={12} />}
                                    />
                                ) : (
                                    <Line
                                        type='monotone'
                                        dataKey={isVolumeChart ? '__grandTotalVolume' : '__grandTotalCount'}
                                        stroke='#000'
                                        strokeWidth={3}
                                        dot={false}
                                        legendType='none'
                                    />
                                )
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            );
    };

    // Dual chart (page view)
    const ChartContent = () => {
        const dims = getChartDims(false, undefined, CHART_MARGIN);
            return (
                <div className='space-y-4'>
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
                        {/* LEFT: Volume */}
                        <div className='space-y-2 relative'>
                            <div className='flex items-center gap-2'>
                                <h3 className='text-md font-semibold text-gray-800'>Investment Volume vs Year</h3>
                                <button
                                    onClick={() => { setExpandedChart('volume'); setIsExpanded(true); }}
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
                                    <img src='/download.svg' alt='Download' className='h-5 w-5' />
                                </button>
                            </div>
                            <ResponsiveContainer width='100%' height={dims.height}>
                                <ComposedChart data={rows} margin={dims.margin} style={{ overflow: 'visible' }}>
                                    <CartesianGrid strokeDasharray='3 3' stroke={GRID_STROKE} />
                                    <XAxis
                                        type='category'
                                        dataKey='year'
                                        stroke={AXIS_STROKE}
                                        fontSize={12}
                                        padding={{ left: 18, right: 18 }}
                                        tickMargin={12}
                                        height={60}
                                    />
                                    <YAxis
                                        stroke={AXIS_STROKE}
                                        fontSize={12}
                                        ticks={volumeTicks}
                                        domain={volumeDomain}
                                        allowDecimals={false}
                                        allowDataOverflow
                                        label={{
                                            value: 'Investment Volume CHF (M)',
                                            angle: -90,
                                            position: 'insideLeft',
                                            fill: AXIS_STROKE,
                                            fontSize: 13,
                                            style: { textAnchor: 'middle' },
                                        }}
                                    />
                                    <Tooltip wrapperStyle={{ pointerEvents: 'none', zIndex: 9999 }} content={<SortedTooltip isVolume />} />
                                    {leftMode === 'column'
                                        ? genders.map(gender => (
                                                <Bar
                                                    key={gender}
                                                    dataKey={`${sanitizeKey(gender)}__volume`}
                                                    stackId='stack-volume'
                                                    fill={colorOf(gender)}
                                                    legendType='none'
                                                />
                                            ))
                                        : genders.map(gender => (
                                                <Line
                                                    key={gender}
                                                    type='monotone'
                                                    dataKey={`${sanitizeKey(gender)}__volume`}
                                                    stroke={colorOf(gender)}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    legendType='none'
                                                />
                                            ))}
                                    {showTotal && (
                                        leftMode === 'column' ? (
                                            <Line
                                                type='monotone'
                                                dataKey='__grandTotalVolume'
                                                stroke='#000'
                                                strokeWidth={3}
                                                dot={false}
                                                legendType='none'
                                                shape={props => <ShiftedLine {...props} offset={8} />}
                                            />
                                        ) : (
                                            <Line
                                                type='monotone'
                                                dataKey='__grandTotalVolume'
                                                stroke='#000'
                                                strokeWidth={3}
                                                dot={false}
                                                legendType='none'
                                            />
                                        )
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        {/* RIGHT: Count */}
                        <div className='space-y-2 relative'>
                            <div className='flex items-center gap-2'>
                                <h3 className='text-md font-semibold text-gray-800'>Number of Deals vs Year</h3>
                                <button
                                    onClick={() => { setExpandedChart('count'); setIsExpanded(true); }}
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
                            <ResponsiveContainer width='100%' height={dims.height}>
                                <ComposedChart data={rows} margin={dims.margin} style={{ overflow: 'visible' }}>
                                    <CartesianGrid strokeDasharray='3 3' stroke={GRID_STROKE} />
                                    <XAxis
                                        type='category'
                                        dataKey='year'
                                        stroke={AXIS_STROKE}
                                        fontSize={12}
                                        padding={{ left: 18, right: 18 }}
                                        tickMargin={12}
                                        height={60}
                                    />
                                    <YAxis
                                        stroke={AXIS_STROKE}
                                        fontSize={12}
                                        ticks={countTicks}
                                        domain={countDomain}
                                        allowDecimals={false}
                                        label={{
                                            value: 'Number of Deals',
                                            angle: -90,
                                            position: 'insideLeft',
                                            fill: AXIS_STROKE,
                                            fontSize: 13,
                                            style: { textAnchor: 'middle' },
                                        }}
                                    />
                                    <Tooltip wrapperStyle={{ pointerEvents: 'none', zIndex: 9999 }} content={<SortedTooltip isVolume={false} />} />
                                    {rightMode === 'column'
                                        ? genders.map(gender => (
                                                <Bar
                                                    key={gender}
                                                    dataKey={`${sanitizeKey(gender)}__count`}
                                                    stackId='stack-count'
                                                    fill={colorOf(gender)}
                                                    legendType='none'
                                                />
                                            ))
                                        : genders.map(gender => (
                                                <Line
                                                    key={gender}
                                                    type='monotone'
                                                    dataKey={`${sanitizeKey(gender)}__count`}
                                                    stroke={colorOf(gender)}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    legendType='none'
                                                />
                                            ))}
                                    {showTotal && (
                                        rightMode === 'column' ? (
                                            <Line
                                                type='monotone'
                                                dataKey='__grandTotalCount'
                                                stroke='#000'
                                                strokeWidth={3}
                                                dot={false}
                                                legendType='none'
                                                shape={props => <ShiftedLine {...props} offset={8} />}
                                            />
                                        ) : (
                                            <Line
                                                type='monotone'
                                                dataKey='__grandTotalCount'
                                                stroke='#000'
                                                strokeWidth={3}
                                                dot={false}
                                                legendType='none'
                                            />
                                        )
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <Legend />
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
                <ExpandedChartContent />
            </ChartModal>
        </>
    );
};

export default ExpandableGenderAnalysisChart;
