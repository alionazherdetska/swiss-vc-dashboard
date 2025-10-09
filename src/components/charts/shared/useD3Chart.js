import { useRef } from "react";
import * as d3 from "d3";

/**
 * Custom hook for D3 chart rendering with common patterns
 * Handles SVG setup, cleanup, and provides common D3 utilities
 */
export const useD3Chart = ({
  width,
  height,
  margin,
  data,
  dependencies = [], // Additional dependencies to trigger re-render
}) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  // Clear and setup SVG
  const setupSVG = () => {
    if (!svgRef.current) return null;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    return svg;
  };

  // Create chart dimensions
  const getChartDimensions = () => {
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    return { chartWidth, chartHeight };
  };

  // Create main chart group with margins
  const createChartGroup = (svg) => {
    return svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  };

  // Common axis styling
  const styleAxis = (axis, isExpanded = false) => {
    axis
      .selectAll("text")
      .style("font-size", isExpanded ? "14px" : "12px")
      .style("fill", "#64748B"); // AXIS_STROKE equivalent

    axis.selectAll("line").style("stroke", "#64748B");

    axis.select(".domain").style("stroke", "#64748B");
  };

  // Create grid lines
  const createGrid = (g, xScale, yScale, chartWidth, chartHeight) => {
    // Vertical grid lines
    g.selectAll(".grid-x")
      .data(xScale.domain())
      .enter()
      .append("line")
      .attr("class", "grid-x")
      .attr(
        "x1",
        (d) => xScale(d) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0),
      )
      .attr(
        "x2",
        (d) => xScale(d) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0),
      )
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .style("stroke", "#E2E8F0") // GRID_STROKE equivalent
      .style("stroke-width", 0.5)
      .style("opacity", 0.5);

    // Horizontal grid lines
    g.selectAll(".grid-y")
      .data(yScale.ticks())
      .enter()
      .append("line")
      .attr("class", "grid-y")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .style("stroke", "#E2E8F0")
      .style("stroke-width", 0.5)
      .style("opacity", 0.5);
  };

  // Create tooltip
  const createTooltip = () => {
    if (!tooltipRef.current) return null;

    return d3
      .select(tooltipRef.current)
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.9)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "13px")
      .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.15)")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000);
  };

  // Show tooltip
  const showTooltip = (tooltip, content, event) => {
    tooltip
      .style("opacity", 1)
      .html(content)
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 10}px`);
  };

  // Hide tooltip
  const hideTooltip = (tooltip) => {
    tooltip.style("opacity", 0);
  };

  // Format numbers for display
  const formatNumber = (value, isVolume = false) => {
    if (isVolume) {
      return `CHF ${d3.format(",.1f")(value)}M`;
    }
    return d3.format(",")(value);
  };

  // Create scales
  const createScales = (data, chartWidth, chartHeight, isVolume = false) => {
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.year))
      .range([0, chartWidth])
      .padding(0.1);

    const maxValue = d3.max(data, (d) =>
      isVolume ? d.volume || 0 : d.count || 0,
    );
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1]) // Add 10% padding
      .range([chartHeight, 0]);

    return { xScale, yScale };
  };

  return {
    svgRef,
    tooltipRef,
    setupSVG,
    getChartDimensions,
    createChartGroup,
    styleAxis,
    createGrid,
    createTooltip,
    showTooltip,
    hideTooltip,
    formatNumber,
    createScales,
  };
};

export default useD3Chart;
