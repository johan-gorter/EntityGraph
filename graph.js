/// <reference path="lib/d3.js" />
var width = 1200,
    height = 1200;

var entityData = [
  {text:"Organisatie"},
  {text:"Persoon"}
];
var linkData = [];

// init svg
var div = d3.select("#chart")
    .call(d3.behavior.zoom().on("zoom", rescale));
var outer = d3.select("#chart svg")
    .attr("pointer-events", "all");

var vis = outer
  .append('svg:g')
	.call(d3.behavior.drag().on("drag", drag))
  .append('svg:g');


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
    d.fixed = true;
    d.x = d3.event.x;
    d.y = d3.event.y;
    //force.resume();
    //    var xy = toSVGCoordinates([d3.event.x, d3.event.y]);
    //    d.x = xy[0];
    //    d.y = xy[1];
    //    var ratio = getLocalToSVGRatio();
    //    console.log("event dx:" + d3.event.dx + " dy:" + d3.event.dy, d3.event);
    //    d.x += d3.event.dx * ratio;
    //    d.y += d3.event.dy * ratio;
    d3.select(this)
      .attr("x", function (d) { return d.x - 100; })
      .attr("y", function (d) { return d.y - 20; });
  }).on("dragstart", function (d) {
    console.log("dragstart", d3.event);
    d3.event.sourceEvent.stopPropagation(); // silence other listeners
    d.fixed = true;
  }).on("dragend", function (d) {
    d.fixed = false;
  });


// get layout properties
var entity = vis.selectAll(".entity").data(entityData),
      link = vis.selectAll(".link").data(linkData);

function tick() {
  link
    .attr("x1", function (d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

  entity
    .attr("x", function (d) { return d.x-100; })
    .attr("y", function (d) { return d.y-20; });
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

function fromVisibleTopLeft(xy, scale) {
  var topLeft = toSVGCoordinates([0, 0]);
  return [xy[0] - topLeft[0]*scale, xy[1] - topLeft[1]*scale];
}

function rescale() {
  var trans=d3.event.translate;
  var scale=d3.event.scale;

  vis
    .attr("transform",
      "translate(" + fromVisibleTopLeft(toSVGCoordinates(trans), scale) + ")"
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