import { useState, useEffect, useMemo } from "react";
import FilterPanel from "../filters/FilterPanel.js";
import { TimelineChart } from "../charts/TimelineChart.js";
import { processCompanies, processDeals, generateChartData } from "../../lib/utils.js";
import ChartErrorBoundary from "../charts/common/ChartErrorBoundary.js";
import QuarterlyAnalysisChart from "../charts/QuarterlyAnalysisChart.js";
import PhaseAnalysisChart from "../charts/PhaseAnalysisChart.js";
import CantonAnalysisChart from "../charts/CantonAnalysisChart.js";
import GenderAnalysisChart from "../charts/GenderAnalysisChart.js";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  // Companies only for mapping; UI is deals-only
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters: keep `yearRange` global across tabs, other filters scoped per-chart
  const [globalFilters, setGlobalFilters] = useState({
    yearRange: [2012, 2025],
  });

  const defaultChartFilters = {
    industries: [],
    ceoGenders: [],
    cantons: [],
    phases: [],
  };

  const [chartFilters, setChartFilters] = useState({
    timeline: { ...defaultChartFilters },
    quarterly: { ...defaultChartFilters },
    phase: { ...defaultChartFilters },
    canton: { ...defaultChartFilters },
    ceoGender: { ...defaultChartFilters },
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

  // Base filtered deals apply only the global yearRange
  const baseFilteredDeals = useMemo(() => {
    const yr = globalFilters.yearRange;
    return deals.filter((item) => {
      if (!item.Year) return false;
      if (item.Year < yr[0] || item.Year > yr[1]) return false;
      return true;
    });
  }, [deals, globalFilters.yearRange]);

  // Helper to filter by a chart's local filters on top of baseFilteredDeals
  const applyChartFilters = (dataset, localFilters) => {
    if (!localFilters) return dataset;
    return dataset.filter((item) => {
      if (localFilters.industries?.length && !localFilters.industries.includes(item.Industry))
        return false;
      if (localFilters.phases?.length && !localFilters.phases.includes(item.Phase)) return false;
      if (localFilters.cantons?.length && !localFilters.cantons.includes(item.Canton)) return false;
      if (
        localFilters.ceoGenders?.length &&
        !localFilters.ceoGenders.includes(item["Gender CEO"])
      )
        return false;
      return true;
    });
  };

  // Chart-specific filtered datasets
  const timelineDeals = useMemo(
    () => applyChartFilters(baseFilteredDeals, chartFilters.timeline),
    [baseFilteredDeals, chartFilters.timeline]
  );

  const quarterlyDeals = useMemo(
    () => applyChartFilters(baseFilteredDeals, chartFilters.quarterly),
    [baseFilteredDeals, chartFilters.quarterly]
  );

  const phaseDeals = useMemo(
    () => applyChartFilters(baseFilteredDeals, chartFilters.phase),
    [baseFilteredDeals, chartFilters.phase]
  );

  const cantonDeals = useMemo(
    () => applyChartFilters(baseFilteredDeals, chartFilters.canton),
    [baseFilteredDeals, chartFilters.canton]
  );

  const genderDeals = useMemo(
    () => applyChartFilters(baseFilteredDeals, chartFilters.ceoGender),
    [baseFilteredDeals, chartFilters.ceoGender]
  );

  // Chart data (deals-only) for timeline
  const chartData = useMemo(() => {
    return generateChartData("deals", [], timelineDeals);
  }, [timelineDeals]);

  // Filter helpers: yearRange is global; other filters are chart-scoped
  const updateFilter = (key, value) => {
    if (key === "yearRange") {
      setGlobalFilters((prev) => ({ ...prev, yearRange: value }));
      return;
    }
    setChartFilters((prev) => ({
      ...prev,
      [activeChart]: { ...(prev[activeChart] || {}), [key]: value },
    }));
  };

  const toggleArrayFilter = (key, value) => {
    setChartFilters((prev) => {
      const arr = prev[activeChart]?.[key] || [];
      const next = arr.includes(value) ? arr.filter((i) => i !== value) : [...arr, value];
      return { ...prev, [activeChart]: { ...(prev[activeChart] || {}), [key]: next } };
    });
  };

  const resetFilters = () => {
    setChartFilters((prev) => ({ ...prev, [activeChart]: { ...defaultChartFilters } }));
  };

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
                      title="Invested Capital"
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
                  deals={quarterlyDeals}
                  selectedIndustryCount={chartFilters.quarterly.industries.length}
                  totalIndustryCount={filterOptions.industries.length}
                />
              </ChartErrorBoundary>
            )}

            {activeChart === "phase" && (
              <ChartErrorBoundary chartName="Phase Analysis">
                <PhaseAnalysisChart
                  deals={phaseDeals}
                  selectedPhaseCount={chartFilters.phase.phases.length}
                  totalPhaseCount={filterOptions.phases.length}
                />
              </ChartErrorBoundary>
            )}

            {activeChart === "canton" && (
              <ChartErrorBoundary chartName="Canton Analysis">
                <CantonAnalysisChart
                  deals={cantonDeals}
                  selectedCantonCount={chartFilters.canton.cantons.length}
                  totalCantonCount={filterOptions.cantons.length}
                />
              </ChartErrorBoundary>
            )}

            {activeChart === "ceoGender" && (
              <ChartErrorBoundary chartName="Gender Analysis">
                <GenderAnalysisChart
                  deals={genderDeals}
                  selectedGenderCount={chartFilters.ceoGender.ceoGenders.length}
                  totalGenderCount={filterOptions.ceoGenders.length}
                />
              </ChartErrorBoundary>
            )}

            <div className={styles.filtersWrap}>
              <FilterPanel
                filters={{ ...(chartFilters[activeChart] || {}), yearRange: globalFilters.yearRange }}
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
