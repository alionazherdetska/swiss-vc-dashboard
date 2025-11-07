/**
 * Common data processing utilities for charts
 * Handles data aggregation, grouping, and transformation patterns
 */

import { sanitizeKey } from "../../../lib/utils";

/**
 * Group data by year for chart processing
 */
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

/**
 * Calculate yearly aggregated data for multiple categories
 */
export const calculateYearlyData = (data, config) => {
  const {
    groupByField = "Year",
    categories = [],
    getCategoryValue = (item) => item.Industry,
    getVolumeValue = (item) => item.VolumeMChf || 0,
    includeTotal = false,
  } = config;

  const groupedByYear = groupDataByYear(data, groupByField);

  return Object.entries(groupedByYear)
    .map(([year, items]) => {
      const yearData = { year: parseInt(year) };
      let totalCount = 0;
      let totalVolume = 0;

      // Process each category
      categories.forEach((category) => {
        const categoryItems = items.filter(
          (item) => getCategoryValue(item) === category,
        );

        const count = categoryItems.length;
        const volume = categoryItems.reduce(
          (sum, item) => sum + getVolumeValue(item),
          0,
        );

        const sanitizedKey = sanitizeKey(category);
        yearData[`${sanitizedKey}__count`] = count;
        yearData[`${sanitizedKey}__volume`] = Math.round(volume * 10) / 10;

        totalCount += count;
        totalVolume += volume;
      });

      // Add totals if requested
      if (includeTotal) {
        yearData.totalCount = totalCount;
        yearData.totalVolume = Math.round(totalVolume * 10) / 10;
        yearData.__grandTotalCount = totalCount;
        yearData.__grandTotalVolume = Math.round(totalVolume * 10) / 10;
      }

      return yearData;
    })
    .sort((a, b) => a.year - b.year);
};

/**
 * Calculate simple yearly totals (for single category data)
 */
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

/**
 * Extract unique categories from data
 */
export const extractCategories = (data, getCategoryValue, sortFn = null) => {
  if (!data || !Array.isArray(data)) return [];

  const categories = [...new Set(data.map(getCategoryValue).filter(Boolean))];

  return sortFn ? categories.sort(sortFn) : categories;
};

/**
 * Filter data by selected categories
 */
export const filterDataByCategories = (
  data,
  selectedCategories,
  getCategoryValue,
) => {
  if (!selectedCategories || selectedCategories.length === 0) return data;

  return data.filter((item) => {
    const category = getCategoryValue(item);
    return selectedCategories.includes(category);
  });
};

/**
 * Prepare chart series data for D3 charts
 */
export const prepareChartSeries = (
  data,
  categories,
  metricSuffix = "__volume",
) => {
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

/**
 * Get chart data configuration for different chart types
 */
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
