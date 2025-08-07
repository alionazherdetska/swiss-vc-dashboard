import React from "react";
import { Target, DollarSign, Calendar } from "lucide-react";
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
}) => {
  if (activeTab === "companies") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-4 rounded-lg border"
          style={{
            background: "#E8F4FB",
            borderColor: PALETTE.blue,
          }}
        >
          <div className="flex items-center">
            <Building2 className="h-6 w-6 mr-3" style={{ color: PALETTE.blue }} />
            <div>
              <p className="text-sm" style={{ color: PALETTE.gray }}>Total</p>
              <p className="text-2xl font-bold" style={{ color: PALETTE.blue }}>
                {filteredCompanies.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div
          className="p-4 rounded-lg border"
          style={{
            background: "#E6F9F0",
            borderColor: PALETTE.green,
          }}
        >
          <div className="flex items-center">
            <Target className="h-6 w-6 mr-3" style={{ color: PALETTE.green }} />
            <div>
              <p className="text-sm" style={{ color: PALETTE.gray }}>Funded</p>
              <p className="text-2xl font-bold" style={{ color: PALETTE.green }}>
                {filteredCompanies
                  .filter((d) => d.Funded)
                  .length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div
          className="p-4 rounded-lg border"
          style={{
            background: "#FDEBEC",
            borderColor: PALETTE.red,
          }}
        >
          <div className="flex items-center">
            <TrendingDown className="h-6 w-6 mr-3" style={{ color: PALETTE.red }} />
            <div>
              <p className="text-sm" style={{ color: PALETTE.gray }}>Closed</p>
              <p className="text-2xl font-bold" style={{ color: PALETTE.red }}>
                {filteredCompanies.filter((d) => d.OOB).length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div
          className="p-4 rounded-lg border"
          style={{
            background: "#F3EAFB",
            borderColor: PALETTE.purple,
          }}
        >
          <div className="flex items-center">
            <Factory className="h-6 w-6 mr-3" style={{ color: PALETTE.purple }} />
            <div>
              <p className="text-sm" style={{ color: PALETTE.gray }}>Industries</p>
              <p className="text-2xl font-bold" style={{ color: PALETTE.purple }}>
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
      <div
        className="p-4 rounded-lg border"
        style={{
          background: "#E8F4FB",
          borderColor: PALETTE.blue,
        }}
      >
        <div className="flex items-center">
          <Handshake className="h-6 w-6 mr-3" style={{ color: PALETTE.blue }} />
          <div>
            <p className="text-sm" style={{ color: PALETTE.gray }}>Total</p>
            <p className="text-2xl font-bold" style={{ color: PALETTE.blue }}>
              {filteredDeals.length.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      <div
        className="p-4 rounded-lg border"
        style={{
          background: "#E6F9F0",
          borderColor: PALETTE.green,
        }}
      >
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 mr-3" style={{ color: PALETTE.green }} />
          <div>
            <p className="text-sm" style={{ color: PALETTE.gray }}>With Amount</p>
            <p className="text-2xl font-bold" style={{ color: PALETTE.green }}>
              {filteredDeals.filter((d) => d.Amount).length.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      <div
        className="p-4 rounded-lg border"
        style={{
          background: "#F3EAFB",
          borderColor: PALETTE.purple,
        }}
      >
        <div className="flex items-center">
          <Target className="h-6 w-6 mr-3" style={{ color: PALETTE.purple }} />
          <div>
            <p className="text-sm" style={{ color: PALETTE.gray }}>With Valuation</p>
            <p className="text-2xl font-bold" style={{ color: PALETTE.purple }}>
              {filteredDeals.filter((d) => d.Valuation).length.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      <div
        className="p-4 rounded-lg border"
        style={{
          background: "#FFF6E5",
          borderColor: PALETTE.orange,
        }}
      >
        <div className="flex items-center">
          <Calendar className="h-6 w-6 mr-3" style={{ color: PALETTE.orange }} />
          <div>
            <p className="text-sm" style={{ color: PALETTE.gray }}>Total Volume</p>
            <p className="text-xl font-bold" style={{ color: PALETTE.orange }}>
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