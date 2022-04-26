FROM python:3-bullseye

WORKDIR /srv

COPY scripts /srv

RUN pip install sinetstream-kafka

CMD ./consumer.py -b $KAFKA_BROKERS -t $KAFKA_TOPIC -A $ZABBIX_ADDR -H $ZABBIX_HOST

ENV KAFKA_BROKERS=localhost:29092
