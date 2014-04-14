/// <reference path="lib/d3.js" />

// constants
var width = 1200;
var height = 1200;
var repelDistance = 80;
var pinPath = "M150.061,232.739l-67.232,67.868  c-3.363,3.267-5.453,7.898-5.453,12.991c0,9.991,8.083,18.173,17.989,18.173h127.379" +
  "V445.34c0,12.536,10.177,22.711,22.713,22.711  c12.537,0,22.715-10.175,22.715-22.711V331.771h136.46c9.899,0,17.992-8.182,17.992-18.173" +
  "c0-4.993-2.006-9.536-5.269-12.811  l-67.417-68.143V77.375h13.631c12.535,0,22.715-10.177,22.715-22.713c0-12.536-10.18-22.713-22.715-22.713" +
  "H136.432  c-12.536,0-22.713,10.177-22.713,22.713c0,12.537,10.177,22.713,22.713,22.713h13.629V232.739z M231.83,95.548v118.109  " +
  "c0,9.996-8.176,18.172-18.172,18.172c-9.994,0-18.171-8.176-18.171-18.172V95.548c0-9.996,8.177-18.173,18.171-18.173  " +
  "C223.653,77.375,231.83,85.552,231.83,95.548z";

var renderPathWithDiamond = function (fromX, fromY, toX, toY) {
  var dx = toX - fromX;
  var dy = toY - fromY;
  var length = Math.sqrt(dx * dx + dy * dy);
  var ndx = dx / length;
  var ndy = dy / length;
  return "M" + (fromX + 16 * ndx) + "," + (fromY + 16 * ndy)
    + " l" + (-8 * ndx + 4 * ndy) + "," + (-8 * ndy - 4 * ndx)
    + " l" + (-8 * ndx - 4 * ndy) + "," + (-8 * ndy + 4 * ndx)
    + " l" + (8 * ndx - 4 * ndy) + "," + (8 * ndy + 4 * ndx)
    + " l" + (8 * ndx + 4 * ndy) + "," + (8 * ndy - 4 * ndx)
    + " L" + toX + "," + toY;
};

var relationTypes = {
  inherits: { // subclass -> superclass
    preferredDx: 0,
    preferredDy: -100, // from below
    dxGrow: 2,
    dxShrink: 2,
    dyGrow: 100, // repel hard
    dyShrink: 5, // attract
    renderPath: function (fromNode, toNode) {
      var dx = fromNode.x - toNode.x;
      return "M" + toNode.x + "," + (toNode.getBottom() + 10)
        + "l-5,0 l5,-10 l5,10 l-5,0 l0,10 "
        + "l" + dx + ",0 "
        + "L" + fromNode.x + "," + fromNode.getTop();
    }
  },
  one: {
    preferredDx: -200,
    preferredDy: -100,
    dxGrow: 2,
    dxShrink: 2,
    dyGrow: 2,
    dyShrink: 2,
    renderPath: function (fromNode, toNode) {
      var fromX = (fromNode.getLeft() + fromNode.width / 4);
      var fromY = fromNode.y;
      var toX = toNode.getRight() - toNode.width / 4;
      var toY = toNode.y;
      var dx = toX - fromX;
      var dy = toY - fromY;
      var halfY = dy / 2;
      return "M" + fromX + "," + fromY
        + "c 0," + halfY + " " + dx + "," + halfY + " " + dx + "," + dy;
    }
  },
  many: {
    preferredDx: -200,
    preferredDy: 100,
    dxGrow: 2,
    dxShrink: 2,
    dyGrow: 5,
    dyShrink: 5,
    renderPath: function (fromNode, toNode) {
      var fromX = (fromNode.getRight() - 10);
      var toX = toNode.getLeft() + 10;
      var dx = toX - fromX;
      var dy = toNode.y - fromNode.y;
      return "M" + fromX + "," + fromNode.y
        + "c 40,20 " + (dx - 40) + "," + dy + " " + dx + "," + dy;
    }
  },
  ownsOne: {
    preferredDx: 200,
    preferredDy: 0,
    dxGrow: 5,
    dxShrink: 5,
    dyGrow: 10,
    dyShrink: 50, // push down hard
    strokeWidth: 2,
    renderPath: function (fromNode, toNode) {
      var fromX = (fromNode.getRight() - 20);
      var fromY = fromNode.getBottom();
      var toX = toNode.getLeft() + 20;
      var toY = toNode.getTop();
      return renderPathWithDiamond(fromX, fromY, toX, toY);
    }
  },
  ownsMany: {
    preferredDx: 150,
    preferredDy: 150,
    dxGrow: 5,
    dxShrink: 5,
    dyGrow: 10,
    dyShrink: 50, // push down hard
    strokeWidth: 2,
    renderPath: function (fromNode, toNode) {
      var fromX = (fromNode.getRight() - 40);
      var fromY = fromNode.getBottom();
      var toX = toNode.getLeft() + 20;
      var toY = toNode.getTop();
      return renderPathWithDiamond(fromX, fromY, toX, toY);
    }
  },
  parts: {
    preferredDx: 0,
    preferredDy: 150,
    dxGrow: 5,
    dxShrink: 5,
    dyGrow: 10,
    dyShrink: 50, // push down hard
    strokeWidth: 2,
    fill: true,
    renderPath: function (fromNode, toNode) {
      var fromX = (fromNode.getRight() - 40);
      var fromY = fromNode.getBottom();
      var toX = toNode.getLeft() + 20;
      var toY = toNode.getTop();
      return renderPathWithDiamond(fromX, fromY, toX, toY) + "Z";
    }
  },
  role: {
    preferredDx: -200,
    preferredDy: 0,
    dxGrow: 50,
    dxShrink: 5,
    dyGrow: 5,
    dyShrink: 5,
    strokeWidth: 1,
    renderPath: function (fromNode, toNode) {
      var fromX = (fromNode.getLeft());
      var fromY = fromNode.y;
      var toX = toNode.getRight();
      var toY = toNode.y;
      return "M" + (toX + 8) + "," + toY
        + "l0,4 l-8,0 l0,-8 l8,0 l0,4 "
        + "L" + fromX + "," + fromY;
    }
  }
};

// state
var graphData = { nodes: [], edges: [], startNodeId: null };
var visibleEntities;
var visibleRelations;
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

function showEdge(edge) {
  if (!edge.visible) {
    edge.visible = true;
    visibleRelations.push(edge);
  }
}

function showEntity(entity, pos) {
  if (!entity.visible) {
    entity.visible = true;
    entity.x = entity.px = pos.x;
    entity.y = entity.py = pos.y;
    visibleEntities.push(entity);
    entity.incomingEdges.forEach(function(edge){
      if (edge.source.visible) {
        showEdge(edge);
      }
    });
    entity.outgoingEdges.forEach(function(edge){
      if (edge.target.visible) {
        showEdge(edge);
      }
    });
  }
}

function expand() {
  var pos = { x: focus.x, y: focus.y };
  focus.incomingEdges.forEach(function (edge) {
    pos.x++;
    pos.y++;
    showEntity(edge.source, pos);
  });
  focus.outgoingEdges.forEach(function(edge){
    pos.x++;
    pos.y++;
    showEntity(edge.target, pos);
  });
  redraw();
  force.resume();
}

// init svg
d3.select("#background").call(d3.behavior.zoom().on("zoom", rescale));
var visualization = d3.select('#visualization');
expandElement.on("click", expand);

// init force
var force = d3.layout.force()
  .size([width, height])
  .linkDistance(0)
  .charge(0)
  .on("tick", tick);

visibleEntities = force.nodes();
visibleRelations = [];

var drag = force.drag()
  .on("drag", function (d, i) {
    force.resume();
    d.dragMoved = true;
}).on("dragstart", function (d) {
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
    .attr("d", function (d) { return relationTypes[d.type].renderPath(d.source, d.target); });

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
      // Cheating here: Making adjustments to the data
      d.width = Math.max(100, textWidth + 20);
      d.height = 40;
      return d.width;
    });

  entity.exit().remove();

  link = link.data(visibleRelations, function (d) { return d.id; });

  link.enter().insert("path")
    .attr("stroke-width", function (d) { return relationTypes[d.type].strokeWidth || 2; })
    .attr("stroke", "black")
    .attr("id", function (d) { return d.id; })
    .attr("class", "link");

  updateFocus();
  force.start();
};

var graphDataLoaded = function (data) {
  graphData = data;
  graphData.nodesById = {};
  graphData.edgesById = {};
  graphData.nodes.forEach(function (node) {
    graphData.nodesById[node.id] = node;
    node.height = 40;
    node.width = 200;
    node.getBottom = function () {
      return this.y + this.height / 2;
    };
    node.getTop = function () {
      return this.y - this.height / 2;
    };
    node.getLeft = function () {
      return this.x - this.width / 2;
    };
    node.getRight = function () {
      return this.x + this.width / 2;
    };
    node.outgoingEdges = [];
    node.incomingEdges = [];
    node.visible = false;
    node.selected = false;
  });
  for (var edgeType in graphData.edges) {
    var edges = graphData.edges[edgeType];
    edges.forEach(function(edge){
      graphData.edgesById[edge.id] = edge;
      edge.type = edgeType;
      edge.source = graphData.nodesById[edge.from];
      edge.target = graphData.nodesById[edge.to];
      edge.source.outgoingEdges.push(edge);
      edge.target.incomingEdges.push(edge);
    });
  };

  visibleRelations.splice(0, visibleRelations.length);
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