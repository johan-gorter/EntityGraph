/// <reference path="lib/d3.js" />
var width = 1200,
    height = 1200;

var entityData = [
  {text:"Organisatie"},
  {text:"Persoon"}
];
var linkData = [];

// init svg
d3.select("#background").call(d3.behavior.zoom().on("zoom", rescale));
var visualization = d3.select('#visualization');

// init force layout
var force = d3.layout.force()
  .size([width, height])
  .nodes(entityData)
  .links(linkData)
  .linkDistance(50)
  .charge(-200)
  .on("tick", tick);

var drag = force.drag()
  .on("drag", function (d, i) {
    force.resume();
  }).on("dragstart", function (d) {
//    d3.event.sourceEvent.stopPropagation(); // silence other listeners
  }).on("dragend", function (d) {
    force.resume();
  });

// get layout properties
var entity = visualization.selectAll(".entity").data(entityData);
var link = visualization.selectAll(".link").data(linkData);

function tick() {
  link
    .attr("x1", function (d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

  entity
    .attr("x", function (d) { return d.x-100-600; })
    .attr("y", function (d) { return d.y-20-600; });
}

function getLocalToSVGRatio() {
  var divNode = d3.select("#chart")[0][0];
  var divWidth = divNode.clientWidth;
  var divHeight = divNode.clientHeight;
  var max = Math.max(divWidth, divHeight);
  return 1200/max;
}

function toSVGCoordinates(xy) {
  var divNode = d3.select("#chart")[0][0];
  var divWidth = divNode.clientWidth;
  var divHeight = divNode.clientHeight;
  var max = Math.max(divWidth, divHeight);
  var result = [(xy[0] - divWidth / 2) * 1200 / max + width / 2, (xy[1] - divHeight / 2) * 1200 / max + height / 2];
  return result;
};

function rescale() {
  var trans=d3.event.translate;
  var scale=d3.event.scale;
  visualization
    .attr("transform",
      "translate(" + trans + ")"
      + " scale(" + scale + ")");
}

var enteringEntity = entity.enter().insert("svg:svg")
  .attr("class", "entity")
  .attr("width", 200)
  .attr("height", 40)
  .call(drag);
    
enteringEntity.append("rect")
  .attr("width", 200)
  .attr("height", 40)
  .attr("rx", 5)
  .attr("ry", 5)
  .attr("fill","url(#entity-gradient)");

enteringEntity.append("svg:text")
  .attr("class", "text")
  .attr("x", 5)
  .attr("y", 9)
  .attr("dy", 15)
  .attr("color", "white")
  .text(function(d) { return d.text; });
    
entity.exit().remove();

force.start();