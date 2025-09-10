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
import SortedTooltip from '../sectorAnalysisChart/components/SortedTooltip';
import {
  CHART_MARGIN,
  EXPANDED_CHART_MARGIN,
  AXIS_STROKE,
  GRID_STROKE,
} from '../../../lib/constants';
import { getChartDims, getTicks } from '../../../lib/utils';

const EXIT_COLOR = '#E53E3E';

const ExpandableExitsAnalysisChart = ({ exits }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedChart, setExpandedChart] = useState('volume'); // 'volume' | 'count'
  const [leftMode, setLeftMode] = useState('line');
  const [rightMode, setRightMode] = useState('line');
  const [expandedMode, setExpandedMode] = useState('line');

  // Filter exits with valid year
  const filteredExits = useMemo(() => {
    const filtered = exits.filter(e => e.Year);
    console.log('Filtered exits:', filtered); // Debug log
    return filtered;
  }, [exits]);

  const years = useMemo(() => Array.from(new Set(filteredExits.map(e => Number(e.Year)))).sort((a, b) => a - b), [filteredExits]);
  
  // Start from first year with data
  const firstYearWithData = useMemo(() => {
    for (const y of years) {
      if (filteredExits.some(e => Number(e.Year) === y)) return y;
    }
    return years[0];
  }, [years, filteredExits]);
  
  const visibleYears = useMemo(() => years.filter(y => y >= firstYearWithData), [years, firstYearWithData]);

  // Prepare chart rows: { year, exits_count, exits_volume, totalCount, totalVolume }
  const rows = useMemo(() => {
    const result = visibleYears.map(year => {
      const items = filteredExits.filter(e => Number(e.Year) === year);
      const count = items.length;
      const volume = items.reduce((sum, e) => sum + (e.VolumeMChf || 0), 0);
      console.log(`Year ${year}: count=${count}, volume=${volume}, items:`, items); // Debug log
      return {
        year,
        exits__count: count,
        exits__volume: Math.round(volume * 10) / 10,
        totalCount: count,
        totalVolume: Math.round(volume * 10) / 10,
        __grandTotalCount: count,
        __grandTotalVolume: Math.round(volume * 10) / 10,
      };
    });
    console.log('Chart rows:', result); // Debug log
    return result;
  }, [visibleYears, filteredExits]);

  // Axis maxima and ticks
  const volumeMax = useMemo(() => rows.length ? Math.max(...rows.map(r => r.totalVolume || 0)) : 0, [rows]);
  const countMax = useMemo(() => rows.length ? Math.max(...rows.map(r => r.totalCount || 0)) : 0, [rows]);
  const volumeTicks = getTicks(0, volumeMax, 5);
  const countTicks = getTicks(0, countMax, 2);
  const padPct = 0.04;
  const volumeDomain = [0, Math.ceil(volumeMax * (1 + padPct))];
  const countDomain = [0, Math.ceil(countMax * (1 + padPct))];

  // Expanded modal chart
  const ExpandedChartContent = () => {
    const isVolumeChart = expandedChart === 'volume';
    const dims = getChartDims(true, 720, EXPANDED_CHART_MARGIN);
    const ticks = isVolumeChart ? volumeTicks : countTicks;
    const domain = isVolumeChart ? volumeDomain : countDomain;
    return (
      <div className='space-y-4'>
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
                value: isVolumeChart ? 'Exit Value CHF (M)' : 'Number of Exits',
                angle: -90,
                position: 'insideLeft',
                fill: AXIS_STROKE,
                fontSize: 16,
                style: { textAnchor: 'middle' },
              }}
            />
            <Tooltip wrapperStyle={{ pointerEvents: 'none', zIndex: 9999 }} content={<SortedTooltip isVolume={isVolumeChart} />} />
            {expandedMode === 'column'
              ? <Bar dataKey={`exits__${isVolumeChart ? 'volume' : 'count'}`} stackId={`stack-${isVolumeChart ? 'volume' : 'count'}`} fill={EXIT_COLOR} legendType='none' />
              : <Line type='monotone' dataKey={`exits__${isVolumeChart ? 'volume' : 'count'}`} stroke={EXIT_COLOR} strokeWidth={3} dot={false} legendType='none' />}
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
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2'>
          {/* LEFT: Value */}
          <div className='space-y-2 relative'>
            <div className='flex items-center gap-2'>
              <h3 className='text-lg font-semibold text-gray-800'>Exit Value vs Year</h3>
              <button
                onClick={() => { setExpandedChart('volume'); setIsExpanded(true); }}
                className='p-2 rounded-md bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors'
                title='Expand Value Chart'
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
                    value: 'Exit Value CHF (M)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: AXIS_STROKE,
                    fontSize: 12,
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Tooltip wrapperStyle={{ pointerEvents: 'none', zIndex: 9999 }} content={<SortedTooltip isVolume />} />
                {leftMode === 'column'
                  ? <Bar dataKey='exits__volume' stackId='stack-volume' fill={EXIT_COLOR} legendType='none' />
                  : <Line type='monotone' dataKey='exits__volume' stroke={EXIT_COLOR} strokeWidth={2} dot={false} legendType='none' />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* RIGHT: Count */}
          <div className='space-y-2 relative'>
            <div className='flex items-center gap-2'>
              <h3 className='text-lg font-semibold text-gray-800'>Number of Exits vs Year</h3>
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
                    value: 'Number of Exits',
                    angle: -90,
                    position: 'insideLeft',
                    fill: AXIS_STROKE,
                    fontSize: 12,
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Tooltip wrapperStyle={{ pointerEvents: 'none', zIndex: 9999 }} content={<SortedTooltip isVolume={false} />} />
                {rightMode === 'column'
                  ? <Bar dataKey='exits__count' stackId='stack-count' fill={EXIT_COLOR} legendType='none' />
                  : <Line type='monotone' dataKey='exits__count' stroke={EXIT_COLOR} strokeWidth={2} dot={false} legendType='none' />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
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
        title={`Expanded ${expandedChart === 'volume' ? 'Exit Value' : 'Exit Count'} Chart`}
      >
        <ExpandedChartContent />
      </ChartModal>
    </>
  );
};

export default ExpandableExitsAnalysisChart;