// FilterPanel.jsx
import React from "react";
import { Filter, Search } from "lucide-react";
import { OFFICIAL_CANTONS } from "./constants";

const FilterPanel = ({
  filters,
  filterOptions,
  activeTab,
  updateFilter,
  toggleArrayFilter,
  resetFilters,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h2>
        <button
          onClick={resetFilters}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Reset
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies, industries..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* Year Range Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Year Range
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="2015"
            max={filters.yearRange[1] - 1}
            value={filters.yearRange[0]}
            onChange={(e) =>
              updateFilter("yearRange", [
                Math.min(parseInt(e.target.value), filters.yearRange[1] - 1),
                filters.yearRange[1],
              ])
            }
            className="w-20 p-2 border border-gray-300 rounded text-sm"
          />
          <span>to</span>
          <input
            type="number"
            min={filters.yearRange[0] + 1}
            max="2025"
            value={filters.yearRange[1]}
            onChange={(e) =>
              updateFilter("yearRange", [
                filters.yearRange[0],
                Math.max(parseInt(e.target.value), filters.yearRange[0] + 1),
              ])
            }
            className="w-20 p-2 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Cantons Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cantons ({filters.cantons.length} selected)
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-md">
          <label className="flex items-center p-1 hover:bg-gray-50 rounded font-medium">
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
            <span className="text-sm">
              {filters.cantons.length === OFFICIAL_CANTONS.length
                ? "Deselect All"
                : "Select All"}
            </span>
          </label>

          {OFFICIAL_CANTONS.map((canton) => (
            <label
              key={canton.code}
              className="flex items-center p-1 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.cantons.includes(canton.name)}
                onChange={() => toggleArrayFilter("cantons", canton.name)}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm">
                {canton.name} ({canton.code})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tab-specific filters */}
      {activeTab === "companies" ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industries ({filters.industries.length} selected)
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-md">
            <label className="flex items-center p-1 hover:bg-gray-50 rounded font-medium">
              <input
                type="checkbox"
                checked={
                  filters.industries.length === filterOptions.industries?.length
                }
                onChange={() => {
                  if (
                    filters.industries.length ===
                    filterOptions.industries?.length
                  ) {
                    updateFilter("industries", []);
                  } else {
                    updateFilter("industries", filterOptions.industries || []);
                  }
                }}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm">
                {filters.industries.length === filterOptions.industries?.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </label>
            {filterOptions.industries?.map((industry) => (
              <label
                key={industry}
                className="flex items-center p-1 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.industries.includes(industry)}
                  onChange={() => toggleArrayFilter("industries", industry)}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm">{industry}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deal Types ({filters.dealTypes.length} selected)
            </label>
            <div className="space-y-2 max-h-36 overflow-y-auto p-2 border border-gray-200 rounded-md">
              <label className="flex items-center p-1 hover:bg-gray-50 rounded font-medium">
                <input
                  type="checkbox"
                  checked={
                    filters.dealTypes.length === filterOptions.dealTypes?.length
                  }
                  onChange={() => {
                    if (
                      filters.dealTypes.length ===
                      filterOptions.dealTypes?.length
                    ) {
                      updateFilter("dealTypes", []);
                    } else {
                      updateFilter("dealTypes", filterOptions.dealTypes || []);
                    }
                  }}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm">
                  {filters.dealTypes.length === filterOptions.dealTypes?.length
                    ? "Deselect All"
                    : "Select All"}
                </span>
              </label>
              {filterOptions.dealTypes?.map((type) => (
                <label
                  key={type}
                  className="flex items-center p-1 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.dealTypes.includes(type)}
                    onChange={() => toggleArrayFilter("dealTypes", type)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funding Phases ({filters.phases.length} selected)
            </label>
            <div className="space-y-2 max-h-36 overflow-y-auto p-2 border border-gray-200 rounded-md">
              <label className="flex items-center p-1 hover:bg-gray-50 rounded font-medium">
                <input
                  type="checkbox"
                  checked={
                    filters.phases.length === filterOptions.phases?.length
                  }
                  onChange={() => {
                    if (
                      filters.phases.length === filterOptions.phases?.length
                    ) {
                      updateFilter("phases", []);
                    } else {
                      updateFilter("phases", filterOptions.phases || []);
                    }
                  }}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm">
                  {filters.phases.length === filterOptions.phases?.length
                    ? "Deselect All"
                    : "Select All"}
                </span>
              </label>
              {filterOptions.phases?.map((phase) => (
                <label
                  key={phase}
                  className="flex items-center p-1 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.phases.includes(phase)}
                    onChange={() => toggleArrayFilter("phases", phase)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm">{phase}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterPanel;
