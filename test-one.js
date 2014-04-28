graphDataLoaded(

{
	"type": "Graph",
	"id": "graph1",
	"nodes": [
		{
		"id": "source",
		"text": "Source entity"
		},
		{
		"id": "target",
		"text": "Target entity"
		}
	],
	"edges": {
	  "inherits": [
	  ],
		"ownsMany": [
		],
		"ownsOne": [
		],
		"one": [
		  {
		    "id": "role",
		    "from": "source",
		    "to": "target"
		  }
		],
		"many": [
		],
		"role": [
		]
	},
	"startNodeId": "source"
}

);