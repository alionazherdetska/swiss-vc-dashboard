import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const CHART_MARGIN = { top: 40, right: 40, bottom: 60, left: 70 };

/** Timeline (deals) */
export const TimelineChart = ({ data, showVolume = false, title, yLabel }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 600;
    const height = svgRef.current.clientHeight || 400;

    const chartWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
    const chartHeight = height - CHART_MARGIN.top - CHART_MARGIN.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${CHART_MARGIN.left},${CHART_MARGIN.top})`);

    const chartKey = showVolume ? "volume" : "count";
    const defaultY = showVolume ? "Invested Capital CHF (M)" : "Count";
    const chartLabel = yLabel || defaultY;

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.year))
      .range([0, chartWidth])
      .padding(0.1);

    const yMax = d3.max(data, (d) => d[chartKey]) || 0;

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax * 1.1])
      .range([chartHeight, 0]);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    g.append("g").call(d3.axisLeft(yScale).ticks(6));

    // Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - CHART_MARGIN.left + 15) // push away from ticks
      .attr("x", 0 - chartHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#4A5568")
      .text(chartLabel);

    // Area generator
    const area = d3
      .area()
      .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
      .y0(chartHeight)
      .y1((d) => yScale(d[chartKey]))
      .curve(d3.curveMonotoneX);

    // Line generator
    const line = d3
      .line()
      .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
      .y((d) => yScale(d[chartKey]))
      .curve(d3.curveMonotoneX);

    // Gradient
    const gradientId = `gradient-${chartKey}`;
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#E84A5F")
      .attr("stop-opacity", 0.8);
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#E84A5F")
      .attr("stop-opacity", 0.1);

    // Area
    g.append("path")
      .datum(data)
      .attr("fill", `url(#${gradientId})`)
      .attr("d", area);

    // Line
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#E84A5F")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Focus elements (vertical line + circle)
    const focusLine = g
      .append("line")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .style("opacity", 0);

    const focusCircle = g
      .append("circle")
      .attr("r", 4)
      .attr("fill", "#E84A5F")
      .style("opacity", 0);

    const tooltip = d3.select(tooltipRef.current);

    // Overlay for mouse events
    g.append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "transparent")
      .on("mousemove", function (event) {
        const [mx] = d3.pointer(event, this);
        const year = Math.round(xScale.domain()[Math.floor(mx / xScale.step())]);
        const row = data.find((d) => +d.year === +year);
        if (!row) return;

        const value = row[chartKey] || 0;

        focusLine
          .attr("x1", xScale(year) + xScale.bandwidth() / 2)
          .attr("x2", xScale(year) + xScale.bandwidth() / 2)
          .style("opacity", 1);

        focusCircle
          .attr("cx", xScale(year) + xScale.bandwidth() / 2)
          .attr("cy", yScale(value))
          .style("opacity", 1);

        const [x, y] = d3.pointer(event, this);

        tooltip
          .style("opacity", 1)
          .style("left", `${x + CHART_MARGIN.left + 20}px`)
          .style("top", `${y + CHART_MARGIN.top - 40}px`)
          .html(`
            <div class="bg-white p-2 border rounded shadow text-sm">
              <div class="font-semibold">${year}</div>
              <div>${showVolume ? value.toFixed(1) + "M CHF" : value}</div>
            </div>
          `);
      })
      .on("mouseout", function () {
        focusLine.style("opacity", 0);
        focusCircle.style("opacity", 0);
        tooltip.style("opacity", 0);
      });
  }, [data, showVolume, yLabel]);

  return (
    <div className="space-y-2 relative">
      <div className="flex items-center mb-2">
        {title && (
          <h3 className="text-md font-semibold text-gray-800 mr-2">{title}</h3>
        )}
        <button
          className="h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors"
          style={{ minHeight: "40px" }}
          title="Export chart (print or save as PDF)"
        >
          Export
          <img src="/download.svg" alt="Download" className="h-5 w-5" />
        </button>
      </div>
      <svg ref={svgRef} width="100%" height="400"></svg>
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity z-50"
      ></div>
    </div>
  );
};
