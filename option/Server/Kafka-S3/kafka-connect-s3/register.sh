#!/bin/bash

set -e

. .env

if [[ -n "$S3_ENDPOINT_URL" ]]; then
STORE_URL="\"store.url\": \"$S3_ENDPOINT_URL\","
else
STORE_URL=""
fi

COMMON_CONFIG=$(cat <<END_LINE
    "connector.class": "io.confluent.connect.s3.S3SinkConnector",
    "value.converter": "jp.ad.sinet.sinetstream.connect.converters.SinetStreamConverter",
    "format.class": "io.confluent.connect.s3.format.bytearray.ByteArrayFormat",
    "storage.class": "io.confluent.connect.s3.storage.S3Storage",
    "tasks.max": 1,
    "flush.size": "1",
    "partitioner.class": "io.confluent.connect.storage.partitioner.TimeBasedPartitioner",
    "path.format": "'year'=YYYY/'month'=MM/'day'=dd/'hour'=HH",
    "partition.duration.ms": "3600000",
    "timestamp.extractor": "Record",
    "locale": "C",
    "timezone": "Asia/Tokyo",
    "s3.region": "${S3_REGION:-us-east-1}",
    "s3.bucket.name": "${S3_BUCKET_NAME:?The bucket name must be set to S3_BUCKET_NAME.}",
    "topics": "${KAFKA_TOPIC:?The topic name must be set to KAFKA_TOPIC.}",
    $STORE_URL
END_LINE
)

curl -f -s -S -X POST -H "Content-Type: application/json" http://localhost:${REST_PORT:-8083}/connectors -d@- <<EOF > /dev/null
{
  "name": "s3-sink-data" ,
  "config": {
    $COMMON_CONFIG
    "group.id": "kafka-connect-s3-sink-data",
    "transforms": "ExtractField,ByteArrayCast",
    "transforms.ExtractField.type":"org.apache.kafka.connect.transforms.ExtractField\$Value",
    "transforms.ExtractField.field":"msg",
    "transforms.ByteArrayCast.type":"jp.ad.sinet.sinetstream.connect.transforms.ByteArrayCast\$Value",
    "format.bytearray.extension": "${S3_OBJECT_EXTENSION:-.bin}"
  }
}
EOF

curl -f -s -S -X POST -H "Content-Type: application/json" http://localhost:${REST_PORT:-8083}/connectors -d@- <<EOF > /dev/null
{
  "name": "s3-sink-timestamp" ,
  "config": {
    $COMMON_CONFIG
    "group.id": "kafka-connect-s3-sink-timestamp",
    "transforms": "Timestamp,ExtractField,ByteArrayCast",
    "transforms.Timestamp.type": "jp.ad.sinet.sinetstream.connect.transforms.MicrosecondTimestampConverter\$Value",
    "transforms.Timestamp.field": "tstamp",
    "transforms.Timestamp.format": "yyyy-MM-dd'T'HH:mm:ss.SSS",
    "transforms.Timestamp.target.type": "string",
    "transforms.ExtractField.type": "org.apache.kafka.connect.transforms.ExtractField\$Value",
    "transforms.ExtractField.field": "tstamp",
    "transforms.ByteArrayCast.type":"jp.ad.sinet.sinetstream.connect.transforms.ByteArrayCast\$Value",
    "format.bytearray.extension": "-timestamp.txt"
  }
}
EOF
