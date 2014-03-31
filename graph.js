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

var drag = d3.behavior.drag()
        .on("drag", function(d,i) {
            d.x += d3.event.dx
            d.y += d3.event.dy
            d3.select(this).attr("transform", function(d,i){
                return "translate(" + [ d.x,d.y ] + ")"
            })
        }).on("dragstart", function() {
		  d3.event.sourceEvent.stopPropagation(); // silence other listeners
        }).on("dragend", function() {
		});

// init force layout
var force = d3.layout.force()
    .size([width, height])
    .nodes(entityData)
    .links(linkData)
    .linkDistance(50)
    .charge(-200)
    .on("tick", tick);

// get layout properties
var entity = vis.selectAll(".entity").data(entityData),
      link = vis.selectAll(".link").data(linkData);

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  entity.attr("x", function(d) { return d.x-width/2; })
        .attr("y", function (d) { return d.y - height/ 2; });
}

function toSVGCoordinates(xy) {
  var divNode = d3.select("#chart")[0][0];
  var divWidth = divNode.clientWidth;
  var divHeight = divNode.clientHeight;
  var max = Math.max(divWidth, divHeight);
  return [(xy[0]-divWidth/2) * 1200 / max, (xy[1]-divHeight/2) * 1200 / max];
};

function offset(xy) {
  return [xy[0]+width/2, xy[1]+height/2];
}

function rescale() {
  var trans=d3.event.translate;
  var scale=d3.event.scale;

  vis.attr("transform",
      "translate(" + toSVGCoordinates(trans) + ")"
      + " scale(" + scale + ")");
}

function drag() {
  
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