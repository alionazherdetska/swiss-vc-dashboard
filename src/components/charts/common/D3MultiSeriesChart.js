import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { AXIS_STROKE, GRID_STROKE } from "../../../lib/constants";

const D3MultiSeriesChart = ({
  data = [],
  categories = [],
  allCategories = null,
  isVolume = false,
  mode = "line",
  width = 400,
  height = 300,
  margin = { top: 20, right: 30, bottom: 60, left: 60 },
  isExpanded = false,
  colorOf,
  showTotal = false,

  yAxisLabel = null,

  getSeriesValue = (d, category, suffix) => d[`${category}${suffix}`] || 0,
  metricSuffix = "__volume",
  children,
}) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data?.length || !categories?.length) return;

    // Debugging aid: when showTotal is enabled, compute the sum of all metric keys
    // present in each year row and compare to the grand total fields that the
    // data may provide. This helps detect mismatches between generated totals
    // and the values used for stacking.
    if (showTotal) {
      try {
        data.forEach((d) => {
          const metricKeys = Object.keys(d).filter((k) => k.endsWith(metricSuffix));
          const computed = metricKeys.length ? d3.sum(metricKeys.map((k) => d[k] || 0)) : 0;
          const pre = isVolume ? (d.__grandTotalVolume ?? d.totalVolume) : (d.__grandTotalCount ?? d.totalCount);
          if (Math.abs((pre || 0) - computed) > 0.0001) {
            // eslint-disable-next-line no-console
            console.warn("[D3MultiSeriesChart] total mismatch for year", d.year, {
              grandTotal: pre,
              computedFromSeries: computed,
              metricKeys: metricKeys.slice(0, 20),
            });
          }
        });
      } catch (e) {
        // swallow errors in debug code
      }
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Use the actual rendered SVG width so plotted content scales to visible size
    const svgRect = svgRef.current.getBoundingClientRect();
    const renderedWidth = svgRect && svgRect.width ? svgRect.width : width;
    const chartWidth = renderedWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Add a transparent background rect covering the full svg so overlays and devtools
    // show the svg bounding box and there is a consistent hit area.
    svg.append("rect").attr("x", 0).attr("y", 0).attr("width", renderedWidth).attr("height", height).attr("fill", "transparent");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // ensure domain contains unique, sorted years to avoid duplicate tick labels
    const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
    const xScale = d3
      .scaleBand()
      .domain(years)
      .range([0, chartWidth])
      .padding(0.1);
    // For stacked (column) mode compute the stacked data and derive the max from the
    // stackedY (d[1]) values so we accurately reflect combined bar heights.
    let stackedDataForDomain = null;
    if (mode === "column") {
      const stack = d3.stack().keys(categories.map((cat) => cat.replace(/[^a-zA-Z0-9]/g, "_")));
      stackedDataForDomain = stack(
        data.map((d) => {
          const row = { year: d.year };
          categories.forEach((cat) => {
            const key = cat.replace(/[^a-zA-Z0-9]/g, "_");
            row[key] = getSeriesValue(d, key, metricSuffix);
          });
          return row;
        })
      );
    }

    const maxValue = (function () {
      if (mode === "column" && stackedDataForDomain) {
        // find the max y1 across stacked series
        const maxStack = d3.max(stackedDataForDomain, (series) => d3.max(series, (d) => d[1]));
        const totalFieldMax = showTotal
          ? d3.max(data, (d) => {
              const pre = isVolume
                ? (d.__grandTotalVolume ?? d.totalVolume)
                : (d.__grandTotalCount ?? d.totalCount);
              if (pre != null) return pre;
              // Robust fallback: sum all keys that look like series metrics in the row
              const metricKeys = Object.keys(d).filter((k) => k.endsWith(metricSuffix));
              if (metricKeys.length) return d3.sum(metricKeys.map((k) => d[k] || 0));
              if (!allCategories || !allCategories.length) return 0;
              return d3.sum(
                allCategories.map((cat) =>
                  getSeriesValue(d, cat.replace(/[^a-zA-Z0-9]/g, "_"), metricSuffix)
                )
              );
            })
          : 0;
        return Math.max(maxStack || 0, totalFieldMax || 0);
      }

      // non-column mode: max of single-category values or totals when visible
      const maxCategory = d3.max(data, (d) =>
        d3.max(categories, (cat) =>
          getSeriesValue(d, cat.replace(/[^a-zA-Z0-9]/g, "_"), metricSuffix)
        )
      );
      const totalFieldMax = showTotal
        ? d3.max(data, (d) => {
            const pre = isVolume
              ? (d.__grandTotalVolume ?? d.totalVolume)
              : (d.__grandTotalCount ?? d.totalCount);
            if (pre != null) return pre;
            const metricKeys = Object.keys(d).filter((k) => k.endsWith(metricSuffix));
            if (metricKeys.length) return d3.sum(metricKeys.map((k) => d[k] || 0));
            if (!allCategories || !allCategories.length) return 0;
            return d3.sum(
              allCategories.map((cat) =>
                getSeriesValue(d, cat.replace(/[^a-zA-Z0-9]/g, "_"), metricSuffix)
              )
            );
          })
        : 0;
      return Math.max(maxCategory || 0, totalFieldMax || 0);
    })();

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([chartHeight, 0]);


    g.selectAll(".grid-y")
      .data(yScale.ticks())
      .enter()
      .append("line")
      .attr("class", "grid-y")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .style("stroke", GRID_STROKE)
      .style("stroke-width", 0.5)
      .style("opacity", 0.5);

    // Choose tick values so labels do not overlap: show all years when the
    // years array is consecutive (e.g., 2012..2025) or small enough to fit,
    // otherwise sample based on chart width (~60px per tick).
    const maxTicks = Math.max(1, Math.floor(chartWidth / 60));
    const isConsecutive = years.length > 1 && years.every((y, i) => i === 0 || y === years[i - 1] + 1);
    let tickValues = [];
    if (isConsecutive || years.length <= maxTicks) {
      tickValues = years.slice();
    } else {
      const step = Math.max(1, Math.ceil(years.length / maxTicks));
      for (let i = 0; i < years.length; i += step) tickValues.push(years[i]);
      if (tickValues[tickValues.length - 1] !== years[years.length - 1]) {
        tickValues.push(years[years.length - 1]);
      }
    }

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickValues(tickValues));

    xAxis
      .selectAll("text")
      .style("font-size", isExpanded ? "14px" : "12px")
      .style("fill", AXIS_STROKE)
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em");

    // Draw vertical grid lines for the chosen ticks, not every data year.
    g.selectAll(".grid-x").remove();
    g.selectAll(".grid-x")
      .data(tickValues)
      .enter()
      .append("line")
      .attr("class", "grid-x")
      .attr("x1", (d) => xScale(d) + xScale.bandwidth() / 2)
      .attr("x2", (d) => xScale(d) + xScale.bandwidth() / 2)
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .style("stroke", GRID_STROKE)
      .style("stroke-width", 0.5)
      .style("opacity", 0.5);

    const yAxis = g.append("g").call(d3.axisLeft(yScale));

    yAxis
      .selectAll("text")
      .style("font-size", isExpanded ? "14px" : "12px")
      .style("fill", AXIS_STROKE);

    if (yAxisLabel) {
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 15)
        .attr("x", 0 - chartHeight / 2)
        .attr("dy", "-1.5em")
        .style("text-anchor", "middle")
        .style("font-size", isExpanded ? "16px" : "12px")
        .style("fill", AXIS_STROKE)
        .text(yAxisLabel);
    }

    const tooltip = d3.select(tooltipRef.current);

    if (mode === "column") {
      const stack = d3.stack().keys(categories.map((cat) => cat.replace(/[^a-zA-Z0-9]/g, "_")));

      const stackedData = stack(
        data.map((d) => {
          const row = { year: d.year };
          categories.forEach((cat) => {
            const key = cat.replace(/[^a-zA-Z0-9]/g, "_");
            row[key] = getSeriesValue(d, key, metricSuffix);
          });
          return row;
        })
      );

      g.selectAll(".category-group")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("class", "category-group")
        .attr("fill", (d, i) => colorOf(categories[i]))
        .selectAll("rect")
        .data((d) => d)
        .enter()
        .append("rect")
        .attr("x", (d) => xScale(d.data.year))
        .attr("y", (d) => yScale(d[1]))
        .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
        .attr("width", xScale.bandwidth())
          .style("cursor", "pointer")
          .on("mouseover", function (event, d) {
            const category = categories[stackedData.findIndex((s) => s.includes(d))];
            const value = d[1] - d[0];
            const formattedValue = isVolume
              ? `CHF ${d3.format(",.1f")(value)}M`
              : d3.format(",")(value);

            // position tooltip above top of stacked segment
            const xPos = margin.left + (xScale(d.data.year) + xScale.bandwidth() / 2);
            const yPos = margin.top + yScale(d[1]);

            tooltip
              .style("opacity", 1)
              .style("left", `${xPos}px`)
              .style("top", `${yPos}px`)
              .style("transform", "translate(-50%, -120%)")
              .style("background", "#ffffff")
              .style("border", "1px solid #E2E8F0")
              .style("padding", "8px")
              .style("border-radius", "8px")
              .style("color", "#1F2937")
              .style("box-shadow", "0 6px 20px rgba(16,24,40,0.08)")
              .html(`<strong>${category}</strong><br/>${d.data.year}: ${formattedValue}`);
          })
        .on("mouseout", () => tooltip.style("opacity", 0));
    } else {
      const line = d3
        .line()
        .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      categories.forEach((category) => {
        const categoryKey = category.replace(/[^a-zA-Z0-9]/g, "_");
        const lineData = data.map((d) => ({
          year: d.year,
          value: getSeriesValue(d, categoryKey, metricSuffix),
        }));

        g.append("path")
          .datum(lineData)
          .attr("fill", "none")
          .attr("stroke", colorOf(category))
          .attr("stroke-width", 2)
          .attr("d", line);

        g.selectAll(`.dot-${categoryKey}`)
          .data(lineData)
          .enter()
          .append("circle")
          .attr("class", `dot-${categoryKey}`)
          .attr("cx", (d) => xScale(d.year) + xScale.bandwidth() / 2)
          .attr("cy", (d) => yScale(d.value))
            .attr("r", 3)
          .attr("fill", colorOf(category))
          .style("cursor", "pointer")
          .on("mouseover", function (event, d) {
            const formattedValue = isVolume
              ? `CHF ${d3.format(",.1f")(d.value)}M`
              : d3.format(",")(d.value);

            const xPos = margin.left + (xScale(d.year) + xScale.bandwidth() / 2);
            const yPos = margin.top + yScale(d.value);

            tooltip
              .style("opacity", 1)
              .style("left", `${xPos}px`)
              .style("top", `${yPos}px`)
              .style("transform", "translate(-50%, -120%)")
              .style("background", "#ffffff")
              .style("border", "1px solid #E2E8F0")
              .style("padding", "8px")
              .style("border-radius", "8px")
              .style("color", "#1F2937")
              .style("box-shadow", "0 6px 20px rgba(16,24,40,0.08)")
              .html(`<strong>${category}</strong><br/>${d.year}: ${formattedValue}`);
          })
          .on("mouseout", () => tooltip.style("opacity", 0));

        // Add larger invisible hit targets so hovering near points still triggers tooltips
        g.selectAll(`.dot-hit-${categoryKey}`)
          .data(lineData)
          .enter()
          .append("circle")
          .attr("class", `dot-hit-${categoryKey}`)
          .attr("cx", (d) => xScale(d.year) + xScale.bandwidth() / 2)
          .attr("cy", (d) => yScale(d.value))
          .attr("r", 8)
          .attr("fill", "transparent")
          .style("pointer-events", "all")
          .style("cursor", "pointer")
          .on("mouseover", function (event, d) {
            // reuse same handler logic as visible point
            const formattedValue = isVolume
              ? `CHF ${d3.format(",.1f")(d.value)}M`
              : d3.format(",")(d.value);
            const xPos = margin.left + (xScale(d.year) + xScale.bandwidth() / 2);
            const yPos = margin.top + yScale(d.value);
            tooltip
              .style("opacity", 1)
              .style("left", `${xPos}px`)
              .style("top", `${yPos}px`)
              .style("transform", "translate(-50%, -120%)")
              .style("background", "#ffffff")
              .style("border", "1px solid #E2E8F0")
              .style("padding", "8px")
              .style("border-radius", "8px")
              .style("color", "#1F2937")
              .style("box-shadow", "0 6px 20px rgba(16,24,40,0.08)")
              .html(`<strong>${category}</strong><br/>${d.year}: ${formattedValue}`);
          })
          .on("mouseout", () => tooltip.style("opacity", 0));
      });
    }

    if (
      showTotal &&
      data.some((d) => d.totalVolume || d.totalCount || d.__grandTotalVolume || d.__grandTotalCount)
    ) {
      const totalLine = d3
        .line()
        .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
        .y((d) => {
          const pre = isVolume
            ? (d.__grandTotalVolume ?? d.totalVolume)
            : (d.__grandTotalCount ?? d.totalCount);
          if (pre != null) return yScale(pre);
          if (!allCategories || !allCategories.length) return yScale(0);
          const computed = d3.sum(
            allCategories.map((cat) =>
              getSeriesValue(d, cat.replace(/[^a-zA-Z0-9]/g, "_"), metricSuffix)
            )
          );
          return yScale(computed);
        })
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(
          data.filter(
            (d) => d.totalVolume || d.totalCount || d.__grandTotalVolume || d.__grandTotalCount
          )
        )
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "5,5")
        .attr("d", totalLine);
    }
  }, [
    data,
    categories,
    isVolume,
    mode,
    width,
    height,
    margin,
    isExpanded,
    colorOf,
    showTotal,
    metricSuffix,
    getSeriesValue,
    yAxisLabel,
    allCategories,
  ]);

  const [debugInfo, setDebugInfo] = useState({ renderedWidth: null, chartWidth: null });

  useEffect(() => {
    if (!svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const renderedWidth = svgRect && svgRect.width ? svgRect.width : width;
    const chartWidth = renderedWidth - margin.left - margin.right;
    setDebugInfo({ renderedWidth: Math.round(renderedWidth), chartWidth: Math.round(chartWidth) });
  }, [width, margin.left, margin.right]);

  return (
    <div className="relative">
      {children}
      <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"></svg>
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity z-50"
      />
      {window && window.__D3_DEBUG__ ? (
        <div
          style={{
            position: "absolute",
            left: 6,
            bottom: 6,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            padding: "6px 8px",
            borderRadius: 6,
            fontSize: 12,
            zIndex: 60,
          }}
        >
          <div>renderedWidth: {debugInfo.renderedWidth ?? "-"}px</div>
          <div>chartWidth: {debugInfo.chartWidth ?? "-"}px</div>
        </div>
      ) : null}
    </div>
  );
};

export default D3MultiSeriesChart;
