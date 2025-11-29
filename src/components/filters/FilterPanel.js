import { useMemo } from "react";
import {
  OFFICIAL_CANTONS,
  CANTON_COLOR_MAP,
  INDUSTRY_COLOR_MAP,
  CEO_GENDER_COLOR_MAP,
  STAGE_COLOR_MAP,
  PRIMARY_CANTON_ORDER_CODES,
  OTHER_CANTON_CODES,
} from "../../lib/constants";
import styles from "./FilterPanel.module.css";

const Section = ({ title, children, minHeight, onReset, plain }) => (
  <div className={plain ? styles.sectionRootPlain : styles.sectionRoot}>
    <div className={styles.sectionHeader}>
      <div className={styles.sectionTitle}>{title}</div>
      {onReset ? (
        <button type="button" className={styles.sectionReset} onClick={onReset}>
          Reset
        </button>
      ) : null}
    </div>
    <div style={{ minHeight: minHeight ? `${minHeight}px` : "auto" }}>{children}</div>
  </div>
);

const FilterPanel = ({
  filters,
  filterOptions,
  activeTab,
  activeChart,
  updateFilter,
  toggleArrayFilter,
  resetFilters,
}) => {
  const companiesTab = activeTab === "companies";
  const dealsTab = !companiesTab;

  // Use centralized canton groupings: primary preview list + grouped "Other"
  const PRIMARY_CANTON_ORDER = PRIMARY_CANTON_ORDER_CODES;
  const OTHER_CANTON_CODES_LOCAL = OTHER_CANTON_CODES;

  const allowedCantons = useMemo(() => {
    const map = OFFICIAL_CANTONS.reduce((acc, c) => {
      acc[c.code] = c;
      return acc;
    }, {});
    return PRIMARY_CANTON_ORDER.map((code) => map[code]).filter(Boolean);
  }, [PRIMARY_CANTON_ORDER]);

  const otherCantons = useMemo(
    () => OFFICIAL_CANTONS.filter((c) => OTHER_CANTON_CODES_LOCAL.includes(c.code)),
    [OTHER_CANTON_CODES_LOCAL]
  );

  const displayCantons = useMemo(() => [...allowedCantons, { name: "Other", code: "OTHER" }], [allowedCantons]);

  // Determine which filter should be primary (checkboxes with colors)
  // On Overview tab (timeline), all filters should show as checkboxes with "All" labels
  const isOverviewTab = activeChart === "timeline";
  const isCantonPrimary = activeChart === "canton";
  const isIndustryPrimary = activeChart === "quarterly";
  const isPhasePrimary = activeChart === "phase";
  const isGenderPrimary = activeChart === "ceoGender";

  const ceoTotal = filterOptions.ceoGenders?.length || 0;
  const industriesTotal = filterOptions.industries?.length || 0;
  const phasesTotal = filterOptions.phases?.length || 0;

  // Calculate heights for each filter section
  const filterHeights = useMemo(() => {
    const heights = [];

    // Cantons: header + items (subset, no scroll)
    const cantonsHeight = 40 + (displayCantons.length + 1) * 28;
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
  }, [ceoTotal, industriesTotal, phasesTotal, dealsTab, displayCantons.length]);

  return (
    <div className={styles.panelRoot}>
      {isOverviewTab ? (
        // Overview layout: Years + All checkboxes in one column + Message
        <div className={styles.filtersRowOverview}>
          {/* Column 1 (Years) removed from FilterPanel overview — moved to dashboard timeline grid */}

          {/* Column 2 removed for the Timeline overview per design (no boxed header or checkboxes) */}

          {/* Column 3 removed - reset now inside Industries section */}

          {/* Column 4 removed - message moved to dashboard layout */}
        </div>
      ) : (
        // Regular layout for other tabs
        <div className={styles.filtersRow}>
          {/* Years */}
          {/* Removed onReset to hide reset button for Years */}
          <Section title="Years" minHeight={filterHeights} plain>
            <div className={styles.inputGroup}>
              {(() => {
                const years =
                  filterOptions?.dealYears && filterOptions.dealYears.length
                    ? Array.from(new Set(filterOptions.dealYears))
                        .map((v) => parseInt(v, 10))
                        .filter((y) => !Number.isNaN(y) && y >= 2012 && y <= 2025)
                        .sort((a, b) => a - b)
                    : [];
                const startOptions = years.filter((y) => y < filters.yearRange[1]);
                const endOptions = years.filter((y) => y > filters.yearRange[0]);
                const startValue = startOptions.includes(filters.yearRange[0])
                  ? filters.yearRange[0]
                  : startOptions[0] ?? filters.yearRange[0];
                const endValue = endOptions.includes(filters.yearRange[1])
                  ? filters.yearRange[1]
                  : endOptions[endOptions.length - 1] ?? filters.yearRange[1];
                return (
                  <>
                    <select
                      value={startValue}
                      onChange={(e) =>
                        updateFilter("yearRange", [
                          Math.min(parseInt(e.target.value || "0"), filters.yearRange[1] - 1),
                          filters.yearRange[1],
                        ])
                      }
                      className={styles.inputSmall}
                      disabled={startOptions.length === 0}
                    >
                      {startOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <span className={styles.textMuted}>to</span>
                    <select
                      value={endValue}
                      onChange={(e) =>
                        updateFilter("yearRange", [
                          filters.yearRange[0],
                          Math.max(parseInt(e.target.value || "0"), filters.yearRange[0] + 1),
                        ])
                      }
                      className={styles.inputSmall}
                      disabled={endOptions.length === 0}
                    >
                      {endOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </>
                );
              })()}
            </div>
          </Section>

          {/* Industries */}
          <Section
            title="Industries"
            minHeight={filterHeights}
            onReset={() => updateFilter("industries", [])}
          >
            <div className={`${styles.listNoScroll}`}>
              {isOverviewTab ? (
                // Overview tab: single checkbox "All Industries"
                <label className={`${styles.itemLabel}`}>
                  <input type="checkbox" checked={true} disabled className={`${styles.checkbox}`} />
                  <span className={styles.labelText}>All Industries</span>
                </label>
              ) : isIndustryPrimary ? (
                // Checkboxes with colors for primary mode
                <>
                  <label className={`${styles.itemLabel} ${styles.itemLabelHover}`}>
                    <input
                      type="checkbox"
                      checked={filters.industries.length === industriesTotal}
                      onChange={() =>
                        updateFilter(
                          "industries",
                          filters.industries.length === industriesTotal
                            ? []
                            : filterOptions.industries
                        )
                      }
                      className={styles.checkboxAll}
                    />
                    <span className={styles.labelTextBold}>All</span>
                  </label>
                  {filterOptions.industries?.map((industry) => {
                    const color = INDUSTRY_COLOR_MAP[industry] || "#999";
                    return (
                      <label
                        key={industry}
                        className={`${styles.itemLabel} ${styles.itemLabelIndented} ${styles.itemLabelHover}`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.industries.includes(industry)}
                          onChange={() => toggleArrayFilter("industries", industry)}
                          className={`${styles.checkbox} ${styles.checkboxColored}`}
                          style={{
                            "--checkbox-bg-color": color,
                          }}
                        />
                        <span className={styles.labelText}>{industry}</span>
                      </label>
                    );
                  })}
                </>
              ) : (
                // Checkbox for "All" with radio buttons for secondary mode
                <>
                  <label className={`${styles.itemLabel} ${styles.itemLabelHover}`}>
                    <input
                      type="checkbox"
                      checked={filters.industries.length === 0}
                      onChange={() => updateFilter("industries", [])}
                      className={styles.checkbox}
                    />
                    <span className={styles.labelTextBold}>All</span>
                  </label>
                  {filterOptions.industries?.map((industry) => (
                    <label
                      key={industry}
                      className={`${styles.itemLabel} ${styles.itemLabelIndented} ${styles.itemLabelHover}`}
                    >
                      <input
                        type="radio"
                        name="industry-radio"
                        checked={
                          filters.industries.length === 1 && filters.industries[0] === industry
                        }
                        onChange={() => updateFilter("industries", [industry])}
                        className={styles.radio}
                      />
                      <span className={styles.labelText}>{industry}</span>
                    </label>
                  ))}
                </>
              )}
            </div>
          </Section>

          {/* Stack: Stages + CEO gender in one column */}
          <div className={styles.stackColumn}>
            {dealsTab ? (
              <Section title="Stages" onReset={() => updateFilter("phases", [])}>
                <div className={styles.listScroll}>
                  {isOverviewTab ? (
                    // Overview tab: single checkbox "All Stages"
                    <label className={`${styles.itemLabel}`}>
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className={`${styles.checkbox}`}
                      />
                      <span className={styles.labelText}>All Stages</span>
                    </label>
                  ) : isPhasePrimary ? (
                    // Checkboxes with colors for primary mode
                    <>
                      <label className={`${styles.itemLabel} ${styles.itemLabelHover}`}>
                        <input
                          type="checkbox"
                          checked={filters.phases.length === phasesTotal}
                          onChange={() =>
                            updateFilter(
                              "phases",
                              filters.phases.length === phasesTotal ? [] : filterOptions.phases
                            )
                          }
                          className={styles.checkboxAll}
                        />
                        <span className={styles.labelTextBold}>All</span>
                      </label>
                      {filterOptions.phases?.map((phase) => {
                        const color = STAGE_COLOR_MAP[phase] || "#999";
                        return (
                          <label
                            key={phase}
                            className={`${styles.itemLabel} ${styles.itemLabelIndented} ${styles.itemLabelHover}`}
                          >
                            <input
                              type="checkbox"
                              checked={filters.phases.includes(phase)}
                              onChange={() => toggleArrayFilter("phases", phase)}
                              className={`${styles.checkbox} ${styles.checkboxColored}`}
                              style={{
                                "--checkbox-bg-color": color,
                              }}
                            />
                            <span className={styles.labelText}>{phase}</span>
                          </label>
                        );
                      })}
                    </>
                  ) : (
                    // Checkbox for "All" with radio buttons for secondary mode
                    <>
                      <label className={`${styles.itemLabel} ${styles.itemLabelHover}`}>
                        <input
                          type="checkbox"
                          checked={filters.phases.length === 0}
                          onChange={() => updateFilter("phases", [])}
                          className={styles.checkbox}
                        />
                        <span className={styles.labelTextBold}>All</span>
                      </label>
                      {filterOptions.phases?.map((phase) => (
                        <label
                          key={phase}
                          className={`${styles.itemLabel} ${styles.itemLabelIndented} ${styles.itemLabelHover}`}
                        >
                          <input
                            type="radio"
                            name="phase-radio"
                            checked={filters.phases.length === 1 && filters.phases[0] === phase}
                            onChange={() => updateFilter("phases", [phase])}
                            className={styles.radio}
                          />
                          <span className={styles.labelText}>{phase}</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              </Section>
            ) : (
              <Section
                title="Stages"
                minHeight={filterHeights}
                onReset={() => updateFilter("phases", [])}
              >
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

            <Section title="CEO gender" onReset={() => updateFilter("ceoGenders", [])}>
              <div className={styles.listScroll}>
                {isOverviewTab ? (
                  // Overview tab: single checkbox "All CEO genders"
                  <label className={`${styles.itemLabel}`}>
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className={`${styles.checkbox}`}
                    />
                    <span className={styles.labelText}>All CEO genders</span>
                  </label>
                ) : isGenderPrimary ? (
                  // Checkboxes with colors for primary mode
                  <>
                    <label className={`${styles.itemLabel} ${styles.itemLabelHover}`}>
                      <input
                        type="checkbox"
                        checked={(filters.ceoGenders?.length || 0) === ceoTotal}
                        onChange={() =>
                          updateFilter(
                            "ceoGenders",
                            (filters.ceoGenders?.length || 0) === ceoTotal
                              ? []
                              : filterOptions.ceoGenders
                          )
                        }
                        className={styles.checkboxAll}
                      />
                      <span className={styles.labelTextBold}>All</span>
                    </label>
                    {filterOptions.ceoGenders?.map((gender) => {
                      const color = CEO_GENDER_COLOR_MAP[gender] || "#999";
                      return (
                        <label
                          key={gender}
                          className={`${styles.itemLabel} ${styles.itemLabelIndented} ${styles.itemLabelHover}`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.ceoGenders?.includes(gender) || false}
                            onChange={() => toggleArrayFilter("ceoGenders", gender)}
                            className={`${styles.checkbox} ${styles.checkboxColored}`}
                            style={{
                              "--checkbox-bg-color": color,
                            }}
                          />
                          <span className={styles.labelText}>{gender}</span>
                        </label>
                      );
                    })}
                  </>
                ) : (
                  // Checkbox for "All" with radio buttons for secondary mode
                  <>
                    <label className={`${styles.itemLabel} ${styles.itemLabelHover}`}>
                      <input
                        type="checkbox"
                        checked={(filters.ceoGenders?.length || 0) === 0}
                        onChange={() => updateFilter("ceoGenders", [])}
                        className={styles.checkbox}
                      />
                      <span className={styles.labelTextBold}>All</span>
                    </label>
                    {filterOptions.ceoGenders?.map((gender) => (
                      <label
                        key={gender}
                        className={`${styles.itemLabel} ${styles.itemLabelIndented} ${styles.itemLabelHover}`}
                      >
                        <input
                          type="radio"
                          name="gender-radio"
                          checked={
                            (filters.ceoGenders?.length || 0) === 1 &&
                            filters.ceoGenders?.[0] === gender
                          }
                          onChange={() => updateFilter("ceoGenders", [gender])}
                          className={styles.radio}
                        />
                        <span className={styles.labelText}>{gender}</span>
                      </label>
                    ))}
                  </>
                )}
              </div>
            </Section>
          </div>

          {/* Cantons */}
          <Section
            title="Cantons"
            minHeight={filterHeights}
            onReset={() => updateFilter("cantons", [])}
          >
            <div className={styles.listNoScroll}>
              {isOverviewTab ? (
                // Overview tab: single checkbox "All Cantons"
                <label className={`${styles.itemLabel}`}>
                  <input type="checkbox" checked={true} disabled className={`${styles.checkbox}`} />
                  <span className={styles.labelText}>All Cantons</span>
                </label>
              ) : isCantonPrimary ? (
                // Checkboxes with colors for primary mode
                <>
                  <label className={`${styles.itemLabel} ${styles.itemLabelHover}`}>
                    <input
                      type="checkbox"
                      checked={allowedCantons.every((c) => filters.cantons.includes(c.name))}
                      onChange={() => {
                        const primaryNames = allowedCantons.map((c) => c.name);
                        const allSelected = primaryNames.every((n) => filters.cantons.includes(n));
                        if (allSelected) {
                          updateFilter(
                            "cantons",
                            filters.cantons.filter((n) => !primaryNames.includes(n))
                          );
                        } else {
                          const toAdd = primaryNames.filter((n) => !filters.cantons.includes(n));
                          updateFilter("cantons", [...filters.cantons, ...toAdd]);
                        }
                      }}
                      className={styles.checkboxAll}
                    />
                    <span className={styles.labelTextBold}>All</span>
                  </label>
                  {displayCantons.map((canton) => {
                    if (canton.code === "OTHER") {
                      const color = CANTON_COLOR_MAP["Other"] || "#999";
                      const isOtherChecked = otherCantons.every((c) => filters.cantons.includes(c.name));
                      return (
                        <label
                          key={canton.code}
                          className={`${styles.itemLabel} ${styles.itemLabelIndented} ${styles.itemLabelHover}`}
                        >
                          <input
                            type="checkbox"
                            checked={isOtherChecked}
                            onChange={() => {
                              if (isOtherChecked) {
                                updateFilter(
                                  "cantons",
                                  filters.cantons.filter((n) => !otherCantons.some((c) => c.name === n))
                                );
                              } else {
                                const toAdd = otherCantons.map((c) => c.name).filter((n) => !filters.cantons.includes(n));
                                updateFilter("cantons", [...filters.cantons, ...toAdd]);
                              }
                            }}
                            className={`${styles.checkbox} ${styles.checkboxColored}`}
                            style={{
                              "--checkbox-bg-color": color,
                            }}
                          />
                          <span className={styles.labelText}>{canton.name}</span>
                        </label>
                      );
                    }
                    const color = CANTON_COLOR_MAP[canton.name] || "#999";
                    return (
                      <label
                        key={canton.code}
                        className={`${styles.itemLabel} ${styles.itemLabelIndented} ${styles.itemLabelHover}`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.cantons.includes(canton.name)}
                          onChange={() => toggleArrayFilter("cantons", canton.name)}
                          className={`${styles.checkbox} ${styles.checkboxColored}`}
                          style={{
                            "--checkbox-bg-color": color,
                          }}
                        />
                        <span className={styles.labelText}>
                          {canton.name} ({canton.code})
                        </span>
                      </label>
                    );
                  })}
                </>
              ) : (
                // Checkbox for "All" with radio buttons for secondary mode
                <>
                  <label className={`${styles.itemLabel} ${styles.itemLabelHover}`}>
                    <input
                      type="checkbox"
                      checked={filters.cantons.length === 0}
                      onChange={() => updateFilter("cantons", [])}
                      className={styles.checkbox}
                    />
                    <span className={styles.labelTextBold}>All</span>
                  </label>
                  {displayCantons.map((canton) => {
                    if (canton.code === "OTHER") {
                      const isOtherSelected = otherCantons.length > 0 && otherCantons.every((c) => filters.cantons.includes(c.name));
                      return (
                        <label
                          key={canton.code}
                          className={`${styles.itemLabel} ${styles.itemLabelIndented} ${styles.itemLabelHover}`}
                        >
                          <input
                            type="radio"
                            name="canton-radio"
                            checked={isOtherSelected}
                            onChange={() => updateFilter("cantons", otherCantons.map((c) => c.name))}
                            className={styles.radio}
                          />
                          <span className={styles.labelText}>{canton.name}</span>
                        </label>
                      );
                    }
                    return (
                      <label
                        key={canton.code}
                        className={`${styles.itemLabel} ${styles.itemLabelIndented} ${styles.itemLabelHover}`}
                      >
                        <input
                          type="radio"
                          name="canton-radio"
                          checked={filters.cantons.length === 1 && filters.cantons[0] === canton.name}
                          onChange={() => updateFilter("cantons", [canton.name])}
                          className={styles.radio}
                        />
                        <span className={styles.labelText}>
                          {canton.name} ({canton.code})
                        </span>
                      </label>
                    );
                  })}
                </>
              )}
            </div>
          </Section>

        </div>
      )}
    </div>
  );
};

export default FilterPanel;
