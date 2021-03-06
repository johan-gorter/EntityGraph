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

  var realm = getQueryStringParameter("realm") || getQueryStringParameter("instance") || "default";
  var rootRef = new window.Firebase("https://entitygraph.firebaseio.com/").child(realm);
  var dataRef = rootRef.child("data");
  var folderRef = rootRef.child("folders/root/files");
  var layoutRef;
  var nodesRef;
  var fileRef;

  var layout = getQueryStringParameter("layout");
  var baseUrl;
  var created = null;

  if(!layout) {
    baseUrl = (location.search ? location.search + "&" : "?") + "layout=";
    layout = "" + Math.random().toString(36).substr(2, 6);
    window.history.pushState(null, "", baseUrl + layout);
  } else {
    baseUrl = location.search.substr(0, location.search.indexOf("layout=")+7);
  }

  window.onpopstate = function (evt) {
    layout = getQueryStringParameter("layout");
    graph.clear();
    reset();
  };

  function reset() {
    nodesRef.off();
    fileRef.off();
    init();
  }

  function init() {
    layoutRef = dataRef.child(layout);
    nodesRef = layoutRef.child("nodes");
    fileRef = folderRef.child(layout);
    nodesRef.on("child_added", function (snapshot) {
      var id = snapshot.name();
      var data = snapshot.val();
      graph.selectNode(id, data);
    });
    nodesRef.on("child_changed", function (snapshot) {
      var id = snapshot.name();
      var data = snapshot.val();
      if (id === "title") {
        graph.setTitle(data);
      } else {
        graph.selectNode(id, data);
      }
    });
    nodesRef.on("child_removed", function (snapshot) {
      var id = snapshot.name();
      graph.hideNode(id);
    });

    fileRef.on("value", function (snapshot) {
      if(snapshot.val()) {
        graph.setTitle(snapshot.val().title);
        created = snapshot.val().created;
      } else {
        graph.setTitle("");
        created = new Date().getTime();
      }
    });
  }

  graph.registerListener({
    added: function (node) {
      var update = {};
      update[node.id] = {fixed: node.fixed || false, expanded: node.expanded || false, x: node.x, y: node.y};
      nodesRef.update(update);
    },
    removed: function (node) {
      nodesRef.child(node.id).remove();
    },
    updated: function (node) {
      var update = {};
      update[node.id] = { fixed: node.fixed || false, expanded: node.expanded || false , x: node.x, y: node.y };
      nodesRef.update(update);
    },
    titleChanged: function (newTitle) {
      if(!newTitle) {
        fileRef.remove();
      } else {
        if(!created) {
          created = new Date().getTime();
        }
        fileRef.update({ title: newTitle, created: created });
        fileRef.setPriority(-created);
      }
    },
    createdNew: function () {
      created = new Date().getTime();
      layout = "" + Math.random().toString(36).substr(2, 6);
      window.history.pushState(null, "", baseUrl + layout);
      reset();
    }
  });

  init();
};