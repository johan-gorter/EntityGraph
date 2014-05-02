/// <reference path="lib/d3.js" />

//TODO:
/*
Touch and scroll in search
search keyboard events
*/

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

// Utility functions

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

var absMaxOne = function (n) {
  return Math.max(-1, Math.min(1, n));
};

var relationTypes = {
  inherits: { // subclass -> superclass
    preferredDx: 0,
    preferredDy: -150, // from below
    dxGrow: 2,
    dxShrink: 2,
    dyGrow: 5, // attract soft: grow=make dy larger (-200 -> -150)
    dyShrink: 100, // repel hard: shrink=make dy smaller (-50 -> -150)
    renderPath: function (fromNode, toNode) {
      var dx = fromNode.x - toNode.x;
      return "M" + toNode.x + "," + (toNode.getBottom() + 10)
        + "l-10,0 l10,-10 l10,10 l-10,0 l0,10 "
        + "l" + dx + ",0 "
        + "L" + fromNode.x + "," + fromNode.getTop();
    }
  },
  one: {
    preferredDx: 200,
    preferredDy: -150,
    dxGrow: 3,
    dxShrink: 1,
    dyGrow: 3,
    dyShrink: 1,
    renderPath: function (fromNode, toNode) {
      var fromX = (fromNode.getRight() - fromNode.width / 4);
      var fromY = fromNode.y;
      var toX = toNode.getLeft() + toNode.width / 4;
      var toY = toNode.y;
      var dx = toX - fromX;
      var dy = toY - fromY;
      var halfY = dy / 2;
      return "M" + fromX + "," + fromY
        + "c 0," + halfY + " " + dx + "," + halfY + " " + dx + "," + dy;
    }
  },
  many: {
    preferredDx: 200,
    preferredDy: 150,
    dxGrow: 3,
    dxShrink: 1,
    dyGrow: 3,
    dyShrink: 1,
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
    preferredDx: -300,
    preferredDy: 0,
    dxGrow: 5,
    dxShrink: 5,
    dyGrow: 10,
    dyShrink: 10,
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
    preferredDx: -100,
    preferredDy: 150,
    dxGrow: 5,
    dxShrink: 5,
    dyGrow: 10,
    dyShrink: 50, // push down hard
    strokeWidth: 2,
    renderPath: function (fromNode, toNode) {
      var dx = toNode.x - fromNode.x;
      var dy = toNode.y - fromNode.y;
      var dxRel = (dx / dy) / (fromNode.width / (2 * fromNode.height));
      var fromY = fromNode.getBottom();
      if (dy < 0) {
        // Abnormal direction
        fromY = fromNode.getTop();
        dxRel = -dxRel;
      }
      var fromX = fromNode.getLeft() + 10 + ((fromNode.width - 20) / 4) * (absMaxOne(dxRel) + 1);
//      dxRel = (dx / dy) / (toNode.width / toNode.height);
//      var toX = toNode.x + ((toNode.width / 2) - 10) * - absMaxOne(dxRel);
//      var toY = toNode.getTop();
      return renderPathWithDiamond(fromX, fromY, toNode.x, toNode.y);
    }
  },
  parts: {
    preferredDx: 0,
    preferredDy: 150,
    dxGrow: 5,
    dxShrink: 5,
    dyGrow: 50, // push down hard
    dyShrink: 10, 
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
    preferredDx: 300,
    preferredDy: 0,
    dxGrow: 50,
    dxShrink: 5,
    dyGrow: 3,
    dyShrink: 3,
    strokeWidth: 10,
    stroke: "url(#role-relation-gradient)",
    renderPathOld: function (fromNode, toNode) {
      var fromX = (fromNode.getLeft());
      var fromY = fromNode.y;
      var toX = toNode.getRight();
      var toY = toNode.y;
      return "M" + (toX + 8) + "," + toY
        + "l0,4 l-8,0 l0,-8 l8,0 l0,4 "
        + "L" + fromX + "," + fromY;
    },
    renderPath: function (fromNode, toNode) {
      var fromX = fromNode.getRight();
      var fromY = fromNode.y;
      var toX = toNode.getLeft();
      var toY = toNode.y;
      var dx = toX - fromX;
      var dy = toY - fromY;
      return "M" + fromX + "," + fromY
        + "c 50,0 " + (dx-50) + "," + dy + " " + dx + "," + dy;
    }
  }
};

// state
var lastBackgroundMousedownPosition = null;
var graphData = { nodes: [], edges: [], startNodeId: null };
var visibleEntities;
var visibleRelations;
var focus = null;

// Elements

var backgroundElement = d3.select("#background");
var focusElement = d3.select("#focus");
var focusBorderElement = d3.select("#focus-border");
var offElement = d3.select("#focus-off");
var expandElement = d3.select("#focus-expand");
var plusElement = d3.select("#focus-expand-plus");
var minusElement = d3.select("#focus-expand-minus");
var pinElement = d3.select("#focus-pin");
var searchAreaElement = d3.select("#search-area");
var visualization = d3.select("#visualization");

var entity = visualization.select("#entities").selectAll(".entity");
var link = visualization.select("#links").selectAll(".link");
var searchResults = d3.select("#search-results").selectAll(".result");

// Helper functions

var updateFocus = function () {
  if(!focus) {
    focusElement.attr("display", "none");
  } else {
    focusElement.attr("display", "");
    focusBorderElement.attr("width", focus.width + 10);
    focusBorderElement.attr("x", -focus.width / 2 - 5);
    pinElement.attr("transform", "translate("+ [-focus.width / 2 + 15, -45]+")");
    offElement.attr("transform", "translate(" + [focus.width / 2 - 15, -45] + ")");
    pinElement.attr("display", focus.fixed ? "" : "none");
    expandElement.attr("transform", "translate(" + [-focus.width / 2 - 30, 0] + ")");
    plusElement.attr("display", focus.expanded ? "none" : "");
    minusElement.attr("display", focus.expanded ? "" : "none");
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
  focusElement.attr("transform", "translate(" + [focus.x, focus.y] + ")");
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

function showRelation(relation) {
  if (!relation.visible) {
    relation.visible = true;
    relation.selected = relation.source.selected && relation.target.selected;
    visibleRelations.push(relation);
  }
}

function showEntity(entity, pos, dx, dy, n) {
  if (!entity.visible) {
    entity.visible = true;
    entity.x = entity.px = pos.x + (dx/2)*(1+n/100)+dy*(n/100);
    entity.y = entity.py = pos.y + (dy/2)*(1+n/100)+dx*(n/100);
    visibleEntities.push(entity);
    entity.incomingRelations.forEach(function(edge){
      if (edge.source.visible) {
        showRelation(edge);
      }
    });
    entity.outgoingRelations.forEach(function(edge){
      if (edge.target.visible) {
        showRelation(edge);
      }
    });
  }
}

function hideRelation(relation) {
  if (relation.visible) {
    relation.visible = false;
    visibleRelations.splice(visibleRelations.indexOf(relation), 1);
  }
}

function expand() {
  focus.expanded = !focus.expanded;
  updateExpanded(focus);
  redraw();
  force.resume();
}

function updateExpanded(d) {
  if (d.expanded) {
    var n = 0;
    d.incomingRelations.forEach(function (edge) {
      n++;
      var type = relationTypes[edge.type];
      showEntity(edge.source, d, -type.preferredDx, -type.preferredDy, n);
    });
    d.outgoingRelations.forEach(function (edge) {
      n++;
      var type = relationTypes[edge.type];
      showEntity(edge.target, d, type.preferredDx, type.preferredDy, n);
    });
  } else {
    markAndSweep();
  }
};

function markAndSweep() {
  visibleEntities.forEach(function (entity) {
    entity.visible = entity.selected;
  });
  visibleEntities.forEach(function (entity) {
    if (entity.expanded) {
      entity.incomingRelations.forEach(function (edge) {
        edge.source.visible = true;
      });
      entity.outgoingRelations.forEach(function (edge) {
        edge.target.visible = true;
      });
    }
  });
  for (var i = 0; i < visibleEntities.length;) {
    var entity = visibleEntities[i];
    if(entity.visible) {
      i++;
    } else {
      visibleEntities.splice(i, 1);
      entity.incomingRelations.forEach(hideRelation);
      entity.outgoingRelations.forEach(hideRelation);
    }
  }
}

function off() {
  focus.fixed = false;
  if(focus.expanded) {
    expand(); // collapse
  }
  focus.selected = false;
  focus = null;
  markAndSweep();
  updateFocus();
  redraw();
  force.resume();
}

function unpin() {
  focus.fixed = false;
  updateFocus();
  force.resume();
  updateFixed(focus);
}

function updateFixed(d) {
  var updated = entity.filter(function (d2) { return d2 === d; });
  if(d.fixed) {
    updated.select(".pin").remove();
    updated.append("path")
      .attr("class", "pin")
      .attr("d", pinPath)
      .attr("fill", "darkred")
      .attr("transform", "scale(0.025) translate(" + (40 * d.width / 2) + " -350) rotate(45)");
  } else {
    updated.select(".pin").remove();
  }
}

// init events
d3.select("#expand-all").on("click", function () {
  visibleEntities.forEach(function (d) {
    if (d.selected && !d.expanded) {
      d.expanded = true;
      updateExpanded(d);
    }
    redraw();
    force.resume();
  });
});
d3.select("#collapse-all").on("click", function () {
  visibleEntities.forEach(function (d) {
    if (d.expanded) {
      d.expanded = false;
    }
    markAndSweep();
    redraw();
  });
});
d3.select("#search")
  .on("focus", function () {
    searchAreaElement.style("display", "");
  })
  .on("blur", function () {
    searchAreaElement.style("display", "none");
  })
  .on("keyup", function () {
    function escapeRegExp(s) {
      return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    var query = new RegExp("\\b"+escapeRegExp(this.value), "g");
    graphData.nodes.forEach(function (d) {
      d.searchHidden = !query.test(d.text);
    });
    searchResults.classed("hidden", function (d) { return d.searchHidden; });
  });
d3.select("#handle-zoom")
  .call(d3.behavior.zoom().on("zoom", rescale))
  .on("dblclick.zoom", null);
expandElement.on("click", expand);
offElement.on("click", off);
pinElement.on("click", unpin);
backgroundElement.on("mousedown", function () {
  lastBackgroundMousedownPosition = {x: d3.event.pageX, y: d3.event.pageY};
}).on("mouseup", function () {
  if(lastBackgroundMousedownPosition && lastBackgroundMousedownPosition.x === d3.event.pageX && lastBackgroundMousedownPosition.y === d3.event.pageY) {
    focus = null;
    updateFocus();
  }
  lastBackgroundMousedownPosition = null;
});;

// init force
var force = d3.layout.force()
  .size([width, height])
  .linkDistance(0)
  .charge(0)
  .gravity(0)
  .friction(0)
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
    d.selected = true;
    d.dragMoved = false;
    d3.event.sourceEvent.stopPropagation();
    redraw();
}).on("dragend", function (d) {
  if (d.dragMoved) {
    d.fixed = true;
    updateFixed(d);
    force.resume();
  }
  focus = d;
  updateFocus();
});

function entitiesRepel(e) {
  // Special repelling behavior
  var k = 0.66 * e.alpha;
  visibleEntities.forEach(function (entity) {
    if (!entity.fixed) {
      visibleEntities.forEach(function (otherEntity) {
        if (entity !== otherEntity
            && (entity.px != null) && (otherEntity.px != null)
            && !(entity.selected && !otherEntity.selected) /*non-selected nodes do not repel selected nodes */) {
          var dy = otherEntity.py - entity.py;
          if (dy > -repelDistance && dy < repelDistance) {
            var dx = otherEntity.px - entity.px;
            dx = dx || 10 * Math.random() - 5;
            dy = dy || 10 * Math.random() - 5;
            var ady = Math.abs(dy);
            var adx = Math.abs(dx);
            if (adx > ady) {
              var maxShift = (entity.width / 2 + otherEntity.width / 2 - entity.height / 2 - otherEntity.height / 2);
              var shift = Math.min(adx - ady, maxShift);
              if (dx > 0) {
                dx = dx - shift;
              } else {
                dx = dx + shift;
              }
              adx = Math.abs(dx);
            }
            var distSq = adx * adx + ady * ady;
            if (distSq < repelDistance * repelDistance) {
              var f = Math.sqrt(repelDistance * repelDistance / distSq) - 1;
              entity.x -= dx * f * k;
              entity.y -= dy * f * k;
            }
          }
        }
      });
    }
  });
};

function edgesAttract(e) {
  // Edge attraction behavior
  var k = 0.005 * e.alpha;
  visibleRelations.forEach(function (relation) {
    var type = relationTypes[relation.type];
    var dx = relation.target.px - relation.source.px;
    var dy = relation.target.py - relation.source.py;
    var diffDx = dx - type.preferredDx;
    var diffDy = dy - type.preferredDy;
    var forceX;
    var forceY;
    if (diffDx > 0) {
      forceX = -diffDx * type.dxShrink * k;
    } else {
      forceX = -diffDx * type.dxGrow * k;
    }
    if (diffDy > 0) {
      forceY = -diffDy * type.dyShrink * k;
    } else {
      forceY = -diffDy * type.dyGrow * k;
    }
    if (!relation.target.fixed && (relation.source.selected || !relation.target.selected)) {
      relation.target.x += forceX;
      relation.target.y += forceY;
    }
    if (!relation.source.fixed && (relation.target.selected || !relation.source.selected)) {
      relation.source.x -= forceX;
      relation.source.y -= forceY;
    }
  });
};

function tick(e) {
  if(e.alpha > 0.05) {
    e.alpha = 0.05; // do not start too fast
  }
  for (var i = 0; i < 10; i++) {
    if(i > 0) {
      visibleEntities.forEach(function (entity) {
        entity.px = entity.x;
        entity.py = entity.y;
      });
    }
    entitiesRepel(e);
    edgesAttract(e);
  }

  // Reposition everything
  link
    .attr("d", function (d) { return relationTypes[d.type].renderPath(d.source, d.target); });

  entity
    .attr("transform", function (d) { return "translate(" + [d.x - (d.width / 2), d.y - d.height / 2] + ")"; });

  if(focus) {
    positionFocus();
  }
}

var redraw = function () {
  entity = entity.data(visibleEntities, function (d) { return d.id; });

  var enteringEntity = entity.enter().insert("g")
    .attr("class", "entity")
    .call(drag);

  enteringEntity.append("rect")
    .attr("width", 200)
    .attr("height", 30)
    .attr("rx", 10)
    .attr("ry", 10);

  enteringEntity.append("svg:text")
    .attr("class", "text")
    .attr("x", 10)
    .attr("y", 4)
    .attr("dy", 15)
    .attr("color", "white")
    .text(function (d) { return d.text; });

  enteringEntity.select("rect")
    .attr("width", function (d) {
      var text = this.parentNode.lastChild;
      var textWidth = text.getComputedTextLength();
      // Cheating here: Making adjustments to the data
      d.width = Math.max(100, textWidth + 20);
      d.height = 30;
      return d.width;
    });

  enteringEntity
    .attr("width", function (d) {
      return d.width;
    });

  entity.select("rect")
    .attr("fill", function (d) {
      return d.selected ? "url(#selected-entity-gradient)" : "url(#entity-gradient)";
    })
    .attr("filter", function (d) {
    return d.expanded ? "url(#shadow)" : "";
  });

  entity.exit().remove();

  link = link.data(visibleRelations, function (d) { return d.id; });

  link.enter().insert("path")
    .attr("stroke-width", function (d) { return relationTypes[d.type].strokeWidth || 2; })
    .attr("stroke", function (d) { return relationTypes[d.type].stroke || "black"; })
    .attr("id", function (d) { return d.id; });

  link.attr("class", function (d) { return "link " + d.type + ((d.source.selected && d.target.selected) ? " selected" : ""); });

  link.exit().remove();

  updateFocus();
  force.start();
};

function showAndFocus(d) {
  if (!d.visible) {
    d.selected = true;
    showEntity(d, { x: 0, y: 0 }, 0, 0, 0);
    redraw();
  }
  focus = d;
  updateFocus();
};

function fillSearchResults() {
  searchResults = searchResults.data(graphData.nodes);

  searchResults.enter()
    .insert("div").attr("class", "result")
    .append("div").attr("class", "result-inner")
    .append("button")
    .text(function (d) { return d.text; })
    .on("mousedown", showAndFocus);
}

var graphDataLoaded = function (data) {
  graphData = data;
  graphData.nodesById = {};
  graphData.edgesById = {};
  graphData.nodes.forEach(function (node) {
    graphData.nodesById[node.id] = node;
    node.height = 30;
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
    node.outgoingRelations = [];
    node.incomingRelations = [];
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
      edge.source.outgoingRelations.push(edge);
      edge.target.incomingRelations.push(edge);
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
  fillSearchResults();
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