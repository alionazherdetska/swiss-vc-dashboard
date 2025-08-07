// utils.js - Fixed with Proper Industry Trends Calculation
import { OFFICIAL_CANTONS, CANTON_MAP } from "./constants";

export const normalizeCanton = (rawCanton) => {
  if (!rawCanton) return null;

  // First check the mapping table
  const mapped = CANTON_MAP[rawCanton];
  if (mapped !== undefined) return mapped;

  // Then check if it matches an official canton name
  return OFFICIAL_CANTONS.some((c) => c.name === rawCanton) ? rawCanton : null;
};

export const processCompanies = (companiesData) => {
  return companiesData.map((company) => ({
    ...company,
    Company: company.Title || company.Company,
    Year: parseInt(company.Year) || new Date().getFullYear(),
    Industry: company.Industry
      ? company.Industry.trim()
          .toLowerCase()
          .replace(/\s*\(.*?\)/g, "")
          .replace(/\s+/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
          .replace(/Ict/g, "ICT")
          .replace(/Biotech/g, "Biotech")
          .replace(/Cleantech/g, "Cleantech")
          .replace(/Medtech/g, "MedTech")
          .replace(/^$/, "Unknown")
      : "Unknown",
    Canton: normalizeCanton(company.Canton) || "Unknown",
    Funded: company.Funded === "TRUE" || company.Funded === true,
    OOB: company.OOB === "TRUE" || company.OOB === true,
    HasSpinoff: !!(company["Spin-offs"] && company["Spin-offs"] !== ""),
    SpinoffType: company["Spin-offs"] || "None",
    City: company.City || "Unknown",
  }));
};

export const processDeals = (dealsData) => {
  return dealsData
    .filter(
      (deal) => deal.Confidential !== "TRUE" && deal.Confidential !== true
    )
    .map((deal) => {
      let year = null;
      if (deal["Date of the funding round"]) {
        const dateStr = deal["Date of the funding round"];
        try {
          const date = new Date(dateStr);
          year = date.getFullYear();
        } catch (e) {
          console.warn("Could not parse date:", dateStr);
        }
      }

      return {
        ...deal,
        Amount: deal.Amount ? parseFloat(deal.Amount) : null,
        Valuation: deal.Valuation ? parseFloat(deal.Valuation) : null,
        Year: year,
        HasAmount: !!(deal.Amount && parseFloat(deal.Amount) > 0),
        HasValuation: !!(deal.Valuation && parseFloat(deal.Valuation) > 0),
        AmountRange: deal.Amount
          ? parseFloat(deal.Amount) < 1
            ? "<1M"
            : parseFloat(deal.Amount) < 5
            ? "1-5M"
            : parseFloat(deal.Amount) < 10
            ? "5-10M"
            : parseFloat(deal.Amount) < 25
            ? "10-25M"
            : parseFloat(deal.Amount) < 50
            ? "25-50M"
            : "50M+"
          : "Unknown",
      };
    });
};

// FIXED: Generate proper industry trends in the format expected by the chart
const generateIndustryTrends = (data, groupByField = "Industry") => {

  // Get all unique years and categories
  const years = [
    ...new Set(data.filter((d) => d.Year && d.Year >= 2015).map((d) => d.Year)),
  ].sort();
  const categories = [
    ...new Set(
      data
        .filter((d) => d[groupByField] && d[groupByField] !== "Unknown")
        .map((d) => d[groupByField])
    ),
  ];

  if (years.length === 0 || categories.length === 0) {
    return [];
  }

  // Create trend data for each category in the PROPER FORMAT
  const trends = categories.map((category) => {
    const dataPoints = years.map((year) => {
      const count = data.filter(
        (d) => d[groupByField] === category && d.Year === year
      ).length;
      return { year, value: count };
    });

    const totalCount = dataPoints.reduce((sum, d) => sum + d.value, 0);

    return {
      name: category,
      data: dataPoints, // Array of {year, value} objects
      totalCount,
    };
  });

  // Sort by total activity and return top 15
  const sortedTrends = trends
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 15);

  return sortedTrends;
};

export const generateChartData = (
  activeTab,
  filteredCompanies,
  filteredDeals
) => {
  const currentData =
    activeTab === "companies" ? filteredCompanies : filteredDeals;

  if (activeTab === "companies") {
    const byYear = {},
      byIndustry = {},
      byCanton = {},
      byFunded = {};

    currentData.forEach((item) => {
      if (item.Year) byYear[item.Year] = (byYear[item.Year] || 0) + 1;
      if (item.Industry)
        byIndustry[item.Industry] = (byIndustry[item.Industry] || 0) + 1;
      if (item.Canton) byCanton[item.Canton] = (byCanton[item.Canton] || 0) + 1;

      const fundedStatus = item.Funded ? "Funded" : "Not Funded";
      byFunded[fundedStatus] = (byFunded[fundedStatus] || 0) + 1;
    });

    // Generate industry trends in PROPER FORMAT
    const industryTrends = generateIndustryTrends(currentData, "Industry");

    return {
      timeline: Object.entries(byYear)
        .map(([year, count]) => ({
          year: parseInt(year),
          count,
          label: year,
        }))
        .sort((a, b) => a.year - b.year),
      industries: Object.entries(byIndustry)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      cantons: Object.entries(byCanton)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15),
      funded: Object.entries(byFunded).map(([name, value]) => ({
        name,
        value,
      })),
      industryTrends: industryTrends, // Array of {name, data: [{year, value}]} objects
    };
  } else {
    const byYear = {},
      byType = {},
      byPhase = {},
      byAmount = {},
      byCanton = {};

    currentData.forEach((item) => {
      if (item.Year) byYear[item.Year] = (byYear[item.Year] || 0) + 1;
      if (item.Type) byType[item.Type] = (byType[item.Type] || 0) + 1;
      if (item.Phase) byPhase[item.Phase] = (byPhase[item.Phase] || 0) + 1;
      if (item.AmountRange)
        byAmount[item.AmountRange] = (byAmount[item.AmountRange] || 0) + 1;
      if (item.Canton) byCanton[item.Canton] = (byCanton[item.Canton] || 0) + 1;
    });

    // Generate deal type trends in PROPER FORMAT
    const industryTrends = generateIndustryTrends(currentData, "Type");

    return {
      timeline: Object.entries(byYear)
        .map(([year, count]) => ({
          year: parseInt(year),
          count,
          label: year,
        }))
        .sort((a, b) => a.year - b.year),
      types: Object.entries(byType)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      phases: Object.entries(byPhase)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      amounts: Object.entries(byAmount).map(([name, value]) => ({
        name,
        value,
      })),
      cantons: Object.entries(byCanton)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15),
      scatter: currentData
        .filter((d) => d.Amount && d.Valuation)
        .map((d) => ({
          x: d.Amount,
          y: d.Valuation,
          company: d.Company,
          canton: d.Canton,
          year: d.Year,
        })),
      industryTrends: industryTrends, // Array of {name, data: [{year, value}]} objects
    };
  }
};
