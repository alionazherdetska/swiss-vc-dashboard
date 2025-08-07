// InsightsPanel.jsx
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
}) => {
  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
        <Target className="h-4 w-4 mr-2" />
        Key Insights
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white p-3 rounded border">
          <p className="text-gray-600">
            Showing:{" "}
            <span className="font-semibold text-gray-800">
              {currentData.length.toLocaleString()}
            </span>{" "}
            {activeTab}
          </p>
          <p className="text-gray-600">
            Total Available:{" "}
            <span className="font-semibold text-gray-800">
              {activeTab === "companies"
                ? companies.length.toLocaleString()
                : deals.length.toLocaleString()}
            </span>
          </p>
        </div>
        <div className="bg-white p-3 rounded border">
          {activeTab === "deals" ? (
            <>
              <p className="text-gray-600">
                Avg. Deal Size:{" "}
                <span className="font-semibold text-gray-800">
                  {filteredDeals.filter((d) => d.Amount).length > 0
                    ? (
                        filteredDeals
                          .filter((d) => d.Amount)
                          .reduce((sum, d) => sum + d.Amount, 0) /
                        filteredDeals.filter((d) => d.Amount).length
                      ).toFixed(1) + "M CHF"
                    : "N/A"}
                </span>
              </p>
              <p className="text-gray-600">
                Largest Deal:{" "}
                <span className="font-semibold text-gray-800">
                  {filteredDeals.filter((d) => d.Amount).length > 0
                    ? Math.max(
                        ...filteredDeals
                          .filter((d) => d.Amount)
                          .map((d) => d.Amount)
                      ).toFixed(1) + "M CHF"
                    : "N/A"}
                </span>
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                Founded This Year:{" "}
                <span className="font-semibold text-gray-800">
                  {filteredCompanies.filter((d) => d.Year === 2025).length}
                </span>
              </p>
              <p className="text-gray-600">
                Success Rate:{" "}
                <span className="font-semibold text-gray-800">
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
        <div className="bg-white p-3 rounded border">
          <p className="text-gray-600">
            Top Canton:{" "}
            <span className="font-semibold text-gray-800">
              {chartData.cantons?.[0]?.name || "N/A"}
              {chartData.cantons?.[0]?.value &&
                ` (${chartData.cantons[0].value})`}
            </span>
          </p>
          <p className="text-gray-600">
            Top {activeTab === "companies" ? "Industry" : "Type"}:{" "}
            <span className="font-semibold text-gray-800">
              {(chartData.industries || chartData.types)?.[0]?.name || "N/A"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;
