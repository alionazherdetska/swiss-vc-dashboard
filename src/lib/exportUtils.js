/**
 * Export utilities for charts
 * Handles CSV and PDF export functionality
 */

/**
 * Convert array of objects to CSV string
 */
export function toCSV(rows) {
  if (!rows || !rows.length) return "";
  
  const keys = Object.keys(rows[0]);
  const header = keys.join(",");
  
  const lines = rows.map((r) =>
    keys
      .map((k) => {
        const v = r[k] == null ? "" : String(r[k]);
        const escaped = v.replace(/"/g, '""');
        if (/[",\n]/.test(escaped)) return `"${escaped}"`;
        return escaped;
      })
      .join(",")
  );
  
  return [header, ...lines].join("\n");
}

/**
 * Trigger download of text content as a file
 */
export function downloadFile(filename, content, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV file
 */
export function exportCSV(rows, filename = "export.csv") {
  const csv = toCSV(rows);
  downloadFile(filename, csv, "text/csv;charset=utf-8;");
}

/**
 * Export content as PDF (opens print dialog)
 */
export function exportPDF(contentHtml, filename = "export.pdf") {
  const w = window.open("", "_blank");
  if (!w) return;
  
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${contentHtml}</body></html>`
  );
  w.document.close();
  w.focus();
}