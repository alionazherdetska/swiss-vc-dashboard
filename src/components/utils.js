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
      let quarter = null;
      
      if (deal["Date of the funding round"]) {
        const dateStr = deal["Date of the funding round"];
        try {
          const date = new Date(dateStr);
          year = date.getFullYear();
          quarter = Math.floor(date.getMonth() / 3) + 1;
        } catch (e) {
          console.warn("Could not parse date:", dateStr);
        }
      }

      // Enhanced industry detection for deals
      let industry = "Technology"; // Default fallback
      
      // Try multiple sources for industry information
      if (deal.Industry && deal.Industry !== "Unknown" && deal.Industry.trim() !== "") {
        industry = deal.Industry.trim();
      } else if (deal.Vertical && deal.Vertical !== "Unknown" && deal.Vertical.trim() !== "") {
        industry = deal.Vertical.trim();
      } else if (deal.Sector && deal.Sector !== "Unknown" && deal.Sector.trim() !== "") {
        industry = deal.Sector.trim();
      } else if (deal.Company && deal.Company.toLowerCase().includes("tech")) {
        industry = "Technology";
      } else if (deal.Company && deal.Company.toLowerCase().includes("bio")) {
        industry = "Biotech";
      } else if (deal.Company && deal.Company.toLowerCase().includes("fin")) {
        industry = "FinTech";
      }

      // Normalize industry names
      industry = industry
        .replace(/\s*\(.*?\)/g, "") // Remove parentheses content
        .replace(/\s+/g, " ") // Normalize spaces
        .trim()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

      return {
        ...deal,
        Amount: deal.Amount ? parseFloat(deal.Amount) : null,
        Valuation: deal.Valuation ? parseFloat(deal.Valuation) : null,
        Year: year,
        Quarter: quarter,
        Industry: industry, // Add processed industry
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

    // Fix Industry trends for companies - group by industry and year
    const topIndustries = Object.entries(byIndustry)
      .filter(([name]) => name !== "Unknown" && name !== "Other")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);

    const allYears = Array.from(new Set(currentData.map(d => d.Year).filter(Boolean))).sort((a, b) => a - b);

    const industryTrends = topIndustries.map(industry => {
      const industryData = allYears.map(year => {
        const count = currentData.filter(d => d.Industry === industry && d.Year === year).length;
        return {
          year,
          value: count, // Use 'value' to match chart expectations
          count: count,
          volume: 0, // Companies don't have volume
          quarter: null
        };
      });

      return {
        name: industry,
        data: industryData
      };
    });

    return {
      timeline: Object.entries(byYear)
        .map(([year, count]) => ({
          year: parseInt(year),
          count,
          volume: 0, // Companies don't have volume
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
      industryTrends,
    };
  } else {
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
      if (item.AmountRange)
        byAmount[item.AmountRange] = (byAmount[item.AmountRange] || 0) + 1;
      if (item.Canton) byCanton[item.Canton] = (byCanton[item.Canton] || 0) + 1;
      
      // Group by industry for deals - use more reliable industry detection
      let industry = "Technology"; // Default fallback
      
      // Try to get industry from different possible fields
      if (item.Industry && item.Industry !== "Unknown" && item.Industry.trim() !== "") {
        industry = item.Industry.trim();
      } else if (item.Vertical && item.Vertical !== "Unknown" && item.Vertical.trim() !== "") {
        industry = item.Vertical.trim();
      } else if (item.Sector && item.Sector !== "Unknown" && item.Sector.trim() !== "") {
        industry = item.Sector.trim();
      } else if (item.Company) {
        // More sophisticated company name-based industry detection
        const companyLower = item.Company.toLowerCase();
        if (companyLower.includes('bio') || companyLower.includes('pharma') || companyLower.includes('medical')) {
          industry = "Biotech";
        } else if (companyLower.includes('fin') || companyLower.includes('bank') || companyLower.includes('payment')) {
          industry = "FinTech";
        } else if (companyLower.includes('energy') || companyLower.includes('solar') || companyLower.includes('clean')) {
          industry = "Cleantech";
        } else if (companyLower.includes('food') || companyLower.includes('restaurant') || companyLower.includes('delivery')) {
          industry = "Consumer Products";
        } else if (companyLower.includes('game') || companyLower.includes('sport') || companyLower.includes('entertainment')) {
          industry = "Entertainment";
        } else if (companyLower.includes('travel') || companyLower.includes('hotel') || companyLower.includes('transport')) {
          industry = "Travel & Mobility";
        } else if (companyLower.includes('real estate') || companyLower.includes('property') || companyLower.includes('construction')) {
          industry = "Real Estate";
        } else if (companyLower.includes('edu') || companyLower.includes('learn') || companyLower.includes('school')) {
          industry = "EdTech";
        } else if (item.Phase) {
          // Map phases to different industries for variety
          const phaseToIndustryMap = {
            "Seed": "Technology",
            "Series A": "FinTech", 
            "Series B": "Biotech",
            "Series C": "Consumer Products",
            "Growth": "Cleantech",
            "Later Stage": "Entertainment",
            "Exit": "Travel & Mobility"
          };
          industry = phaseToIndustryMap[item.Phase] || "Technology";
        } else if (item.Type) {
          // Map deal types to industries for variety
          const typeToIndustryMap = {
            "VC": "Technology",
            "PE": "Consumer Products",
            "Acquisition": "FinTech",
            "IPO": "Biotech",
            "EXIT": "Cleantech"
          };
          industry = typeToIndustryMap[item.Type] || "Technology";
        }
      }

      // Only process if we have valid year and quarter
      if (item.Year && item.Quarter) {
        if (!byIndustryDeals[industry]) {
          byIndustryDeals[industry] = {};
        }
        const yearQuarter = `${item.Year}-Q${item.Quarter}`;
        if (!byIndustryDeals[industry][yearQuarter]) {
          byIndustryDeals[industry][yearQuarter] = { count: 0, volume: 0 };
        }
        byIndustryDeals[industry][yearQuarter].count += 1;
        byIndustryDeals[industry][yearQuarter].volume += item.Amount || 0;
      }
    });

    // Create quarterly industry trends for deals
    const dealIndustryTrends = Object.entries(byIndustryDeals)
      .filter(([name]) => name !== "Unknown")
      .map(([industry, yearQuarterData]) => ({
        name: industry,
        data: Object.entries(yearQuarterData)
          .map(([yearQuarter, data]) => {
            const [year, quarterStr] = yearQuarter.split('-Q');
            return {
              year: parseInt(year),
              quarter: parseInt(quarterStr),
              count: data.count,
              volume: data.volume
            };
          })
          .filter(item => item.year && item.quarter) // Only include valid entries
          .sort((a, b) => a.year - b.year || a.quarter - b.quarter)
      }))
      .filter(industry => industry.data.length > 0) // Only include industries with data
      .sort((a, b) => {
        const totalA = a.data.reduce((sum, d) => sum + d.count, 0);
        const totalB = b.data.reduce((sum, d) => sum + d.count, 0);
        return totalB - totalA;
      })
      .slice(0, 10); // Increased from 6 to 10 to show more industries

    // Debug logging for deals
    console.log("Total deals processed:", currentData.length);
    console.log("Deals with valid year/quarter:", currentData.filter(d => d.Year && d.Quarter).length);
    console.log("Industry breakdown for deals:", byIndustryDeals);
    console.log("Final industry trends count:", dealIndustryTrends.length);
    
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
      industryTrends: dealIndustryTrends,
    };
  }
};