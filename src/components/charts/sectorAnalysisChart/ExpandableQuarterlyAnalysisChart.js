import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Maximize2 } from 'lucide-react';
import ChartModal from '../../common/ChartModal';

import ChartLegend from './components/ChartLegend';
import SortedTooltip from './components/SortedTooltip';
import ShiftedLine from './components/ShiftedLine';

import prepareQuarterlyRows from './helpers/PrepareQuarterlyRows';
import createSeriesRenderers from './helpers/CreateSeriesRenderers';

import {
  CHART_MARGIN,
  EXPANDED_CHART_MARGIN,
  INDUSTRY_COLOR_MAP,
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

/* ===========================
   ExpandableQuarterlyAnalysisChart
   =========================== */
const ExpandableQuarterlyAnalysisChart = ({
  deals,
  data,
  selectedIndustries = [],
  colorOf: externalColorOf,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedChart, setExpandedChart] = useState('volume'); // "volume" | "count"

  const [leftMode, setLeftMode] = useState('line');
  const [rightMode, setRightMode] = useState('line');
  const [showTotal, setShowTotal] = useState(false);

  const [expandedMode, setExpandedMode] = useState('line');
  const [expandedShowTotal, setExpandedShowTotal] = useState(true);

  const colorFn = makeDistributedColorFn(
    INDUSTRY_COLOR_MAP,
    ENHANCED_COLOR_PALETTE
  );

  /* Data source */
  const dealsSource = useMemo(() => {
    if (Array.isArray(deals)) return deals;
    if (Array.isArray(data)) return data;
    return [];
  }, [deals, data]);

  const { rows, industries, top5 } = useMemo(
    () => prepareQuarterlyRows(dealsSource),
    [dealsSource]
  );

  const colorOf =
    externalColorOf && externalColorOf.useExternal
      ? externalColorOf
      : (name) => colorFn(name, industries);

  /* Axis maxima and ticks (computed once here) */
  const volumeMaxPerIndustry = useMemo(() => {
    let m = 0;
    for (const r of rows) {
      for (const ind of industries) {
        const v = r[`${sanitizeKey(ind)}__volume`] || 0;
        if (v > m) m = v;
      }
    }
    return m;
  }, [rows, industries]);

  const totalVolumeMax = useMemo(
    () => (rows.length ? Math.max(...rows.map((r) => r.totalVolume || 0)) : 0),
    [rows]
  );

  const totalCountMax = useMemo(
    () => (rows.length ? Math.max(...rows.map((r) => r.totalCount || 0)) : 0),
    [rows]
  );

  const countMaxPerIndustry = useMemo(() => {
    let m = 0;
    for (const r of rows) {
      for (const ind of industries) {
        const v = r[`${sanitizeKey(ind)}__count`] || 0;
        if (v > m) m = v;
      }
    }
    return m;
  }, [rows, industries]);

  const volumeTicksLine = getTicks(0, volumeMaxPerIndustry, 500);
  const volumeTicksStack = getTicks(0, totalVolumeMax, 500);
  const countTicksStack = getTicks(0, totalCountMax, 50);
  const countTicksLine = getTicks(0, countMaxPerIndustry, 50);

  const padPct = 0.04;
  const volumeDomainStack = [0, Math.ceil(totalVolumeMax * (1 + padPct))];
  const countDomainStack = [0, Math.ceil(totalCountMax * (1 + padPct))];
  const volumeDomainLine = [0, Math.ceil(volumeMaxPerIndustry * (1 + padPct))];
  const countDomainLine = [0, Math.ceil(countMaxPerIndustry * (1 + padPct))];

  const withTotalMax = {
    volume: Math.max(volumeMaxPerIndustry, totalVolumeMax),
    count: Math.max(countMaxPerIndustry, totalCountMax),
  };
  const volumeTicksLineWithTotal = getTicks(0, withTotalMax.volume, 500);
  const countTicksLineWithTotal = getTicks(0, withTotalMax.count, 50);
  const volumeDomainLineWithTotal = [
    0,
    Math.ceil(withTotalMax.volume * (1 + padPct)),
  ];
  const countDomainLineWithTotal = [
    0,
    Math.ceil(withTotalMax.count * (1 + padPct)),
  ];

  /* Label rules config */
  const effectiveSelectedCount =
    Array.isArray(selectedIndustries) && selectedIndustries.length > 0
      ? selectedIndustries.length
      : industries.length;
  const shouldFullyLabelLines = effectiveSelectedCount <= 3;

  const latestYear = useMemo(
    () => (rows.length ? Math.max(...rows.map((r) => Number(r.year) || 0)) : 0),
    [rows]
  );
  const latestRow = useMemo(
    () => rows.find((r) => Number(r.year) === latestYear),
    [rows, latestYear]
  );
  const visibleIndustrySet = useMemo(
    () =>
      new Set(
        (selectedIndustries?.length ? selectedIndustries : industries) ?? []
      ),
    [selectedIndustries, industries]
  );
  const top3For2024 = useMemo(() => {
    const out = { volume: new Set(), count: new Set() };
    if (!latestRow || latestYear !== 2024) return out;

    const pickTop3 = (metricSuffix) => {
      const scored = industries
        .filter((ind) => visibleIndustrySet.has(ind))
        .map((ind) => ({
          ind,
          v: Number(latestRow[`${sanitizeKey(ind)}__${metricSuffix}`] || 0),
        }))
        .filter(({ v }) => v > 0)
        .sort((a, b) => b.v - a.v)
        .slice(0, 3)
        .map(({ ind }) => ind);
      return new Set(scored);
    };

    out.volume = pickTop3('volume');
    out.count = pickTop3('count');
    return out;
  }, [industries, latestRow, latestYear, visibleIndustrySet]);

  /* ---------- Expanded (modal) content ---------- */
  const ExpandedChartContent = () => {
    const isVolumeChart = expandedChart === 'volume';
    const metricSuffix = isVolumeChart ? 'volume' : 'count';
    const dims = getChartDims(true, 720, EXPANDED_CHART_MARGIN);

    const volTicks =
      expandedMode === 'column'
        ? volumeTicksStack
        : expandedShowTotal
        ? volumeTicksLineWithTotal
        : volumeTicksLine;

    const cntTicks =
      expandedMode === 'column'
        ? countTicksStack
        : expandedShowTotal
        ? countTicksLineWithTotal
        : countTicksLine;

    const domain = isVolumeChart
      ? expandedMode === 'column'
        ? volumeDomainStack
        : expandedShowTotal
        ? volumeDomainLineWithTotal
        : volumeDomainLine
      : expandedMode === 'column'
      ? countDomainStack
      : expandedShowTotal
      ? countDomainLineWithTotal
      : countDomainLine;

    const { main } = createSeriesRenderers({
      industries,
      colorOf,
      rows,
      top5,
      mode: expandedMode,
      metricSuffix,
      isExpandedView: true,
      chartDims: dims,
      shouldFullyLabelLines,
      latestYear,
      top3For2024,
    });

    return (
      <div className='space-y-4'>
        <div className='flex justify-center'>
          <ChartLegend industries={industries} colorOf={colorOf} />
        </div>

        <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-2'>
              <span className='text-gray-700'>Chart Type:</span>
              <select
                value={expandedMode}
                onChange={(e) => setExpandedMode(e.target.value)}
                className='px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700'
              >
                <option value='line'>Line</option>
                <option value='column'>Column</option>
              </select>
            </div>

            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={expandedShowTotal}
                onChange={(e) => setExpandedShowTotal(e.target.checked)}
                className='text-red-600 focus:ring-red-500'
              />
              <span className='text-gray-700'>Show total</span>
            </label>
          </div>

          <button
            className='h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors'
            style={{ minHeight: '40px' }}
            title='Export chart (print or save as PDF)'
          >
            Export
            <img src="/download.svg" alt="Download" className="h-5 w-5" />
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
              ticks={isVolumeChart ? volTicks : cntTicks}
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
            <Tooltip
              wrapperStyle={{ pointerEvents: 'none', zIndex: 9999 }}
              content={<SortedTooltip isVolume={isVolumeChart} />}
            />

            {expandedShowTotal &&
              (expandedMode === 'column' ? (
                <Line
                  type='monotone'
                  dataKey={isVolumeChart ? '__grandTotalVolume' : '__grandTotalCount'}
                  stroke='#000'
                  strokeWidth={3}
                  dot={false}
                  legendType='none'
                  shape={(props) => <ShiftedLine {...props} offset={12} />}
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
              ))}

            {main}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  /* ---------- Page charts (dual) ---------- */
  const ChartContent = ({
    isExpandedView = false,
    leftModeState,
    rightModeState,
    showTotalState,
    onLeftModeChange,
    onRightModeChange,
    onShowTotalChange,
  }) => {
    const dims = getChartDims(
      isExpandedView,
      undefined,
      isExpandedView ? EXPANDED_CHART_MARGIN : CHART_MARGIN
    );

    // VOLUME axis config
    const volTicks =
      leftModeState === 'column'
        ? volumeTicksStack
        : showTotalState
        ? volumeTicksLineWithTotal
        : volumeTicksLine;

    const volDomain =
      leftModeState === 'column'
        ? volumeDomainStack
        : showTotalState
        ? volumeDomainLineWithTotal
        : volumeDomainLine;

    const { main: leftMain } = createSeriesRenderers({
      industries,
      colorOf,
      rows,
      top5,
      mode: leftModeState,
      metricSuffix: 'volume',
      isExpandedView,
      chartDims: dims,
      shouldFullyLabelLines,
      latestYear,
      top3For2024,
    });

    // COUNT axis config
    const cntTicks =
      rightModeState === 'column'
        ? countTicksStack
        : showTotalState
        ? countTicksLineWithTotal
        : countTicksLine;

    const cntDomain =
      rightModeState === 'column'
        ? countDomainStack
        : showTotalState
        ? countDomainLineWithTotal
        : countDomainLine;

    const { main: rightMain } = createSeriesRenderers({
      industries,
      colorOf,
      rows,
      top5,
      mode: rightModeState,
      metricSuffix: 'count',
      isExpandedView,
      chartDims: dims,
      shouldFullyLabelLines,
      latestYear,
      top3For2024,
    });

    return (
      <div className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-2'>
              <span className='text-gray-700'>Left (Volume):</span>
              <select
                value={leftModeState}
                onChange={(e) => onLeftModeChange(e.target.value)}
                className='px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700'
              >
                <option value='line'>Line</option>
                <option value='column'>Column</option>
              </select>
            </div>

            <div className='flex items-center gap-2'>
              <span className='text-gray-700'>Right (Count):</span>
              <select
                value={rightModeState}
                onChange={(e) => onRightModeChange(e.target.value)}
                className='px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700'
              >
                <option value='line'>Line</option>
                <option value='column'>Column</option>
              </select>
            </div>

            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={showTotalState}
                onChange={(e) => onShowTotalChange(e.target.checked)}
                className='text-red-600 focus:ring-red-500'
              />
              <span className='text-gray-700'>Show total</span>
            </label>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* LEFT: Volume */}
          <div className='space-y-2 relative'>
            <div className='flex items-center gap-2'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Investment Volume vs Year
              </h3>
              {!isExpandedView && (
                <>
                  <button
                    onClick={() => {
                      setExpandedChart('volume');
                      setIsExpanded(true);
                    }}
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
                    <img src="/download.svg" alt="Download" className="h-5 w-5" />
                  </button>
                </>
              )}
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
                  ticks={volTicks}
                  domain={volDomain}
                  allowDecimals={false}
                  allowDataOverflow
                  label={{
                    value: 'Investment Volume CHF (M)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: AXIS_STROKE,
                    fontSize: 12,
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Tooltip
                  wrapperStyle={{ pointerEvents: 'none', zIndex: 9999 }}
                  content={<SortedTooltip isVolume />}
                />

                {showTotalState &&
                  (leftModeState === 'column' ? (
                    <Line
                      type='linear'
                      dataKey='__grandTotalVolume'
                      stroke='#000'
                      strokeWidth={isExpandedView ? 4 : 3}
                      dot={false}
                      legendType='none'
                      shape={(props) => <ShiftedLine {...props} offset={8} />}
                    />
                  ) : (
                    <Line
                      type='monotone'
                      dataKey='__grandTotalVolume'
                      stroke='#000'
                      strokeWidth={isExpandedView ? 4 : 3}
                      dot={false}
                      legendType='none'
                    />
                  ))}

                {leftMain}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* RIGHT: Count */}
          <div className='space-y-2 relative'>
            <div className='flex items-center gap-2'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Number of Deals vs Year
              </h3>
              {!isExpandedView && (
                <>
                  <button
                    onClick={() => {
                      setExpandedChart('count');
                      setIsExpanded(true);
                    }}
                    className='p-2 rounded-md bg-green-600 text-white shadow-md hover:bg-green-700 transition-colors'
                    title='Expand Count Chart'
                  >
                    <Maximize2 className='h-5 w-5' />
                  </button>
                  <button
                    className="h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors"
                    style={{ minHeight: '40px' }}
                    title='Export chart (print or save as PDF)'
                  >
                    Export
                    <img src="/download.svg" alt="Download" className="h-5 w-5" />
                  </button>
                </>
              )}
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
                  ticks={cntTicks}
                  domain={cntDomain}
                  allowDecimals={false}
                  label={{
                    value: 'Number of Deals',
                    angle: -90,
                    position: 'insideLeft',
                    fill: AXIS_STROKE,
                    fontSize: 12,
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Tooltip
                  wrapperStyle={{ pointerEvents: 'none', zIndex: 9999 }}
                  content={<SortedTooltip isVolume={false} />}
                />

                {showTotalState &&
                  (rightModeState === 'column' ? (
                    <Line
                      type='linear'
                      dataKey='__grandTotalCount'
                      stroke='#000'
                      strokeWidth={isExpandedView ? 4 : 3}
                      dot={false}
                      legendType='none'
                      shape={(props) => <ShiftedLine {...props} offset={8} />}
                    />
                  ) : (
                    <Line
                      type='monotone'
                      dataKey='__grandTotalCount'
                      stroke='#000'
                      strokeWidth={isExpandedView ? 4 : 3}
                      dot={false}
                      legendType='none'
                    />
                  ))}

                {rightMain}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='flex justify-center'>
          <ChartLegend industries={industries} colorOf={colorOf} />
        </div>
      </div>
    );
  };

  return (
    <>
      <ChartContent
        isExpandedView={false}
        leftModeState={leftMode}
        rightModeState={rightMode}
        showTotalState={showTotal}
        onLeftModeChange={setLeftMode}
        onRightModeChange={setRightMode}
        onShowTotalChange={setShowTotal}
      />
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

export default ExpandableQuarterlyAnalysisChart;