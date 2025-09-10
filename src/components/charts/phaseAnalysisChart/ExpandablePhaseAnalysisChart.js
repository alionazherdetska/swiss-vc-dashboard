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

    // Y scale
    const maxValue = d3.max(data, (d) => d[totalKey]) || 0;
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
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll("text")
      .style("font-size", isExpanded ? "14px" : "12px")
      .style("fill", AXIS_STROKE);

    // Tooltip
    const tooltip = d3.select(tooltipRef.current);

    if (mode === "column") {
      // Stacked bar chart
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
          const year = d.data.year;
          let tooltipContent = `
            <div class="bg-white p-3 border rounded-lg shadow-lg">
              <div class="font-semibold text-gray-800 mb-2">${year}</div>
          `;
          phases.forEach((phase) => {
            const value = d.data[`${sanitizeKey(phase)}${metricSuffix}`] || 0;
            if (value > 0) {
              const roundedValue = isVolume
                ? value.toFixed(1) + "M CHF"
                : value;
              tooltipContent += `
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 rounded" style="background:${colorOf(
                    phase
                  )}"></div>
                  <span class="text-gray-700">${phase}: <strong>${roundedValue}</strong></span>
                </div>`;
            }
          });
          tooltipContent += "</div>";

          const rect = d3.select(this);
          const barX = +rect.attr("x");
          const barY = +rect.attr("y");
          const barW = xScale.bandwidth();

          tooltip
            .style("opacity", 1)
            .html(tooltipContent)
            .style("left", `${margin.left + barX + barW / 2}px`)
            .style("top", `${margin.top + barY - 10}px`);
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

      // total line on top of stacked bars
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
      // Line chart
      phases.forEach((phase) => {
        const lineData = data.map((d) => ({
          year: d.year,
          value: d[`${sanitizeKey(phase)}${metricSuffix}`] || 0,
        }));

        const line = d3
          .line()
          .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
          .y((d) => yScale(d.value))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(lineData)
          .attr("fill", "none")
          .attr("stroke", colorOf(phase))
          .attr("stroke-width", isExpanded ? 3 : 2)
          .attr("d", line);
      });

      // total line
      if (showTotal) {
        const totalLine = d3
          .line()
          .x((d) => xScale(d.year) + xScale.bandwidth() / 2)
          .y((d) => yScale(d[totalKey]))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "#000")
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", "5,5")
          .attr("d", totalLine);
      }

      // Invisible overlay per year for tooltip with all phases
      g.selectAll(".year-overlay")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d) => xScale(d.year))
        .attr("width", xScale.bandwidth())
        .attr("y", 0)
        .attr("height", chartHeight)
        .attr("fill", "transparent")
        .on("mouseover", function (event, d) {
          let tooltipContent = `
            <div class="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
              <div class="font-semibold text-gray-800 mb-2">${d.year}</div>
          `;
          phases.forEach((phase) => {
            const value = d[`${sanitizeKey(phase)}${metricSuffix}`] || 0;
            if (value > 0) {
              const roundedValue = isVolume
                ? value.toFixed(1) + "M CHF"
                : value;
              tooltipContent += `
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-3 h-3 rounded" style="background:${colorOf(
                    phase
                  )}"></div>
                  <span class="text-gray-700">${phase}: <strong>${roundedValue}</strong></span>
                </div>`;
            }
          });
          tooltipContent += "</div>";

          const containerRect =
            svgRef.current.parentElement.getBoundingClientRect();
          const x = event.clientX - containerRect.left;
          const y = event.clientY - containerRect.top;

          tooltip
            .style("opacity", 1)
            .html(tooltipContent)
            .style("left", `${x}px`)
            .style("top", `${Math.max(y - 100, 10)}px`);
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
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
      Array.from(
        new Set(deals.map((d) => d.Phase).filter((p) => p && p.trim()))
      ).sort(),
    [deals]
  );

  const colorOf = (phase) =>
    ENHANCED_COLOR_PALETTE[phases.indexOf(phase) % ENHANCED_COLOR_PALETTE.length];

  const rows = useMemo(() => {
    const byYear = {};
    deals.forEach((d) => {
      if (!d.Phase || !d.Year) return;
      const year = d.Year;
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
  const expandedDims = getChartDims(true, 720, EXPANDED_CHART_MARGIN);

  return (
    <div className="space-y-6">
      {/* Mode selectors */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded bg-gray-50">
        <span className="text-gray-700">Left (Volume):</span>
        <select
          value={leftMode}
          onChange={(e) => setLeftMode(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="line">Line</option>
          <option value="column">Column</option>
        </select>
        <span className="text-gray-700">Right (Count):</span>
        <select
          value={rightMode}
          onChange={(e) => setRightMode(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Volume chart */}
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

        {/* Count chart */}
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
