import React from "react";
import { Target } from "lucide-react";

const InsightsPanel = ({
  activeTab,
  currentData,
  companies,
  deals,
  filteredCompanies,
  filteredDeals,
  chartData,
  isDark = false,
}) => {
  const totalVolume = filteredDeals
    .filter((d) => d.Amount)
    .reduce((sum, d) => sum + d.Amount, 0);

  const avgDealSize = filteredDeals.filter((d) => d.Amount).length > 0
    ? totalVolume / filteredDeals.filter((d) => d.Amount).length
    : 0;

  return (
    <div className={`mt-6 p-4 rounded-lg border ${
      isDark 
        ? 'bg-blue-900 bg-opacity-20 border-blue-600' 
        : 'bg-blue-50 border-blue-200'
    }`}>
      <h4 className={`font-medium mb-2 flex items-center ${
        isDark ? 'text-blue-300' : 'text-blue-900'
      }`}>
        <Target className="h-4 w-4 mr-2" />
        Key Insights
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className={`p-3 rounded border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Showing:{" "}
            <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              {currentData.length.toLocaleString()}
            </span>{" "}
            {activeTab}
          </p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Total Available:{" "}
            <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              {activeTab === "companies"
                ? companies.length.toLocaleString()
                : deals.length.toLocaleString()}
            </span>
          </p>
        </div>
        <div className={`p-3 rounded border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          {activeTab === "deals" ? (
            <>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Total Volume:{" "}
                <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {totalVolume.toFixed(1)}M CHF
                </span>
              </p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Avg. Deal Size:{" "}
                <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {avgDealSize > 0 ? avgDealSize.toFixed(1) + "M CHF" : "N/A"}
                </span>
              </p>
            </>
          ) : (
            <>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Founded This Year:{" "}
                <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {filteredCompanies.filter((d) => d.Year === 2025).length}
                </span>
              </p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Funding Rate:{" "}
                <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {filteredCompanies.length > 0
                    ? (
                        (filteredCompanies.filter((d) => d.Funded).length /
                          filteredCompanies.length) *
                        100
                      ).toFixed(1) + "%"
                    : "N/A"}
                </span>
              </p>
            </>
          )}
        </div>
        <div className={`p-3 rounded border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Top Canton:{" "}
            <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              {chartData.cantons?.[0]?.name || "N/A"}
              {chartData.cantons?.[0]?.value &&
                ` (${chartData.cantons[0].value})`}
            </span>
          </p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Top {activeTab === "companies" ? "Industry" : "Type"}:{" "}
            <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              {(chartData.industries || chartData.types)?.[0]?.name || "N/A"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;