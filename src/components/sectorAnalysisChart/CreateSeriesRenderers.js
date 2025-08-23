
import { Bar, Line, LabelList } from "recharts";
import { sanitizeKey, clampY } from "../utils";
import { SMALLSET_LABEL_BASE_LIFT, SMALLSET_LABEL_DY } from "../constants";

/**
 * Returns { main } where main is JSX for either bars or lines.
 * All complex label rules live here.
 */
export default function createSeriesRenderers({
  industries,
  colorOf,
  rows,
  top5,
  mode,                // "line" | "column"
  metricSuffix,        // "volume" | "count"
  showLabelsEnabled,
  isExpandedView,
  chartDims,
  shouldFullyLabelLines,
  latestYear,
  top3For2024,         // { volume:Set, count:Set }
}) {
  const totalKey = metricSuffix === "volume" ? "totalVolume" : "totalCount";
  const barSize = isExpandedView ? 48 : 36;

  const MIN_SHARE = 0.1;
  const MIN_PX = 12;
  const TOP5_MIN_SHARE = 0.06;
  const TOP5_MIN_PX = 10;

  const formatK = (n) => {
    if (metricSuffix === "count") return `${n ?? 0}`;
    const v = Number(n) || 0;
    if (v >= 1000) {
      const k = v / 1000;
      const kr = Math.round(k * 10) / 10;
      return kr % 1 === 0 ? `${kr.toFixed(0)}k` : `${kr.toFixed(1)}k`;
    }
    const r = Math.round(v * 10) / 10;
    return r % 1 === 0 ? `${r.toFixed(0)}` : `${r.toFixed(1)}`;
  };

  const renderBars = () =>
    industries.map((ind, idx) => {
      const key = `${sanitizeKey(ind)}__${metricSuffix}`;
      const isLastStack = idx === industries.length - 1;

      return (
        <Bar
          key={key}
          dataKey={key}
          stackId={`stack-${metricSuffix}`}
          fill={colorOf(ind)}
          legendType="none"
          barSize={barSize}
        >
          {showLabelsEnabled && (
            <LabelList
              dataKey={key}
              content={({ x, y, width, height, value, index }) => {
                if (x == null || y == null || width == null || height == null || index == null) return null;

                const row = rows[index];
                if (!row) return null;

                const total = Number(row[totalKey]) || 0;
                const v = Number(value) || 0;
                if (total <= 0) return null;

                if (metricSuffix === "volume" && v < 5) return null;
                if (metricSuffix === "count" && v < 2) return null;

                const share = v / total;
                const meetsDefault = share >= MIN_SHARE && height >= MIN_PX;
                const meetsTop5 =
                  Array.isArray(top5) &&
                  top5.includes(ind) &&
                  share >= TOP5_MIN_SHARE &&
                  height >= TOP5_MIN_PX;
                if (!(meetsDefault || meetsTop5)) return null;

                const cx = x + width / 2;
                const cy = clampY(y + height / 2, chartDims, 10);

                return (
                  <text
                    x={cx}
                    y={cy}
                    fill="#000"
                    fontSize={isExpandedView ? 12 : 10}
                    fontWeight="600"
                    textAnchor="middle"
                    alignmentBaseline="central"
                    pointerEvents="none"
                  >
                    {formatK(v)}
                  </text>
                );
              }}
            />
          )}

          {showLabelsEnabled && isLastStack && (
            <LabelList
              dataKey={totalKey}
              position="top"
              offset={isExpandedView ? 18 : 14}
              content={({ x, y, width, value }) => {
                if (x == null || y == null || width == null) return null;
                const cx = x + width / 2;
                const ySafe = clampY(y - (isExpandedView ? 14 : 10), chartDims, 10);
                return (
                  <text
                    x={cx}
                    y={ySafe}
                    fill="#000"
                    fontWeight="700"
                    fontSize={isExpandedView ? 14 : 12}
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {formatK(value)}
                  </text>
                );
              }}
            />
          )}
        </Bar>
      );
    });

  const renderRightEndLabelsForLines = () =>
    industries.map((ind, idx) => {
      const key = `${sanitizeKey(ind)}__${metricSuffix}`;
      if (shouldFullyLabelLines || !showLabelsEnabled) return null;

      const top3Set = metricSuffix === "volume" ? top3For2024.volume : top3For2024.count;
      const shouldConsider = latestYear === 2024 && top3Set.has(ind);
      if (!shouldConsider) return null;

      return (
        <Bar
          key={`_line_labels_${key}`}
          dataKey={key}
          fill="transparent"
          stroke="transparent"
          isAnimationActive={false}
          legendType="none"
          shape={() => null}
        >
          <LabelList
            dataKey={key}
            position="right"
            content={({ x, y, width, value, index }) => {
              if (index !== rows.length - 1) return null;
              if (Number(rows[index]?.year) !== 2024) return null;

              const v = Number(value) || 0;
              if (metricSuffix === "volume" && v < 5) return null;
              if (metricSuffix === "count" && v < 2) return null;

              const rightOffset = isExpandedView ? 8 : 4;
              const baseX = x != null ? x + (width || 0) : 0;
              const cx = baseX + rightOffset;

              const lift = [-12, -6, -18][idx % 3];
              const cy = clampY((y ?? 0) + lift, chartDims, 10);

              return (
                <text
                  x={cx}
                  y={cy}
                  fill="#000"
                  fontSize={isExpandedView ? 12 : 11}
                  fontWeight="600"
                  textAnchor="start"
                  alignmentBaseline="central"
                  pointerEvents="none"
                >
                  {formatK(v)}
                </text>
              );
            }}
          />
        </Bar>
      );
    });

  const renderFullPointLabelsForLines = () =>
    industries.map((ind, seriesIdx) => {
      const key = `${sanitizeKey(ind)}__${metricSuffix}`;
      if (!shouldFullyLabelLines || !showLabelsEnabled) return null;

      const lastYByX = new Map();

      return (
        <Bar
          key={`_line_full_labels_${key}`}
          dataKey={key}
          fill="transparent"
          stroke="transparent"
          isAnimationActive={false}
          legendType="none"
          shape={() => null}
        >
          <LabelList
            dataKey={key}
            content={({ x, y, value }) => {
              if (x == null || y == null) return null;
              const v = Number(value) || 0;
              if (metricSuffix === "volume" && v < 1) return null;
              if (metricSuffix === "count" && v < 1) return null;

              const dyTable = isExpandedView ? SMALLSET_LABEL_DY.expanded : SMALLSET_LABEL_DY.regular;
              const baseLift = isExpandedView ? SMALLSET_LABEL_BASE_LIFT.expanded : SMALLSET_LABEL_BASE_LIFT.regular;

              let ySafe = clampY(y + baseLift + dyTable[seriesIdx % dyTable.length], chartDims, 10);

              const keyX = Math.round(Number(x));
              const prevY = lastYByX.get(keyX);
              if (prevY != null && Math.abs(prevY - ySafe) < 12) {
                ySafe = ySafe - 12;
              }
              lastYByX.set(keyX, ySafe);

              return (
                <text
                  x={x}
                  y={ySafe}
                  fill="#000"
                  fontSize={isExpandedView ? 12 : 11}
                  fontWeight="600"
                  textAnchor="middle"
                  alignmentBaseline="central"
                  pointerEvents="none"
                >
                  {formatK(v)}
                </text>
              );
            }}
          />
        </Bar>
      );
    });

  const renderLines = () => (
    <>
      {industries.map((ind) => {
        const key = `${sanitizeKey(ind)}__${metricSuffix}`;
        return (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colorOf(ind)}
            strokeWidth={isExpandedView ? 3 : 2}
            dot={{ r: isExpandedView ? 5 : 3 }}
            legendType="none"
          />
        );
      })}
      {renderRightEndLabelsForLines()}
      {renderFullPointLabelsForLines()}
    </>
  );

  return {
    main: mode === "column" ? renderBars() : renderLines(),
  };
}
