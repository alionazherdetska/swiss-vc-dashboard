import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { OFFICIAL_CANTONS } from "../../lib/constants";

const Section = ({ title, children, minHeight }) => (
  <div className="flex-1 min-w-[180px]">
    <div className="font-semibold text-gray-900 mb-3 text-sm">{title}</div>
    <div style={{ minHeight: minHeight ? `${minHeight}px` : 'auto' }}>
      {children}
    </div>
  </div>
);

/* ---------- Main FilterPanel ---------- */
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
  const dealTypesTotal = filterOptions.dealTypes?.length || 0;
  const phasesTotal = filterOptions.phases?.length || 0;

  const selectAllLabel = (selected, total) =>
    selected === total && total > 0 ? "Deselect All" : "Select All";

  // Calculate heights for each filter section
  const filterHeights = useMemo(() => {
    const heights = [];
    
    // Cantons: header + items (capped at max-h-60 = 240px)
    const cantonsHeight = Math.min(40 + (OFFICIAL_CANTONS.length + 1) * 28, 280);
    heights.push(cantonsHeight);
    
    // CEO Gender: header + items
    const ceoHeight = 40 + (ceoTotal + 1) * 28;
    heights.push(ceoHeight);
    
    // Industries: header + items (capped at max-h-60 = 240px)
    const industriesHeight = Math.min(40 + (industriesTotal + 1) * 28, 280);
    heights.push(industriesHeight);
    
    if (dealsTab) {
      // Deal Types: header + items (capped at max-h-60 = 240px)
      const dealTypesHeight = Math.min(40 + (dealTypesTotal + 1) * 28, 280);
      heights.push(dealTypesHeight);
      
      // Phases: header + items (capped at max-h-60 = 240px)
      const phasesHeight = Math.min(40 + (phasesTotal + 1) * 28, 280);
      heights.push(phasesHeight);
    }
    
    // Sort and get second longest
    const sorted = [...heights].sort((a, b) => b - a);
    return sorted[1] || sorted[0] || 100;
  }, [ceoTotal, industriesTotal, dealTypesTotal, phasesTotal, dealsTab]);

  return (
    <div className="rounded-lg shadow-sm px-6 py-5 border bg-white border-gray-200">
      {/* Header with Year Range and Reset */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
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
              className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900"
            />
            <span className="text-gray-600 text-sm">to</span>
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
              className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900"
            />
          </div>
        </div>
        <button
          onClick={resetFilters}
          className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      <div className="flex gap-6">
        {/* Industries */}
        <Section title="Industries" minHeight={filterHeights}>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded">
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
                className="w-4 h-4 text-red-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 font-medium">
                {selectAllLabel(filters.industries.length, industriesTotal)}
              </span>
            </label>
            {filterOptions.industries?.map((industry) => (
              <label
                key={industry}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.industries.includes(industry)}
                  onChange={() => toggleArrayFilter("industries", industry)}
                  className="w-4 h-4 text-red-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{industry}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Deal Types or Stages */}
        {dealsTab ? (
          <Section title="Stages" minHeight={filterHeights}>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded">
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
                  className="w-4 h-4 text-red-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">
                  {selectAllLabel(filters.phases.length, phasesTotal)}
                </span>
              </label>
              {filterOptions.phases?.map((phase) => (
                <label
                  key={phase}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.phases.includes(phase)}
                    onChange={() => toggleArrayFilter("phases", phase)}
                    className="w-4 h-4 text-red-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{phase}</span>
                </label>
              ))}
            </div>
          </Section>
        ) : (
          <Section title="Stages" minHeight={filterHeights}>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-4 h-4 text-gray-400 rounded border-gray-300"
                />
                <span className="text-sm text-gray-400">All</span>
              </label>
            </div>
          </Section>
        )}

        {/* CEO Gender */}
        <Section title="CEO gender" minHeight={filterHeights}>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded">
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
                className="w-4 h-4 text-red-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 font-medium">
                {selectAllLabel(filters.ceoGenders?.length || 0, ceoTotal)}
              </span>
            </label>
            {filterOptions.ceoGenders?.map((gender) => (
              <label
                key={gender}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.ceoGenders?.includes(gender) || false}
                  onChange={() => toggleArrayFilter("ceoGenders", gender)}
                  className="w-4 h-4 text-red-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{gender}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Cantons */}
        <Section title="Cantons" minHeight={filterHeights}>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded">
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
                className="w-4 h-4 text-red-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 font-medium">
                {selectAllLabel(filters.cantons.length, OFFICIAL_CANTONS.length)}
              </span>
            </label>
            {OFFICIAL_CANTONS.map((canton) => (
              <label
                key={canton.code}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.cantons.includes(canton.name)}
                  onChange={() => toggleArrayFilter("cantons", canton.name)}
                  className="w-4 h-4 text-red-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  {canton.name} ({canton.code})
                </span>
              </label>
            ))}
          </div>
        </Section>

        {/* Deal Types */}
        {dealsTab && (
          <Section title="Deal types" minHeight={filterHeights}>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.dealTypes.length === dealTypesTotal}
                  onChange={() =>
                    updateFilter(
                      "dealTypes",
                      filters.dealTypes.length === dealTypesTotal
                        ? []
                        : filterOptions.dealTypes,
                    )
                  }
                  className="w-4 h-4 text-red-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 font-medium">
                  {selectAllLabel(filters.dealTypes.length, dealTypesTotal)}
                </span>
              </label>
              {filterOptions.dealTypes?.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.dealTypes.includes(type)}
                    onChange={() => toggleArrayFilter("dealTypes", type)}
                    className="w-4 h-4 text-red-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
