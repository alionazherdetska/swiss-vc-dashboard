import React from "react";
import { Filter } from "lucide-react";
import { OFFICIAL_CANTONS } from "./constants";

const FilterPanel = ({
  filters,
  filterOptions,
  activeTab,
  updateFilter,
  toggleArrayFilter,
  resetFilters,
  isDark = false,
}) => {
  return (
    <div className={`rounded-lg shadow-sm p-6 sticky top-6 border ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold flex items-center ${
          isDark ? 'text-gray-200' : 'text-gray-800'
        }`}>
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


      {/* Year Range Filter */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Year Range
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="2012"
            max={filters.yearRange[1] - 1}
            value={filters.yearRange[0]}
            onChange={(e) =>
              updateFilter("yearRange", [
                Math.min(parseInt(e.target.value), filters.yearRange[1] - 1),
                filters.yearRange[1],
              ])
            }
            className={`w-20 p-2 border rounded text-sm ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>to</span>
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
            className={`w-20 p-2 border rounded text-sm ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
      </div>

      {/* Cantons Filter */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Cantons ({filters.cantons.length} selected)
        </label>
        <div className={`space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md ${
          isDark ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <label className={`flex items-center p-1 rounded font-medium cursor-pointer ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
          }`}>
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
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {filters.cantons.length === OFFICIAL_CANTONS.length
                ? "Deselect All"
                : "Select All"}
            </span>
          </label>

          {OFFICIAL_CANTONS.map((canton) => (
            <label
              key={canton.code}
              className={`flex items-center p-1 rounded cursor-pointer ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={filters.cantons.includes(canton.name)}
                onChange={() => toggleArrayFilter("cantons", canton.name)}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {canton.name} ({canton.code})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* CEO Gender Filter - Only show for companies */}
      {activeTab === "companies" && (
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            CEO Gender ({filters.ceoGenders?.length || 0} selected)
          </label>
          <div className={`space-y-2 p-2 border rounded-md ${
            isDark ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <label className={`flex items-center p-1 rounded font-medium cursor-pointer ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}>
              <input
                type="checkbox"
                checked={
                  (filters.ceoGenders?.length || 0) === (filterOptions.ceoGenders?.length || 0) &&
                  (filterOptions.ceoGenders?.length || 0) > 0
                }
                onChange={() => {
                  if (
                    (filters.ceoGenders?.length || 0) === (filterOptions.ceoGenders?.length || 0)
                  ) {
                    updateFilter("ceoGenders", []);
                  } else {
                    updateFilter("ceoGenders", filterOptions.ceoGenders || []);
                  }
                }}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {(filters.ceoGenders?.length || 0) === (filterOptions.ceoGenders?.length || 0) &&
                 (filterOptions.ceoGenders?.length || 0) > 0
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </label>
            {filterOptions.ceoGenders?.map((gender) => (
              <label
                key={gender}
                className={`flex items-center p-1 rounded cursor-pointer ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.ceoGenders?.includes(gender) || false}
                  onChange={() => toggleArrayFilter("ceoGenders", gender)}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {gender}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tab-specific filters */}
      {activeTab === "companies" ? (
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Industries ({filters.industries.length} selected)
          </label>
          <div className={`space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md ${
            isDark ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <label className={`flex items-center p-1 rounded font-medium cursor-pointer ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}>
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
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {filters.industries.length === filterOptions.industries?.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </label>
            {filterOptions.industries?.map((industry) => (
              <label
                key={industry}
                className={`flex items-center p-1 rounded cursor-pointer ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.industries.includes(industry)}
                  onChange={() => toggleArrayFilter("industries", industry)}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {industry}
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Deal Types ({filters.dealTypes.length} selected)
            </label>
            <div className={`space-y-2 max-h-36 overflow-y-auto p-2 border rounded-md ${
              isDark ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <label className={`flex items-center p-1 rounded font-medium cursor-pointer ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}>
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
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {filters.dealTypes.length === filterOptions.dealTypes?.length
                    ? "Deselect All"
                    : "Select All"}
                </span>
              </label>
              {filterOptions.dealTypes?.map((type) => (
                <label
                  key={type}
                  className={`flex items-center p-1 rounded cursor-pointer ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filters.dealTypes.includes(type)}
                    onChange={() => toggleArrayFilter("dealTypes", type)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Funding Phases ({filters.phases.length} selected)
            </label>
            <div className={`space-y-2 max-h-36 overflow-y-auto p-2 border rounded-md ${
              isDark ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <label className={`flex items-center p-1 rounded font-medium cursor-pointer ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}>
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
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {filters.phases.length === filterOptions.phases?.length
                    ? "Deselect All"
                    : "Select All"}
                </span>
              </label>
              {filterOptions.phases?.map((phase) => (
                <label
                  key={phase}
                  className={`flex items-center p-1 rounded cursor-pointer ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filters.phases.includes(phase)}
                    onChange={() => toggleArrayFilter("phases", phase)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {phase}
                  </span>
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