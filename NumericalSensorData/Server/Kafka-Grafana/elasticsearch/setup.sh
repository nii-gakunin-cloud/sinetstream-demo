#!/bin/bash


curl -X PUT http://localhost:9200/_index_template/template_1 \
  -H "Content-Type: application/json" \
  -d@- <<EOF
{
  "index_patterns" : ["*"],
  "priority" : 10,
  "template": {
    "settings" : {
        "number_of_shards": 1, 
        "number_of_replicas": 0
    }
  }
}
EOF