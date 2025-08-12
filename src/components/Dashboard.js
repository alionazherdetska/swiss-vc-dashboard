import { BarChart3, Moon, Sun } from "lucide-react";
import React, {useState, useEffect, useMemo, useRef, useCallback} from "react";

// Import our modular components
import FilterPanel from "./FilterPanel.js";
import MetricsCards from "./MetricsCards.js";
import { TopIndustriesBarChart } from "./Charts.js";
import ChartSelector from "./ChartSelector.js";
import InsightsPanel from "./InsightsPanel.js";
import {
  TimelineChart,
  IndustryDistributionChart,
  GeographicDistributionChart,
  IndustryTrendsChart,
  FundingAnalysisChart,
  PhaseAnalysisChart,
  QuarterlyAnalysisChart,
} from "./Charts.js";
import { Building2, Handshake } from "./CustomIcons.js";
import { processCompanies, processDeals, generateChartData } from "./utils";
import { SAMPLE_DATA, getChartOptions, VOLUME_OPTIONS } from "./constants";
import { COLOR_PALETTE, FIXED_INDUSTRY_COLORS } from "./colors";


const Dashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activeTab, setActiveTab] = useState("companies");
  const [filters, setFilters] = useState({
    industries: [],
    ceoGenders: [],
    cantons: [],
    yearRange: [2012, 2025],
    dealTypes: [],
    phases: [],
  });
  const [activeChartType, setActiveChartType] = useState("timeline");
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("");
// Import utilities and constants


  // keep a stable map that starts with your fixed colors
  const colorMapRef = useRef(new Map(Object.entries(FIXED_INDUSTRY_COLORS)));

  const ALIASES = {
    "med tech": "MedTech",
    "medtech": "MedTech",
    "fin tech": "FinTech",
    "cleantech": "Cleantech",
    "ict": "ICT",
    // add common variants you see
  };

  const normalizeIndustry = (raw) => {
    if (!raw) return null;
    const s = String(raw).trim();
    const key = s.toLowerCase().replace(/\s+/g, " ");
    const alias = ALIASES[key];
    if (alias) return alias;

    // Title-case canonicalization fallback
    return s
        .replace(/\s*\(.*?\)/g, "")
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
  };

  const getIndustryColor = useCallback((name) => {
    const norm = normalizeIndustry(name);
    if (!norm) return "#7F8C8D"; // neutral gray for unknown

    if (colorMapRef.current.has(norm)) {
      return colorMapRef.current.get(norm);
    }
    // assign next fallback color and remember it (stable across filters)
    const next = COLOR_PALETTE[colorMapRef.current.size % COLOR_PALETTE.length];
    colorMapRef.current.set(norm, next);
    return next;
  }, []);


  // Dark mode toggle
  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

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
          ceoGenders: [
            ...new Set(
              companies
                .map((d) => d["Gender CEO"] || d.GenderCEO)
                .filter((g) => g && g !== "Unknown")
            ),
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

      if (
        filters.industries.length &&
        !filters.industries.includes(item.Industry)
      )
        return false;
      if (
        filters.ceoGenders.length &&
        !filters.ceoGenders.includes(item["Gender CEO"] || item.GenderCEO)
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
  console.log("timeline sample:", chartData.timeline?.[0]);


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
      yearRange: [2012, 2025],
      dealTypes: [],
      phases: [],
    });
  };

  // Chart rendering function
  const renderChart = () => {
    const chartOptions = getChartOptions(activeTab);

    switch (activeChartType) {
      case "timeline":
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Sum of invested capital */}
              <TimelineChart
                  data={chartData.timeline}
                  showVolume={true}
                  isDark={isDark}
                  title="Overall Sum of Invested Capital by Year"
                  yLabel="Invested Capital CHF (M)"                 // exact Y-axis label you asked for
              />

              {/* Right: Count of deals */}
              <TimelineChart
                  data={chartData.timeline}
                  showVolume={false}
                  isDark={isDark}
                  title="Overall Number of Deals by Year"
                  yLabel="Number of Deals"
              />
            </div>
        );



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
            isDark={isDark}
          />
        );
      case "top-industries-bar":
        return (
          <TopIndustriesBarChart
            data={activeTab === "companies" ? chartData.industries : chartData.types}
            isDark={isDark}
          />
        );
      case "geographic-distribution":
        return <GeographicDistributionChart data={chartData.cantons} isDark={isDark} />;
      case "industry-trends":
        return (
          <IndustryTrendsChart
            data={chartData.industryTrends}
            filters={filters}
            filterOptions={filterOptions}
            activeTab={activeTab}
            isDark={isDark}
          />
        );
      case "quarterly-analysis":
        return (
            <QuarterlyAnalysisChart
                deals={filteredDeals}
                isDark={isDark}
                colorOf={getIndustryColor}   // pass down
            />
        );

      case "funding-analysis":
        if (activeTab === "companies") {
          return (
            <FundingAnalysisChart
              data={chartData.funded}
              activeTab={activeTab}
              isDark={isDark}
            />
          );
        } else {
          return (
            <FundingAnalysisChart
              data={chartData.scatter}
              activeTab={activeTab}
              isDark={isDark}
            />
          );
        }
      case "phase-analysis":
        const phaseData = chartData.phases || chartData.amounts || [];
        return <PhaseAnalysisChart data={phaseData} isDark={isDark} />;
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
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${isDark ? 'border-blue-400' : 'border-red-600'}`}></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Loading Swiss startup ecosystem data...
          </p>
        </div>
      </div>
    );
  }

  const currentData =
    activeTab === "companies" ? filteredCompanies : filteredDeals;

  return (
    <div className={`min-h-screen p-4 md:p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 z-50 p-3 rounded-full border transition-all duration-300 hover:scale-105"
          style={{
            background: isDark ? '#1F2937' : '#ffffff',
            borderColor: isDark ? '#374151' : '#E5E7EB',
            color: isDark ? '#F9FAFB' : '#1F2937',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Header */}
        <div className={`rounded-lg shadow-sm mb-6 p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center mb-2">
            <img
              src="/logo.png"
              alt="Swiss Startup Ecosystem Logo"
              className="h-24 mr-6 mb-4 mt-4"
              style={{ minWidth: "4rem" }}
            />
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Swiss Startup Ecosystem Dashboard
              </h1>
              <p className={`text-lg mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Analysis of {companies.length.toLocaleString()} companies and{" "}
                {deals.length.toLocaleString()} deals
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={`flex space-x-2 p-1 rounded-lg mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <button
              onClick={() => {
                setActiveTab("companies");
                setActiveChartType("timeline");
              }}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "companies"
                  ? isDark 
                    ? "bg-gray-600 text-red-400 shadow-sm border border-red-600"
                    : "bg-white text-red-600 shadow-sm border border-red-200"
                  : isDark
                    ? "text-gray-300 hover:text-gray-100"
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
                  ? isDark 
                    ? "bg-gray-600 text-red-400 shadow-sm border border-red-600"
                    : "bg-white text-red-600 shadow-sm border border-red-200"
                  : isDark
                    ? "text-gray-300 hover:text-gray-100"
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
            isDark={isDark}
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
              isDark={isDark}
            />
          </div>

          {/* Charts Panel */}
          <div className="lg:col-span-3">
            <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* Chart Type Selector */}
              <ChartSelector
                activeTab={activeTab}
                activeChartType={activeChartType}
                setActiveChartType={setActiveChartType}
                isDark={isDark}
              />

              {/* Chart Title */}
              <div className="mb-4">
                <h3 className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {getChartOptions(activeTab).find(
                    (opt) => opt.key === activeChartType
                  )?.name || "Chart"}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activeTab === "companies" ? "Company" : "Deal"} data
                  visualization
                </p>
              </div>

              {/* Active Chart */}
              <div className={`border rounded-lg p-4 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
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
                isDark={isDark}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-8 text-center text-sm p-4 rounded-lg shadow-sm border ${isDark ? 'text-gray-400 bg-gray-800 border-gray-700' : 'text-gray-500 bg-white border-gray-200'}`}>
          <p className="flex items-center justify-center">
            <Building2 className="h-4 w-4 mr-2" />
            Swiss Startup Ecosystem Dashboard | Inspired by Swiss Venture
            Capital Report 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;