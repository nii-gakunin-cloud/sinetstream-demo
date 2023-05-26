#!/bin/bash

usage() {
    echo "USAGE: $0 -t topic [-d db_name] [-u db_user] [-p db_password]" \
        "[-n name] [-P kafka-connect-port]" >&2
    exit 1
}

optparse() {
    while getopts t:d:u:p:n:P:h OPT; do
        case $OPT in
        n)
            NAME=$OPTARG
            ;;
        t)
            TOPIC=$OPTARG
            ;;
        d)
            DB_NAME=$OPTARG
            ;;
        u)
            DB_USER=$OPTARG
            ;;
        p)
            DB_PASSWORD=$OPTARG
            ;;
        P)
            PORT=$OPTARG
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
    : "${DB_NAME:=$POSTGRES_DB}"
    : "${DB_USER:=$POSTGRES_USER}"
    : "${DB_PASSWORD:=$POSTGRES_PASSWORD}"
    : "${DB_NAME:?The database name must be specified with the -d option.}"
    : "${DB_USER:?The database user must be specified with the -u option.}"
    : "${DB_PASSWORD:?The database password must be specified with the -p option.}"
    : "${PORT:=8083}"
    : "${NAME:=sink-psql}"
}

register_psql_connector() {
    curl -f -s -S -X POST -H "Content-Type: application/json" "http://localhost:$PORT/connectors" -d@- <<EOF >/dev/null
{
  "name": "$NAME",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
    "connection.url": "jdbc:postgresql://postgres:5432/$DB_NAME",
    "connection.user": "$DB_USER",
    "connection.password": "$DB_PASSWORD",
    "dialect.name": "PostgreSqlDatabaseDialect",
    "pk.mode": "none",
    "topics": "$TOPIC",
    "value.converter": "jp.ad.sinet.sinetstream.connect.converters.SinetStreamConverter",
    "auto.create": true,
    "transforms": "Timestamp,Cast",
    "transforms.Timestamp.type": "org.apache.kafka.connect.transforms.TimestampConverter\$Value",
    "transforms.Timestamp.field": "tstamp",
    "transforms.Timestamp.target.type": "Timestamp",
    "transforms.Timestamp.unix.precision": "microseconds",
    "transforms.Cast.type": "jp.ad.sinet.sinetstream.connect.transforms.StringCast\$Value",
    "transforms.Cast.field": "msg",
    "errors.tolerance": "all",
    "errors.deadletterqueue.topic.name": "dlq-test_text_001",
    "errors.deadletterqueue.topic.replication.factor": "1",
    "errors.deadletterqueue.context.headers.enable": true
  }
}
EOF
}

optparse "$@"
register_psql_connector
