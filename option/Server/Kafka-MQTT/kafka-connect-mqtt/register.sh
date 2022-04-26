#!/bin/bash

set -e

. .env

: ${KAFKA_TOPIC:?The topic name must be set to KAFKA_TOPIC.}
: ${MQTT_TOPIC:=$KAFKA_TOPIC}

curl -f -s -S -X POST -H "Content-Type: application/json" http://localhost:${REST_PORT:-8083}/connectors -d@- <<EOF > /dev/null
{
  "name": "${CONNECTOR_NAME:-mqtt-source}",
  "config": {
    "connector.class": "com.datamountaineer.streamreactor.connect.mqtt.source.MqttSourceConnector",
    "task.max": "1",
    "name": "${CONNECTOR_NAME:-mqtt-source}",
    "connect.mqtt.kcql": "INSERT INTO $KAFKA_TOPIC SELECT * FROM $KAFKA_TOPIC",
    "connect.mqtt.service.quality": "${MQTT_QOS:-1}",
    "connect.mqtt.converter.throw.on.error": "true",
    "connect.mqtt.hosts": "${MQTT_URL:?The address of the MQTT broker must be set to MQTT_URL.}"
  }
}
EOF
