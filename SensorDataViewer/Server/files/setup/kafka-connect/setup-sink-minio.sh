#!/bin/bash

usage() {
    echo "USAGE: $0 -t topic -b bucket -u endpoint-url [( -D | -T )]" \
        "[-n name] [-R region] [-X object-extension] [-P kafka-connect-port]" \
        "[-A access-key] [-S secret-key]" >&2
    exit 1
}

optparse() {
    while getopts n:t:b:u:R:X:P:hDTA:S: OPT; do
        case $OPT in
        n)
            NAME=$OPTARG
            ;;
        t)
            TOPIC=$OPTARG
            ;;
        b)
            BUCKET=$OPTARG
            ;;
        u)
            ENDPOINT=$OPTARG
            ;;
        R)
            REGION=$OPTARG
            ;;
        X)
            EXTENSION=$OPTARG
            ;;
        P)
            PORT=$OPTARG
            ;;
        D)
            OP="data"
            ;;
        T)
            OP="timestamp"
            ;;
        A)
            ACCESS_KEY=$OPTARG
            ;;
        S)
            SECRET_KEY=$OPTARG
            ;;
        h)
            usage
            ;;
        \?)
            usage
            ;;
        esac
    done

    : "${TOPIC:?The topic name must be specified with the -t option.}"
    : "${BUCKET:?The bucket name must be specified with the -b option.}"
    : "${ENDPOINT:?The endpoint URL must be specified with the -u option.}"
    : "${REGION:=us-east-1}"
    : "${PORT:=8083}"
    : "${OP:=data}"
    : "${NAME:=sink-minio-$OP}"
    if [[ $OP == "data" ]]; then
        : "${EXTENSION:=.jpg}"
    else
        : "${EXTENSION:=-timestamp.txt}"
    fi
    : "${ACCESS_KEY:=$AWS_ACCESS_KEY_ID}"
    : "${SECRET_KEY:=$AWS_SECRET_KEY}"
    : "${ACCESS_KEY:?The access key must be specified with the -A option.}"
    : "${SECRET_KEY:?The secret key must be specified with the -S option.}"
}

common_params() {
    COMMON_PARAMS=$(
        cat <<END_LINE
        "connector.class": "io.confluent.connect.s3.S3SinkConnector",
        "value.converter": "jp.ad.sinet.sinetstream.connect.converters.SinetStreamConverter",
        "format.class": "io.confluent.connect.s3.format.bytearray.ByteArrayFormat",
        "storage.class": "io.confluent.connect.s3.storage.S3Storage",
        "tasks.max": 1,
        "flush.size": "1",
        "format.bytearray.separator": "",
        "partitioner.class": "io.confluent.connect.storage.partitioner.TimeBasedPartitioner",
        "path.format": "'year'=YYYY/'month'=MM/'day'=dd/'hour'=HH",
        "partition.duration.ms": "3600000",
        "timestamp.extractor": "Record",
        "locale": "C",
        "timezone": "Asia/Tokyo",
        "s3.region": "$REGION",
        "s3.bucket.name": "$BUCKET",
        "topics": "$TOPIC",
        "store.url": "$ENDPOINT",
        "aws.access.key.id": "$ACCESS_KEY",
        "aws.secret.access.key": "$SECRET_KEY",
END_LINE
    )
}

register_data_connector() {
    common_params
    curl -f -s -S -X POST -H "Content-Type: application/json" "http://localhost:${PORT}/connectors" -d@- <<EOF >/dev/null
{
  "name": "$NAME" ,
  "config": {
    $COMMON_PARAMS
    "group.id": "$NAME",
    "transforms": "ExtractField,ByteArrayCast",
    "transforms.ExtractField.type":"org.apache.kafka.connect.transforms.ExtractField\$Value",
    "transforms.ExtractField.field":"msg",
    "transforms.ByteArrayCast.type":"jp.ad.sinet.sinetstream.connect.transforms.ByteArrayCast\$Value",
    "format.bytearray.extension": "$EXTENSION"
  }
}
EOF
}

register_timestamp_connector() {
    common_params
    curl -f -s -S -X POST -H "Content-Type: application/json" "http://localhost:${PORT}/connectors" -d@- <<EOF >/dev/null
{
  "name": "$NAME" ,
  "config": {
    $COMMON_PARAMS
    "group.id": "$NAME",
    "transforms": "Timestamp,ExtractField,ByteArrayCast",
    "transforms.Timestamp.type": "jp.ad.sinet.sinetstream.connect.transforms.MicrosecondTimestampConverter\$Value",
    "transforms.Timestamp.field": "tstamp",
    "transforms.Timestamp.format": "yyyy-MM-dd'T'HH:mm:ss.SSS",
    "transforms.Timestamp.target.type": "string",
    "transforms.ExtractField.type": "org.apache.kafka.connect.transforms.ExtractField\$Value",
    "transforms.ExtractField.field": "tstamp",
    "transforms.ByteArrayCast.type": "jp.ad.sinet.sinetstream.connect.transforms.ByteArrayCast\$Value",
    "format.bytearray.extension": "$EXTENSION"
  }
}
EOF
}

optparse "$@"
if [[ $OP == "data" ]]; then
    register_data_connector
else
    register_timestamp_connector
fi
