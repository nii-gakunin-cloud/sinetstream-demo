#!/bin/bash

set -e

. .env

curl -f -s -S -X POST -H "Content-Type: application/json" http://localhost:${REST_PORT:-8083}/connectors -d@- <<EOF > /dev/null
{
  "name": "es-sink",
  "config": {
    "name": "es-sink",
    "connection.url": "${ES_URL:?The URL to connect to the Elasticsearch must be set to ES_URL.}",
    "topics": "${KAFKA_TOPIC:?The topic name must be set to KAFKA_TOPIC.}",
    "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
    "tasks.max": "1",
    "key.ignore": "true",
    "flush.synchronously": "true",
    "schema.ignore": "true",
    "type.name": "kafka-connect",
    "value.converter": "jp.ad.sinet.sinetstream.connect.converters.SinetStreamConverter",
    "transforms": "Timestamp,Json,Replace,Router",
    "transforms.Json.type": "jp.ad.sinet.sinetstream.connect.transforms.ParseJson\$Value",
    "transforms.Json.field": "msg",
    "transforms.Timestamp.type": "jp.ad.sinet.sinetstream.connect.transforms.MicrosecondTimestampConverter\$Value",
    "transforms.Timestamp.field": "tstamp",
    "transforms.Timestamp.format": "yyyy-MM-dd'T'HH:mm:ss.SSS",
    "transforms.Timestamp.target.type": "string",
    "transforms.Replace.type": "org.apache.kafka.connect.transforms.ReplaceField\$Value",
    "transforms.Replace.renames": "tstamp:@timestamp",
    "transforms.Router.type": "org.apache.kafka.connect.transforms.TimestampRouter"
  }
}
EOF
