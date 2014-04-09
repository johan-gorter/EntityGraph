graphDataLoaded(

{
	"type": "Graph",
	"id": "graph1",
	"nodes": [
		{
		"id": "EntityDesign_comment",
		"text": "comment"
		},
		{
		"id": "EntityDesign_issue",
		"text": "issue"
		},
		{
		"id": "EntityDesign_issueStatus",
		"text": "issueStatus"
		},
		{
		"id": "EntityDesign_project",
		"text": "project"
		},
		{
		"id": "EntityDesign_user",
		"text": "user"
		}
	],
	"edges": {
		"inherits": [],
		"ownsMany": [
		{
		  "id": "RelationDesign_comments",
		  "from": "EntityDesign_issue",
		  "to": "EntityDesign_comment"
		},
		{
		  "id": "RelationDesign_issues",
		  "from": "EntityDesign_project",
		  "to": "EntityDesign_issue"
		},
		{
		  "id": "RelationDesign_users",
		  "from": "EntityDesign_project",
		  "to": "EntityDesign_user"
		}
		],
		"ownsOne": [],
		"one": [
		{
		  "id": "RelationDesign_by",
		  "from": "EntityDesign_comment",
		  "to": "EntityDesign_user"
		},
		{
		  "id": "RelationDesign_assignee",
		  "from": "EntityDesign_issue",
		  "to": "EntityDesign_user"
		},
		{
		  "id": "RelationDesign_reporter",
		  "from": "EntityDesign_issue",
		  "to": "EntityDesign_user"
		},
		{
		  "id": "RelationDesign_status",
		  "from": "EntityDesign_issue",
		  "to": "EntityDesign_issueStatus"
		}
		],
		"many": []
	},
	"startNodeId": "EntityDesign_project"
}

);