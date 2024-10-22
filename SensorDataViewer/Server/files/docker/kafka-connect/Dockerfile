FROM eclipse-temurin:11.0.20_8-jdk AS build

RUN mkdir -p /build "$HOME/.gradle"
COPY src /build

WORKDIR /build/sinetstream-serde
RUN ./gradlew jar

WORKDIR /build/sinetstream-converter
RUN --mount=type=secret,id=gradle_secret,dst=/root/.gradle/gradle.properties ./gradlew jar
 
FROM confluentinc/cp-kafka-connect:7.5.1
RUN confluent-hub install --no-prompt confluentinc/kafka-connect-s3:10.5.6 \
 && confluent-hub install --no-prompt confluentinc/kafka-connect-elasticsearch:14.0.10 \
 && confluent-hub install --no-prompt confluentinc/kafka-connect-jdbc:10.7.4 \
 && mkdir -p /usr/share/java/sinetstream
COPY --from=build --chown=appuser:appuser /build/*/build/libs/*.jar /usr/share/java/sinetstream/
