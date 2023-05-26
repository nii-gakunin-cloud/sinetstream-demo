#!/bin/bash

usage() {
    echo "USAGE: $0 -t topic-prefix [-T table] [-F fields] [-Y table-type] [-D drop-fields]" \
        "[-d db_name] [-u db_user] [-p db_password] [-n name] [-P kafka-connect-port]" >&2
    exit 1
}

optparse() {
    while getopts t:T:F:Y:d:u:p:n:P:D:h OPT; do
        case $OPT in
        n)
            NAME=$OPTARG
            ;;
        t)
            TOPIC_PREFIX=$OPTARG
            ;;
        T)
            TABLE=$OPTARG
            ;;
        F)
            FIELDS=$OPTARG
            ;;
        D)
            DROP_FIELDS=$OPTARG
            ;;
        Y)
            TABLE_TYPE=$OPTARG
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

    : "${TOPIC_PREFIX:?The topic prefix must be specified with the -t option.}"

    : "${DB_NAME:=$POSTGRES_DB}"
    : "${DB_USER:=$POSTGRES_USER}"
    : "${DB_PASSWORD:=$POSTGRES_PASSWORD}"
    : "${DB_NAME:?The database name must be specified with the -d option.}"
    : "${DB_USER:?The database user must be specified with the -u option.}"
    : "${DB_PASSWORD:?The database password must be specified with the -p option.}"
    : "${PORT:=8083}"
    : "${NAME:=source-psql}"
    : "${TABLE:=picamera}"
    : "${TABLE_TYPE:=VIEW}"
    : "${FIELDS:=timestamp:tstamp,path:msg}"
    : "${DROP_FIELDS:=topic}"
}

register_psql_connector() {
    curl -f -s -S -X POST -H "Content-Type: application/json" "http://localhost:$PORT/connectors" -d@- <<EOF >/dev/null
{
  "name": "$NAME",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
    "table.whitelist": "$TABLE",
    "table.types": "$TABLE_TYPE",
    "mode": "timestamp",
    "timestamp.column.name": "timestamp",
    "validate.non.null": "false",
    "connection.url": "jdbc:postgresql://postgres:5432/$DB_NAME",
    "connection.user": "$DB_USER",
    "connection.password": "$DB_PASSWORD",
    "dialect.name": "PostgreSqlDatabaseDialect",
    "value.converter": "jp.ad.sinet.sinetstream.connect.converters.SinetStreamConverter",
    "transforms": "RenameField,DropField,Timestamp,BytesCast",
    "transforms.RenameField.type": "org.apache.kafka.connect.transforms.ReplaceField\$Value",
    "transforms.RenameField.renames": "$FIELDS",
    "transforms.DropField.type": "org.apache.kafka.connect.transforms.ReplaceField\$Value",
    "transforms.DropField.blacklist": "$DROP_FIELDS",
    "transforms.Timestamp.type": "org.apache.kafka.connect.transforms.TimestampConverter\$Value",
    "transforms.Timestamp.target.type": "unix",
    "transforms.Timestamp.unix.precision": "microseconds",
    "transforms.Timestamp.field": "tstamp",
    "transforms.BytesCast.type": "jp.ad.sinet.sinetstream.connect.transforms.ByteArrayCast\$Value",
    "transforms.BytesCast.field": "msg",
    "topic.prefix": "$TOPIC_PREFIX"
  }
}
EOF
}

optparse "$@"
register_psql_connector
