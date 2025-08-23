
import React from "react";

const ShiftedLine = ({ points, stroke, strokeWidth = 3, offset = 8 }) => {
  if (!points || !points.length) return null;
  const d = points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y - offset}`).join(" ");
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
};

export default ShiftedLine;
