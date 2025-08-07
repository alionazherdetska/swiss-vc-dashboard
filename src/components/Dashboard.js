// Dashboard.jsx - Fixed Version
import React, { useState, useEffect, useMemo } from "react";
import { BarChart3 } from "lucide-react";

// Import our modular components
import FilterPanel from "./FilterPanel.js";
import MetricsCards from "./MetricsCards.js";
import ChartSelector from "./ChartSelector.js";
import InsightsPanel from "./InsightsPanel.js";
import {
  TimelineChart,
  IndustryDistributionChart,
  GeographicDistributionChart,
  IndustryTrendsChart,
  FundingAnalysisChart,
  PhaseAnalysisChart,
} from "./Charts.js";
import { Building2, Handshake } from "./CustomIcons.js";

// Import utilities and constants
import { processCompanies, processDeals, generateChartData } from "./utils";
import { SAMPLE_DATA, getChartOptions } from "./constants";

const Dashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activeTab, setActiveTab] = useState("companies");
  const [filters, setFilters] = useState({
    industries: [],
    cantons: [],
    searchQuery: "",
    yearRange: [2015, 2025],
    dealTypes: [],
    phases: [],
  });
  const [activeChartType, setActiveChartType] = useState("timeline");
  const [loading, setLoading] = useState(true);

  // Load and process data
  useEffect(() => {
    const loadData = async () => {
      try {
        let jsonData;

        if (window.startupData) {
          jsonData = window.startupData;
        } else {
          jsonData = SAMPLE_DATA;
        }

        // Process Companies data
        if (jsonData.Companies) {
          const processedCompanies = processCompanies(jsonData.Companies);
          setCompanies(processedCompanies);
        }

        // Process Deals data
        if (jsonData.Deals) {
          const processedDeals = processDeals(jsonData.Deals);
          setDeals(processedDeals);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate filter options
  const filterOptions = useMemo(() => {
    const companyOptions = companies.length
      ? {
          industries: [
            ...new Set(
              companies.map((d) => d.Industry).filter((i) => i && i !== "Other")
            ),
          ].sort(),
          years: [
            ...new Set(companies.map((d) => d.Year).filter((y) => y)),
          ].sort(),
        }
      : { industries: [], years: [] };

    const dealOptions = deals.length
      ? {
          dealTypes: [
            ...new Set(deals.map((d) => d.Type).filter((t) => t)),
          ].sort(),
          phases: [
            ...new Set(deals.map((d) => d.Phase).filter((p) => p)),
          ].sort(),
          dealYears: [
            ...new Set(deals.map((d) => d.Year).filter((y) => y)),
          ].sort(),
        }
      : { dealTypes: [], phases: [], dealYears: [] };

    return { ...companyOptions, ...dealOptions };
  }, [companies, deals]);

  // Apply filters
  const filteredCompanies = useMemo(() => {
    return companies.filter((item) => {
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch =
          item.Company?.toLowerCase().includes(searchLower) ||
          item.Industry?.toLowerCase().includes(searchLower) ||
          item.Canton?.toLowerCase().includes(searchLower) ||
          item.City?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (
        filters.industries.length &&
        !filters.industries.includes(item.Industry)
      )
        return false;
      if (filters.cantons.length && !filters.cantons.includes(item.Canton))
        return false;
      if (
        item.Year &&
        (item.Year < filters.yearRange[0] || item.Year > filters.yearRange[1])
      )
        return false;
      return true;
    });
  }, [companies, filters]);

  const filteredDeals = useMemo(() => {
    return deals.filter((item) => {
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch =
          item.Company?.toLowerCase().includes(searchLower) ||
          item.Type?.toLowerCase().includes(searchLower) ||
          item.Phase?.toLowerCase().includes(searchLower) ||
          item.Canton?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.dealTypes.length && !filters.dealTypes.includes(item.Type))
        return false;
      if (filters.phases.length && !filters.phases.includes(item.Phase))
        return false;
      if (filters.cantons.length && !filters.cantons.includes(item.Canton))
        return false;
      if (
        item.Year &&
        (item.Year < filters.yearRange[0] || item.Year > filters.yearRange[1])
      )
        return false;
      return true;
    });
  }, [deals, filters]);

  // Generate chart data
  const chartData = useMemo(() => {
    return generateChartData(activeTab, filteredCompanies, filteredDeals);
  }, [activeTab, filteredCompanies, filteredDeals]);

  // Filter update functions
  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  const resetFilters = () => {
    setFilters({
      industries: [],
      cantons: [],
      searchQuery: "",
      yearRange: [2015, 2025],
      dealTypes: [],
      phases: [],
    });
  };

  // Chart rendering function
  const renderChart = () => {
    const chartOptions = getChartOptions(activeTab);

    switch (activeChartType) {
      case "timeline":
        return <TimelineChart data={chartData.timeline} />;
      case "industry-distribution":
        let industryData =
          activeTab === "companies"
            ? chartData.industries || []
            : chartData.types || [];
        industryData = industryData.filter((d) => d.name !== "Unknown");
        return (
          <IndustryDistributionChart
            data={industryData}
            activeTab={activeTab}
          />
        );
      case "geographic-distribution":
        return <GeographicDistributionChart data={chartData.cantons} />;
      case "industry-trends":
        // 🔧 FIX: Pass both filters and filterOptions to the chart
        return (
          <IndustryTrendsChart
            data={chartData.industryTrends}
            filters={filters}
            filterOptions={filterOptions}
            activeTab={activeTab}
          />
        );
      case "funding-analysis":
        if (activeTab === "companies") {
          return (
            <FundingAnalysisChart
              data={chartData.funded}
              activeTab={activeTab}
            />
          );
        } else {
          return (
            <FundingAnalysisChart
              data={chartData.scatter}
              activeTab={activeTab}
            />
          );
        }
      case "phase-analysis":
        const phaseData = chartData.phases || chartData.amounts || [];
        return <PhaseAnalysisChart data={phaseData} />;
      default:
        return (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a visualization type</p>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading Swiss startup ecosystem data...
          </p>
        </div>
      </div>
    );
  }

  const currentData =
    activeTab === "companies" ? filteredCompanies : filteredDeals;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Swiss Startup Ecosystem Dashboard
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Analysis of {companies.length.toLocaleString()} companies and{" "}
            {deals.length.toLocaleString()} deals
          </p>

          {/* Tab Navigation */}
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => {
                setActiveTab("companies");
                setActiveChartType("timeline");
              }}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "companies"
                  ? "bg-white text-red-600 shadow-sm border border-red-200"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              Companies ({companies.length.toLocaleString()})
            </button>
            <button
              onClick={() => {
                setActiveTab("deals");
                setActiveChartType("timeline");
              }}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "deals"
                  ? "bg-white text-red-600 shadow-sm border border-red-200"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Handshake className="h-4 w-4 inline mr-2" />
              Deals ({deals.length.toLocaleString()})
            </button>
          </div>

          {/* Key Metrics Cards */}
          <MetricsCards
            activeTab={activeTab}
            filteredCompanies={filteredCompanies}
            filteredDeals={filteredDeals}
            filterOptions={filterOptions}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <FilterPanel
              filters={filters}
              filterOptions={filterOptions}
              activeTab={activeTab}
              updateFilter={updateFilter}
              toggleArrayFilter={toggleArrayFilter}
              resetFilters={resetFilters}
            />
          </div>

          {/* Charts Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              {/* Chart Type Selector */}
              <ChartSelector
                activeTab={activeTab}
                activeChartType={activeChartType}
                setActiveChartType={setActiveChartType}
              />

              {/* Chart Title */}
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-800">
                  {getChartOptions(activeTab).find(
                    (opt) => opt.key === activeChartType
                  )?.name || "Chart"}
                </h3>
                <p className="text-sm text-gray-600">
                  {activeTab === "companies" ? "Company" : "Deal"} data
                  visualization
                </p>
              </div>

              {/* Active Chart */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                {renderChart()}
              </div>

              {/* Data Insights */}
              <InsightsPanel
                activeTab={activeTab}
                currentData={currentData}
                companies={companies}
                deals={deals}
                filteredCompanies={filteredCompanies}
                filteredDeals={filteredDeals}
                chartData={chartData}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="flex items-center justify-center">
            <Building2 className="h-4 w-4 mr-2" />
            Swiss Startup Ecosystem Dashboard | Inspired by Swiss Venture
            Capital Report 2025
          </p>
          <p className="mt-1 text-xs">
            Data visualization for entrepreneurship and innovation analysis
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
