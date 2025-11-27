import { useRef, useEffect } from "react";
import * as d3 from "d3";

const D3ComposedChart = ({
  data = [],
  categories = [],
  allCategories = null,
  mode = "line",
  showTotal = false,
  width = 400,
  height = 300,
  margin = { top: 20, right: 30, bottom: 60, left: 60 },
  strokeWidth = 2,
  gridColor = "#E2E8F0",
  axisColor = "#4A5568",
  yAxisLabel = "",
  colorOf,
  dataKeySuffix = "__volume",
  tooltipFormatter,
  showDataPoints = false,
}) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data?.length || !categories?.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.year))
      .range([0, chartWidth])
      .padding(mode === "column" ? 0.1 : 0);

    let stackedForDomain = null;
    if (mode === "column") {
      const stack = d3
        .stack()
        .keys(categories.map((cat) => `${cat.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`))
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);
      stackedForDomain = stack(data);
    }

    const maxValue = (function () {
      if (mode === "column" && stackedForDomain) {
        const maxStack = d3.max(stackedForDomain, (series) => d3.max(series, (d) => d[1]));
        const totalFieldMax = showTotal
          ? d3.max(data, (d) => {
              const pre =
                dataKeySuffix === "__volume"
                  ? d.__grandTotalVolume ?? d.totalVolume
                  : d.__grandTotalCount ?? d.totalCount;
              if (pre != null) return pre;
              const metricKeys = Object.keys(d).filter((k) => k.endsWith(dataKeySuffix));
              if (metricKeys.length) return d3.sum(metricKeys.map((k) => d[k] || 0));
              if (!allCategories || !allCategories.length) return 0;
              return d3.sum(
                allCategories.map(
                  (cat) => d[`${cat.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`] || 0
                )
              );
            })
          : 0;
        return Math.max(maxStack || 0, totalFieldMax || 0);
      }

      const maxCategory = d3.max(data, (d) =>
        d3.max(categories, (cat) => {
          const key = `${cat.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`;
          return d[key] || 0;
        })
      );

      const totalFieldMax = showTotal
        ? d3.max(data, (d) => {
            const pre =
              dataKeySuffix === "__volume"
                ? d.__grandTotalVolume ?? d.totalVolume
                : d.__grandTotalCount ?? d.totalCount;
            if (pre != null) return pre;
            const metricKeys = Object.keys(d).filter((k) => k.endsWith(dataKeySuffix));
            if (metricKeys.length) return d3.sum(metricKeys.map((k) => d[k] || 0));
            if (!allCategories || !allCategories.length) return 0;
            return d3.sum(
              allCategories.map(
                (cat) => d[`${cat.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`] || 0
              )
            );
          })
        : 0;

      return Math.max(maxCategory || 0, totalFieldMax || 0);
    })();

    const yScale = d3.scaleLinear().domain([0, (maxValue || 0) * 1.1]).range([chartHeight, 0]);

    const xTicks = data.map((d) => d.year);
    const yTicks = yScale.ticks();

    g.selectAll(".grid-x")
      .data(xTicks)
      .enter()
      .append("line")
      .attr("class", "grid-x")
      .attr("x1", (d) => xScale(d) + xScale.bandwidth() / 2)
      .attr("x2", (d) => xScale(d) + xScale.bandwidth() / 2)
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .style("stroke", gridColor)
      .style("stroke-width", 1)
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.7);

    g.selectAll(".grid-y")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("class", "grid-y")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .style("stroke", gridColor)
      .style("stroke-width", 1)
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.7);

    const xAxis = g.append("g").attr("transform", `translate(0,${chartHeight})`).call(d3.axisBottom(xScale));

    xAxis
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", axisColor)
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em");

    xAxis.selectAll("line, path").style("stroke", axisColor);

    const yAxis = g.append("g").call(d3.axisLeft(yScale));
    yAxis.selectAll("text").style("font-size", "12px").style("fill", axisColor);
    yAxis.selectAll("line, path").style("stroke", axisColor);

    if (yAxisLabel) {
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - chartHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("fill", axisColor)
        .text(yAxisLabel);
    }

    const tooltip = d3.select(tooltipRef.current);

    if (mode === "column") {
      const stack = d3
        .stack()
        .keys(categories.map((cat) => `${cat.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`))
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const stackedData = stack(data);
      const barWidth = xScale.bandwidth();

      stackedData.forEach((series, i) => {
        const category = categories[i];
        const color = colorOf ? colorOf(category) : `hsl(${(i * 360) / categories.length}, 70%, 50%)`;

        g.selectAll(`.bar-${i}`)
          .data(series)
          .enter()
          .append("rect")
          .attr("class", `bar-${i}`)
          .attr("x", (d) => xScale(d.data.year))
          .attr("y", (d) => yScale(d[1]))
          .attr("width", barWidth)
          .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
          .attr("fill", color)
          .style("cursor", "pointer")
          .on("mouseover", function (event, d) {
            const value = d[1] - d[0];
            const formattedValue = tooltipFormatter ? tooltipFormatter(value, category)[0] : Math.round(value * 100) / 100;

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
      });

      if (
        showTotal &&
        data.some((d) => d.totalVolume || d.totalCount || d.__grandTotalVolume || d.__grandTotalCount)
      ) {
        const totalKey =
          dataKeySuffix === "__volume"
            ? (d) => d.__grandTotalVolume ?? d.totalVolume ?? 0
            : (d) => d.__grandTotalCount ?? d.totalCount ?? 0;

        const totalLine = d3
          .line()
          .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
          .y((d) => yScale(totalKey(d)))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(data.filter((d) => totalKey(d) != null))
          .attr("fill", "none")
          .attr("stroke", "#000")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")
          .attr("d", totalLine);
      }
    } else {
      categories.forEach((category, i) => {
        const color = colorOf ? colorOf(category) : `hsl(${(i * 360) / categories.length}, 70%, 50%)`;
        const dataKey = `${category.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`;

        const lineData = data.filter((d) => (d[dataKey] || 0) > 0);

        if (lineData.length > 0) {
          const line = d3
            .line()
            .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
            .y((d) => yScale(d[dataKey] || 0))
            .curve(d3.curveMonotoneX);

          g.append("path")
            .datum(lineData)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", strokeWidth)
            .attr("d", line);

          g.selectAll(`.dot-${i}`)
            .data(lineData)
            .enter()
            .append("circle")
            .attr("class", `dot-${i}`)
            .attr("cx", (d) => xScale(d.year) + xScale.bandwidth() / 2)
            .attr("cy", (d) => yScale(d[dataKey] || 0))
            .attr("r", showDataPoints ? 4 : 0)
            .style("cursor", showDataPoints ? "pointer" : "default")
            .attr("fill", color)
            .attr("stroke", "none")
            .attr("stroke-width", 0)
            .on("mouseover", function (event, d) {
              const value = d[dataKey] || 0;
              const formattedValue = tooltipFormatter ? tooltipFormatter(value, category)[0] : Math.round(value * 100) / 100;

              const xPos = margin.left + (xScale(d.year) + xScale.bandwidth() / 2);
              const yPos = margin.top + yScale(d[dataKey] || 0);

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

          // invisible larger hit targets on top of the visible points
          g.selectAll(`.dot-hit-${i}`)
            .data(lineData)
            .enter()
            .append("circle")
            .attr("class", `dot-hit-${i}`)
            .attr("cx", (d) => xScale(d.year) + xScale.bandwidth() / 2)
            .attr("cy", (d) => yScale(d[dataKey] || 0))
            .attr("r", 10)
            .attr("fill", "transparent")
            .style("pointer-events", "all")
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
              const value = d[dataKey] || 0;
              const formattedValue = tooltipFormatter ? tooltipFormatter(value, category)[0] : Math.round(value * 100) / 100;
              const xPos = margin.left + (xScale(d.year) + xScale.bandwidth() / 2);
              const yPos = margin.top + yScale(d[dataKey] || 0);
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
        }
      });

      if (
        showTotal &&
        data.some((d) => d.totalVolume || d.totalCount || d.__grandTotalVolume || d.__grandTotalCount)
      ) {
        const totalKey =
          dataKeySuffix === "__volume"
            ? (d) => d.__grandTotalVolume ?? d.totalVolume ?? 0
            : (d) => d.__grandTotalCount ?? d.totalCount ?? 0;

        const totalLine = d3
          .line()
          .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
          .y((d) => {
            const pre = dataKeySuffix === "__volume" ? d.__grandTotalVolume ?? d.totalVolume : d.__grandTotalCount ?? d.totalCount;
            if (pre != null) return yScale(pre);
            if (!allCategories || !allCategories.length) return yScale(0);
            const computed = d3.sum(allCategories.map((cat) => d[`${cat.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`] || 0));
            return yScale(computed);
          })
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(data.filter((d) => d.totalVolume || d.totalCount || d.__grandTotalVolume || d.__grandTotalCount))
          .attr("fill", "none")
          .attr("stroke", "#000")
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", "5,5")
          .attr("d", totalLine);
      }

      // overlay for per-year aggregated tooltip — compute closest center robustly
      const overlay = g
        .append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("fill", "transparent")
        .style("pointer-events", "all")
        .on("mousemove", function (event) {
          const [mouseX] = d3.pointer(event);
          const centers = data.map((d) => xScale(d.year) + xScale.bandwidth() / 2);
          let closestIdx = -1;
          let minDist = Infinity;
          centers.forEach((cx, i) => {
            const dist = Math.abs(mouseX - cx);
            if (dist < minDist) {
              minDist = dist;
              closestIdx = i;
            }
          });

          if (closestIdx >= 0) {
            const closestData = data[closestIdx];
            const categoryValues = categories
              .map((cat) => ({
                category: cat,
                value: closestData[`${cat.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`] || 0,
              }))
              .filter((cv) => cv.value > 0);

            if (categoryValues.length > 0) {
              const maxCategory = categoryValues.reduce((max, curr) => (curr.value > max.value ? curr : max));
              const formattedValue = tooltipFormatter ? tooltipFormatter(maxCategory.value, maxCategory.category)[0] : Math.round(maxCategory.value * 100) / 100;
              const xPos = margin.left + centers[closestIdx];
              const yPos = margin.top + yScale(maxCategory.value);
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
                .html(`<strong>${maxCategory.category}</strong><br/>${closestData.year}: ${formattedValue}`);

              overlay.style("cursor", "pointer");
            } else {
              overlay.style("cursor", "default");
              tooltip.style("opacity", 0);
            }
          }
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));

      if (overlay && overlay.lower) overlay.lower();
    }
  }, [
    data,
    categories,
    mode,
    showTotal,
    width,
    height,
    margin,
    strokeWidth,
    gridColor,
    axisColor,
    yAxisLabel,
    colorOf,
    dataKeySuffix,
    tooltipFormatter,
    showDataPoints,
    allCategories,
  ]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height}></svg>
      <div ref={tooltipRef} className="absolute pointer-events-none opacity-0 transition-opacity z-50" />
    </div>
  );
};

export default D3ComposedChart;
