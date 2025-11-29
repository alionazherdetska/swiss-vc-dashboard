import { useState, useEffect, useMemo } from "react";
import FilterPanel from "../filters/FilterPanel.js";
import filterStyles from "../filters/FilterPanel.module.css";
import { TimelineChart } from "../charts/TimelineChart.js";
import { processCompanies, processDeals, generateChartData } from "../../lib/utils.js";
import ChartErrorBoundary from "../charts/common/ChartErrorBoundary.js";
import QuarterlyAnalysisChart from "../charts/QuarterlyAnalysisChart.js";
import PhaseAnalysisChart from "../charts/PhaseAnalysisChart.js";
import CantonAnalysisChart from "../charts/CantonAnalysisChart.js";
import GenderAnalysisChart from "../charts/GenderAnalysisChart.js";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const [activeChart, setActiveChart] = useState("timeline");
  
  const chartTabs = [
    { key: "timeline", label: "Total Investments/Deals" },
    { key: "quarterly", label: "Sectors" },
    { key: "phase", label: "Stages" },
    { key: "canton", label: "Canton" },
    { key: "ceoGender", label: "Gender" },
  ];

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

          // Default year range: last available year minus 10 years to last year
          const years = processedDeals.map((d) => parseInt(d.Year, 10)).filter((y) => !Number.isNaN(y));
          if (years.length) {
            const maxYear = Math.max(...years);
            const minYear = Math.min(...years);
            const startYear = Math.max(minYear, maxYear - 10);
            setGlobalFilters({ yearRange: [startYear, maxYear] });
          }
        }
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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

  const baseFilteredDeals = useMemo(() => {
    const yr = globalFilters.yearRange;
    return deals.filter((item) => {
      if (!item.Year) return false;
      if (item.Year < yr[0] || item.Year > yr[1]) return false;
      return true;
    });
  }, [deals, globalFilters.yearRange]);

  const applyChartFilters = (dataset, localFilters) => {
    if (!localFilters) return dataset;
    return dataset.filter((item) => {
      if (localFilters.industries?.length && !localFilters.industries.includes(item.Industry))
        return false;
      if (localFilters.phases?.length && !localFilters.phases.includes(item.Phase)) return false;
      if (localFilters.cantons?.length && !localFilters.cantons.includes(item.Canton)) return false;
      if (localFilters.ceoGenders?.length && !localFilters.ceoGenders.includes(item["Gender CEO"]))
        return false;
      return true;
    });
  };

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

  const chartData = useMemo(() => {
    return generateChartData("deals", [], timelineDeals);
  }, [timelineDeals]);

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
        <section className={styles.tabPanel + " " + styles.innerContainer}>
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
                <div>
                  {(() => {
                    const years =
                      filterOptions?.dealYears && filterOptions.dealYears.length
                        ? Array.from(new Set(filterOptions.dealYears))
                            .map((v) => parseInt(v, 10))
                            .filter((y) => !Number.isNaN(y) && y >= 2012 && y <= 2025)
                            .sort((a, b) => a - b)
                        : [];
                    const startOptions = years.filter((y) => y < globalFilters.yearRange[1]);
                    const endOptions = years.filter((y) => y > globalFilters.yearRange[0]);
                    const startValue = startOptions.includes(globalFilters.yearRange[0])
                      ? globalFilters.yearRange[0]
                      : startOptions[0] ?? globalFilters.yearRange[0];
                    const endValue = endOptions.includes(globalFilters.yearRange[1])
                      ? globalFilters.yearRange[1]
                      : endOptions[endOptions.length - 1] ?? globalFilters.yearRange[1];

                    return (
                      <div>
                        <div className={filterStyles.sectionTitle}>Years</div>
                        <div className={filterStyles.inputGroup}>
                          <select
                            value={startValue}
                            onChange={(e) =>
                              updateFilter("yearRange", [
                                Math.min(parseInt(e.target.value || "0"), globalFilters.yearRange[1] - 1),
                                globalFilters.yearRange[1],
                              ])
                            }
                            className={filterStyles.inputSmall}
                            disabled={startOptions.length === 0}
                          >
                            {startOptions.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                          <span className={filterStyles.textMuted}>to</span>
                          <select
                            value={endValue}
                            onChange={(e) =>
                              updateFilter("yearRange", [
                                globalFilters.yearRange[0],
                                Math.max(parseInt(e.target.value || "0"), globalFilters.yearRange[0] + 1),
                              ])
                            }
                            className={filterStyles.inputSmall}
                            disabled={endOptions.length === 0}
                          >
                            {endOptions.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className={styles.timelineMessagePlain}>
                  <h3 className={styles.overviewMessageTitle}>How to use the dashboard</h3>
                  <p className={styles.overviewMessageText}>
                    Check out the category tabs Industries, Stages, Cantons and CEO gender above
                    the graphs to filter the data from our database.
                  </p>
                  <p className={styles.overviewMessageText}>
                    HY data is visible in expanded view only.
                  </p>
                </div>
              </div>
            )}

            {activeChart === "quarterly" && (
              <ChartErrorBoundary chartName="Quarterly Analysis">
                <QuarterlyAnalysisChart
                  deals={quarterlyDeals}
                  allDeals={baseFilteredDeals}
                  selectedIndustryCount={chartFilters.quarterly.industries.length}
                  totalIndustryCount={filterOptions.industries.length}
                />
              </ChartErrorBoundary>
            )}

            {activeChart === "phase" && (
              <ChartErrorBoundary chartName="Phase Analysis">
                <PhaseAnalysisChart
                  deals={phaseDeals}
                  allDeals={baseFilteredDeals}
                  selectedPhaseCount={chartFilters.phase.phases.length}
                  totalPhaseCount={filterOptions.phases.length}
                />
              </ChartErrorBoundary>
            )}

            {activeChart === "canton" && (
              <ChartErrorBoundary chartName="Canton Analysis">
                <CantonAnalysisChart
                  deals={cantonDeals}
                  allDeals={baseFilteredDeals}
                  selectedCantonCount={chartFilters.canton.cantons.length}
                  totalCantonCount={filterOptions.cantons.length}
                />
              </ChartErrorBoundary>
            )}

            {activeChart === "ceoGender" && (
              <ChartErrorBoundary chartName="Gender Analysis">
                <GenderAnalysisChart
                  deals={genderDeals}
                  allDeals={baseFilteredDeals}
                  selectedGenderCount={chartFilters.ceoGender.ceoGenders.length}
                  totalGenderCount={filterOptions.ceoGenders.length}
                />
              </ChartErrorBoundary>
            )}

            <div className={styles.filtersWrap}>
              <FilterPanel
                filters={{
                  ...(chartFilters[activeChart] || {}),
                  yearRange: globalFilters.yearRange,
                }}
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