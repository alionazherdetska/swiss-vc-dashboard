import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { OFFICIAL_CANTONS } from "../../lib/constants";

const Section = ({ title, children }) => (
  <div className="mr-6 mb-4 min-w-[180px]">
    <div className="font-medium text-gray-800 mb-2 text-sm">{title}</div>
    {children}
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

  const sectionIds = useMemo(() => {
    const base = ["year", "cantons", "ceo", "industries"]; // Always include CEO gender
  const selectAllLabel = () => "All";
    if (dealsTab) base.push("dealtypes", "phases");
    return base;
  }, [dealsTab]);

  const [remountKey, setRemountKey] = useState(0);
  const setAllSections = (open) => {
    try {
      sectionIds.forEach((id) =>
        window.localStorage.setItem(
          `filters.section.${id}.open`,
          open ? "1" : "0",
        ),
      );
      setRemountKey((k) => k + 1);
    } catch {}
  };

  return (
    <div
      key={remountKey}
      className="rounded-lg shadow-sm px-4 py-6 border bg-white border-gray-200 text-xs sticky top-4 z-20"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-700" />
          <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        </div>
        <button
          onClick={resetFilters}
          className="px-2.5 py-1 text-xs font-medium rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
        >
          Reset
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <button
          onClick={() => setAllSections(true)}
          className="px-1.5 py-1 text-xs font-medium rounded-md border border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
        >
          Expand all
        </button>
        <button
          onClick={() => setAllSections(false)}
          className="px-1.5 py-1 text-xs font-medium rounded-md border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
        >
          Collapse all
        </button>
      </div>

      {/* Year Range */}
      <Section id="year" title="Year Range" defaultOpen>
        <div className="flex items-center gap-1 ">
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
            className="w-16 px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-900 leading-[1.5]"
          />
          <span className="text-gray-500">to</span>
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
            className="w-16 px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-900 leading-[1.5]"
          />
        </div>
      </Section>

      {/* Cantons */}
      <Section id="cantons" title="Cantons">
        <div className="space-y-1 max-h-40 overflow-y-auto p-1 border rounded border-gray-200 scrollbar-thin">
          <label className="flex items-center gap-1 px-1 py-1.5 cursor-pointer">
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
              className="w-3.5 h-3.5 text-red-600"
            />
            <span className="text-xs text-gray-700">
              {selectAllLabel(filters.cantons.length, OFFICIAL_CANTONS.length)}
            </span>
          </label>
          {OFFICIAL_CANTONS.map((canton) => (
            <label
              key={canton.code}
              className="flex items-center gap-1 px-1.5 py-1.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.cantons.includes(canton.name)}
                onChange={() => toggleArrayFilter("cantons", canton.name)}
                className="w-3.5 h-3.5 text-red-600"
              />
              <span className="text-xs text-gray-700">
                {canton.name} ({canton.code})
              </span>
            </label>
          ))}
        </div>
      </Section>

      {/* CEO Gender - Now shown for both companies and deals */}
      <Section id="ceo" title="CEO Gender">
        <div className="space-y-1 p-1 border rounded border-gray-200">
          <label className="flex items-center gap-1 px-1 py-1 cursor-pointer">
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
              className="w-3.5 h-3.5 text-red-600"
            />
            <span className="text-xs text-gray-700">
              {selectAllLabel(filters.ceoGenders?.length || 0, ceoTotal)}
            </span>
          </label>
          {filterOptions.ceoGenders?.map((gender) => (
            <label
              key={gender}
              className="flex items-center gap-1 px-1 py-1 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.ceoGenders?.includes(gender) || false}
                onChange={() => toggleArrayFilter("ceoGenders", gender)}
                className="w-3.5 h-3.5 text-red-600"
              />
              <span className="text-xs text-gray-700">{gender}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Industries */}
      <Section id="industries" title="Industries" defaultOpen>
        <div className="space-y-1 max-h-40 overflow-y-auto p-1 border rounded border-gray-200 scrollbar-thin">
          <label className="flex items-center gap-1 px-1 py-1 cursor-pointer">
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
              className="w-3.5 h-3.5 text-red-600"
            />
            <span className="text-xs text-gray-700">
              {selectAllLabel(filters.industries.length, industriesTotal)}
            </span>
          </label>
          {filterOptions.industries?.map((industry) => (
            <label
              key={industry}
              className="flex items-center gap-1 px-1 py-1 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.industries.includes(industry)}
                onChange={() => toggleArrayFilter("industries", industry)}
                className="w-3.5 h-3.5 text-red-600"
              />
              <span className="text-xs text-gray-700">{industry}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Deal Types */}
      {dealsTab && (
        <Section id="dealtypes" title="Deal Types">
          <div className="space-y-1 max-h-36 overflow-y-auto p-1 border rounded border-gray-200 scrollbar-thin">
            <label className="flex items-center gap-1 px-1 py-1 cursor-pointer">
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
                className="w-3.5 h-3.5 text-red-600"
              />
              <span className="text-xs text-gray-700">
                {selectAllLabel(filters.dealTypes.length, dealTypesTotal)}
              </span>
            </label>
            {filterOptions.dealTypes?.map((type) => (
              <label
                key={type}
                className="flex items-center gap-1 px-1 py-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.dealTypes.includes(type)}
                  onChange={() => toggleArrayFilter("dealTypes", type)}
                  className="w-3.5 h-3.5 text-red-600"
                />
                <span className="text-xs text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* Funding Phases */}
      {dealsTab && (
        <Section id="phases" title="Funding Phases">
          <div className="space-y-1 max-h-36 overflow-y-auto p-1 border rounded border-gray-200 scrollbar-thin">
            <label className="flex items-center gap-1 px-1 py-1 cursor-pointer">
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
                className="w-3.5 h-3.5 text-red-600"
              />
              <span className="text-xs text-gray-700">
                {selectAllLabel(filters.phases.length, phasesTotal)}
              </span>
            </label>
            {filterOptions.phases?.map((phase) => (
              <label
                key={phase}
                className="flex items-center gap-1 px-1 py-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.phases.includes(phase)}
                  onChange={() => toggleArrayFilter("phases", phase)}
                  className="w-3.5 h-3.5 text-red-600"
                />
                <span className="text-xs text-gray-700">{phase}</span>
              </label>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

export default FilterPanel;
