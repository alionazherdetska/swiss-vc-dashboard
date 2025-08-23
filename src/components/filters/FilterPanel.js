import React, { useState, useMemo } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { OFFICIAL_CANTONS } from "../../lib/constants";

const Section = ({
  title,
  countBadge,          // optional string like "3 selected"
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{title}</span>
          {countBadge != null && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {countBadge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`transition-[grid-template-rows] duration-200 ease-out grid ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-3 border-t border-gray-200 bg-white">{children}</div>
        </div>
      </div>
    </div>
  );
};

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

  // derived counts (safe defaults)
  const ceoTotal = filterOptions.ceoGenders?.length || 0;
  const industriesTotal = filterOptions.industries?.length || 0;
  const dealTypesTotal = filterOptions.dealTypes?.length || 0;
  const phasesTotal = filterOptions.phases?.length || 0;

  const selectAllLabel = (selected, total) =>
    selected === total && total > 0 ? "Deselect All" : "Select All";

  return (
    <div className="rounded-lg shadow-sm p-6 sticky top-6 border bg-white border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center text-gray-800">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h2>
        <button
          onClick={resetFilters}
          className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Year Range */}
      <Section
        title="Year Range"
        defaultOpen
        countBadge={`${filters.yearRange[0]}–${filters.yearRange[1]}`}
      >
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="2012"
            max={filters.yearRange[1] - 1}
            value={filters.yearRange[0]}
            onChange={(e) =>
              updateFilter("yearRange", [
                Math.min(parseInt(e.target.value || "0", 10), filters.yearRange[1] - 1),
                filters.yearRange[1],
              ])
            }
            className="w-24 p-2 border rounded text-sm bg-white border-gray-300 text-gray-900"
          />
          <span className="text-gray-600">to</span>
          <input
            type="number"
            min={filters.yearRange[0] + 1}
            max="2025"
            value={filters.yearRange[1]}
            onChange={(e) =>
              updateFilter("yearRange", [
                filters.yearRange[0],
                Math.max(parseInt(e.target.value || "0", 10), filters.yearRange[0] + 1),
              ])
            }
            className="w-24 p-2 border rounded text-sm bg-white border-gray-300 text-gray-900"
          />
        </div>
      </Section>

      {/* Cantons */}
      <Section
        title="Cantons"
        countBadge={`${filters.cantons.length} selected`}
        defaultOpen={false}
      >
        <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md border-gray-200">
          <label className="flex items-center p-1 rounded font-medium cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filters.cantons.length === OFFICIAL_CANTONS.length}
              onChange={() => {
                if (filters.cantons.length === OFFICIAL_CANTONS.length) {
                  updateFilter("cantons", []);
                } else {
                  updateFilter(
                    "cantons",
                    OFFICIAL_CANTONS.map((c) => c.name)
                  );
                }
              }}
              className="mr-2 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">
              {selectAllLabel(filters.cantons.length, OFFICIAL_CANTONS.length)}
            </span>
          </label>

          {OFFICIAL_CANTONS.map((canton) => (
            <label
              key={canton.code}
              className="flex items-center p-1 rounded cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={filters.cantons.includes(canton.name)}
                onChange={() => toggleArrayFilter("cantons", canton.name)}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">
                {canton.name} ({canton.code})
              </span>
            </label>
          ))}
        </div>
      </Section>

      {/* CEO Gender (companies only) */}
      {companiesTab && (
        <Section
          title="CEO Gender"
          countBadge={`${filters.ceoGenders?.length || 0} selected`}
          defaultOpen={false}
        >
          <div className="space-y-2 p-2 border rounded-md border-gray-200">
            <label className="flex items-center p-1 rounded font-medium cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={
                  (filters.ceoGenders?.length || 0) === ceoTotal && ceoTotal > 0
                }
                onChange={() => {
                  if ((filters.ceoGenders?.length || 0) === ceoTotal) {
                    updateFilter("ceoGenders", []);
                  } else {
                    updateFilter("ceoGenders", filterOptions.ceoGenders || []);
                  }
                }}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">
                {selectAllLabel(filters.ceoGenders?.length || 0, ceoTotal)}
              </span>
            </label>

            {filterOptions.ceoGenders?.map((gender) => (
              <label
                key={gender}
                className="flex items-center p-1 rounded cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={filters.ceoGenders?.includes(gender) || false}
                  onChange={() => toggleArrayFilter("ceoGenders", gender)}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">{gender}</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* Industries (companies or deals) */}
      <Section
        title="Industries"
        countBadge={`${filters.industries.length} selected`}
        defaultOpen
      >
        <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md border-gray-200">
          <label className="flex items-center p-1 rounded font-medium cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filters.industries.length === industriesTotal}
              onChange={() => {
                if (filters.industries.length === industriesTotal) {
                  updateFilter("industries", []);
                } else {
                  updateFilter("industries", filterOptions.industries || []);
                }
              }}
              className="mr-2 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">
              {selectAllLabel(filters.industries.length, industriesTotal)}
            </span>
          </label>

          {filterOptions.industries?.map((industry) => (
            <label
              key={industry}
              className="flex items-center p-1 rounded cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={filters.industries.includes(industry)}
                onChange={() => toggleArrayFilter("industries", industry)}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">{industry}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Deals-only groups */}
      {dealsTab && (
        <>
          <Section
            title="Deal Types"
            countBadge={`${filters.dealTypes.length} selected`}
            defaultOpen={false}
          >
            <div className="space-y-2 max-h-36 overflow-y-auto p-2 border rounded-md border-gray-200">
              <label className="flex items-center p-1 rounded font-medium cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={filters.dealTypes.length === dealTypesTotal}
                  onChange={() => {
                    if (filters.dealTypes.length === dealTypesTotal) {
                      updateFilter("dealTypes", []);
                    } else {
                      updateFilter("dealTypes", filterOptions.dealTypes || []);
                    }
                  }}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  {selectAllLabel(filters.dealTypes.length, dealTypesTotal)}
                </span>
              </label>

              {filterOptions.dealTypes?.map((type) => (
                <label
                  key={type}
                  className="flex items-center p-1 rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={filters.dealTypes.includes(type)}
                    onChange={() => toggleArrayFilter("dealTypes", type)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </Section>

          <Section
            title="Funding Phases"
            countBadge={`${filters.phases.length} selected`}
            defaultOpen={false}
          >
            <div className="space-y-2 max-h-36 overflow-y-auto p-2 border rounded-md border-gray-200">
              <label className="flex items-center p-1 rounded font-medium cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={filters.phases.length === phasesTotal}
                  onChange={() => {
                    if (filters.phases.length === phasesTotal) {
                      updateFilter("phases", []);
                    } else {
                      updateFilter("phases", filterOptions.phases || []);
                    }
                  }}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  {selectAllLabel(filters.phases.length, phasesTotal)}
                </span>
              </label>

              {filterOptions.phases?.map((phase) => (
                <label
                  key={phase}
                  className="flex items-center p-1 rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={filters.phases.includes(phase)}
                    onChange={() => toggleArrayFilter("phases", phase)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{phase}</span>
                </label>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
};

export default FilterPanel;
