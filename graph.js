/// <reference path="lib/d3.js" />

/*globals d3*/
/*jslint browser: true, vars: true, indent: 2 */

window.createEntityGraph = function (appendTo) {

  "use strict";

  var d3 = window.d3;

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

  // Elements needed after construction phase
  var
    title,
    createNewElement,
    cloneElement,
    expandAllElement,
    collapseAllElement,
    searchElement,
    searchAreaElement,
    searchResultsElement,
    backgroundElement,
    focusElement,
    focusBorderElement,
    offElement,
    expandElement,
    plusElement,
    minusElement,
    pinElement,
    visualization,
    droplocation;

  // Construction phase
  (function () {

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

    function appendCreateNew(button) {
      var svg = button.append("svg")
        .attr("viewBox", "0 0 100 100");
      svg.append("path")
        .attr("d", "M 30,20 l 40,0 l 0,60 l -40,0 z");
    }

    function appendClone(button) {
      var svg = button.append("svg")
        .attr("viewBox", "0 0 100 100");
      svg.append("path")
        .attr("d", "M 20,10 l 40,0 l 0,20 l 20,0 l 0,60 l -40,0 l 0,-60 l 20,0 m -20,40 l -20,0 l 0,-60 l 40,0");
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

    d3.select(appendTo).append("div").attr("class", "svg-defs").call(appendDefs);

    var chart = d3.select(appendTo).append("div").attr("class", "chart");

    title = chart.append("input").attr("type", "text")
      .attr("class", "title");

    createNewElement = chart.append("button")
      .attr("class", "create-new")
      .call(appendCreateNew);
    cloneElement = chart.append("button")
      .attr("class", "clone")
      .call(appendClone);
    expandAllElement = chart.append("button")
      .attr("class", "expand-all")
      .call(appendExpandAll);
    collapseAllElement = chart.append("button")
      .attr("class", "collapse-all")
      .call(appendCollapseAll);
    searchAreaElement = chart.append("div").attr("class", "search-area").attr("style", "display:none");
    searchResultsElement = searchAreaElement.append("div").attr("class", "search-results");
    searchElement = chart.append("input")
      .attr({ "class": "search", type: "text", autocomplete: "off" });
    chart.append("div")
      .attr("class", "search-icon")
      .call(appendSearchIcon);

    var chartSvg = chart.append("svg")
      .attr("preserveAspectRatio", "xMidYMid slice")
      .attr("viewBox", "-600 -600 1200 1200")
      .attr("pointer-events", "all");
    var handleZoom = chartSvg.append("g").attr("class", "handle-zoom");
    backgroundElement = handleZoom.append("rect").attr("class", "background")
      .attr("x", "-600").attr("y", "-600").attr("width", "1200").attr("height", "1200")
      .attr("fill", "transparent");
    visualization = handleZoom.append("g").attr("class", "visualization");

    var relations = visualization.append("g").attr("class", "relations").attr("fill", "none");
    var entities = visualization.append("g").attr("class", "entities");
    droplocation = visualization.append("rect").attr({
      x: "0",
      y: "0",
      width: "200",
      height: "30",
      fill: "none",
      "stroke-width": "3",
      stroke: "#888888",
      rx: "10",
      ry: "10",
      "pointer-events": "none",
      display: "none"
    });

    focusElement = visualization.append("g").attr({ "class": "focus", transform: "translate(0,0)" });

    focusBorderElement = focusElement.append("rect").attr({ "class": "focus-border", x: "-100", y: "-20", width: "200", height: "40", rx: "15", ry: "15", "pointer-events": "none" });
    offElement = focusElement.append("g").attr({ "class": "focus-off", transform: "translate(80,-50)" });
    offElement.append("circle").attr({ cx: "0", cy: "0", r: "20", fill: "rgba(255,255,255,0.5)" });
    offElement.append("path").attr({ "stroke-width": "4", d: "M-10,-10 l20,20 M-10,10 l 20, -20" });

    expandElement = focusElement.append("g").attr({ "class": "focus-expand", transform: "translate(-120,0)" });
    expandElement.append("circle").attr({ cx: "0", cy: "0", r: "20", fill: "rgba(255,255,255,0.5)" });
    plusElement = expandElement.append("path").attr({ "class": "focus-expand-plus", "stroke-width": "4", d: "M -10,0 l 20,0 M 0,-10 l 0,20" });
    minusElement = expandElement.append("path").attr({ "class": "focus-expand-minus", "stroke-width": "4", d: "M -10,0 l 20,0" });

    pinElement = focusElement.append("g").attr({ "class": "focus-pin", transform: "translate(-80,-50)" });
    pinElement.append("circle").attr({ cx: "0", cy: "0", r: "20", fill: "rgba(255,255,255,0.5)" });
    pinElement.append("path").attr({ "class": "pin-path", fill: "#FF4C05", transform: "scale(0.06) translate(-240 -260)", d: pinPath });
    pinElement.append("path").attr({ "stroke-width": "5", stroke: "white", transform: "rotate(45 0 0)", d: "M 0,-18.5 l 0,37" });
    pinElement.append("path").attr({ transform: "rotate(45 0 0)", d: "M 0,-18.5 l 0,37" });

  }());


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

  var renderPathWithArrow = function (fromX, fromY, toX, toY) {
    var dx = toX - fromX;
    var dy = toY - fromY;
    var length = Math.sqrt(dx * dx + dy * dy);
    var ndx = dx / length;
    var ndy = dy / length;
    return "M" + toX + "," + toY
      + " l" + (-8 * ndx - 3 * ndy) + "," + (-8 * ndy + 3 * ndx)
      + " m" + (8 * ndx + 3 * ndy) + "," + (8 * ndy - 3 * ndx)
      + " l" + (-8 * ndx + 3 * ndy) + "," + (-8 * ndy - 3 * ndx)
      + " m" + (8 * ndx - 3 * ndy) + "," + (8 * ndy + 3 * ndx)
      + " l" + -dx + "," + -dy;
  };

  var absMaxOne = function (n) {
    return Math.max(-1, Math.min(1, n));
  };

  var intersectionWithEntity = function (fromX, fromY, entity) {
    var dx = entity.x - fromX;
    var dy = entity.y - fromY;
    var adx = Math.abs(dx);
    var ady = Math.abs(dy);
    var entityWidthHeightRatio = (entity.width - 40) / entity.height; //-40: angle must not be too sharp
    var topOrBottom = adx / ady < entityWidthHeightRatio;
    var toX, toY;
    if(topOrBottom) {
      toX = -dx * (entity.height / 2) / ady;
      toY = dy > 0 ? -entity.height / 2 : entity.height / 2;
      // move away from the rounded borders
      var maxX = entity.width / 2 - 10;
      if(toX > maxX) {
        toX = maxX;
      }
      if(toX < -maxX) {
        toX = -maxX;
      }
    } else {
      toX = dx > 0 ? -entity.width / 2 : entity.width / 2;
      toY = -dy * (entity.width / 2) / adx;
      // move away from the rounded borders
      var maxY = entity.height / 2 - 10;
      if(toY > maxY) {
        toY = maxY;
      }
      if(toY < -maxY) {
        toY = -maxY;
      }
    }
    return [entity.x + toX, entity.y + toY];
  };

  var relationTypes = {
    inherits: {
      // subclass -> superclass
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
      preferredDx: -200,
      preferredDy: -150,
      dxGrow: 1,
      dxShrink: 3,
      dyGrow: 3,
      dyShrink: 1,
      renderPath: function (fromNode, toNode) {
        var fromX = (fromNode.getLeft() + fromNode.width / 4);
        var fromY = fromNode.y;
        var to = intersectionWithEntity(fromX, fromY, toNode);
        return renderPathWithArrow(fromX, fromY, to[0], to[1]);
      }
    },
    many: {
      preferredDx: -200,
      preferredDy: 150,
      dxGrow: 1,
      dxShrink: 3,
      dyGrow: 3,
      dyShrink: 1,
      renderPath: function (fromNode, toNode) {
        var fromX = (fromNode.getLeft() + 10);
        var toX = toNode.getRight() - 10;
        var dx = toX - fromX;
        var dy = toNode.y - fromNode.y;
        return "M" + fromX + "," + fromNode.y
          + "c 40,20 " + (dx - 40) + "," + dy + " " + dx + "," + dy;
      }
    },
    ownsOne: {
      preferredDx: 300,
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
      preferredDx: 100,
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
        if(dy < 0) {
          // Abnormal direction
          fromY = fromNode.getTop();
          dxRel = -dxRel;
        }
        var fromX = fromNode.x + ((fromNode.width - 20) / 4) * (absMaxOne(dxRel) + 1);
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
      renderPath: function (fromNode, toNode) {
        return relationTypes.ownsMany.renderPath(fromNode, toNode) + "Z";
        //      var fromX = (fromNode.getRight() - 40);
        //      var fromY = fromNode.getBottom();
        //      var toX = toNode.getLeft() + 20;
        //      var toY = toNode.getTop();
        //      return renderPathWithDiamond(fromX, fromY, toX, toY) + "Z";
      }
    },
    role: {
      preferredDx: -300,
      preferredDy: 0,
      dxGrow: 5,
      dxShrink: 50,
      dyGrow: 3,
      dyShrink: 3,
      strokeWidth: 10,
      renderPath: function (fromNode, toNode) {
        var fromX = fromNode.getLeft();
        var fromY = fromNode.y;
        var toX = toNode.getRight();
        var toY = toNode.y;
        var dx = toX - fromX;
        var dy = toY - fromY;
        if(dx === 0.0 || dy === 0.0) {
          return "M" + fromX + "," + fromY + " l " + dx + "," + dy + "m 1,1";
        }
        return "M" + fromX + "," + fromY
          + "c -50,0 " + (dx + 50) + "," + dy + " " + dx + "," + dy;
      }
    },
    roleTop: {
      preferredDx: 0,
      preferredDy: -300,
      dxGrow: 3,
      dxShrink: 3,
      dyGrow: 5,
      dyShrink: 50,
      strokeWidth: 10,
      stroke: "url(#role-relation-gradient)",
      renderPath: function (fromNode, toNode) {
        var fromX = fromNode.x;
        var fromY = fromNode.getTop();
        var toX = toNode.x;
        var toY = toNode.getBottom();
        var dx = toX - fromX;
        var dy = toY - fromY;
        return "M" + fromX + "," + fromY
          + "c 0,-50 " + dx + "," + (dy + 50) + " " + dx + "," + dy;
      }
    }
  };

  // state
  var lastBackgroundMousedownPosition = null;
  var graphData = { nodes: [], edges: [], startNodeId: null };
  var visibleEntities;
  var visibleRelations;
  var focus = null;
  var oldSearchValue = "";
  var listener = {
    createdNew: function () {},
    titleChanged: function () {},
    added: function () {},
    removed: function () {},
    updated: function () {}
  };

  // Helper functions

  var makeSnapshot = function () {
    var selected = [], i, e;
    for(i = 0; i < visibleEntities.length; i = i + 1) {
      e = visibleEntities[i];
      if(e.selected) {
        selected.push({ id: e.id, expanded: e.expanded === true, fixed: e.fixed === true, x: e.x, y: e.y });
      }
    }
    return {
      selected: selected,
      focus: focus ? focus.id : null
    };
  };

  var setTitle = function (newTitle) {
    title.property("value", newTitle);
  };

  var clearAll = function () {
    focus = null;
    for(var i = 0; i < visibleEntities.length; i++) {
      visibleEntities[i].selected = false;
    }
    markAndSweep();
  };

  var applySnapshot = function (snapshot) {
    clearAll();
    for(var i = 0; i < snapshot.selected.length; i++) {
      var selected = snapshot.selected[i];
      var node = graphData.nodesById[selected.id];
      if(node) {
        node.selected = true;
        node.x = node.px = selected.x;
        node.y = node.py = selected.y;
        node.expanded = selected.expanded;
        node.fixed = selected.fixed;
        node.visible = true;
        visibleEntities.push(node);
      }
    }
    for(var edgeType in graphData.edges) {
      var edges = graphData.edges[edgeType];
      for(i = 0; i < edges.length; i++) {
        var edge = edges[i];
        if(edge.source.visible && edge.target.visible) {
          showRelation(edge);
        }
      }
    }
    for(i = 0; i < visibleEntities.length; i++) {
      var entity = visibleEntities[i];
      if(entity.expanded) {
        updateExpanded(entity);
      }
    }
    if(snapshot.focus) {
      focus = graphData.nodesById[snapshot.focus];
    }
  };
  var positionFocus = function () {
    focusElement.attr("transform", "translate(" + [focus.x, focus.y] + ")");
  };

  var updateFocus = function () {
    if(!focus) {
      focusElement.attr("display", "none");
    } else {
      focusElement.attr("display", "");
      focusBorderElement.attr("width", focus.width + 10);
      focusBorderElement.attr("x", -focus.width / 2 - 5);
      pinElement.attr("transform", "translate(" + [-focus.width / 2 + 15, -45] + ")");
      offElement.attr("transform", "translate(" + [focus.width / 2 - 15, -45] + ")");
      pinElement.attr("display", focus.fixed ? "" : "none");
      expandElement.attr("transform", "translate(" + [-focus.width / 2 - 30, 0] + ")");
      plusElement.attr("display", focus.expanded ? "none" : "");
      minusElement.attr("display", focus.expanded ? "" : "none");
      positionFocus();
    }
  };

  function getLocalToSVGRatio() {
    var divNode = d3.select(".chart")[0][0];
    var divWidth = divNode.clientWidth;
    var divHeight = divNode.clientHeight;
    var max = Math.max(divWidth, divHeight);
    return 1200 / max;
  }

  function toSVGCoordinates(xy) {
    var divNode = d3.select(".chart")[0][0];
    var divWidth = divNode.clientWidth;
    var divHeight = divNode.clientHeight;
    var max = Math.max(divWidth, divHeight);
    var result = [(xy[0] - divWidth / 2) * 1200 / max + width / 2, (xy[1] - divHeight / 2) * 1200 / max + height / 2];
    return result;
  }

  function rescale() {
    var trans = d3.event.translate;
    var scale = d3.event.scale;
    visualization
      .attr("transform",
        "translate(" + trans + ")"
          + " scale(" + scale + ")");
  }

  function showRelation(relation) {
    if(!relation.visible) {
      relation.visible = true;
      relation.selected = relation.source.selected && relation.target.selected;
      visibleRelations.push(relation);
    }
  }

  function showRelations(entity) {
    entity.incomingRelations.forEach(function (edge) {
      if (edge.source.visible) {
        showRelation(edge);
      }
    });
    entity.outgoingRelations.forEach(function (edge) {
      if (edge.target.visible) {
        showRelation(edge);
      }
    });
  }

  function showEntity(entity, pos, dx, dy, n) {
    if(!entity.visible) {
      entity.x = entity.px = pos.x + (dx / 2) * (1 + n / 100) + dy * (n / 100);
      entity.y = entity.py = pos.y + (dy / 2) * (1 + n / 100) + dx * (n / 100);
      entity.visible = true;
      visibleEntities.push(entity);
      showRelations(entity);
    }
  }

  function hideRelation(relation) {
    if(relation.visible) {
      relation.visible = false;
      visibleRelations.splice(visibleRelations.indexOf(relation), 1);
    }
  }

  function markAndSweep() {
    var i;
    visibleEntities.forEach(function (entity) {
      entity.visible = entity.selected;
    });
    visibleEntities.forEach(function (entity) {
      if(entity.expanded) {
        entity.incomingRelations.forEach(function (edge) {
          edge.source.visible = true;
        });
        entity.outgoingRelations.forEach(function (edge) {
          edge.target.visible = true;
        });
      }
    });
    for(i = 0; i < visibleEntities.length; i) {
      var entity = visibleEntities[i];
      if(entity.visible) {
        i = i + 1;
      } else {
        visibleEntities.splice(i, 1);
        entity.incomingRelations.forEach(hideRelation);
        entity.outgoingRelations.forEach(hideRelation);
      }
    }
  }

  function updateExpanded(d) {
    listener.updated(d);
    if(d.expanded) {
      var n = 0;
      d.incomingRelations.forEach(function (edge) {
        n = n + 1;
        var type = relationTypes[edge.type];
        showEntity(edge.source, d, -type.preferredDx, -type.preferredDy, n);
      });
      d.outgoingRelations.forEach(function (edge) {
        n = n + 1;
        var type = relationTypes[edge.type];
        showEntity(edge.target, d, type.preferredDx, type.preferredDy, n);
      });
    } else {
      markAndSweep();
    }
  }

  function expand() {
    focus.expanded = !focus.expanded;
    updateExpanded(focus);
    redraw();
    force.resume();
  }

  function off() {
    focus.fixed = false;
    if(focus.expanded) {
      expand(); // collapse
    }
    focus.selected = false;
    listener.removed(focus);
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
    listener.updated(d);
    var updated = entity.filter(function (d2) { return d2 === d; });
    if(d.fixed) {
      updated.select(".pin").remove();
      updated.append("path")
        .attr("class", "pin")
        .attr("d", pinPath)
        .attr("fill", "#86A102")
        .attr("transform", "scale(0.025) translate(" + (40 * d.width / 2) + " -350) rotate(45)");
    } else {
      updated.select(".pin").remove();
    }
  }

  function createNew() {
    listener.createdNew();
    clearAll();
  }

  function clone() {
    
  }

  function expandAll() {
    visibleEntities.forEach(function (d) {
      if(d.selected && !d.expanded) {
        d.expanded = true;
        updateExpanded(d);
      }
      redraw();
      force.resume();
    });
  }

  function collapseAll() {
    visibleEntities.forEach(function (d) {
      if(d.expanded) {
        d.expanded = false;
        listener.updated(d);
      }
      markAndSweep();
      redraw();
    });
  }

  function snapToGrid(x) {
    return 10 * Math.round(x / 10);
  }

  // init events
  var entity = visualization.select(".entities").selectAll(".entity");
  var link = visualization.select(".relations").selectAll(".link");
  var searchResults = searchResultsElement.selectAll(".result");


  // Top right controls
  title.on("input", function () {
    listener.titleChanged(this.value);
  });
  createNewElement.on("click", createNew);
  cloneElement.on("click", clone);
  expandAllElement.on("click", expandAll);
  collapseAllElement.on("click", collapseAll);
  searchElement.on("focus", function () {
    searchAreaElement.style("display", "");
  })
    .on("blur", function () {
      searchAreaElement.style("display", "none");
    })
    .on("keydown", function () {
      var i, j;
      if(d3.event.keyCode === 40) { /*down*/
        d3.event.preventDefault();
        for(i = 0; i < graphData.nodes.length - 1; i = i + 1) {
          if(graphData.nodes[i].searchActive) {
            for(j = i + 1; j < graphData.nodes.length; j = j + 1) {
              if(!graphData.nodes[j].searchHidden) {
                graphData.nodes[i].searchActive = false;
                graphData.nodes[j].searchActive = true;
                break;
              }
            }
            break;
          }
        }
        searchResults.classed("active", function (d) { return d.searchActive; });
      } else if(d3.event.keyCode === 38) { /*up*/
        d3.event.preventDefault();
        for(i = 1; i < graphData.nodes.length; i = i + 1) {
          if(graphData.nodes[i].searchActive) {
            for(j = i - 1; j >= 0; j = j - 1) {
              if(!graphData.nodes[j].searchHidden) {
                graphData.nodes[i].searchActive = false;
                graphData.nodes[j].searchActive = true;
                break;
              }
            }
            break;
          }
        }
        searchResults.classed("active", function (d) { return d.searchActive; });
      } else if(d3.event.keyCode === 13) { /*enter*/
        d3.event.preventDefault();
        for(i = 0; i < graphData.nodes.length; i = i + 1) {
          if(graphData.nodes[i].searchActive) {
            showAndFocus(graphData.nodes[i]);
            break;
          }
        }
      }
    })
    .on("keyup", function () {

      function escapeRegExp(s) {
        return s.replace(/[\-\/\\\^$*+?.()|\[\]{}]/g, '\\$&');
      }

      if(this.value !== oldSearchValue) {
        oldSearchValue = this.value;
        var query = new RegExp(escapeRegExp(this.value.toLowerCase()));
        var first = true;
        graphData.nodes.forEach(function (d) {
          d.searchHidden = !query.test(d.text.toLowerCase());
          if(d.searchHidden) {
            d.searchActive = false;
          } else {
            d.searchActive = first;
            first = false;
          }
        });
        searchResults.classed("hidden", function (d) { return d.searchHidden; });
        searchResults.classed("active", function (d) { return d.searchActive; });
      }
    });
  d3.select(".handle-zoom")
    .call(d3.behavior.zoom().on("zoom", rescale))
    .on("dblclick.zoom", null);

  // focus controls
  expandElement.on("click", expand);
  offElement.on("click", off);
  pinElement.on("click", unpin);
  backgroundElement.on("mousedown", function () {
    lastBackgroundMousedownPosition = { x: d3.event.pageX, y: d3.event.pageY };
  }).on("mouseup", function () {
    if(lastBackgroundMousedownPosition && lastBackgroundMousedownPosition.x === d3.event.pageX && lastBackgroundMousedownPosition.y === d3.event.pageY) {
      focus = null;
      updateFocus();
    }
    lastBackgroundMousedownPosition = null;
  });

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
      d.dragMoved = true;
      droplocation.attr("display", "");
      droplocation.attr("width", d.width);
      droplocation.attr("height", d.height);
      droplocation.attr("transform", "translate(" + [d.px - (d.width / 2), d.py - (d.height / 2)] + ")");
      d.px = snapToGrid(d.px);
      d.py = snapToGrid(d.py);
    }).on("dragstart", function (d) {
      focus = null;
      updateFocus();
      d.selected = true;
      listener.updated(d);
      d.dragMoved = false;
      d3.event.sourceEvent.stopPropagation();
      redraw();
    }).on("dragend", function (d) {
      if(d.dragMoved) {
        d.fixed = true;
        updateFixed(d);
        force.resume();
      }
      focus = d;
      updateFocus();
      droplocation.attr("display", "none");
    });

  function entitiesRepel(e) {
    // Special repelling behavior
    var k = 2 * e.alpha;
    visibleEntities.forEach(function (entity) {
      if(!entity.fixed) {
        visibleEntities.forEach(function (otherEntity) {
          if(entity !== otherEntity
            && (entity.px != null) && (otherEntity.px != null)
            && !(entity.selected && !otherEntity.selected)) { /*non-selected nodes do not repel selected nodes */
            var dy = otherEntity.py - entity.py;
            if(dy > -repelDistance && dy < repelDistance) {
              var dx = otherEntity.px - entity.px;
              dx = dx || 10 * Math.random() - 5;
              dy = dy || 10 * Math.random() - 5;
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
              if(distSq < repelDistance * repelDistance) {
                var f = Math.sqrt(repelDistance * repelDistance / distSq) - 1;
                entity.x -= dx * f * k;
                entity.y -= dy * f * k;
              }
            }
          }
        });
      }
    });
  }

  function edgesAttract(e) {
    // Edge attraction behavior
    var k = 0.025 * e.alpha;
    visibleRelations.forEach(function (relation) {
      var type = relationTypes[relation.type];
      var dx = relation.target.px - relation.source.px;
      var dy = relation.target.py - relation.source.py;
      var diffDx = dx - type.preferredDx;
      var diffDy = dy - type.preferredDy;
      var forceX;
      var forceY;
      if(diffDx > 0) {
        forceX = -diffDx * type.dxShrink * k;
      } else {
        forceX = -diffDx * type.dxGrow * k;
      }
      if(diffDy > 0) {
        forceY = -diffDy * type.dyShrink * k;
      } else {
        forceY = -diffDy * type.dyGrow * k;
      }
      if(!relation.target.fixed && (relation.source.selected || !relation.target.selected)) {
        relation.target.x += forceX;
        relation.target.y += forceY;
      }
      if(!relation.source.fixed && (relation.target.selected || !relation.source.selected)) {
        relation.source.x -= forceX;
        relation.source.y -= forceY;
      }
    });
  }

  function setPrevious(entity) {
    entity.px = entity.x;
    entity.py = entity.y;
  }

  function tick(e) {
    var i;
    //  if(e.alpha > 0.05) {
    e.alpha = 0.05; // do not start too fast
    //  }
    for(i = 0; i < 10; i = i + 1) {
      if(i > 0) {
        visibleEntities.forEach(setPrevious);
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

  var determineWidth = function (d) {
    var text = d3.select(this.parentNode).select("text")[0][0];
    var textWidth = text.getComputedTextLength();
    textWidth = Math.round(textWidth / 20) * 20;
    // Cheating here: Making adjustments to the data
    d.width = Math.max(110, textWidth + 30);
    d.height = 30;
    return d.width;
  };
  var updateTexts = function () {
    entity.select("text").text(function (d) { return d.text; });
    entity.select("rect").attr("width", determineWidth);
    entity.select(".text").attr("x", function (d) { return (d.width / 2); });
  };
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
      .attr("text-anchor", "middle")
      .attr("x", 10)
      .attr("y", 4)
      .attr("dy", 15)
      .attr("color", "white")
      .text(function (d) { return d.text; });

    enteringEntity.select("rect")
      .attr("width", determineWidth);

    enteringEntity
      .attr("width", function (d) {
        return d.width;
      });

    entity.select("rect")
      .attr("fill", function (d) {
        return d.selected ? "url(#selected-entity-gradient)" : "url(#entity-gradient)";
      })
      .attr("filter", function (d) {
        return d.expanded ? "url(#entity-expanded-shadow)" : "none";
      });
    enteringEntity.select(".text")
      .attr("x", function (d) { return (d.width / 2); });

    entity.exit().remove();

    link = link.data(visibleRelations, function (d) { return d.id; });

    link.enter().insert("path")
      .attr("id", function (d) { return d.id; });

    link
      .attr("stroke-width", function (d) { return relationTypes[d.type].strokeWidth || 2; })
      .attr("stroke", function (d) { return relationTypes[d.type].stroke || "black"; })
      .attr("class", function (d) { return "link " + d.type + (d.mandatory === false ? " optional" : "") + ((d.source.selected && d.target.selected) ? " selected" : ""); });

    link.exit().remove();

    updateFocus();
    force.start();
  };

  function showAndFocus(d) {
    d3.event.preventDefault();
    if(!d.visible) {
      d.selected = true;
      showEntity(d, { x: 0, y: 0 }, 0, 0, 0);
      listener.added(entity);
      redraw();
    }
    focus = d;
    updateFocus();
  }

  function fillSearchResults() {
    searchResults = searchResults.data(graphData.nodes);
    searchResults.select("button").text(function (d) { return d.text; });

    searchResults.enter()
      .insert("div").attr("class", "result")
      .append("div").attr("class", "result-inner")
      .append("button")
      .text(function (d) { return d.text; })
      .on("mousedown", showAndFocus);

    searchResults.exit().remove();
    searchResults.classed("active", function (d) { return d.searchActive; });
  }

  function load(data) {
    var edgeType;
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
    if(graphData.nodes.length > 0) {
      graphData.nodes[0].searchActive = true;
    }
    for(edgeType in graphData.edges) {
      var edges = graphData.edges[edgeType];
      edges.forEach(function (edge) {
        graphData.edgesById[edge.id] = edge;
        edge.type = edgeType;
        edge.source = graphData.nodesById[edge.from];
        edge.target = graphData.nodesById[edge.to];
        edge.source.outgoingRelations.push(edge);
        edge.target.incomingRelations.push(edge);
      });
    }

    visibleRelations.splice(0, visibleRelations.length);
    visibleEntities.splice(0, visibleEntities.length);
  }

  redraw();

  force.start();

  return {
    init: function (data) {
      load(data);
      focus = null;
      if(graphData.startNodeId) {
        var startNode = graphData.nodesById[graphData.startNodeId];
        if (startNode) {
          if(!startNode.visible) {
            startNode.visible = true;
            visibleEntities.push(startNode);
          }
          startNode.selected = true;
          startNode.x = startNode.px = 0;
          startNode.y = startNode.py = 0;
          listener.added(startNode);
          force.nodes(visibleEntities);
          focus = startNode;
        }
      }
      redraw();
      fillSearchResults();
    },

    update: function (newData) {
      var snapshot = makeSnapshot();
      load(newData);
      applySnapshot(snapshot);
      redraw();
      updateTexts();
      tick({});
      fillSearchResults();
      updateFocus();
    },

    // API for syncing

    registerListener: function (onlyListener) {
      listener = onlyListener;
    },

    setTitle: setTitle,

    clear: clearAll,

    selectNode: function (id, data) {
      var node = graphData.nodesById[id];
      if (node) {
        if(!node.visible) {
          node.visible = true;
          visibleEntities.push(node);
          showRelations(node);
        }
        node.selected = true;
        node.expanded = data.expanded;
        node.fixed = data.fixed;
        node.x = node.px = data.x;
        node.y = node.py = data.y;
        if(data.expanded) {
          updateExpanded(node);
        }
        redraw();
        force.resume();
      }
    },

    hideNode: function (id) {
      var node = graphData.nodesById[id];
      if(node && node.selected) {
        node.fixed = false;
        if(node.expanded) {
          node.expanded = false;
          updateExpanded(node);
        }
        focus.selected = false;
        markAndSweep();
        updateFocus();
        redraw();
        force.resume();
      }
    }
  };
};