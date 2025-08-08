import React from "react";
import { Target, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Building2, Factory, TrendingDown, Handshake } from "./CustomIcons";

// Custom palette
const PALETTE = {
  red: "#E84A5F",      // Primary Red
  orange: "#FF6B35",   // Orange
  yellow: "#F7931E",   // Yellow
  green: "#2ECC71",    // Green
  blue: "#3498DB",     // Blue
  purple: "#9B59B6",   // Purple
  teal: "#1ABC9C",     // Teal
  gray: "#7F8C8D",     // Gray
};

const MetricsCards = ({
  activeTab,
  filteredCompanies,
  filteredDeals,
  filterOptions,
  isDark = false,
}) => {
  if (activeTab === "companies") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-lg border transition-all ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
          }`}
          style={isDark ? {} : {
            background: "#E8F4FB",
            borderColor: PALETTE.blue,
          }}
        >
          <div className="flex items-center">
            <Building2 className="h-6 w-6 mr-3" style={{ color: PALETTE.blue }} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total
              </p>
              <p className="text-2xl font-bold" style={{ color: PALETTE.blue }}>
                {filteredCompanies.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-lg border transition-all ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
          }`}
          style={isDark ? {} : {
            background: "#E6F9F0",
            borderColor: PALETTE.green,
          }}
        >
          <div className="flex items-center">
            <Target className="h-6 w-6 mr-3" style={{ color: PALETTE.green }} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Funded
              </p>
              <p className="text-2xl font-bold" style={{ color: PALETTE.green }}>
                {filteredCompanies
                  .filter((d) => d.Funded)
                  .length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-lg border transition-all ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
          }`}
          style={isDark ? {} : {
            background: "#FDEBEC",
            borderColor: PALETTE.red,
          }}
        >
          <div className="flex items-center">
            <TrendingDown className="h-6 w-6 mr-3" style={{ color: PALETTE.red }} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Closed
              </p>
              <p className="text-2xl font-bold" style={{ color: PALETTE.red }}>
                {filteredCompanies.filter((d) => d.OOB).length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-lg border transition-all ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-purple-50 border-purple-200'
          }`}
          style={isDark ? {} : {
            background: "#F3EAFB",
            borderColor: PALETTE.purple,
          }}
        >
          <div className="flex items-center">
            <Factory className="h-6 w-6 mr-3" style={{ color: PALETTE.purple }} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Industries
              </p>
              <p className="text-2xl font-bold" style={{ color: PALETTE.purple }}>
                {filterOptions.industries?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total volume for deals
  const totalVolume = filteredDeals
    .filter((d) => d.Amount)
    .reduce((sum, d) => sum + d.Amount, 0);

  const avgDealSize = filteredDeals.filter((d) => d.Amount).length > 0
    ? totalVolume / filteredDeals.filter((d) => d.Amount).length
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        className={`p-4 rounded-lg border transition-all ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
        }`}
        style={isDark ? {} : {
          background: "#E8F4FB",
          borderColor: PALETTE.blue,
        }}
      >
        <div className="flex items-center">
          <Handshake className="h-6 w-6 mr-3" style={{ color: PALETTE.blue }} />
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Total Deals
            </p>
            <p className="text-2xl font-bold" style={{ color: PALETTE.blue }}>
              {filteredDeals.length.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      <div
        className={`p-4 rounded-lg border transition-all ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
        }`}
        style={isDark ? {} : {
          background: "#E6F9F0",
          borderColor: PALETTE.green,
        }}
      >
        <div className="flex items-center">
          <TrendingUp className="h-6 w-6 mr-3" style={{ color: PALETTE.green }} />
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Total Volume
            </p>
            <p className="text-xl font-bold" style={{ color: PALETTE.green }}>
              {totalVolume.toFixed(1)}M CHF
            </p>
          </div>
        </div>
      </div>
      <div
        className={`p-4 rounded-lg border transition-all ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-purple-50 border-purple-200'
        }`}
        style={isDark ? {} : {
          background: "#F3EAFB",
          borderColor: PALETTE.purple,
        }}
      >
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 mr-3" style={{ color: PALETTE.purple }} />
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Avg Deal Size
            </p>
            <p className="text-xl font-bold" style={{ color: PALETTE.purple }}>
              {avgDealSize > 0 ? `${avgDealSize.toFixed(1)}M CHF` : 'N/A'}
            </p>
          </div>
        </div>
      </div>
      <div
        className={`p-4 rounded-lg border transition-all ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-orange-50 border-orange-200'
        }`}
        style={isDark ? {} : {
          background: "#FFF6E5",
          borderColor: PALETTE.orange,
        }}
      >
        <div className="flex items-center">
          <Calendar className="h-6 w-6 mr-3" style={{ color: PALETTE.orange }} />
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              With Amount
            </p>
            <p className="text-2xl font-bold" style={{ color: PALETTE.orange }}>
              {filteredDeals.filter((d) => d.Amount).length.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsCards;