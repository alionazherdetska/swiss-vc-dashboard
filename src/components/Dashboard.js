import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

// Panels / components you still use
import FilterPanel from "./FilterPanel.js";
import MetricsCards from "./MetricsCards.js";
import { TimelineChart } from "./Charts.js";
import ExpandableQuarterlyAnalysisChart from "./ExpandableQuarterlyAnalysisChart.js";

// Utilities / data
import { processCompanies, processDeals, generateChartData } from "./utils";
import { SAMPLE_DATA } from "./constants";
import { COLOR_PALETTE, FIXED_INDUSTRY_COLORS } from "./colors";

const Dashboard = () => {
  // Companies only for mapping; UI is deals-only
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    industries: [],
    ceoGenders: [], // unused visually; harmless to keep
    cantons: [],
    yearRange: [2012, 2025],
    dealTypes: [],
    phases: [],
  });

  // Tab-like chart selector: "timeline" or "quarterly"
  const [activeChart, setActiveChart] = useState("timeline"); // default open

  // For industry colors (used in quarterly analysis)
  const colorMapRef = useRef(new Map(Object.entries(FIXED_INDUSTRY_COLORS)));
  const ALIASES = {
    "med tech": "MedTech",
    medtech: "MedTech",
    "fin tech": "FinTech",
    cleantech: "Cleantech",
    ict: "ICT",
  };
  const normalizeIndustry = (raw) => {
    if (!raw) return null;
    const s = String(raw).trim();
    const key = s.toLowerCase().replace(/\s+/g, " ");
    const alias = ALIASES[key];
    if (alias) return alias;
    return s
      .replace(/\s*\(.*?\)/g, "")
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };
  const getIndustryColor = useCallback((name) => {
    const norm = normalizeIndustry(name);
    if (!norm) return "#7F8C8D";
    if (colorMapRef.current.has(norm)) return colorMapRef.current.get(norm);
    const next = COLOR_PALETTE[colorMapRef.current.size % COLOR_PALETTE.length];
    colorMapRef.current.set(norm, next);
    return next;
  }, []);

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

        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter options: deals-only
  const filterOptions = useMemo(() => {
    if (!deals.length) {
      return { dealTypes: [], phases: [], dealYears: [], industries: [] };
    }
    return {
      dealTypes: [...new Set(deals.map((d) => d.Type).filter(Boolean))].sort(),
      phases: [...new Set(deals.map((d) => d.Phase).filter(Boolean))].sort(),
      dealYears: [...new Set(deals.map((d) => d.Year).filter(Boolean))].sort(),
      industries: [...new Set(deals.map((d) => d.Industry).filter(Boolean))].sort(),
    };
  }, [deals]);

  // Apply filters (deals only)
  const filteredDeals = useMemo(() => {
    return deals.filter((item) => {
      if (filters.industries.length && !filters.industries.includes(item.Industry)) return false;
      if (filters.dealTypes.length && !filters.dealTypes.includes(item.Type)) return false;
      if (filters.phases.length && !filters.phases.includes(item.Phase)) return false;
      if (filters.cantons.length && !filters.cantons.includes(item.Canton)) return false;
      if (item.Year && (item.Year < filters.yearRange[0] || item.Year > filters.yearRange[1])) return false;
      return true;
    });
  }, [deals, filters]);

  // Chart data (deals-only)
  const chartData = useMemo(() => {
    return generateChartData("deals", [], filteredDeals);
  }, [filteredDeals]);

  // Filter helpers
  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
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
      searchQuery: "",
      yearRange: [2012, 2025],
      dealTypes: [],
      phases: [],
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Swiss startup ecosystem data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 md:p-8 bg-gray-50">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="rounded-lg shadow-sm mb-6 p-8 border bg-white border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Deals ({deals.length.toLocaleString()})
            </h2>
          </div>

          <MetricsCards
            activeTab="deals"
            filteredCompanies={[]}
            filteredDeals={filteredDeals}
            filterOptions={filterOptions}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <FilterPanel
              filters={filters}
              filterOptions={filterOptions}
              activeTab="deals"
              updateFilter={updateFilter}
              toggleArrayFilter={toggleArrayFilter}
              resetFilters={resetFilters}
            />
          </div>

          {/* Charts Panel with tab-like chart selector */}
          <div className="lg:col-span-4">
            <div className="rounded-lg shadow-sm p-6 border bg-white border-gray-200">
              {/* Tab bar */}
              <div className="flex space-x-2 p-1 rounded-lg mb-6 bg-gray-100">
                <button
                  onClick={() => setActiveChart("timeline")}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                    activeChart === "timeline"
                      ? "bg-white text-red-600 shadow-sm border border-red-200"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  title="Show timeline charts"
                >
                  Timeline
                </button>
                <button
                  onClick={() => setActiveChart("quarterly")}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                    activeChart === "quarterly"
                      ? "bg-white text-red-600 shadow-sm border border-red-200"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  title="Show quarterly analysis"
                >
                  Quarterly Analysis
                </button>
              </div>

              {/* Active chart rendered by tab selection */}
              <div className="border rounded-lg p-4 border-gray-200 bg-gray-50">
                {activeChart === "timeline" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TimelineChart
                      data={chartData.timeline}
                      showVolume={true}
                      title="Overall Sum of Invested Capital by Year"
                      yLabel="Invested Capital CHF (M)"
                    />
                    <TimelineChart
                      data={chartData.timeline}
                      showVolume={false}
                      title="Overall Number of Deals by Year"
                      yLabel="Number of Deals"
                    />
                  </div>
                ) : (
                  <ExpandableQuarterlyAnalysisChart
                    deals={filteredDeals}
                    selectedIndustryCount={filters.industries.length}
                    totalIndustryCount={filterOptions.industries.length}
                  />

                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
