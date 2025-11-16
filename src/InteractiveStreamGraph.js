import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
  }
  componentDidUpdate() {
    const chartData = this.props.csvData;
    if (!chartData || chartData.length === 0) return;

    const llmModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];
    const colors = {
      "GPT-4": "#e41a1c",
      "Gemini": "#377eb8",
      "PaLM-2": "#4daf4a",
      "Claude": "#984ea3",
      "LLaMA-3.1": "#ff7f00"
    };
    const width = 600, height = 500, margin = { top: 40, right: 20, bottom: 40, left: 50 };
    const svg = d3.select(this.svgRef.current);
    svg.selectAll("*").remove();

    const x = d3.scaleTime()
      .domain(d3.extent(chartData, d => d.Date))
      .range([margin.left, width - margin.right]);
    const maxY = d3.max(chartData, d => llmModels.reduce((sum, m) => sum + d[m], 0));
    const y = d3.scaleLinear()
      .domain([-0.2 * maxY, maxY]) // Add 20% space below
      .range([height - margin.bottom, margin.top]);
    const stack = d3.stack().keys(llmModels).offset(d3.stackOffsetWiggle);
    const stackedData = stack(chartData);
    const area = d3.area()
      .x(d => x(d.data.Date))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveCatmullRom); // Make lines curvy

    // Tooltip container
    let tooltip = d3.select("#stream-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div")
        .attr("id", "stream-tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "12px")
        .style("pointerEvents", "none")
        .style("zIndex", 10)
        .style("display", "none");
    }

    svg.selectAll(".stream")
      .data(stackedData)
      .join("path")
      .attr("class", "stream")
      .attr("d", area)
      .attr("fill", d => colors[d.key])
      .attr("stroke", "#222")
      .attr("stroke-width", 0.5)
      .on("mousemove", function(event, d) {
        // d.key is the hovered model
        const model = d.key;
        // Show a bar chart of this model's values across all months
        tooltip.style("display", "block")
          .style("left", `${event.clientX + 20}px`)
          .style("top", `${event.clientY - 20}px`);
        tooltip.html("");
        tooltip.append("div")
          .style("fontWeight", "bold")
          .style("marginBottom", "8px")
          .text(model);
        // Bar chart SVG
        const barWidth = 300, barHeight = 160, barMargin = { left: 40, right: 20, top: 30, bottom: 40 };
        const barSvg = tooltip.append("svg")
          .attr("width", barWidth)
          .attr("height", barHeight);
        const xBar = d3.scaleBand()
          .domain(chartData.map(d => d3.timeFormat("%b")(d.Date)))
          .range([barMargin.left, barWidth - barMargin.right])
          .padding(0.15);
        const yBar = d3.scaleLinear()
          .domain([0, d3.max(chartData, d => d[model])])
          .range([barHeight - barMargin.bottom, barMargin.top]);
        // X axis
        barSvg.append("g")
          .attr("transform", `translate(0,${barHeight - barMargin.bottom})`)
          .call(d3.axisBottom(xBar));
        // Y axis
        barSvg.append("g")
          .attr("transform", `translate(${barMargin.left},0)`)
          .call(d3.axisLeft(yBar).ticks(5));
        // Bars
        barSvg.selectAll(".bar")
          .data(chartData)
          .join("rect")
          .attr("class", "bar")
          .attr("x", d => xBar(d3.timeFormat("%b")(d.Date)))
          .attr("y", d => yBar(d[model]))
          .attr("width", xBar.bandwidth())
          .attr("height", d => barHeight - barMargin.bottom - yBar(d[model]))
          .attr("fill", colors[model]);
      })
      .on("mouseleave", function() {
        tooltip.style("display", "none");
        tooltip.html("");
      });

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6));
    // Removed y-axis for cleaner look
  }

  render() {
    const llmModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];
    const colors = {
      "GPT-4": "#e41a1c",
      "Gemini": "#377eb8",
      "PaLM-2": "#4daf4a",
      "Claude": "#984ea3",
      "LLaMA-3.1": "#ff7f00"
    };
    const showLegend = this.props.csvData && this.props.csvData.length > 0;
    return (
      <div style={{ display: "flex", alignItems: "flex-start", marginTop: 60 }}>
        <svg ref={this.svgRef} style={{ width: 600, height: 500 }} className="svg_parent"></svg>
        {showLegend && (
          <div style={{ marginLeft: 24, marginTop: 40 }}>
            {[...llmModels].reverse().map(model => (
              <div key={model} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <div style={{ width: 20, height: 20, background: colors[model], marginRight: 10, borderRadius: 4 }}></div>
                <span style={{ fontSize: 16 }}>{model}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default InteractiveStreamGraph;
