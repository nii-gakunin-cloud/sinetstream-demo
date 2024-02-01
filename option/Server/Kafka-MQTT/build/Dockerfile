FROM confluentinc/cp-kafka-connect:7.4.0

ARG URL_KAFKA_CONNECT_MQTT=https://github.com/lensesio/stream-reactor/releases/download/3.0.1/kafka-connect-mqtt-3.0.1-2.5.0-all.tar.gz

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN mkdir -p /usr/share/java/stream-reactor \
 && ( curl -sL $URL_KAFKA_CONNECT_MQTT | \
      tar xzf - -C /usr/share/java/stream-reactor )