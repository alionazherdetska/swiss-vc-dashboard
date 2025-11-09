import { useRef, useEffect } from "react";
import * as d3 from "d3";
import styles from "../Charts.module.css";

/**
 * D3-based area chart component that replaces Recharts AreaChart
 * Matches the visual styling and functionality of the original TimelineChart
 */
const D3AreaChart = ({
  data = [],
  dataKey = "value",
  width = 400,
  height = 400,
  margin = { top: 50, right: 50, left: 60, bottom: 60 },
  strokeColor = "#E84A5F",
  strokeWidth = 2,
  fillColor = "#E84A5F",
  fillOpacity = 0.8,
  gridColor = "#E2E8F0",
  axisColor = "#4A5568",
  yAxisLabel = "",
  showVolume = false,
  onTooltipShow,
  onTooltipHide,
}) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data?.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create gradient definition
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", `area-gradient-${dataKey}`)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "5%")
      .attr("stop-color", fillColor)
      .attr("stop-opacity", fillOpacity);

    gradient
      .append("stop")
      .attr("offset", "95%")
      .attr("stop-color", fillColor)
      .attr("stop-opacity", 0.1);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.year))
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[dataKey]) * 1.05])
      .range([chartHeight, 0]);

    // Grid lines
    const xTicks = xScale.ticks();
    const yTicks = yScale.ticks();

    // Vertical grid lines
    g.selectAll(".grid-x")
      .data(xTicks)
      .enter()
      .append("line")
      .attr("class", "grid-x")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
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

    // Create area generator
    const area = d3
      .area()
      .x((d) => xScale(d.year))
      .y0(chartHeight)
      .y1((d) => yScale(d[dataKey]))
      .curve(d3.curveMonotoneX);

    // Create line generator for the stroke
    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d[dataKey]))
      .curve(d3.curveMonotoneX);

    // Draw area
    g.append("path").datum(data).attr("fill", `url(#area-gradient-${dataKey})`).attr("d", area);

    // Draw line stroke
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", strokeColor)
      .attr("stroke-width", strokeWidth)
      .attr("d", line);

    // X Axis
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    xAxis
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", axisColor)
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em");

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
        .style("font-size", "12px")
        .style("fill", axisColor)
        .text(yAxisLabel);
    }

    // Tooltip functionality
    const tooltip = d3.select(tooltipRef.current);

    // Create invisible overlay for mouse events
    g.append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "transparent")
      .on("mousemove", function (event) {
        const [mouseX] = d3.pointer(event);
        const year = Math.round(xScale.invert(mouseX));
        const closestData =
          data.find((d) => d.year === year) ||
          data.reduce((prev, curr) =>
            Math.abs(curr.year - year) < Math.abs(prev.year - year) ? curr : prev
          );

        if (closestData) {
          const value = closestData[dataKey];
          const formattedValue = showVolume
            ? `${Number(value).toFixed(1)}M CHF`
            : d3.format(",")(value);

          tooltip
            .style("opacity", 1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`).html(`
              <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px; color: #1F2937; font-size: 13px;">
                <strong>${closestData.year}</strong><br/>
                ${yAxisLabel}: ${formattedValue}
              </div>
            `);

          if (onTooltipShow) {
            onTooltipShow(closestData, event);
          }
        }
      })
      .on("mouseleave", function () {
        tooltip.style("opacity", 0);
        if (onTooltipHide) {
          onTooltipHide();
        }
      });
  }, [
    data,
    dataKey,
    width,
    height,
    margin,
    strokeColor,
    strokeWidth,
    fillColor,
    fillOpacity,
    gridColor,
    axisColor,
    yAxisLabel,
    showVolume,
    onTooltipShow,
    onTooltipHide,
  ]);

  return (
    <div className={styles.chartArea}>
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

export default D3AreaChart;
