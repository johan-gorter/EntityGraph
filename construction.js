/// <reference path="lib/d3.js" />

// construction helper functions

function appendDefs(parent) {
  var defs = parent.append("svg").append("defs");
  function appendLinearGradient(id, direction) {
    var gradient = defs.append("linearGradient")
        .attr("id", id)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", direction === "down" ? "0%" : "100%")
        .attr("y2", direction === "down" ? "100%" : "0%");
    gradient.append("stop")
          .attr("offset", "0%")
          .attr("class", id + "-from");
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("class", id + "-to");
  };
  appendLinearGradient("entity-gradient", "down");
  appendLinearGradient("selected-entity-gradient", "down");
  appendLinearGradient("role-relation-gradient", "right");
  appendLinearGradient("selected-role-relation-gradient", "right");
  var filter = defs.append("filter").attr("id", "entity-expanded-shadow")
      .attr("width", "400%").attr("height", "400%")
      .attr("x", "-100%").attr("y", "-100%");
  filter.append("feGaussianBlur")
      .attr("result", "blurOut").attr("in", "SourceGraphic").attr("stdDeviation", "8");
  filter.append("feBlend")
      .attr("in", "SourceGraphic").attr("in2", "blurOut").attr("mode", "normal");
}

function appendExpandAll(button) {
  var svg = button.append("svg")
      .attr("viewBox", "0 0 100 100");
  svg.append("path")
      .attr("d", "M 5,50 l 40,0 m -20,-20 l 0,40");
  svg.append("path")
      .attr("d", "M 55,50 l 40,0 m -20,-20 l 0,40");
};

function appendCollapseAll(button) {
  var svg = button.append("svg")
      .attr("viewBox", "0 0 100 100");
  svg.append("path")
      .attr("d", "M 5,50 l 40,0");
  svg.append("path")
      .attr("d", "M 55,50 l 40,0");
};

function appendSearchIcon(div) {
  var svg = div.append("svg")
      .attr("viewBox", "0 0 32 32");
  svg.append("circle")
      .attr({ cx: "12", cy: "12", r: "10" });
  svg.append("path")
      .attr("d", "M 19.5,19.5 l 10,10");
};

// initialization

d3.select("body").append("div").attr("class", "svg-defs").call(appendDefs);

var chart = d3.select("body").append("div").attr("class", "chart");

chart.append("button")
    .attr("class", "expand-all")
    .call(appendExpandAll);
chart.append("button")
    .attr("class", "collapse-all")
    .call(appendCollapseAll);
chart.append("div")
    .attr("style", "display:none")
    .append("div")
    .attr("class", "search-results");
chart.append("input")
    .attr({ "class": "search", type: "text", autocomplete: "off" });
chart.append("div")
    .attr("class", "search-icon")
    .call(appendSearchIcon);

var chartSvg = chart.append("svg")
    .attr("preserveAspectRatio", "xMidYMid slice")
    .attr("viewBox", "-600 -600 1200 1200")
    .attr("pointer-events", "all");
var handleZoom = chartSvg.append("g").attr("class", "handle-zoom");
var background = handleZoom.append("rect").attr("class", "background")
    .attr("x", "-600").attr("y", "-600").attr("width", "1200").attr("height", "1200")
    .attr("fill", "transparent");
var visualization = handleZoom.append("g").attr("class", "visualization");

var relations = visualization.append("g").attr("class", "relations").attr("fill", "none");
var entities = visualization.append("g").attr("class", "entities");
var droplocation = visualization.append("rect").attr({x:"0", y:"0", width:"200", height:"30", fill:"none", "stroke-width": "3", stroke:"#888888", rx:"10", ry:"10", "pointer-events":"none", display:"none"});

