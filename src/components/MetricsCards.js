import React from "react";
import { Target, DollarSign, Calendar } from "lucide-react";
import { Building2, Factory, TrendingDown, Handshake } from "./CustomIcons";

const MetricsCards = ({
  activeTab,
  filteredCompanies,
  filteredDeals,
  filterOptions,
}) => {
  if (activeTab === "companies") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredCompanies.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <Target className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Funded</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredCompanies
                  .filter((d) => d.Funded)
                  .length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center">
            <TrendingDown className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredCompanies.filter((d) => d.OOB).length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <Factory className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Industries</p>
              <p className="text-2xl font-bold text-purple-600">
                {filterOptions.industries?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center">
          <Handshake className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-blue-600">
              {filteredDeals.length.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <p className="text-sm text-gray-600">With Amount</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredDeals.filter((d) => d.Amount).length.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <div className="flex items-center">
          <Target className="h-6 w-6 text-purple-600 mr-3" />
          <div>
            <p className="text-sm text-gray-600">With Valuation</p>
            <p className="text-2xl font-bold text-purple-600">
              {filteredDeals.filter((d) => d.Valuation).length.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-orange-600 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Total Volume</p>
            <p className="text-xl font-bold text-orange-600">
              {filteredDeals
                .filter((d) => d.Amount)
                .reduce((sum, d) => sum + d.Amount, 0)
                .toFixed(1)}
              M CHF
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsCards;
