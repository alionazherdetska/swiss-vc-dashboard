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
          <ChartContent
            chartType={expandedChart}
            mode={expandedMode}
            showTotalState={expandedShowTotal}
            onModeChange={setExpandedMode}
          />
          <div>
            <ChartLegend 
              items={expandedShowTotal ? [...genders, 'Total'] : genders} 
              colorOf={colorOf} 
              title="Legend" 
            />
          </div>
        </div>
      </ChartModal>
    </>
  );
};

export default ExpandableGenderAnalysisChart;