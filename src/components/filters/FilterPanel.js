import { useMemo } from "react";
import { OFFICIAL_CANTONS } from "../../lib/constants";
import styles from "./FilterPanel.module.css";

const Section = ({ title, children, minHeight }) => (
  <div className={styles.sectionRoot}>
    <div className={styles.sectionTitle}>{title}</div>
    <div style={{ minHeight: minHeight ? `${minHeight}px` : "auto" }}>
      {children}
    </div>
  </div>
);

const FilterPanel = ({
  filters,
  filterOptions,
  activeTab,
  updateFilter,
  toggleArrayFilter,
  resetFilters,
}) => {
  const companiesTab = activeTab === "companies";
  const dealsTab = !companiesTab;

  const ceoTotal = filterOptions.ceoGenders?.length || 0;
  const industriesTotal = filterOptions.industries?.length || 0;
  const phasesTotal = filterOptions.phases?.length || 0;

  const selectAllLabel = (selected, total) =>
    selected === total && total > 0 ? "Deselect All" : "Select All";

  // Calculate heights for each filter section
  const filterHeights = useMemo(() => {
    const heights = [];

    // Cantons: header + items (capped at max-h-60 = 240px)
    const cantonsHeight = Math.min(
      40 + (OFFICIAL_CANTONS.length + 1) * 28,
      280,
    );
    heights.push(cantonsHeight);

    // CEO Gender: header + items
    const ceoHeight = 40 + (ceoTotal + 1) * 28;
    heights.push(ceoHeight);

    // Industries: header + items (capped at max-h-60 = 240px)
    const industriesHeight = Math.min(40 + (industriesTotal + 1) * 28, 280);
    heights.push(industriesHeight);

    if (dealsTab) {
      // Phases: header + items (capped at max-h-60 = 240px)
      const phasesHeight = Math.min(40 + (phasesTotal + 1) * 28, 280);
      heights.push(phasesHeight);
    }

    // Sort and get second longest
    const sorted = [...heights].sort((a, b) => b - a);
    return sorted[1] || sorted[0] || 100;
  }, [ceoTotal, industriesTotal, phasesTotal, dealsTab]);

  return (
    <div className={styles.panelRoot}>
      <div className={styles.panelCard}>
        {/* Header with Year Range and Reset */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.inputGroup}>
              <input
                type="number"
                min="2012"
                max={filters.yearRange[1] - 1}
                value={filters.yearRange[0]}
                onChange={(e) =>
                  updateFilter("yearRange", [
                    Math.min(
                      parseInt(e.target.value || "0"),
                      filters.yearRange[1] - 1,
                    ),
                    filters.yearRange[1],
                  ])
                }
                className={styles.inputSmall}
              />
              <span className={styles.textMuted}>to</span>
              <input
                type="number"
                min={filters.yearRange[0] + 1}
                max="2025"
                value={filters.yearRange[1]}
                onChange={(e) =>
                  updateFilter("yearRange", [
                    filters.yearRange[0],
                    Math.max(
                      parseInt(e.target.value || "0"),
                      filters.yearRange[0] + 1,
                    ),
                  ])
                }
                className={styles.inputSmall}
              />
            </div>
          </div>
          <button onClick={resetFilters} className={styles.btnReset}>
            Reset
          </button>
        </div>

        <div className={styles.filtersRow}>
          {/* Industries */}
          <Section title="Industries" minHeight={filterHeights}>
            <div className={`${styles.listScroll}`}>
              <label className={`${styles.itemLabel} ${styles.itemLabelHover}`}>
                <input
                  type="checkbox"
                  checked={filters.industries.length === industriesTotal}
                  onChange={() =>
                    updateFilter(
                      "industries",
                      filters.industries.length === industriesTotal
                        ? []
                        : filterOptions.industries,
                    )
                  }
                  className={`${styles.checkbox} ${styles.checkboxPrimary}`}
                />
                <span className={styles.labelTextBold}>
                  {selectAllLabel(filters.industries.length, industriesTotal)}
                </span>
              </label>
              {filterOptions.industries?.map((industry) => (
                <label
                  key={industry}
                  className={`${styles.itemLabel} ${styles.itemLabelHover}`}
                >
                  <input
                    type="checkbox"
                    checked={filters.industries.includes(industry)}
                    onChange={() => toggleArrayFilter("industries", industry)}
                    className={`${styles.checkbox} ${styles.checkboxPrimary}`}
                  />
                  <span className={styles.labelText}>{industry}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* Deal Types or Stages */}
          {dealsTab ? (
            <Section title="Stages" minHeight={filterHeights}>
              <div className={styles.listScroll}>
                <label
                  className={`${styles.itemLabel} ${styles.itemLabelHover}`}
                >
                  <input
                    type="checkbox"
                    checked={filters.phases.length === phasesTotal}
                    onChange={() =>
                      updateFilter(
                        "phases",
                        filters.phases.length === phasesTotal
                          ? []
                          : filterOptions.phases,
                      )
                    }
                    className={`${styles.checkbox} ${styles.checkboxPrimary}`}
                  />
                  <span className={styles.labelTextBold}>
                    {selectAllLabel(filters.phases.length, phasesTotal)}
                  </span>
                </label>
                {filterOptions.phases?.map((phase) => (
                  <label
                    key={phase}
                    className={`${styles.itemLabel} ${styles.itemLabelHover}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.phases.includes(phase)}
                      onChange={() => toggleArrayFilter("phases", phase)}
                      className={`${styles.checkbox} ${styles.checkboxPrimary}`}
                    />
                    <span className={styles.labelText}>{phase}</span>
                  </label>
                ))}
              </div>
            </Section>
          ) : (
            <Section title="Stages" minHeight={filterHeights}>
              <div className="space-y-1.5">
                <label className={`${styles.itemLabel}`}>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className={`${styles.checkbox}`}
                  />
                  <span className={styles.labelTextMuted}>All</span>
                </label>
              </div>
            </Section>
          )}

          {/* CEO Gender */}
          <Section title="CEO gender" minHeight={filterHeights}>
            <div>
              <label className={`${styles.itemLabel} ${styles.itemLabelHover}`}>
                <input
                  type="checkbox"
                  checked={(filters.ceoGenders?.length || 0) === ceoTotal}
                  onChange={() =>
                    updateFilter(
                      "ceoGenders",
                      (filters.ceoGenders?.length || 0) === ceoTotal
                        ? []
                        : filterOptions.ceoGenders,
                    )
                  }
                  className={`${styles.checkbox} ${styles.checkboxPrimary}`}
                />
                <span className={styles.labelTextBold}>
                  {selectAllLabel(filters.ceoGenders?.length || 0, ceoTotal)}
                </span>
              </label>
              {filterOptions.ceoGenders?.map((gender) => (
                <label
                  key={gender}
                  className={`${styles.itemLabel} ${styles.itemLabelHover}`}
                >
                  <input
                    type="checkbox"
                    checked={filters.ceoGenders?.includes(gender) || false}
                    onChange={() => toggleArrayFilter("ceoGenders", gender)}
                    className={`${styles.checkbox} ${styles.checkboxPrimary}`}
                  />
                  <span className={styles.labelText}>{gender}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* Cantons */}
          <Section title="Cantons" minHeight={filterHeights}>
            <div className={styles.listScroll}>
              <label className={`${styles.itemLabel} ${styles.itemLabelHover}`}>
                <input
                  type="checkbox"
                  checked={filters.cantons.length === OFFICIAL_CANTONS.length}
                  onChange={() =>
                    updateFilter(
                      "cantons",
                      filters.cantons.length === OFFICIAL_CANTONS.length
                        ? []
                        : OFFICIAL_CANTONS.map((c) => c.name),
                    )
                  }
                  className={`${styles.checkbox} ${styles.checkboxPrimary}`}
                />
                <span className={styles.labelTextBold}>
                  {selectAllLabel(
                    filters.cantons.length,
                    OFFICIAL_CANTONS.length,
                  )}
                </span>
              </label>
              {OFFICIAL_CANTONS.map((canton) => (
                <label
                  key={canton.code}
                  className={`${styles.itemLabel} ${styles.itemLabelHover}`}
                >
                  <input
                    type="checkbox"
                    checked={filters.cantons.includes(canton.name)}
                    onChange={() => toggleArrayFilter("cantons", canton.name)}
                    className={`${styles.checkbox} ${styles.checkboxPrimary}`}
                  />
                  <span className={styles.labelText}>
                    {canton.name} ({canton.code})
                  </span>
                </label>
              ))}
            </div>
          </Section>

          {/* Deal types filter removed intentionally */}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
