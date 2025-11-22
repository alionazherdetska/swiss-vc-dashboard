// Simple export helpers: CSV and basic PDF via window.print fallback

// Convert array of objects to CSV string. Expects rows with consistent keys.
export function toCSV(rows) {
  if (!rows || !rows.length) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.join(",");
  const lines = rows.map((r) =>
    keys
      .map((k) => {
        const v = r[k] == null ? "" : String(r[k]);
        // Escape quotes
        const escaped = v.replace(/"/g, '""');
        // Wrap fields containing comma/newline/quote in quotes
        if (/[",\n]/.test(escaped)) return `"${escaped}"`;
        return escaped;
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}

// Trigger download of text content as a file
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

// Simple CSV export helper that accepts rows (array of objects) and filename
export function exportCSV(rows, filename = "export.csv") {
  const csv = toCSV(rows);
  downloadFile(filename, csv, "text/csv;charset=utf-8;");
}

// Basic PDF helper: attempts to open a printable view and call print()
// For a robust PDF export, integrate with a client-side PDF library (e.g., jsPDF)
export function exportPDF(contentHtml, filename = "export.pdf") {
  // Create printable window
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${contentHtml}</body></html>`
  );
  w.document.close();
  // Let user print/save as PDF
  w.focus();
  // We don't call print() automatically to avoid popup blocking; caller can.
}
