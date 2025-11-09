import { useRef, useEffect } from "react";
import * as d3 from "d3";

/**
 * D3-based composed chart component that replaces Recharts ComposedChart
 * Supports both line and bar modes with multiple series
 */
const D3ComposedChart = ({
  data = [],
  categories = [],
  mode = "line", // 'line' or 'column'
  width = 400,
  height = 300,
  margin = { top: 20, right: 30, bottom: 40, left: 60 },
  strokeWidth = 2,
  gridColor = "#E2E8F0",
  axisColor = "#4A5568",
  yAxisLabel = "",
  colorOf,
  dataKeySuffix = "__volume",
  tooltipFormatter,
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

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.year))
      .range([0, chartWidth])
      .padding(mode === "column" ? 0.1 : 0);

    // Calculate max value across all categories
    const maxValue = d3.max(data, (d) =>
      d3.max(categories, (cat) => {
        const key = `${cat.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`;
        return d[key] || 0;
      })
    );

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([chartHeight, 0]);

    // Grid lines
    const xTicks = data.map((d) => d.year);
    const yTicks = yScale.ticks();

    // Vertical grid lines
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

    // Horizontal grid lines
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

    // X Axis
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale));

    xAxis.selectAll("text").style("font-size", "12px").style("fill", axisColor);

    xAxis.selectAll("line, path").style("stroke", axisColor);

    // Y Axis
    const yAxis = g.append("g").call(d3.axisLeft(yScale));

    yAxis.selectAll("text").style("font-size", "12px").style("fill", axisColor);

    yAxis.selectAll("line, path").style("stroke", axisColor);

    // Y Axis Label
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

    // Tooltip
    const tooltip = d3.select(tooltipRef.current);

    if (mode === "column") {
      // Stacked bar chart
      const stack = d3
        .stack()
        .keys(categories.map((cat) => `${cat.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`))
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const stackedData = stack(data);
      const barWidth = xScale.bandwidth();

      stackedData.forEach((series, i) => {
        const category = categories[i];
        const color = colorOf
          ? colorOf(category)
          : `hsl(${(i * 360) / categories.length}, 70%, 50%)`;

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
          .on("mouseover", function (event, d) {
            const value = d[1] - d[0];
            const formattedValue = tooltipFormatter
              ? tooltipFormatter(value, category)[0]
              : Math.round(value * 100) / 100;

            tooltip
              .style("opacity", 1)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 10}px`).html(`
                <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px; color: #1F2937; font-size: 13px;">
                  <strong>${category}</strong><br/>
                  ${d.data.year}: ${formattedValue}
                </div>
              `);
          })
          .on("mouseout", () => tooltip.style("opacity", 0));
      });
    } else {
      // Line chart
      categories.forEach((category, i) => {
        const color = colorOf
          ? colorOf(category)
          : `hsl(${(i * 360) / categories.length}, 70%, 50%)`;
        const dataKey = `${category.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`;

        // Filter data points with values > 0
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

          // Add data points for tooltip interaction
          g.selectAll(`.dot-${i}`)
            .data(lineData)
            .enter()
            .append("circle")
            .attr("class", `dot-${i}`)
            .attr("cx", (d) => xScale(d.year) + xScale.bandwidth() / 2)
            .attr("cy", (d) => yScale(d[dataKey] || 0))
            .attr("r", 0) // Invisible dots for hover interaction
            .attr("fill", color)
            .on("mouseover", function (event, d) {
              const value = d[dataKey] || 0;
              const formattedValue = tooltipFormatter
                ? tooltipFormatter(value, category)[0]
                : Math.round(value * 100) / 100;

              tooltip
                .style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 10}px`).html(`
                  <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px; color: #1F2937; font-size: 13px;">
                    <strong>${category}</strong><br/>
                    ${d.year}: ${formattedValue}
                  </div>
                `);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));
        }
      });

      // Add invisible overlay for better mouse interaction
      g.append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("fill", "transparent")
        .on("mousemove", function (event) {
          const [mouseX] = d3.pointer(event);
          const year = Math.round(
            xScale.invert
              ? xScale.invert(mouseX)
              : data[Math.floor(mouseX / (chartWidth / data.length))]?.year
          );

          // Show tooltip for closest data point
          const closestData = data.find((d) => d.year === year);
          if (closestData) {
            // Find category with highest value for this year
            const categoryValues = categories
              .map((cat) => ({
                category: cat,
                value: closestData[`${cat.replace(/[^a-zA-Z0-9]/g, "_")}${dataKeySuffix}`] || 0,
              }))
              .filter((cv) => cv.value > 0);

            if (categoryValues.length > 0) {
              const maxCategory = categoryValues.reduce((max, curr) =>
                curr.value > max.value ? curr : max
              );

              const formattedValue = tooltipFormatter
                ? tooltipFormatter(maxCategory.value, maxCategory.category)[0]
                : Math.round(maxCategory.value * 100) / 100;

              tooltip
                .style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 10}px`).html(`
                  <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px; color: #1F2937; font-size: 13px;">
                    <strong>${maxCategory.category}</strong><br/>
                    ${closestData.year}: ${formattedValue}
                  </div>
                `);
            }
          }
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
    }
  }, [
    data,
    categories,
    mode,
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
  ]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height}></svg>
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity z-50"
        style={{
          position: "fixed",
        }}
      />
    </div>
  );
};

export default D3ComposedChart;
