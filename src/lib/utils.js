// utils.js
import { OFFICIAL_CANTONS, CANTON_MAP, CHART_MARGIN, EXPANDED_CHART_MARGIN } from "./constants";

/* =========================
   Generic helpers for charts
   ========================= */

// Recharts-safe key
export const sanitizeKey = (s) =>
  String(s || "Unknown").replace(/\s+/g, "_").replace(/[^\w]/g, "_");

// Compute chart dimensions; optional margins override
export const getChartDims = (isExpandedView, forcedHeight, margins) => ({
  width: isExpandedView ? 800 : 780,
  height: forcedHeight ?? (isExpandedView ? 600 : 420),
  margin: margins ?? (isExpandedView ? EXPANDED_CHART_MARGIN : CHART_MARGIN),
});

// Keep Y labels within plot area
export const clampY = (y, { height, margin }, pad = 8) => {
  const innerTop = (margin?.top ?? 0) + pad;
  const innerBottom = height - (margin?.bottom ?? 0) - pad;
  return Math.max(innerTop, Math.min(y, innerBottom));
};

// Tick helpers
const ceilToStep = (max, step) => Math.ceil(max / step) * step;
export const getTicks = (min, max, step) => {
  const end = ceilToStep(max, step);
  const out = [];
  for (let v = min; v <= end; v += step) out.push(v);
  return out;
};

// Deterministic color distributor using a map + palette
export const makeDistributedColorFn = (map, palette) => {
  const cache = new Map();
  return (name, allIndustries = []) => {
    if (!name) return "#7F8C8D";
    if (!cache.has(name)) {
      if (map[name]) {
        cache.set(name, map[name]);
      } else {
        const idx = allIndustries.indexOf(name);
        const pick = (idx >= 0 ? idx : cache.size) % palette.length;
        cache.set(name, palette[pick]);
      }
    }
    return cache.get(name);
  };
};

/* =========================
   Your existing data utils
   ========================= */

// Parse "CHF" amounts into millions, handling various input formats
const parseAmountToMillions = (v) => {
  if (v == null) return null;
  if (typeof v === "number") return v; // assume already in CHF millions

  let s = String(v).toLowerCase();
  s = s
    .replace(/chf/g, "")
    .replace(/\s/g, "")
    .replace(/[',']/g, "") // thousands separators (comma/apostrophe)
    .replace(/million(s)?/g, "m");

  // Already in millions? e.g., "5.2m"
  if (s.endsWith("m")) {
    const n = parseFloat(s.slice(0, -1).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  const n = parseFloat(s.replace(",", "."));
  if (!Number.isFinite(n)) return null;

  // Heuristic: if n > 10_000, it's CHF units; convert to millions
  return n > 10000 ? n / 1_000_000 : n;
};

export const normalizeCanton = (rawCanton) => {
  if (!rawCanton) return null;

  // Mapping table first
  const mapped = CANTON_MAP[rawCanton];
  if (mapped !== undefined) return mapped;

  // Then verify official canton names
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

export const processDeals = (dealsData, companiesData = []) => {
  // Build a lookup for company → industry mapping
  const companyLookup = new Map();
  if (companiesData && Array.isArray(companiesData)) {
    companiesData.forEach((company) => {
      if (company.Title) {
        const title = company.Title.trim();

        // Variants
        companyLookup.set(title.toLowerCase(), company);
        companyLookup.set(title.toLowerCase().replace(/\s+/g, ""), company); // no spaces
        companyLookup.set(title.toLowerCase().replace(/[^\w\s]/g, ""), company); // no punctuation

        // Remove common suffixes
        const withoutSuffix = title
          .toLowerCase()
          .replace(/\s+(ag|sa|ltd|inc|corp|gmbh|llc)$/i, "");
        if (withoutSuffix !== title.toLowerCase()) {
          companyLookup.set(withoutSuffix, company);
        }
      }
    });
  }

  const processedDeals = dealsData
    .filter((deal) => deal.Confidential !== "TRUE" && deal.Confidential !== true)
    .map((deal) => {
      let year = null;
      let quarter = null;

      if (deal["Date of the funding round"]) {
        const dateStr = deal["Date of the funding round"];
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          year = date.getFullYear();
          quarter = Math.floor(date.getMonth() / 3) + 1;
        }
      }

      // INDUSTRY MAPPING — derive from company list
      let industry = null;
      let mappingSource = "none";

      if (deal.Company) {
        const companyName = deal.Company.trim();

        let matchedCompany =
          companyLookup.get(companyName.toLowerCase()) ||
          companyLookup.get(companyName.toLowerCase().replace(/\s+/g, "")) ||
          companyLookup.get(companyName.toLowerCase().replace(/[^\w\s]/g, ""));

        if (!matchedCompany) {
          const withoutSuffix = companyName
            .toLowerCase()
            .replace(/\s+(ag|sa|ltd|inc|corp|gmbh|llc)$/i, "");
          matchedCompany = companyLookup.get(withoutSuffix);
        }

        if (matchedCompany && matchedCompany.Industry && matchedCompany.Industry.trim()) {
          industry = matchedCompany.Industry.trim();
          mappingSource = "company_lookup";
        }
      }

      const rawAmount =
        deal.Amount ??
        deal["Amount (CHF M)"] ??
        deal["Amount CHF M"] ??
        deal["Amount (CHF million)"] ??
        deal["AmountCHF_M"] ??
        deal["Deal Amount"] ??
        deal["Funding Amount"] ??
        deal["Amount (CHF)"] ??
        deal["Amount (CHF) m"];

      const parsedAmountM = parseAmountToMillions(rawAmount);

      return {
        ...deal,
        Amount: parsedAmountM,
        VolumeMChf: parsedAmountM, // <-- ensure charting uses this
        Valuation: deal.Valuation ? parseFloat(deal.Valuation) : null,
        Year: year,
        Quarter: quarter,
        Industry: industry,
        MappingSource: mappingSource,
        Canton: normalizeCanton(deal.Canton) || "Unknown",
        HasAmount: !!(parsedAmountM && parseFloat(parsedAmountM) > 0),
        HasValuation: !!(deal.Valuation && parseFloat(deal.Valuation) > 0),
        AmountRange: parsedAmountM
          ? parseFloat(parsedAmountM) < 1
            ? "<1M"
            : parseFloat(parsedAmountM) < 5
            ? "1-5M"
            : parseFloat(parsedAmountM) < 10
            ? "5-10M"
            : parseFloat(parsedAmountM) < 25
            ? "10-25M"
            : parseFloat(parsedAmountM) < 50
            ? "25-50M"
            : "50M+"
          : "Unknown",
      };
    });

  return processedDeals;
};

export const generateChartData = (activeTab, filteredCompanies, filteredDeals) => {
  const currentData = activeTab === "companies" ? filteredCompanies : filteredDeals;

  if (activeTab === "companies") {
    const byYear = {}, byIndustry = {}, byCanton = {}, byFunded = {};

    currentData.forEach((item) => {
      if (item.Year) byYear[item.Year] = (byYear[item.Year] || 0) + 1;

      // Only count real industries from JSON
      if (item.Industry && item.Industry !== "Unknown") {
        byIndustry[item.Industry] = (byIndustry[item.Industry] || 0) + 1;
      }

      if (item.Canton) byCanton[item.Canton] = (byCanton[item.Canton] || 0) + 1;

      const fundedStatus = item.Funded ? "Funded" : "Not Funded";
      byFunded[fundedStatus] = (byFunded[fundedStatus] || 0) + 1;
    });

    const realIndustries = Object.entries(byIndustry)
      .filter(([name]) => name && name !== "Unknown")
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    const allYears = Array.from(
      new Set(currentData.map((d) => d.Year).filter(Boolean))
    ).sort((a, b) => a - b);

    const industryTrends = realIndustries.map((industry) => {
      const industryData = allYears.map((year) => {
        const count = currentData.filter(
          (d) => d.Industry === industry && d.Year === year
        ).length;
        return { year, value: count, count, volume: 0, quarter: null };
      });

      return { name: industry, data: industryData };
    });

    return {
      timeline: Object.entries(byYear)
        .map(([year, count]) => ({ year: parseInt(year), count, volume: 0, label: year }))
        .sort((a, b) => a.year - b.year),
      industries: Object.entries(byIndustry)
        .filter(([name]) => name && name !== "Unknown")
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      cantons: Object.entries(byCanton)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15),
      funded: Object.entries(byFunded).map(([name, value]) => ({ name, value })),
      industryTrends,
    };
  }

  // DEALS
  const byYear = {},
    byYearVolume = {},
    byType = {},
    byPhase = {},
    byAmount = {},
    byCanton = {},
    byIndustryDeals = {};

  currentData.forEach((item) => {
    if (item.Year) {
      byYear[item.Year] = (byYear[item.Year] || 0) + 1;
      byYearVolume[item.Year] = (byYearVolume[item.Year] || 0) + (item.Amount || 0);
    }
    if (item.Type) byType[item.Type] = (byType[item.Type] || 0) + 1;
    if (item.Phase) byPhase[item.Phase] = (byPhase[item.Phase] || 0) + 1;
    if (item.AmountRange) byAmount[item.AmountRange] = (byAmount[item.AmountRange] || 0) + 1;
    if (item.Canton) byCanton[item.Canton] = (byCanton[item.Canton] || 0) + 1;

    // Only deals with REAL industry + time granularity
    const industry = item.Industry;
    if (industry && item.Year && item.Quarter) {
      if (!byIndustryDeals[industry]) byIndustryDeals[industry] = {};
      const yearQuarter = `${item.Year}-Q${item.Quarter}`;
      if (!byIndustryDeals[industry][yearQuarter]) {
        byIndustryDeals[industry][yearQuarter] = { count: 0, volume: 0 };
      }
      byIndustryDeals[industry][yearQuarter].count += 1;
      byIndustryDeals[industry][yearQuarter].volume += item.Amount || 0;
    }
  });

  const dealIndustryTrends = Object.entries(byIndustryDeals)
    .filter(([name]) => name && name !== "Unknown")
    .map(([industry, yearQuarterData]) => ({
      name: industry,
      data: Object.entries(yearQuarterData)
        .map(([yq, d]) => {
          const [year, qStr] = yq.split("-Q");
          return { year: parseInt(year), quarter: parseInt(qStr), count: d.count, volume: d.volume };
        })
        .filter((d) => d.year && d.quarter)
        .sort((a, b) => a.year - b.year || a.quarter - b.quarter),
    }))
    .filter((it) => it.data.length > 0)
    .sort((a, b) => {
      const totalA = a.data.reduce((sum, d) => sum + d.count, 0);
      const totalB = b.data.reduce((sum, d) => sum + d.count, 0);
      return totalB - totalA;
    })
    .slice(0, 15);

  return {
    timeline: Object.entries(byYear)
      .map(([year, count]) => ({
        year: parseInt(year),
        count,
        volume: byYearVolume[year] || 0,
        label: year,
      }))
      .sort((a, b) => a.year - b.year),
    types: Object.entries(byType)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    phases: Object.entries(byPhase)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    amounts: Object.entries(byAmount).map(([name, value]) => ({ name, value })),
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
    industryTrends: dealIndustryTrends,
  };
};
