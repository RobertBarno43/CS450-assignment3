import React, { Component } from "react";
import "./App.css";
import * as d3 from "d3"

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {wordFrequency:[]};
  }
  componentDidMount() {
    this.renderChart();
  }

  componentDidUpdate() {
    this.renderChart();
  }

  getWordFrequency = (text) => {
    const stopWords = new Set(["the", "and", "a", "an", "in", "on", "at", "for", "with", "about", "as", "by", "to", "of", "from", "that", "which", "who", "whom", "this", "these", "those", "it", "its", "they", "their", "them", "we", "our", "ours", "you", "your", "yours", "he", "him", "his", "she", "her", "hers", "it", "its", "we", "us", "our", "ours", "they", "them", "theirs", "I", "me", "my", "myself", "you", "your", "yourself", "yourselves", "was", "were", "is", "am", "are", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "as", "if", "each", "how", "which", "who", "whom", "what", "this", "these", "those", "that", "with", "without", "through", "over", "under", "above", "below", "between", "among", "during", "before", "after", "until", "while", "of", "for", "on", "off", "out", "in", "into", "by", "about", "against", "with", "amongst", "throughout", "despite", "towards", "upon", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't", "doesn't", "didn't", "don't", "doesn't", "didn't", "won't", "wouldn't", "can't", "couldn't", "shouldn't", "mustn't", "needn't", "daren't", "hasn't", "haven't", "hadn't"]);
    const words = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=_`~()]/g, "").replace(/\s{2,}/g, " ").split(" ");
    const filteredWords = words.filter(word => !stopWords.has(word));
    return Object.entries(filteredWords.reduce((freq, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {}));
  }


  renderChart() {
    const data = this.state.wordFrequency.sort((a,b)=>b[1]-a[1]).slice(0,5)
    console.log(data)

    const top = data.map(d => ({ word: d[0], count: d[1] }));

    const svg = d3.select(".svg_parent");
    const width = 1000;
    const height = 300;
    svg.attr("width", width).attr("height", height);

    if (!top || top.length === 0) {
      svg.selectAll("text").remove();
      return;
    }

    const fixedY = height / 2;

    const hadExisting = svg.selectAll("text").size() > 0;

    const counts = top.map(d => d.count);
    const countMin = d3.min(counts);
    const countMax = d3.max(counts);
    const fontScale = (countMin === countMax)
      ? d3.scaleLinear().domain([countMin, countMax]).range([36, 48])
      : d3.scaleLinear().domain([countMin, countMax]).range([20, 80]);

    const margin = 40;
    const basePadding = 20; 
    const usableWidth = width - 2 * margin;

    const measurer = svg.append("g")
      .attr("class", "measurer")
      .style("visibility", "hidden")
      .style("pointer-events", "none");

    const widths = top.map(d => {
      const t = measurer.append("text")
        .text(d.word)
        .attr("font-size", `${fontScale(d.count)}px`)
        .attr("font-family", "sans-serif")
        .attr("text-anchor", "start");
      const bbox = t.node().getBBox();
      const w = bbox.width;
      t.remove();
      return w;
    });

    measurer.remove();

    const lefts = [];
    lefts[0] = 0; 
    for (let i = 1; i < top.length; i++) {
      lefts[i] = lefts[i - 1] + widths[i - 1] + basePadding;
    }

    const contentWidth = lefts[top.length - 1] + widths[top.length - 1]; 
    
    let xs = [];
    if (contentWidth <= usableWidth) {
      const extra = usableWidth - contentWidth;
      const gaps = Math.max(1, top.length - 1);
      const extraPerGap = extra / gaps;
      xs[0] = margin;
      for (let i = 1; i < top.length; i++) {
        xs[i] = xs[i - 1] + widths[i - 1] + basePadding + extraPerGap;
      }
    } else {
      const minScale = 0.55; 
      const scale = Math.max(minScale, usableWidth / contentWidth);
      xs[0] = margin;
      for (let i = 1; i < top.length; i++) {
        xs[i] = margin + Math.round((lefts[i]) * scale);
      }
      const lastRight = xs[top.length - 1] + widths[top.length - 1];
      if (lastRight > width - margin) {
        const shiftBack = lastRight - (width - margin);
        for (let i = 0; i < xs.length; i++) xs[i] = xs[i] - shiftBack;
      }
    }

    const texts = svg.selectAll("text").data(top, d => d.word);

    texts.exit()
      .transition()
      .duration(600)
      .attr("opacity", 0)
      .attr("x", width + 30)
      .remove();

    const enter = texts.enter()
      .append("text")
      .attr("text-anchor", "start")
      .attr("fill", "#333")
      .style("font-family", "sans-serif")
      .style("opacity", 0)
      .text(d => d.word)
      .attr("y", fixedY);

    if (!hadExisting) {
      enter
        .attr("x", (d, i) => xs[i])
        .style("font-size", "4px")
        .transition()
        .delay((d, i) => i * 60)
        .duration(900)
        .style("opacity", 1)
        .style("font-size", d => `${fontScale(d.count)}px`);
    } else {
      enter
        .attr("x", width + 30)
        .style("font-size", "4px")
        .transition()
        .delay((d, i) => i * 80)
        .duration(900)
        .style("opacity", 1)
        .attr("x", (d, i) => xs[i])
        .style("font-size", d => `${fontScale(d.count)}px`);
    }

    texts.transition()
      .delay((d, i) => i * 60)
      .duration(900)
      .attr("x", (d, i) => xs[i])
      .attr("y", fixedY)
      .style("font-size", d => `${fontScale(d.count)}px`)
      .style("opacity", 1)
      .text(d => d.word);

  }

  render() {
    return (
      <div className="parent">
        <div className="child1" style={{width: 1000 }}>
        <textarea type="text" id="input_field" style={{ height: 150, width: 1000 }}/>
          <button type="submit" value="Generate Matrix" style={{ marginTop: 10, height: 40, width: 1000 }} onClick={() => {
                var input_data = document.getElementById("input_field").value
                this.setState({wordFrequency:this.getWordFrequency(input_data)})
              }}
            > Generate WordCloud</button>
        </div>
        <div className="child2"><svg className="svg_parent"></svg></div>
      </div>
    );
  }
}

export default App;