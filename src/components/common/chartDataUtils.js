import { sanitizeKey } from '../../lib/utils';

/**
 * Prepare gender-based data for charting
 */
export const prepareGenderData = (deals, genders) => {
    const byYear = {};
    deals.forEach(d => {
        if (!d.Gender || !d.Year) return;
        const year = d.Year;
        const genderKey = sanitizeKey(d.Gender);
        if (!byYear[year]) byYear[year] = { year };
        byYear[year][`${genderKey}__volume`] = (byYear[year][`${genderKey}__volume`] || 0) + Number(d.Amount || 0);
        byYear[year][`${genderKey}__count`] = (byYear[year][`${genderKey}__count`] || 0) + 1;
        byYear[year]['__grandTotalVolume'] = (byYear[year]['__grandTotalVolume'] || 0) + Number(d.Amount || 0);
        byYear[year]['__grandTotalCount'] = (byYear[year]['__grandTotalCount'] || 0) + 1;
    });

    const allRows = Object.values(byYear).sort((a, b) => a.year - b.year);
    
    // Find first year with any non-zero value
    const firstIdx = allRows.findIndex(row => {
        return genders.some(gender => {
            const v = row[`${sanitizeKey(gender)}__volume`] || 0;
            const c = row[`${sanitizeKey(gender)}__count`] || 0;
            return v > 0 || c > 0;
        });
    });

    const rows = firstIdx >= 0 ? allRows.slice(firstIdx) : allRows;
    
    return {
        rows,
        metadata: {
            totalVolume: rows.reduce((sum, row) => sum + (row.__grandTotalVolume || 0), 0),
            totalCount: rows.reduce((sum, row) => sum + (row.__grandTotalCount || 0), 0)
        }
    };
};

/**
 * Prepare canton-based data for charting
 */
export const prepareCantonData = (deals, cantons) => {
    const byYear = {};
    deals.forEach(d => {
        if (!d.Canton || !d.Year) return;
        const year = d.Year;
        const cantonKey = sanitizeKey(d.Canton);
        if (!byYear[year]) byYear[year] = { year };
        byYear[year][`${cantonKey}__volume`] = (byYear[year][`${cantonKey}__volume`] || 0) + Number(d.Amount || 0);
        byYear[year][`${cantonKey}__count`] = (byYear[year][`${cantonKey}__count`] || 0) + 1;
        byYear[year]['__grandTotalVolume'] = (byYear[year]['__grandTotalVolume'] || 0) + Number(d.Amount || 0);
        byYear[year]['__grandTotalCount'] = (byYear[year]['__grandTotalCount'] || 0) + 1;
    });

    const allRows = Object.values(byYear).sort((a, b) => a.year - b.year);
    
    // Find first year with any non-zero value
    const firstIdx = allRows.findIndex(row => {
        return cantons.some(canton => {
            const v = row[`${sanitizeKey(canton)}__volume`] || 0;
            const c = row[`${sanitizeKey(canton)}__count`] || 0;
            return v > 0 || c > 0;
        });
    });

    const rows = firstIdx >= 0 ? allRows.slice(firstIdx) : allRows;
    
    return {
        rows,
        metadata: {
            totalVolume: rows.reduce((sum, row) => sum + (row.__grandTotalVolume || 0), 0),
            totalCount: rows.reduce((sum, row) => sum + (row.__grandTotalCount || 0), 0)
        }
    };
};

/**
 * Prepare phase-based data for charting
 */
export const preparePhaseData = (deals, phases) => {
    const byYear = {};
    deals.forEach(d => {
        if (!d.Phase || !d.Year) return;
        const year = d.Year;
        const phaseKey = sanitizeKey(d.Phase);
        if (!byYear[year]) byYear[year] = { year };
        byYear[year][`${phaseKey}__volume`] = (byYear[year][`${phaseKey}__volume`] || 0) + Number(d.Amount || 0);
        byYear[year][`${phaseKey}__count`] = (byYear[year][`${phaseKey}__count`] || 0) + 1;
        byYear[year]['__grandTotalVolume'] = (byYear[year]['__grandTotalVolume'] || 0) + Number(d.Amount || 0);
        byYear[year]['__grandTotalCount'] = (byYear[year]['__grandTotalCount'] || 0) + 1;
    });

    const allRows = Object.values(byYear).sort((a, b) => a.year - b.year);
    
    // Find first year with any non-zero value
    const firstIdx = allRows.findIndex(row => {
        return phases.some(phase => {
            const v = row[`${sanitizeKey(phase)}__volume`] || 0;
            const c = row[`${sanitizeKey(phase)}__count`] || 0;
            return v > 0 || c > 0;
        });
    });

    const rows = firstIdx >= 0 ? allRows.slice(firstIdx) : allRows;
    
    return {
        rows,
        metadata: {
            totalVolume: rows.reduce((sum, row) => sum + (row.__grandTotalVolume || 0), 0),
            totalCount: rows.reduce((sum, row) => sum + (row.__grandTotalCount || 0), 0)
        }
    };
};

/**
 * Prepare quarterly data for charting
 */
export const prepareQuarterlyData = (deals) => {
    const byQuarter = {};
    
    deals.forEach(deal => {
        if (!deal.Year || !deal.Quarter) return;
        const quarterKey = `${deal.Year} Q${deal.Quarter}`;
        
        if (!byQuarter[quarterKey]) {
            byQuarter[quarterKey] = {
                quarter: quarterKey,
                year: deal.Year,
                q: deal.Quarter,
                volume: 0,
                count: 0
            };
        }
        
        byQuarter[quarterKey].volume += Number(deal.Amount || 0);
        byQuarter[quarterKey].count += 1;
    });

    const rows = Object.values(byQuarter).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.q - b.q;
    });

    return {
        rows,
        metadata: {
            totalVolume: rows.reduce((sum, row) => sum + row.volume, 0),
            totalCount: rows.reduce((sum, row) => sum + row.count, 0)
        }
    };
};