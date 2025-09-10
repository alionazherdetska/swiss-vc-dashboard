import React, { useState, useEffect, useMemo } from 'react';

// Panels / components you still use
import FilterPanel from './filters/FilterPanel.js';
import { TimelineChart } from './charts/TimelineChart.js';

import { processCompanies, processDeals, generateChartData } from '../lib/utils';
import { SAMPLE_DATA } from '../lib/constants.js';
import ExpandableQuarterlyAnalysisChart from './charts/sectorAnalysisChart/ExpandableQuarterlyAnalysisChart.js';
import ExpandablePhaseAnalysisChart from './charts/phaseAnalysisChart/ExpandablePhaseAnalysisChart.js';
import ExpandableCantonAnalysisChart from './charts/sectorAnalysisChart/ExpandableCantonAnalysisChart.js';
import ExpandableGenderAnalysisChart from './charts/sectorAnalysisChart/ExpandableGenderAnalysisChart.js';
import ExpandableExitsAnalysisChart from './charts/sectorAnalysisChart/ExpandableExitsAnalysisChart.js';

const Dashboard = () => {
	// Companies only for mapping; UI is deals-only
	const [deals, setDeals] = useState([]);
	const [loading, setLoading] = useState(true);
	const [exits, setExits] = useState([]);


	// Filters
	const [filters, setFilters] = useState({
		industries: [],
		ceoGenders: [], // Now used for deals filtering
		cantons: [],
		yearRange: [2012, 2025],
		dealTypes: [],
		phases: [],
	});

	const [activeChart, setActiveChart] = useState('timeline'); // default open
	const chartTabs = [
		{ key: 'timeline', label: 'Overview' },
		{ key: 'quarterly', label: 'Sectors' },
		{ key: 'phase', label: 'Stages' },
		{ key: 'canton', label: 'Canton' },
		{ key: 'ceoGender', label: 'Gender' },
		{ key: 'exits', label: 'Exits' },
	];

	// Load & process data (companies only for mapping)
	useEffect(() => {
		const loadData = async () => {
			try {
				const jsonData = window.startupData || SAMPLE_DATA;

				let processedCompanies = [];
				let processedDeals = [];

				if (jsonData.Companies) {
					processedCompanies = processCompanies(jsonData.Companies);
				}

				if (jsonData.Deals) {
					processedDeals = processDeals(jsonData.Deals, processedCompanies);
					setDeals(processedDeals);
				}

				if (jsonData.Exits) {
					const processedExits = jsonData.Exits.map((e) => ({
						...e, // Pass through all fields
						Year: Number(e.Year) || null,
						VolumeMChf: Number(e.ProceedsMChf ?? e.ExitValueMChf ?? 0),
					}));
					console.log('Processed exits:', processedExits); // Debug log
					setExits(processedExits);
				}

			} catch {
				setLoading(false);
			} finally {
				setLoading(false);       // always clear loading, success or error
			}
		};

		loadData();
	}, []);

	// Filter options: deals-only, now including CEO genders
	const filterOptions = useMemo(() => {
		if (!deals.length) {
			return { dealTypes: [], phases: [], dealYears: [], industries: [], ceoGenders: [] };
		}
		return {
			dealTypes: [...new Set(deals.map((d) => d.Type).filter(Boolean))].sort(),
			phases: [...new Set(deals.map((d) => d.Phase).filter(Boolean))].sort(),
			dealYears: [...new Set(deals.map((d) => d.Year).filter(Boolean))].sort(),
			industries: [
				...new Set(deals.map((d) => d.Industry).filter(Boolean)),
			].sort(),
			ceoGenders: [...new Set(deals.map((d) => d['Gender CEO']).filter(Boolean))].sort(),
		};
	}, [deals]);

	//exits timeline (group by year)
	const exitsTimeline = useMemo(() => {
		if (!exits.length) return [];

		const byYear = new Map();
		for (const e of exits) {
			if (!e.Year) continue;
			const y = e.Year;
			const prev = byYear.get(y) || { year: y, count: 0, volume: 0 };
			prev.count += 1;
			// Use your normalized numeric field for exits volume:
			prev.volume += Number(e.VolumeMChf || 0);
			byYear.set(y, prev);
		}
		return [...byYear.values()].sort((a, b) => a.year - b.year);
	}, [exits]);

	// Apply filters (deals only, now including CEO gender filter)
	const filteredDeals = useMemo(() => {
		return deals.filter((item) => {
			if (
				filters.industries.length &&
				!filters.industries.includes(item.Industry)
			)
				return false;
			if (filters.dealTypes.length && !filters.dealTypes.includes(item.Type))
				return false;
			if (filters.phases.length && !filters.phases.includes(item.Phase))
				return false;
			if (filters.cantons.length && !filters.cantons.includes(item.Canton))
				return false;
			if (
				filters.ceoGenders.length && 
				!filters.ceoGenders.includes(item['Gender CEO'])
			)
				return false;
			if (
				item.Year &&
				(item.Year < filters.yearRange[0] || item.Year > filters.yearRange[1])
			)
				return false;
			return true;
		});
	}, [deals, filters]);

	// Chart data (deals-only)
	const chartData = useMemo(() => {
		return generateChartData('deals', [], filteredDeals);
	}, [filteredDeals]);

	// Filter helpers
	const updateFilter = (key, value) =>
		setFilters((prev) => ({ ...prev, [key]: value }));
	const toggleArrayFilter = (key, value) =>
		setFilters((prev) => ({
			...prev,
			[key]: prev[key].includes(value)
				? prev[key].filter((item) => item !== value)
				: [...prev[key], value],
		}));
	const resetFilters = () =>
		setFilters({
			industries: [],
			cantons: [],
			ceoGenders: [],
			searchQuery: '',
			yearRange: [2012, 2025],
			dealTypes: [],
			phases: [],
		});

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4' />
					<p className='text-gray-600'>
						Loading Swiss startup ecosystem data...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-50'>

				<div className='grid grid-cols-1 lg:grid-cols-5 gap-2'>
					{/* Filters Panel */}
					<div className='lg:col-span-1'>
						<FilterPanel
							filters={filters}
							filterOptions={filterOptions}
							activeTab='deals'
							updateFilter={updateFilter}
							toggleArrayFilter={toggleArrayFilter}
							resetFilters={resetFilters}
						/>
					</div>

					{/* Charts Panel with tab-like chart selector */}
					<div className='lg:col-span-4'>
						<div className='rounded-lg shadow-sm p-6 border bg-white border-gray-200'>
							{/* Tab bar */}
							<div className='flex space-x-2 p-1 rounded-lg mb-6 bg-gray-100'>
								{chartTabs.map(tab => (
									<button
										key={tab.key}
										onClick={() => setActiveChart(tab.key)}
										className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
											activeChart === tab.key
												? 'bg-white text-red-600 shadow-sm border border-red-200'
												: 'text-gray-600 hover:text-gray-800'
										}`}
										title={tab.label}
									>
										{tab.label}
									</button>
								))}
							</div>

							{/* Active chart rendered by tab selection */}
							<div className='border rounded-lg p-4 border-gray-200 bg-gray-50'>
								{activeChart === 'timeline' && (
									<div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
										<TimelineChart
											data={chartData.timeline}
											showVolume={true}
											title='Invested Capital by Year'
											yLabel='Invested Capital CHF (M)'
										/>
										<TimelineChart
											data={chartData.timeline}
											showVolume={false}
											title='Number of Deals by Year'
											yLabel='Number of Deals'
										/>
									</div>
								)}
								{activeChart === 'quarterly' && (
									<ExpandableQuarterlyAnalysisChart
										deals={filteredDeals}
										selectedIndustryCount={filters.industries.length}
										totalIndustryCount={filterOptions.industries.length}
									/>
								)}
								{activeChart === 'phase' && (
										<ExpandablePhaseAnalysisChart
											deals={filteredDeals}
											selectedPhaseCount={filters.phases.length}
											totalPhaseCount={filterOptions.phases.length}
										/>
								)}
								{activeChart === 'canton' && (
										<ExpandableCantonAnalysisChart
											deals={filteredDeals}
											selectedCantonCount={filters.cantons.length}
											totalCantonCount={filterOptions.industries.length}
										/>
								)}
								{activeChart === 'ceoGender' && (
										<ExpandableGenderAnalysisChart
											deals={filteredDeals}
											selectedGenderCount={filters.ceoGenders.length}
											totalGenderCount={filterOptions.ceoGenders.length}
										/>
								)}
								{activeChart === 'exits' && (
										<ExpandableExitsAnalysisChart
											exits={exits}
											selectedYearCount={exitsTimeline.length}
											totalYearCount={exitsTimeline.length}
										/>
								)}
							</div>
						</div>
					</div>
				</div>
		</div>
	);
};

export default Dashboard;