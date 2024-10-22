FROM eclipse-temurin:11.0.24_8-jdk-focal AS builder

WORKDIR /build/perftool/
COPY sinetstream-java/sample/perftool /build/perftool
RUN ./gradlew build

FROM python:3.12.7-slim-bullseye

RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-11-jre-headless \
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
    && apt-get install -y --no-install-recommends gcc python-dev libffi-dev \
    && pip install --no-cache-dir -U pip setuptools \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get remove -y gcc python-dev \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
COPY scripts/*.py ./
CMD ["./controller.py"]
ENV JAVA_OPTS="--add-opens=java.base/sun.nio.ch=ALL-UNNAMED"
