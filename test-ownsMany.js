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
		  {
		    "id": "role",
		    "from": "source",
		    "to": "target"
		  }
		],
		"ownsOne": [
		],
		"one": [
		],
		"many": [
		],
		"role": [
		]
	},
	"startNodeId": "source"
}

);