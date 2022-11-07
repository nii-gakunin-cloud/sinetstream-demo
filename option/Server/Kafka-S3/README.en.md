# Store messages from the Kafka broker in object storage

Save messages sent to the Kafka broker using SINETStream to object storage such as Amazon S3. To store messages from the Kafka broker in object storage, use [Kafka Connect](https://kafka.apache.org/documentation/#connect).


## 1. Configuration

![System Configuration](system-1.svg)
<!--
```mermaid
flowchart LR
  subgraph P[Producer]
    SS(SINETStream)
  end
  subgraph S[Server]
    B[Kafka Broker]
    KC["Kafka Connect<br>Amazon S3 Sink Connector"]
    M[MinIO]
  end
  S3[("Amazon S3")]

  SS-.->B==>KC==>S3
  KC==>M
```
-->

This section describes the construction procedure when the following object storage is used as the destination for messages.

1. [Amazon S3](https://aws.amazon.com/jp/s3/)
2. [MinIO](https://min.io/) (S3 compatible object storage)

MinIO runs as a container in the same server as Kafka Connect; a configuration using MinIO can also be used as a configuration to store broker messages on the file system.

### 1.1. Version

The version of each software component is listed below.

|Software|Version|
|---|---|
|[Apache Kafka](https://kafka.apache.org/)|3.1.0|
|[Amazon S3 Sink Connector](https://www.confluent.io/hub/confluentinc/kafka-connect-s3)|10.0.7|
|[MinIO](https://min.io/)|RELEASE.2022-04-12T06-55-35Z(*)|

(*) The building procedure shown here uses the latest tag as the container image of MinIO. Therefore, the actual environment may differ from this version.

### 1.2. Prerequisites

The Kafka broker must be available. Please refer to the following procedures and others to build the Kafka broker.

* [option/Server/Kafka](../Kafka/README.en.md)

Kafka Connector is run using [Docker](https://www.docker.com/), [Docker Compose](https://github.com/docker/compose). Please refer to the following links for installation.

* Docker Engine
  * [Install Docker Engine on CentOS](https://docs.docker.com/engine/install/centos/)
  * [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
  * [Install Docker Engine on Debian](https://docs.docker.com/engine/install/debian/)
* Docker Compose
  * [Docker Compose v2 - Where to get Docker Compose](https://github.com/docker/compose#linux)

Docker Engine requires at least version 19.03.0 and Docker Compose requires at least 1.27.1.

## 2. Preparation

### 2.1. Deploying Materials

Place the files in the subdirectory `kafka-connect-s3/` on the node where you will run Kafka Connect.

### 2.2. Setting Parameters

Set parameters as environment variables for the container. Create `.env` in the directory where you placed `docker-compose.yml` and write the parameters there. The parameters are listed in the following table.

|Environment variable name|Required|Description|Example|
|---|---|---|---|
|BROKER_HOSTNAME|&check;|Hostname of the Kafka broker|BROKER_HOSTNAME=kafka.example.org|
|KAFKA_TOPIC|&check;|Topic name|KAFKA_TOPIC=sinetstream.sensor|
|AWS_ACCESS_KEY_ID|&check;|object storage access ID|AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE|
|AWS_SECRET_KEY|&check;|Object Storage Secret Key|AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY|
|S3_BUCKET_NAME|&check;|object storage bucket name|S3_BUCKET_NAME=mybucket|
|S3_REGION|-|Region of object storage<br>Default value: us-east-1|S3_REGION=ap-northeast-1|
|S3_ENDPOINT_URL|-|Object storage endpoint URL|S3_ENDPOINT_URL=http://minio:9000|
|S3_OBJECT_EXTENSION|-|Object Extension<br>Default value: `.bin`|S3_OBJECT_EXTENSION=.jpeg<br>S3_OBJECT_EXTENSION=.json|
|REST_PORT|-|Kafka Connect REST API port number<br>Default value: 8083|REST_PORT=8083|

An example of `.env` description can be found in [kafka-connect-s3/example_dot_env](kafka-connect-s3/example_dot_env). Use it as a template for creating `.env`.



#### 2.2.1. When using Amazon S3

If you use Amazon S3 as a storage destination, please create the bucket specified in `S3_BUCKET_NAME` in advance. It is also required that you have the permission to write objects to the bucket with the access ID specified in `AWS_ACCESS_KEY_ID`.

#### 2.2.2. When using MinIO

Specify `http://minio:9000` for `S3_ENDPOINT_URL`.

The access key and secret key of the MinIO container running on the server are set to the values specified in `AWS_ACCESS_KEY_ID` and `AWS_SECRET_KEY` at startup. A bucket with the name specified in `S3_BUCKET_NAME` will be created at startup.

## 3. Object Storage Format

Messages sent to the Kafka broker by SINETStream consist of data (payload) specified by the user and a timestamp that records the date and time the message was sent. Kafka Connect stores these as separate objects. The name of the stored object will be

* payload
  * topics/{topic name}/year=YYYYY/month=MM/day=dd/hour=HH/{topic name}+{partition}+{offset}.bin
* timestamp
  * topics/{topic name}/year=YYYYY/month=MM/day=dd/hour=HH/{topic name}+{partition}+{offset}-timestamp.txt

The extension `.bin` of the object name corresponding to the payload can be changed with the parameter `S3_OBJECT_EXTENSION` specified in `.env`.

## 4. Building Kafka Connect

### 4.1. Using Amazon S3

![Amazon S3](system-2.svg)
<!--
```mermaid
flowchart LR
  subgraph S[Server]
    subgraph B["Kafka Broker"]
      T([KAFKA_TOPIC])
    end
    KC[Kafka Connect]
  end
  BK[("Amazon S3<br>S3_BUCKET_NAME")]
  T===KC==>BK

  style B y:35
```
-->

#### 4.1.1. Running Containers

Run the following command on the node where you want to run Kafka Connect.

```console
$ docker compose up -d
```

Check the status of the container, making sure that STATUS is ``running``.

```console
$ docker compose ps
NAME                         COMMAND                  SERVICE             STATUS              PORTS
kc-kafka-connect-1           "/etc/confluent/dock…"   kafka-connect       running (healthy)   0.0.0.0:8083->8083/tcp, :::8083->8083/tcp
```

After the container is started, it takes a few minutes for the Kafka Connect startup process to complete; STATUS is `running (starting)` during the Kafka Connect startup process, but becomes `running (healthy)` when the startup process is complete.

If you specify a hostname (not an IP address) as the `BROKER_HOSTNAME` in the `.env` of the Kafka broker, Kafka Connect must be able to resolve the name of the host in its environment. If you specify a hostname that is not registered in DNS, etc. as `BROKER_HOSTNAME`, please make sure to enable name resolution for the Kafka broker by specifying [extra_hosts](https://docs.docker.com/compose/compose-file/compose-file-v3/#extra_hosts) in `docker-compose.yml`. An example of specifying extra_hosts in `docker-compose.yml` is shown below with the modified difference. In this example, an entry for the Kafka broker `kafka.example.org` with IP address `192.168.1.100` is registered in `extra_hosts`.

```diff
@@ -21,6 +21,8 @@ services:
       AWS_SECRET_KEY: $AWS_SECRET_KEY
     ports:
       - "${REST_PORT:-8083}:8083"
+    extra_hosts:
+      - "kafka.example.org:192.168.1.100"
   minio:
     image: minio/minio
     command: server /data
```

#### 4.1.2. Registering connectors

Register connectors according to the parameters set in ``.env``. Run `register.sh` in the same directory as `docker-compose.yml`.

```console
$ . /register.sh
````

Running `register.sh` will register the following two connectors.

* s3-sink-timestamp
* s3-sink-data

You can check the status of the connectors and tasks by running Kafka Connect's REST API.

```console
$ curl -s -X GET http://localhost:8083/connectors | jq .
[
  "s3-sink-timestamp",
  "s3-sink-data"
]
$ curl -s -X GET http://localhost:8083/connectors/s3-sink-data/tasks/0/status  | jq .
{
  "id": 0,
  "state": "RUNNING",
  "worker_id": "kafka-connect:8083"
}
$ curl -s -X GET http://localhost:8083/connectors/s3-sink-timestamp/tasks/0/status  | jq .
{
  "id": 0,
  "state": "RUNNING",
  "worker_id": "kafka-connect:8083"
}
```

If you want to change the ``.env`` parameters and register the connector again, delete the already registered connector. To remove a connector, issue the following command.

```console
$ curl -s -X DELETE http://localhost:8083/connectors/s3-sink-data
$ curl -s -X DELETE http://localhost:8083/connectors/s3-sink-timestamp
```

For more information on Kafka Connect's REST API, see [Connect REST Interface](https://docs.confluent.io/platform/current/connect/references/restapi.html).

### 4.2. Using MinIO

![MinIO](system-3.svg)
<!--
```mermaid
flowchart LR
  subgraph S[Server].
    direction LR
    subgraph B["Kafka Broker"]]
      T([KAFKA_TOPIC])
    T([KAFKA_TOPIC]) end
    KC[Kafka Connect] subgraph
    subgraph M[MinIO].
      BK[S3_BUCKET_NAME] end
    end
  M[MinIO] BK[S3_BUCKET_NAME] end
  T===KC==>BK
```
-->

In addition to Kafka Connect, the container can run MinIO, an S3-compatible object storage.

MinIO objects are stored as files in a subdirectory `data/` created in the directory where docker compose is run. Thus, this configuration can also be used to store broker messages on the file system.

#### 4.2.1. Running the Container

On the node where you want to run Kafka Connect, execute the following command:

```console
$ docker compose --profile minio up -d
```

Check the status of the container, making sure that the STATUS is ``running``.

```console
$ docker compose ps 
NAME                               COMMAND                  SERVICE             STATUS              PORTS
kafka-connect-s3-create-bucket-1   "/bin/sh -c ' /usr/b…"   create-bucket       exited (0)
kafka-connect-s3-kafka-connect-1   "/etc/confluent/dock…"   kafka-connect       running (healthy)   0.0.0.0:8083->8083/tcp, :::8083->8083/tcp
kafka-connect-s3-minio-1           "/usr/bin/docker-ent…"   minio               running (healthy)   0.0.0.0:9000->9000/tcp, :::9000->9000/tcp
```

After the container is started, it takes a few minutes for the Kafka Connect startup process to complete; STATUS is `running (starting)` during the Kafka Connect startup process, but becomes `running (healthy)` when the startup process is complete.

> If you cannot resolve the hostname of the Kafka broker as described in [4.1.1. Running Containers](#411-running-containers), you may need to add `extra_hosts` setting to `docker-compose.yml`.

#### 4.2.2. Registering Connectors

Register connectors according to the parameters set in `.env`. Run `register.sh` in the same directory as `docker-compose.yml`.

```console
$ . /register.sh
````

Running `register.sh` will register the following two connectors.

* s3-sink-timestamp
* s3-sink-data

You can use Kafka Connect's REST API to check the connector registration status, etc. The procedure for calling the REST API is the same as described in "[4.1.2. Registering Connectors](#412-registering-connectors)".

#### 4.2.3. Destination of Objects

Objects saved in MinIO are recorded as files in `data/`, which is created in the directory where the container is executed.

If you have configured messages with the topic name `sinetstream.sensor` to be stored in the bucket name `mybucket`, they will be recorded in the file system where the MinIO container is running with the following directory and file name.

```console
$ tree -d data/
data/
└── mybucket
    └── topics
        └── sinetstream.sensor
            └── year=2022
                └── month=04
                    └── day=18
                        ├── hour=10
                        └── hour=11
$ ls data/mybucket/topics/sinetstream.sensor/year\=2022/month\=04/day\=18/hour\=10/
sinetstream.sensor+0+0000000000-timestamp.txt
sinetstream.sensor+0+0000000000.json
sinetstream.sensor+0+0000000001-timestamp.txt
sinetstream.sensor+0+0000000001.json
sinetstream.sensor+0+0000000002-timestamp.txt
sinetstream.sensor+0+0000000002.json
sinetstream.sensor+0+0000000003-timestamp.txt
sinetstream.sensor+0+0000000003.json
sinetstream.sensor+0+0000000004-timestamp.txt
sinetstream.sensor+0+0000000004.json
```