/*jslint browser: true, vars: true, indent: 2 */

window.syncLayout = function (graph) {

  "use strict";

  if(!window.Firebase) {
    return;
  }

  function getQueryStringParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  var layoutsRef = new window.Firebase("https://entitygraph.firebaseio.com/layouts/");

  var layout = getQueryStringParameter("layout");
  var baseUrl;

  if(!layout) {
    baseUrl = (location.search ? location.search + "&" : "?") + "layout=";
    layout = "" + new Date().getTime();
    window.history.pushState(null, "", baseUrl + layout);
  } else {
    baseUrl = location.search.substr(location.search.indexOf("layout=")+7);
  }

  window.onpopstate = function (evt) {
    layout = getQueryStringParameter("layout");
    layoutRef.off();
    init();
  };

  function init() {
    layoutRef.on("child_added", function (snapshot) {
      var id = snapshot.name();
      var data = snapshot.val();
      if (id === "title") {
        graph.setTitle(data);
      } else {
        graph.selectNode(id, data);
      }
    });
    layoutRef.on("child_changed", function (snapshot) {
      var id = snapshot.name();
      var data = snapshot.val();
      if (id === "title") {
        graph.setTitle(data);
      } else {
        graph.selectNode(id, data);
      }
    });
    layoutRef.on("child_removed", function (snapshot) {
      var id = snapshot.name();
      graph.hideNode(id);
    });
  }

  graph.registerListener({
    added: function (node) {
      var update = {};
      update[node.id] = {fixed: node.fixed || false, expanded: node.expanded || false, x: node.x, y: node.y};
      layoutRef.update(update);
    },
    removed: function (node) {
      layoutRef.child(node.id).remove();
    },
    updated: function (node) {
      var update = {};
      update[node.id] = { fixed: node.fixed || false, expanded: node.expanded || false , x: node.x, y: node.y };
      layoutRef.update(update);
    },
    titleChanged: function (newTitle) {
      layoutRef.update({title: newTitle});
    },
    createdNew: function () {
      layout = "" + new Date().getTime();
      window.history.pushState(null, "", baseUrl + layout);
      layoutRef.off();
      init();
    }
  });

  var layoutRef = layoutsRef.child(layout);
  init();
};