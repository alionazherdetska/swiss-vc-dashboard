import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { formatNumberCH } from "../../../lib/utils";

const D3AreaChart = ({
  data = [],
  dataKey = "value",
  width = 400,
  height = 440,
  margin = { top: 50, right: 50, left: 60, bottom: 60 },
  strokeColor = "#E84A5F",
  strokeWidth = 2,
  fillColor = "#E84A5F",
  fillOpacity = 0.8,
  gridColor = "#E2E8F0",
  axisColor = "#4A5568",
  yAxisLabel = "",
  yTickCount = null,
  yTickValues = null,
  showVolume = false,
  onTooltipShow,
  onTooltipHide,
  children,
}) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data?.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Use the actual rendered SVG width to compute chart dimensions so the
    // plotted area fills the visible SVG even when CSS scales the svg.
    const svgRect = svgRef.current.getBoundingClientRect();
    const renderedWidth = svgRect && svgRect.width ? svgRect.width : width;
    const chartWidth = renderedWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Gradient definition
    const defs = svg.append("defs");
    // Create a clip path for the plotting area so shapes do not visually
    // overflow the chart bounds (helps avoid small gaps/antialiasing artifacts).
    const clipId = `clip-${Math.random().toString(36).slice(2, 9)}`;
    defs
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', chartWidth)
      .attr('height', chartHeight);
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

    // Add a non-filled full-viewport rect (in viewBox units) so the svg area
    // is measurable without introducing a visible fill that could overlay
    // the plotted content. Use `fill='none'` and viewBox-aligned units.
    svg.append("rect").attr("x", 0).attr("y", 0).attr("width", width).attr("height", height).attr("fill", "none").style("pointer-events", "none");

    // Store debug info for optional overlay
    try {
      // update state in a non-blocking way
      // eslint-disable-next-line react-hooks/rules-of-hooks
      // (we'll set via a setter defined below)
    } catch (e) {
      // ignore
    }

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);


    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.year))
      .range([0, chartWidth]);

    const rawMax = d3.max(data, (d) => d[dataKey]) || 0;

    // Determine y tick count default used earlier
    const defaultYTickCount = Math.max(3, Math.min(6, Math.floor(chartHeight / 70)));
    const effectiveYTickCount = yTickCount != null ? yTickCount : defaultYTickCount;

    // Compute a sensible step and top value so the top tick is a rounded
    // multiple near the data max (avoids showing oversized top like 8000).
    const step = Math.max(1, d3.tickStep(0, rawMax, effectiveYTickCount));
    const yTop = Math.max(step, Math.ceil(rawMax / step) * step);

    const yScale = d3
      .scaleLinear()
      .domain([0, yTop])
      .range([chartHeight, 0]);

    // Build a deduplicated, sorted array of data years so we can pick ticks
    const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
    // If the years array is consecutive (e.g. 2012,2013,...,2025) or short enough
    // to fit, show every year. Otherwise sample ticks based on chart width.
    const maxTicks = Math.max(1, Math.floor(chartWidth / 60));
    const isConsecutive = years.length > 1 && years.every((y, i) => i === 0 || y === years[i - 1] + 1);
    let tickValues = [];
    if (isConsecutive || years.length <= maxTicks) {
      tickValues = years.slice();
    } else {
      const step = Math.max(1, Math.ceil(years.length / maxTicks));
      for (let i = 0; i < years.length; i += step) tickValues.push(years[i]);
      // Ensure last year is included
      if (tickValues[tickValues.length - 1] !== years[years.length - 1]) {
        tickValues.push(years[years.length - 1]);
      }
    }

    // Determine y-axis ticks. Allow caller to supply explicit tick values
    // or request an approximate tick count. Use the effective count computed
    // earlier so we don't redeclare variables.
    const yTicks = yTickValues ? yTickValues : yScale.ticks(effectiveYTickCount);

    // Grid lines (use chosen tickValues)
    g.selectAll(".grid-x").remove();
    g.selectAll(".grid-x")
      .data(tickValues)
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

    // Area and line
    const area = d3
      .area()
      .x((d) => xScale(d.year))
      .y0(chartHeight)
      .y1((d) => yScale(d[dataKey]))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d[dataKey]))
      .curve(d3.curveMonotoneX);

    // Plotting group (clipped) for area/line so they do not overflow bounds
    const plot = g.append('g').attr('clip-path', `url(#${clipId})`);

    plot.append("path").datum(data).attr("fill", `url(#area-gradient-${dataKey})`).attr("d", area);

    plot.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", strokeColor)
      .attr("stroke-width", strokeWidth)
      .attr("d", line);

    // Axes
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickValues(tickValues).tickFormat(d3.format("d")));

    xAxis
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", axisColor)
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em");

    xAxis.selectAll("line, path").style("stroke", axisColor);

    // Replace default domain path for x axis with a crisp horizontal line
    xAxis.select('.domain').remove();
    g.append('line')
      .attr('class', 'axis-domain-x')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', chartHeight + 0.5)
      .attr('y2', chartHeight + 0.5)
      .style('stroke', axisColor)
      .style('stroke-width', 1)
      .style('shape-rendering', 'crispEdges');

    xAxis.selectAll('.tick line').style('stroke-linecap', 'butt');

    const yAxis = g
      .append("g")
      .call(
        d3
          .axisLeft(yScale)
          .tickValues(yTicks)
          .tickFormat((d) => formatNumberCH(d, showVolume ? "auto" : 0))
      );

    yAxis.selectAll("text").style("font-size", "12px").style("fill", axisColor);
    yAxis.selectAll("line, path").style("stroke", axisColor);

    // Defensive dedupe of y-axis tick labels (remove duplicates if any)
    try {
      const seen = new Set();
      yAxis.selectAll('text').nodes().forEach((n) => {
        const key = `${n.textContent}|${n.getAttribute('y')}`;
        if (seen.has(key)) n.remove();
        else seen.add(key);
      });
    } catch (e) {}

    // Replace default domain path with a precise single-pixel vertical line
    // to avoid small caps/dashes at the top caused by the SVG path geometry.
    yAxis.select('.domain').remove();
    g.append('line')
      .attr('class', 'axis-domain')
      .attr('x1', 0.5)
      .attr('x2', 0.5)
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .style('stroke', axisColor)
      .style('stroke-width', 1)
      .style('shape-rendering', 'crispEdges');

    yAxis.selectAll('.tick line').style('stroke-linecap', 'butt');

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

    const tooltip = d3.select(tooltipRef.current);

    // Tooltip interaction
    const overlay = g
      .append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "transparent")
      .style("pointer-events", "all")
      .on("mousemove", function (event) {
        const [mouseX] = d3.pointer(event);

        const xPositions = data.map((d) => xScale(d.year));
        let minIndex = -1;
        let minDist = Infinity;
        xPositions.forEach((xp, i) => {
          const dist = Math.abs(mouseX - xp);
          if (dist < minDist) {
            minDist = dist;
            minIndex = i;
          }
        });

        const HIT_THRESHOLD_PX = 15;

        if (minIndex >= 0 && minDist <= HIT_THRESHOLD_PX) {
          const closestData = data[minIndex];
          const value = closestData[dataKey];
          const formattedValue = showVolume
            ? formatNumberCH(value, "auto")
            : formatNumberCH(value, 0);

          const xPos = margin.left + xScale(closestData.year);
          const yPos = margin.top + yScale(closestData[dataKey]);

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
            .style("white-space", "nowrap")
            .html(`${closestData.year}: ${formattedValue}`);

          if (onTooltipShow) onTooltipShow(closestData, event);
          overlay.style("cursor", "pointer");
        } else {
          tooltip.style("opacity", 0);
          if (onTooltipHide) onTooltipHide();
          overlay.style("cursor", "default");
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
    yTickCount,
    yTickValues,
    showVolume,
    onTooltipShow,
    onTooltipHide,
  ]);

  // Debug state: show measured widths when requested
  const [debugInfo, setDebugInfo] = useState({ renderedWidth: null, chartWidth: null });

  // Update debugInfo when the SVG is available; keep lightweight
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
      <svg ref={svgRef} className="relative z-40" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"></svg>
      <div ref={tooltipRef} className="absolute pointer-events-none opacity-0 transition-opacity z-50" />
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

export default D3AreaChart;