import React, { useMemo, useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import { Maximize2 } from "lucide-react";
import ChartModal from "../../common/ChartModal";
import ChartLegend from "../sectorAnalysisChart/components/ChartLegend";

import {
  ENHANCED_COLOR_PALETTE,
  AXIS_STROKE,
  GRID_STROKE,
  CHART_MARGIN,
  EXPANDED_CHART_MARGIN,
} from "../../../lib/constants";

import { sanitizeKey, getChartDims } from "../../../lib/utils";

/* ===========================
   D3 Chart for Phase Analysis
   =========================== */
const D3PhaseChart = ({
  data,
  phases,
  isVolume,
  mode,
  width,
  height,
  margin,
  isExpanded,
  colorOf,
  showTotal,
}) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || !phases || phases.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const metricSuffix = isVolume ? "__volume" : "__count";
    const totalKey = isVolume ? "__grandTotalVolume" : "__grandTotalCount";

    // X scale
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.year))
      .range([0, chartWidth])
      .padding(0.1);

    // Y scale: fix for proper stacked chart calculation
    let maxValue;
    if (showTotal) {
      maxValue = d3.max(data, (d) => d[totalKey]) || 0;
    } else {
      if (mode === "column") {
        // For stacked charts, calculate the sum of all phases per year
        maxValue = d3.max(data, (d) => {
          return phases.reduce((sum, phase) => {
            return sum + (d[`${sanitizeKey(phase)}${metricSuffix}`] || 0);
          }, 0);
        }) || 0;
      } else {
        // For line charts, use individual phase max
        maxValue =
          d3.max(
            phases.flatMap((phase) =>
              data.map((d) => d[`${sanitizeKey(phase)}${metricSuffix}`] || 0)
            )
          ) || 0;
      }
    }

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([chartHeight, 0]);

    // Grid
    g.selectAll(".grid-line")
      .data(yScale.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", GRID_STROKE)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.6);

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", isExpanded ? "14px" : "12px")
      .style("fill", AXIS_STROKE)
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(10))
      .selectAll("text")
      .style("font-size", isExpanded ? "14px" : "12px")
      .style("fill", AXIS_STROKE);

    // Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 10)
      .attr("x", 0 - chartHeight / 2)
      .attr("dy", "-1.5em")
      .style("text-anchor", "middle")
      .style("font-size", isExpanded ? "16px" : "12px")
      .style("fill", AXIS_STROKE)
      .text(isVolume ? "Investment Volume CHF (M)" : "Number of Deals");

    // Tooltip
    const tooltip = d3.select(tooltipRef.current);

    if (mode === "column") {
      const stack = d3
        .stack()
        .keys(phases.map((p) => `${sanitizeKey(p)}${metricSuffix}`));

      const stackedData = stack(data);

      g.selectAll(".phase-group")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("fill", (d, i) => colorOf(phases[i]))
        .selectAll("rect")
        .data((d) => d)
        .enter()
        .append("rect")
        .attr("x", (d) => xScale(d.data.year))
        .attr("y", (d) => yScale(d[1]))
        .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .on("mouseover", function (event, d) {
          const containerRect =
            svgRef.current.parentElement.getBoundingClientRect();
          const x = event.clientX - containerRect.left;
          const y = event.clientY - containerRect.top;

          let tooltipContent = `<div class="bg-white p-3 border rounded-lg shadow-lg"><div class="font-semibold text-gray-800 mb-2">${d.data.year}</div>`;
          phases.forEach((phase) => {
            const value = d.data[`${sanitizeKey(phase)}${metricSuffix}`] || 0;
            if (value > 0) {
              tooltipContent += `<div class="flex items-center gap-2 mb-1">
                <div class="w-3 h-3 rounded" style="background:${colorOf(
                  phase
                )}"></div>
                <span class="text-gray-700">${phase}: <strong>${
                isVolume ? value.toFixed(1) + "M CHF" : value
              }</strong></span>
              </div>`;
            }
          });
          tooltipContent += "</div>";

          tooltip
            .style("opacity", 1)
            .html(tooltipContent)
            .style("left", `${x + 15}px`)
            .style("top", `${y - 60}px`);
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

      if (showTotal) {
        const line = d3
          .line()
          .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
          .y((d) => yScale(d[totalKey]))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "#000")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")
          .attr("d", line);
      }
    } else {
      // Line chart with stable tooltips using overlay approach
      phases.forEach((phase) => {
        const lineData = data.map((d) => ({
          year: d.year,
          value: d[`${sanitizeKey(phase)}${metricSuffix}`] || 0,
          originalData: d,
        }));

        const line = d3
          .line()
          .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
          .y((d) => yScale(d.value))
          .curve(d3.curveMonotoneX);

        // Draw the line
        g.append("path")
          .datum(lineData)
          .attr("fill", "none")
          .attr("stroke", colorOf(phase))
          .attr("stroke-width", isExpanded ? 3 : 2)
          .attr("d", line);

        // Add visible dots for each data point
        g.selectAll(`.visible-dot-${sanitizeKey(phase)}`)
          .data(lineData)
          .enter()
          .append("circle")
          .attr("class", `visible-dot-${sanitizeKey(phase)}`)
          .attr("cx", (d) => xScale(d.year) + xScale.bandwidth() / 2)
          .attr("cy", (d) => yScale(d.value))
          .attr("r", 3)
          .attr("fill", colorOf(phase))
          .attr("stroke", "white")
          .attr("stroke-width", 1);
      });

      // Create a single overlay for hover detection per year
      data.forEach((yearData) => {
        const x = xScale(yearData.year) + xScale.bandwidth() / 2;
        
        g.append("rect")
          .attr("class", "hover-overlay")
          .attr("x", x - xScale.bandwidth() / 2)
          .attr("y", 0)
          .attr("width", xScale.bandwidth())
          .attr("height", chartHeight)
          .attr("fill", "transparent")
          .style("cursor", "pointer")
          .on("mouseover", function (event) {
            // Highlight all dots for this year
            phases.forEach((phase) => {
              const value = yearData[`${sanitizeKey(phase)}${metricSuffix}`] || 0;
              if (value > 0) {
                g.selectAll(`.visible-dot-${sanitizeKey(phase)}`)
                  .filter((d) => d.year === yearData.year)
                  .attr("r", 5)
                  .attr("stroke-width", 2);
              }
            });

            const containerRect =
              svgRef.current.parentElement.getBoundingClientRect();
            const mouseX = event.clientX - containerRect.left;
            const mouseY = event.clientY - containerRect.top;

            let tooltipContent = `<div class="bg-white p-3 border rounded-lg shadow-lg">
              <div class="font-semibold text-gray-800 mb-2">${yearData.year}</div>`;

            phases.forEach((phase) => {
              const value = yearData[`${sanitizeKey(phase)}${metricSuffix}`] || 0;
              if (value > 0) {
                tooltipContent += `<div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 rounded" style="background:${colorOf(phase)}"></div>
                  <span class="text-gray-700">${phase}: <strong>${
                    isVolume ? value.toFixed(1) + "M CHF" : value
                  }</strong></span>
                </div>`;
              }
            });

            tooltipContent += "</div>";

            tooltip
              .style("opacity", 1)
              .html(tooltipContent)
              .style("left", `${mouseX + 15}px`)
              .style("top", `${mouseY - 60}px`);
          })
          .on("mouseout", function () {
            // Reset all dots for this year
            phases.forEach((phase) => {
              g.selectAll(`.visible-dot-${sanitizeKey(phase)}`)
                .filter((d) => d.year === yearData.year)
                .attr("r", 3)
                .attr("stroke-width", 1);
            });

            tooltip.style("opacity", 0);
          });
      });

      if (showTotal) {
        const totalLineData = data.map((d) => ({
          year: d.year,
          value: d[totalKey],
          originalData: d,
        }));

        const totalLine = d3
          .line()
          .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
          .y((d) => yScale(d.value))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(totalLineData)
          .attr("fill", "none")
          .attr("stroke", "#000")
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", "5,5")
          .attr("d", totalLine);

        // Add visible dots for total line
        g.selectAll(".visible-dot-total")
          .data(totalLineData)
          .enter()
          .append("circle")
          .attr("class", "visible-dot-total")
          .attr("cx", (d) => xScale(d.year) + xScale.bandwidth() / 2)
          .attr("cy", (d) => yScale(d.value))
          .attr("r", 3)
          .attr("fill", "#000")
          .attr("stroke", "white")
          .attr("stroke-width", 1);
      }
    }
  }, [data, phases, isVolume, mode, width, height, margin, isExpanded, colorOf, showTotal]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height}></svg>
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 z-50"
      ></div>
    </div>
  );
};

/* ===========================
   ExpandablePhaseAnalysisChart
   =========================== */
const ExpandablePhaseAnalysisChart = ({ deals }) => {
  const [expandedChart, setExpandedChart] = useState(null); // "volume" | "count"
  const [leftMode, setLeftMode] = useState("line");
  const [rightMode, setRightMode] = useState("line");
  const [modalMode, setModalMode] = useState("line");
  const [showTotal, setShowTotal] = useState(false);
  const [modalShowTotal, setModalShowTotal] = useState(true);

  const phases = useMemo(
    () =>
      Array.from(new Set(deals.map((d) => d.Phase).filter((p) => p && p.trim()))).sort(),
    [deals]
  );

  const colorOf = (phase) =>
    ENHANCED_COLOR_PALETTE[phases.indexOf(phase) % ENHANCED_COLOR_PALETTE.length];

  const rows = useMemo(() => {
    const byYear = {};
    deals.forEach((d) => {
      if (!d.Phase || !d.Year || d.Year >= 2025) return; // Filter out 2025 and beyond
      const year = d.Year; // This line was missing due to comment placement
      const phaseKey = sanitizeKey(d.Phase);
      if (!byYear[year]) byYear[year] = { year };
      byYear[year][`${phaseKey}__volume`] =
        (byYear[year][`${phaseKey}__volume`] || 0) + Number(d.Amount || 0);
      byYear[year][`${phaseKey}__count`] =
        (byYear[year][`${phaseKey}__count`] || 0) + 1;
      byYear[year]["__grandTotalVolume"] =
        (byYear[year]["__grandTotalVolume"] || 0) + Number(d.Amount || 0);
      byYear[year]["__grandTotalCount"] =
        (byYear[year]["__grandTotalCount"] || 0) + 1;
    });
    return Object.values(byYear).sort((a, b) => a.year - b.year);
  }, [deals, phases]);

  const dims = getChartDims(false, undefined, CHART_MARGIN);
  const expandedDims = getChartDims(true, 690, EXPANDED_CHART_MARGIN);

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex items-center gap-4 p-4 rounded bg-transparent">
        <span className="text-gray-700">Left (Volume):</span>
        <select
          value={leftMode}
          onChange={(e) => setLeftMode(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
        >
          <option value="line">Line</option>
          <option value="column">Column</option>
        </select>
        <span className="text-gray-700">Right (Count):</span>
        <select
          value={rightMode}
          onChange={(e) => setRightMode(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
        >
          <option value="line">Line</option>
          <option value="column">Column</option>
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showTotal}
            onChange={(e) => setShowTotal(e.target.checked)}
            className="text-red-600 focus:ring-red-500"
          />
          <span className="text-gray-700">Show total</span>
        </label>
      </div>

      {/* Dual charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Volume chart */}
        <div className="space-y-3">
          <h3 className="text-md font-semibold text-gray-800 pl-4">
            Investment Volume vs Year
          </h3>
          <div className="flex gap-2 pl-4">
            <button
              className="h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors"
              style={{ minHeight: "40px" }}
              title="Export chart (print or save as PDF)"
            >
              Export
              <img src="/download.svg" alt="Download" className="h-5 w-5" />
            </button>
            <button
              onClick={() => setExpandedChart("volume")}
              className="p-2 rounded-md bg-blue-600 text-white shadow-md hover:bg-blue-700"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
          <D3PhaseChart
            data={rows}
            phases={phases}
            isVolume={true}
            mode={leftMode}
            width={dims.width / 2}
            height={dims.height}
            margin={dims.margin}
            isExpanded={false}
            colorOf={colorOf}
            showTotal={showTotal}
          />
        </div>

        {/* Count chart */}
        <div className="space-y-3">
          <h3 className="text-md font-semibold text-gray-800 pl-4">
            Number of Deals vs Year
          </h3>
          <div className="flex gap-2 pl-4">
            <button
              className="h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors"
              style={{ minHeight: "40px" }}
              title="Export chart (print or save as PDF)"
            >
              Export
              <img src="/download.svg" alt="Download" className="h-5 w-5" />
            </button>
            <button
              onClick={() => setExpandedChart("count")}
              className="p-2 rounded-md bg-green-600 text-white shadow-md hover:bg-green-700"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
          <D3PhaseChart
            data={rows}
            phases={phases}
            isVolume={false}
            mode={rightMode}
            width={dims.width / 2}
            height={dims.height}
            margin={dims.margin}
            isExpanded={false}
            colorOf={colorOf}
            showTotal={showTotal}
          />
        </div>
      </div>

      <ChartLegend items={phases} colorOf={colorOf} title="Phases" />

      {/* Expanded modal */}
      <ChartModal
        isOpen={expandedChart !== null}
        onClose={() => setExpandedChart(null)}
        title={`Expanded ${
          expandedChart === "volume" ? "Investment Volume" : "Deal Count"
        } Chart`}
      >
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className="text-gray-700">Chart Type:</span>
          <select
            value={modalMode}
            onChange={(e) => setModalMode(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700"
          >
            <option value="line">Line</option>
            <option value="column">Column</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={modalShowTotal}
              onChange={(e) => setModalShowTotal(e.target.checked)}
              className="text-red-600 focus:ring-red-500"
            />
            <span className="text-gray-700">Show total</span>
          </label>
        </div>
        <ChartLegend items={phases} colorOf={colorOf} title="Phases" />
        <D3PhaseChart
          data={rows}
          phases={phases}
          isVolume={expandedChart === "volume"}
          mode={modalMode}
          width={expandedDims.width}
          height={expandedDims.height}
          margin={expandedDims.margin}
          isExpanded={true}
          colorOf={colorOf}
          showTotal={modalShowTotal}
        />
      </ChartModal>
    </div>
  );
};

export default ExpandablePhaseAnalysisChart;