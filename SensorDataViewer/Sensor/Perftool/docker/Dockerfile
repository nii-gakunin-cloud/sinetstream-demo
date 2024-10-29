FROM eclipse-temurin:17.0.13_11-jdk AS builder

WORKDIR /build/perftool/
COPY sinetstream-java/sample/perftool /build/perftool
RUN sed -i -e '/distributionUrl/s/6.8.3/7.6.4/' gradle/wrapper/gradle-wrapper.properties \
    && ./gradlew build

FROM python:3.13.0-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
COPY  --from=builder /build/perftool/build/distributions/*.tar /opt/
RUN mkdir -p /opt/perftool \
    && tar xf /opt/*.tar -C /opt/perftool --strip-components 1 \
    && rm /opt/*.tar
ENV CMD_PERFTOOL=/opt/perftool/bin/perftool

WORKDIR /perftool
COPY scripts/*.sh /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
COPY scripts/*.txt ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends libffi-dev \
    && pip install --no-cache-dir -r requirements.txt \
    && rm -rf /var/lib/apt/lists/*
COPY scripts/*.py ./
CMD ["./controller.py"]
ENV JAVA_OPTS="--add-opens=java.base/sun.nio.ch=ALL-UNNAMED"
