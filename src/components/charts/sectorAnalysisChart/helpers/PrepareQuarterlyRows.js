
import { sanitizeKey } from "../../../../lib/utils";

export default function prepareQuarterlyRows(dealsSource) {
  const byYearIndustry = {};
  const yearSet = new Set();
  const industrySet = new Set();
  const totals = {};

  dealsSource.forEach((d) => {
    const year = Number(d.Year ?? d.year);
    if (!year || year === 2025) return;
    const ind = (d.Industry && String(d.Industry).trim()) || "Unknown";
    if (!ind) return;

    yearSet.add(year);
    industrySet.add(ind);
    byYearIndustry[year] ??= {};
    byYearIndustry[year][ind] ??= { count: 0, volume: 0 };

    const amt = typeof d.Amount === "number" && isFinite(d.Amount) ? d.Amount : 0;
    byYearIndustry[year][ind].count += 1;
    byYearIndustry[year][ind].volume += amt;

    totals[ind] = (totals[ind] || 0) + amt;
  });

  const years = Array.from(yearSet).sort((a, b) => a - b);
  const industries = Array.from(industrySet).sort();

  const rows = years.map((year) => {
    const entry = { year };
    let tc = 0;
    let tv = 0;

    industries.forEach((ind) => {
      const cKey = `${sanitizeKey(ind)}__count`;
      const vKey = `${sanitizeKey(ind)}__volume`;
      const cell = byYearIndustry[year]?.[ind];
      const c = cell ? cell.count : 0;
      const v = cell ? cell.volume : 0;
      entry[cKey] = c;
      entry[vKey] = +v;
      tc += c;
      tv += v;
    });

    entry.totalCount = tc;
    entry.totalVolume = +tv;
    entry.__grandTotalCount = tc;   // immutable totals
    entry.__grandTotalVolume = tv;

    return entry;
  });

  const top5 = Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name]) => name);

  return { rows, industries, top5 };
}
