
import React from "react";

const SortedTooltip = ({ active, payload, label, isVolume }) => {
  if (!active || !payload || !payload.length) return null;

  const norm = (s) =>
    String(s || "")
      .replace(/(__|_)?(count|volume)$/i, "")
      .replace(/_/g, " ")
      .trim();

  const byBase = new Map();
  for (const p of payload) {
    const rawName = p?.name ?? p?.dataKey ?? "";
    if (!rawName || String(rawName).startsWith("__helper__")) continue;

    const base = norm(rawName);
    const value = +p?.value || 0;
    const color = p?.color || p?.stroke || p?.fill || "#888";

    const prev = byBase.get(base);
    if (!prev || value > prev.value) byBase.set(base, { name: base, value, color });
  }

  const rows = Array.from(byBase.values())
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #E2E8F0",
        borderRadius: "8px",
        color: "#1F2937",
        minWidth: 180,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #E2E8F0",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div>
        {rows.map((it) => (
          <div
            key={it.name}
            style={{
              padding: "6px 12px",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div
              style={{ width: 10, height: 10, borderRadius: 2, background: it.color }}
            />
            <div style={{ fontSize: 13 }}>
              <span style={{ color: it.color, fontWeight: 600 }}>{it.name}</span>
              <span style={{ marginLeft: 8 }}>
                : {isVolume ? `${it.value.toFixed(1)}M CHF` : it.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SortedTooltip;
