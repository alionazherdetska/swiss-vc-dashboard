import { useState, useEffect, useMemo } from "react";
import FilterPanel from "./filters/FilterPanel.js";
import { TimelineChart } from "./charts/TimelineChart.js";
import { processCompanies, processDeals, generateChartData } from "../lib/utils";
import ChartErrorBoundary from "./charts/shared/ChartErrorBoundary.js";
import QuarterlyAnalysisChart from "./charts/QuarterlyAnalysisChart.js";
import PhaseAnalysisChart from "./charts/PhaseAnalysisChart.js";
import CantonAnalysisChart from "./charts/CantonAnalysisChart.js";
import GenderAnalysisChart from "./charts/GenderAnalysisChart.js";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  // Companies only for mapping; UI is deals-only
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    industries: [],
    ceoGenders: [], // Now used for deals filtering
    cantons: [],
    yearRange: [2012, 2025],
    phases: [],
  });

  const [activeChart, setActiveChart] = useState("timeline"); // default open
  const chartTabs = [
    { key: "timeline", label: "Total Investments/Deals" },
    { key: "quarterly", label: "Sectors" },
    { key: "phase", label: "Stages" },
    { key: "canton", label: "Canton" },
    { key: "ceoGender", label: "Gender" },
  ];

  // Load & process data (from window.startupData prepared in App)
  useEffect(() => {
    const loadData = async () => {
      try {
        const jsonData = window.startupData || {};
        let processedCompanies = [];
        let processedDeals = [];

        if (jsonData.Companies) {
          processedCompanies = processCompanies(jsonData.Companies);
        }

        if (jsonData.Deals) {
          processedDeals = processDeals(jsonData.Deals, processedCompanies);
          setDeals(processedDeals);
        }
      } catch (e) {
        // swallow and proceed to hide loader
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Removed dynamic width measurement logic; CSS handles layout

  // Filter options: deals-only, include phases, years, industries, cantons, CEO genders
  const filterOptions = useMemo(() => {
    if (!deals.length) {
      return {
        phases: [],
        dealYears: [],
        industries: [],
        cantons: [],
        ceoGenders: [],
      };
    }
    return {
      phases: [...new Set(deals.map((d) => d.Phase).filter(Boolean))].sort(),
      dealYears: [...new Set(deals.map((d) => d.Year).filter(Boolean))].sort(),
      industries: [...new Set(deals.map((d) => d.Industry).filter(Boolean))].sort(),
      cantons: [...new Set(deals.map((d) => d.Canton).filter(Boolean))].sort(),
      ceoGenders: [...new Set(deals.map((d) => d["Gender CEO"]).filter(Boolean))].sort(),
    };
  }, [deals]);

  // Apply filters (deals only, now including CEO gender filter)
  const filteredDeals = useMemo(() => {
    return deals.filter((item) => {
      if (filters.industries.length && !filters.industries.includes(item.Industry)) return false;
      // dealTypes filter removed
      if (filters.phases.length && !filters.phases.includes(item.Phase)) return false;
      if (filters.cantons.length && !filters.cantons.includes(item.Canton)) return false;
      if (filters.ceoGenders.length && !filters.ceoGenders.includes(item["Gender CEO"]))
        return false;
      if (item.Year && (item.Year < filters.yearRange[0] || item.Year > filters.yearRange[1]))
        return false;
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
      ceoGenders: [],
      searchQuery: "",
      yearRange: [2012, 2025],
      phases: [],
    });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.textCenter}>
          <div className={styles.spinner} />
          <p className={styles.textMuted}>Loading Swiss startup ecosystem data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 ${styles.dashboardContainer}`}>
      <div className="inner-panel">
        {/* Charts Panel with tab-like chart selector */}
        <section className={styles.tabPanel + " " + styles.innerContainer}>
          {/* Tab bar */}
          <div className={styles.tabBarWrap}>
            <div className={styles.tabBar}>
              {chartTabs.map((tab) => {
                const isActive = activeChart === tab.key;
                const btnClass = `${styles.tabButton} ${isActive ? styles.active : styles.inactive}`;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveChart(tab.key)}
                    className={btnClass}
                    title={tab.label}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active chart rendered by tab selection */}
          <div className={styles.chartsArea}>
            {activeChart === "timeline" && (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 ${styles.timelineGrid || ""}`}>
                  <ChartErrorBoundary chartName="Timeline Volume">
                    <TimelineChart
                      data={chartData.timeline}
                      showVolume={true}
                      title="Invested Capital by Year"
                      yLabel="Invested Capital CHF (M)"
                    />
                  </ChartErrorBoundary>
                  <ChartErrorBoundary chartName="Timeline Count">
                    <TimelineChart
                      data={chartData.timeline}
                      showVolume={false}
                      title="Number of Deals by Year"
                      yLabel="Number of Deals"
                    />
                  </ChartErrorBoundary>
                </div>
            )}

            {activeChart === "quarterly" && (
              <ChartErrorBoundary chartName="Quarterly Analysis">
                <QuarterlyAnalysisChart
                  deals={filteredDeals}
                  selectedIndustryCount={filters.industries.length}
                  totalIndustryCount={filterOptions.industries.length}
                />
              </ChartErrorBoundary>
            )}

            {activeChart === "phase" && (
              <ChartErrorBoundary chartName="Phase Analysis">
                <PhaseAnalysisChart
                  deals={filteredDeals}
                  selectedPhaseCount={filters.phases.length}
                  totalPhaseCount={filterOptions.phases.length}
                />
              </ChartErrorBoundary>
            )}

            {activeChart === "canton" && (
              <ChartErrorBoundary chartName="Canton Analysis">
                <CantonAnalysisChart
                  deals={filteredDeals}
                  selectedCantonCount={filters.cantons.length}
                  totalCantonCount={filterOptions.cantons.length}
                />
              </ChartErrorBoundary>
            )}

            {activeChart === "ceoGender" && (
              <ChartErrorBoundary chartName="Gender Analysis">
                <GenderAnalysisChart
                  deals={filteredDeals}
                  selectedGenderCount={filters.ceoGenders.length}
                  totalGenderCount={filterOptions.ceoGenders.length}
                />
              </ChartErrorBoundary>
            )}

            <div className={styles.filtersWrap}>
              <FilterPanel
                filters={filters}
                filterOptions={filterOptions}
                activeTab="deals"
                activeChart={activeChart}
                updateFilter={updateFilter}
                toggleArrayFilter={toggleArrayFilter}
                resetFilters={resetFilters}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
