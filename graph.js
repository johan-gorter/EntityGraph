/// <reference path="lib/d3.js" />
var width = 1200;
var height = 1200;
var repelDistance = 80;

var graphData = { nodes: [], edges: [], startNodeId: null };
var visibleEntities;
var visibleLinks;
var focus = null;

// Elements

var focusElement = d3.select("#focus");
var focusBorderElement = d3.select("#focus-border");
var offElement = d3.select("#focus-off");
var expandElement = d3.select("#focus-expand");

// Helper functions

var updateFocus = function () {
  if(!focus) {
    focusElement.attr("display", "none");
  } else {
    focusElement.attr("display", "");
    focusBorderElement.attr("width", focus.width + 10);
    focusBorderElement.attr("x", -focus.width / 2 - 5);
    offElement.attr("transform", "translate("+ [-focus.width / 2 + 15, -50]+")");
    expandElement.attr("transform", "translate(" + [focus.width / 2 - 15, -50] + ")");
    positionFocus();
  }
};

function getQueryStringParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var positionFocus = function () {
  focusElement.attr("transform", "translate(" + [focus.x - 600, focus.y - 600] + ")");
};

function getLocalToSVGRatio() {
  var divNode = d3.select("#chart")[0][0];
  var divWidth = divNode.clientWidth;
  var divHeight = divNode.clientHeight;
  var max = Math.max(divWidth, divHeight);
  return 1200 / max;
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
  var trans = d3.event.translate;
  var scale = d3.event.scale;
  visualization
    .attr("transform",
      "translate(" + trans + ")"
      + " scale(" + scale + ")");
}

function showEntity(entity, pos) {
  if (!entity.visible) {
    entity.visible = true;
    entity.x = entity.px = pos.x;
    entity.y = entity.py = pos.y;
    visibleEntities.push(entity);
    entity.incomingEdges.forEach(function(edge){
      if (edge.target.visible) {
        visibleLinks.push(edge);
      }
    });
    entity.outgoingEdges.forEach(function(edge){
      if (edge.source.visible) {
        visibleLinks.push(edge);
      }
    });
  }
}

function expand() {
  var pos = { x: focus.x, y: focus.y };
  focus.incomingEdges.forEach(function (edge) {
    pos.x++;
    pos.y++;
    showEntity(edge.source, focus);
  });
  focus.outgoingEdges.forEach(function(edge){
    pos.x++;
    pos.y++;
    showEntity(edge.target, focus);
  });
  redraw();
  force.resume();
}

// init svg
d3.select("#background").call(d3.behavior.zoom().on("zoom", rescale));
var visualization = d3.select('#visualization');
expandElement.on("click", expand);

// init force layout
var force = d3.layout.force()
  .size([width, height])
  .linkDistance(0)
  .charge(-200)
  .on("tick", tick);

visibleEntities = force.nodes();
visibleLinks = [];

var drag = force.drag()
  .on("drag", function (d, i) {
    force.resume();
    d.dragMoved = true;
}).on("dragstart", function (d) {
//    d3.event.sourceEvent.stopPropagation(); // silence other listeners
    focus = null;
    updateFocus();
    d.dragMoved = false;
}).on("dragend", function (d) {
  if(d.dragMoved) {
    force.resume();
  }
  focus = d;
  updateFocus();
});

var entity = visualization.select("#entities").selectAll(".entity");
var link = visualization.select("#links").selectAll(".link");

function tick(e) {
  var k = 0.6 * e.alpha;
  force.nodes().forEach(function (entity) {
    if(!entity.fixed) {
      force.nodes().forEach(function (otherEntity) {
        if(entity !== otherEntity && (entity.px != null) && (otherEntity.px != null)) {
          var dy = otherEntity.py - entity.py;
          if(dy > -repelDistance && dy < repelDistance) {
            var dx = otherEntity.px - entity.px;
            var ady = Math.abs(dy);
            var adx = Math.abs(dx);
            if(adx > ady) {
              var maxShift = (entity.width / 2 + otherEntity.width / 2 - entity.height / 2 - otherEntity.height / 2);
              var shift = Math.min(adx - ady, maxShift);
              if(dx > 0) {
                dx = dx - shift;
              } else {
                dx = dx + shift;
              }
              adx = Math.abs(dx);
            }
            var distSq = adx * adx + ady * ady;
            if (distSq < repelDistance * repelDistance) {
              var f = Math.sqrt(repelDistance * repelDistance / (dx * dx + dy * dy)) - 1;
              entity.x -= dx * f * k;
              entity.y -= dy * f * k;
            }
          }
        }
      });
    }
  });

  link
    .attr("x1", function (d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

  entity
    .attr("x", function (d) { return d.x - (d.width/2) - 600; })
    .attr("y", function (d) { 
      return d.y - 20 - 600; }
    );

  if(focus) {
    positionFocus();
  }
}

var redraw = function () {
  entity = entity.data(visibleEntities, function (d) { return d.id; });
  link = link.data(visibleLinks, function (d) { return d.id; });

  var enteringEntity = entity.enter().insert("svg:svg")
    .attr("class", "entity")
    .attr("width", 200)
    .attr("height", 40)
    .call(drag);

  enteringEntity.append("rect")
    .attr("width", 200)
    .attr("height", 40)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("fill", "url(#entity-gradient)");

  enteringEntity.append("svg:text")
    .attr("class", "text")
    .attr("x", 10)
    .attr("y", 9)
    .attr("dy", 15)
    .attr("color", "white")
    .text(function (d) { return d.text; });

  enteringEntity.select("rect")
    .attr("width", function (d) {
      var text = this.parentNode.lastChild;
      var textWidth = text.getComputedTextLength();
      d.width = Math.max(100, textWidth + 20);
      return d.width;
    });

  entity.exit().remove();

  updateFocus();
  force.start();
};

var graphDataLoaded = function (data) {
  graphData = data;
  graphData.nodesById = {};
  graphData.edgesById = {};
  graphData.nodes.forEach(function (node) {
    graphData.nodesById[node.id] = node;
    node.outgoingEdges = [];
    node.incomingEdges = [];
    node.visible = false;
    node.selected = false;
  });
  for (var edgeType in graphData.edges) {
    var edges = graphData.edges[edgeType];
    edges.forEach(function(edge){
      graphData.edgesById[edge.id] = edge;
      edge.source = graphData.nodesById[edge.from];
      edge.target = graphData.nodesById[edge.to];
      edge.source.outgoingEdges.push(edge);
      edge.target.incomingEdges.push(edge);
    });
  };

  visibleLinks.splice(0, visibleLinks.length);
  visibleEntities.splice(0, visibleEntities.length);
  focus = null;
  if (graphData.startNodeId) {
    var startNode = graphData.nodesById[graphData.startNodeId];
    startNode.visible = true;
    startNode.selected = true;
    startNode.x = startNode.px = 0;
    startNode.y = startNode.py = 0;
    visibleEntities.push(startNode);
    force.nodes(visibleEntities);
    focus = startNode;
  }
  redraw();
};

redraw();

force.start();

var modelUrl = getQueryStringParameter("model");
if (modelUrl) {
  if(!/[\w\d\-\.]*/g.test(modelUrl)) {
    throw new Error("Not sure if url is an XSS attack: "+modelUrl);
  }
  d3.select("body").append("script").attr("src", modelUrl);
}