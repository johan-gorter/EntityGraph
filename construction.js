/// <reference path="lib/d3.js" />

// construction helper functions

var pinPath = "M150.061,232.739l-67.232,67.868  c-3.363,3.267-5.453,7.898-5.453,12.991c0,9.991,8.083,18.173,17.989,18.173h127.379" +
              "V445.34c0,12.536,10.177,22.711,22.713,22.711  c12.537,0,22.715-10.175,22.715-22.711V331.771h136.46c9.899,0,17.992-8.182,17.992-18.173" +
              "c0-4.993-2.006-9.536-5.269-12.811  l-67.417-68.143V77.375h13.631c12.535,0,22.715-10.177,22.715-22.713c0-12.536-10.18-22.713-22.715-22.713" +
              "H136.432  c-12.536,0-22.713,10.177-22.713,22.713c0,12.537,10.177,22.713,22.713,22.713h13.629V232.739z M231.83,95.548v118.109" +
              "c0,9.996-8.176,18.172-18.172,18.172c-9.994,0-18.171-8.176-18.171-18.172V95.548c0-9.996,8.177-18.173,18.171-18.173" +
              "C223.653,77.375,231.83,85.552,231.83,95.548z";

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
  }
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
}

function appendCollapseAll(button) {
  var svg = button.append("svg")
      .attr("viewBox", "0 0 100 100");
  svg.append("path")
      .attr("d", "M 5,50 l 40,0");
  svg.append("path")
      .attr("d", "M 55,50 l 40,0");
}

function appendSearchIcon(div) {
  var svg = div.append("svg")
      .attr("viewBox", "0 0 32 32");
  svg.append("circle")
      .attr({ cx: "12", cy: "12", r: "10" });
  svg.append("path")
      .attr("d", "M 19.5,19.5 l 10,10");
}

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
{
  var relations = visualization.append("g").attr("class", "relations").attr("fill", "none");
  var entities = visualization.append("g").attr("class", "entities");
  var droplocation = visualization.append("rect").attr({x:"0", y:"0", width:"200", height:"30", fill:"none", "stroke-width": "3", stroke:"#888888", rx:"10", ry:"10", "pointer-events":"none", display:"none"});

  var focus = visualization.append("g").attr({"class":"focus", transform:"translate(0,0)"});
  {
    var focusBorder = focus.append("rect").attr({"class":"focus-border", x:"-100", y:"-20", width:"200", height:"40", rx:"15", ry:"15", "pointer-events":"none"});
    var focusOff = focus.append("g").attr({"class":"focus-off", transform:"translate(80,-50)"});
    focusOff.append("circle").attr({cx:"0", cy:"0", r:"20", fill:"rgba(255,255,255,0.5)"});
    focusOff.append("path").attr({"stroke-width":"4", d:"M-10,-10 l20,20 M-10,10 l 20, -20"});

    var focusExpand = focus.append("g").attr({"class":"focus-expand", transform:"translate(-120,0)"});
    focusExpand.append("circle").attr({cx:"0", cy:"0", r:"20", fill:"rgba(255,255,255,0.5)"});
    focusExpand.append("path").attr({"class":"focus-expand-plus", "stroke-width":"4", d:"M -10,0 l 20,0 M 0,-10 l 0,20"});
    focusExpand.append("path").attr({"class":"focus-expand-minus", "stroke-width":"4", d:"M -10,0 l 20,0"});
    
    var focusPin = focus.append("g").attr({"class":"focus-pin", transform:"translate(-80,-50)"});
    focusPin.append("circle").attr({cx:"0", cy:"0", r:"20", fill:"rgba(255,255,255,0.5)"});
    focusPin.append("path").attr({"class":"pin-path", fill:"#FF4C05", transform:"scale(0.06) translate(-240 -260)", d:pinPath});
    focusPin.append("path").attr({"stroke-width":"5", stroke:"white", transform:"rotate(45 0 0)", d:"M 0,-18.5 l 0,37"});
    focusPin.append("path").attr({transform:"rotate(45 0 0)", d:"M 0,-18.5 l 0,37"});
  }
}
