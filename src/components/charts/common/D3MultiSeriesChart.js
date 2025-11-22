import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { AXIS_STROKE, GRID_STROKE } from "../../../lib/constants";

const D3MultiSeriesChart = ({
  data = [],
  categories = [],
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
      .padding(0.1);

    let maxValue = 0;
    if (showTotal) {
      maxValue = d3.max(data, (d) => d.totalVolume || d.totalCount || 0);
    } else {
      maxValue = d3.max(data, (d) =>
        d3.max(categories, (cat) =>
          getSeriesValue(d, cat.replace(/[^a-zA-Z0-9]/g, "_"), metricSuffix)
        )
      );
    }

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([chartHeight, 0]);

    g.selectAll(".grid-x")
      .data(xScale.domain())
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

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale));

    xAxis
      .selectAll("text")
      .style("font-size", isExpanded ? "14px" : "12px")
      .style("fill", AXIS_STROKE)
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em");

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
        .on("mouseover", function (event, d) {
          const category = categories[stackedData.findIndex((s) => s.includes(d))];
          const value = d[1] - d[0];
          const formattedValue = isVolume
            ? `CHF ${d3.format(",.1f")(value)}M`
            : d3.format(",")(value);

          tooltip
            .style("opacity", 1)
            .html(`<strong>${category}</strong><br/>${d.data.year}: ${formattedValue}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`);
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
          .attr("r", 4)
          .attr("fill", colorOf(category))
          .on("mouseover", function (event, d) {
            const formattedValue = isVolume
              ? `CHF ${d3.format(",.1f")(d.value)}M`
              : d3.format(",")(d.value);

            tooltip
              .style("opacity", 1)
              .html(`<strong>${category}</strong><br/>${d.year}: ${formattedValue}`)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 10}px`);
          })
          .on("mouseout", () => tooltip.style("opacity", 0));
      });
    }

    if (showTotal && data.some((d) => d.totalVolume || d.totalCount)) {
      const totalLine = d3
        .line()
        .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
        .y((d) => yScale(isVolume ? d.totalVolume : d.totalCount))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(data.filter((d) => d.totalVolume || d.totalCount))
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
  ]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height}></svg>
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity z-50 bg-black/90 text-white px-3 py-2 rounded-md text-[13px] shadow-lg"
      />
    </div>
  );
};

export default D3MultiSeriesChart;
