/**
 * Common data processing utilities for charts
 * Handles data aggregation, grouping, and transformation patterns
 */

import { sanitizeKey } from "../../../lib/utils";

export const groupDataByYear = (data, groupByField = "Year") => {
  if (!data || !Array.isArray(data)) return {};

  return data.reduce((acc, item) => {
    const year = item[groupByField];
    if (!year) return acc;

    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(item);
    return acc;
  }, {});
};

export const calculateYearlyData = (data, config) => {
  const {
    groupByField = "Year",
    categories = [],
    getCategoryValue = (item) => item.Industry,
    getVolumeValue = (item) => item.VolumeMChf || 0,
    includeTotal = false,
    // Pass all data for grand total calculation (optional, falls back to data)
    allData = null,
  } = config;

  const groupedByYear = groupDataByYear(data, groupByField);
  // Group all data separately for grand total calculation
  const allGroupedByYear = allData ? groupDataByYear(allData, groupByField) : groupedByYear;

  // Get all years from both datasets to ensure we don't miss any
  const allYears = new Set([
    ...Object.keys(groupedByYear),
    ...(allData ? Object.keys(allGroupedByYear) : []),
  ]);

  return Array.from(allYears)
    .map((year) => {
      const items = groupedByYear[year] || [];
      const yearData = { year: parseInt(year) };

      // Calculate per-category values
      categories.forEach((category) => {
        const categoryItems = items.filter((item) => getCategoryValue(item) === category);

        const count = categoryItems.length;
        const volume = categoryItems.reduce((sum, item) => sum + getVolumeValue(item), 0);

        const sanitizedKey = sanitizeKey(category);
        yearData[`${sanitizedKey}__count`] = count;
        yearData[`${sanitizedKey}__volume`] = Math.round(volume * 10) / 10;
      });

      if (includeTotal) {
        // Grand total from ALL data (unfiltered), not just selected categories
        const allItemsForYear = allGroupedByYear[year] || [];
        const grandTotalCount = allItemsForYear.length;
        const grandTotalVolume = allItemsForYear.reduce(
          (sum, item) => sum + getVolumeValue(item),
          0
        );

        yearData.totalCount = grandTotalCount;
        yearData.totalVolume = Math.round(grandTotalVolume * 10) / 10;
        yearData.__grandTotalCount = grandTotalCount;
        yearData.__grandTotalVolume = Math.round(grandTotalVolume * 10) / 10;
      }

      return yearData;
    })
    .sort((a, b) => a.year - b.year);
};

export const calculateSimpleYearlyData = (data, config = {}) => {
  const {
    groupByField = "Year",
    getVolumeValue = (item) => item.VolumeMChf || 0,
    countField = "count",
    volumeField = "volume",
  } = config;

  const groupedByYear = groupDataByYear(data, groupByField);

  return Object.entries(groupedByYear)
    .map(([year, items]) => {
      const count = items.length;
      const volume = items.reduce((sum, item) => sum + getVolumeValue(item), 0);

      return {
        year: parseInt(year),
        [countField]: count,
        [volumeField]: Math.round(volume * 10) / 10,
        totalCount: count,
        totalVolume: Math.round(volume * 10) / 10,
      };
    })
    .sort((a, b) => a.year - b.year);
};

export const extractCategories = (data, getCategoryValue, sortFn = null) => {
  if (!data || !Array.isArray(data)) return [];

  const categories = [...new Set(data.map(getCategoryValue).filter(Boolean))];

  return sortFn ? categories.sort(sortFn) : categories;
};

export const filterDataByCategories = (data, selectedCategories, getCategoryValue) => {
  if (!selectedCategories || selectedCategories.length === 0) return data;

  return data.filter((item) => {
    const category = getCategoryValue(item);
    return selectedCategories.includes(category);
  });
};

export const prepareChartSeries = (data, categories, metricSuffix = "__volume") => {
  return data.map((yearData) => {
    const series = { ...yearData };

    categories.forEach((category) => {
      const sanitizedKey = sanitizeKey(category);
      const value = yearData[`${sanitizedKey}${metricSuffix}`] || 0;
      series[sanitizedKey] = value;
    });

    return series;
  });
};

export const getChartConfig = (chartType) => {
  const configs = {
    quarterly: {
      getCategoryValue: (item) => item.Industry,
      getVolumeValue: (item) => item.VolumeMChf || 0,
      includeTotal: true,
    },
    canton: {
      getCategoryValue: (item) => item.Canton,
      getVolumeValue: (item) => item.VolumeMChf || 0,
      includeTotal: true,
    },
    gender: {
      getCategoryValue: (item) => item.Gender,
      getVolumeValue: (item) => item.VolumeMChf || 0,
      includeTotal: true,
    },
    phase: {
      getCategoryValue: (item) => item.Phase,
      getVolumeValue: (item) => item.VolumeMChf || 0,
      includeTotal: true,
    },
  };

  return configs[chartType] || configs.quarterly;
};
