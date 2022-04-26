# Kafkaブローカのメッセージをオブジェクトストレージに保存する

SINETStreamを利用してKafkaブローカに送信されたメッセージをAmazon S3などのオブジェクトストレージに保存します。Kafkaブローカからメッセージをオブジェクトストレージに保管するために[Kafka Connect](https://kafka.apache.org/documentation/#connect)を利用します。


## 1. 構成

![システム構成](system-1.svg)
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

メッセージの保存先となるオブジェクトストレージとして、以下のものを利用する場合の構築手順を説明します。

1. [Amazon S3](https://aws.amazon.com/jp/s3/)
1. [MinIO](https://min.io/)（S3互換オブジェクトストレージ）

MinIOはKafka Connectと同じサーバ内のコンテナとして実行します。MinIOを利用する構成は、ブローカのメッセージをファイルシステムに保存する構成としても利用できます。

### 1.1. バージョン

各ソフトウェアコンポーネントのバージョンを以下に示します。

|ソフトウェア|バージョン|
|---|---|
|[Apache Kafka](https://kafka.apache.org/)|3.1.0|
|[Amazon S3 Sink Connector](https://www.confluent.io/hub/confluentinc/kafka-connect-s3)|10.0.7|
|[MinIO](https://min.io/)|RELEASE.2022-04-12T06-55-35Z(*)|

(*) ここで示す構築手順では MinIO のコンテナイメージとして latest タグのものを利用しています。そのため実際の構築環境ではこのバージョンと異なる場合があります。

### 1.2. 前提条件

Kafkaブローカが利用可能な状態になっている必要があります。以下に示す手順などを参照してKafkaブローカを構築してください。

* [option/Server/Kafka](../Kafka/README.md)

Kafka Connectorは [Docker](https://www.docker.com/), [Docker Compose](https://github.com/docker/compose)を利用して実行します。以下のリンク先を参考にインストールを行ってください。

* Docker Engine
  * [Install Docker Engine on CentOS](https://docs.docker.com/engine/install/centos/)
  * [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
  * [Install Docker Engine on Debian](https://docs.docker.com/engine/install/debian/)
* Docker Compose
  * [Docker Compose v2 - Where to get Docker Compose](https://github.com/docker/compose#linux)

Docker Engine は 19.03.0 以上、Docker Compose は 1.27.1 以上が必要となります。

## 2. 準備

### 2.1. 資材の配置

サブディレクトリ`kafka-connect-s3/`にあるファイルをKafka Connectを実行するノードに配置してください。

### 2.2. パラメータの設定

コンテナの環境変数としてパラメータの設定を行います。`docker-compose.yml`を配置したディレクトリに `.env` を作成し、そこでパラメータの記述を行ってください。パラメータを次表に示します。

|環境変数名|必須|説明|指定例|
|---|---|---|---|
|BROKER_HOSTNAME|&check;|Kafkaブローカのホスト名|BROKER_HOSTNAME=kafka.example.org|
|KAFKA_TOPIC|&check;|トピック名|KAFKA_TOPIC=sinetstream.sensor|
|AWS_ACCESS_KEY_ID|&check;|オブジェクトストレージのアクセスID|AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE|
|AWS_SECRET_KEY|&check;|オブジェクトストレージのシークレットキー|AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY|
|S3_BUCKET_NAME|&check;|オブジェクトストレージのバケット名|S3_BUCKET_NAME=mybucket|
|S3_REGION||オブジェクトストレージのリージョン<br>デフォルト値: us-east-1|S3_REGION=ap-northeast-1|
|S3_ENDPOINT_URL||オブジェクトストレージのエンドポイントURL|S3_ENDPOINT_URL=http://minio:9000|
|S3_OBJECT_EXTENSION||オブジェクトの拡張子<br>デフォルト値: `.bin`|S3_OBJECT_EXTENSION=.jpeg<br>S3_OBJECT_EXTENSION=.json|
|REST_PORT||Kafka Connect REST APIのポート番号<br>デフォルト値: 8083|REST_PORT=8083|

`.env`の記述例が [kafka-connect-s3/example_dot_env](kafka-connect-s3/example_dot_env) にあります。`.env`を作成する際のテンプレートとして利用してください。



#### 2.2.1. Amazon S3を利用する場合

Amazon S3を保存先とする場合、`S3_BUCKET_NAME`に指定したバケットをあらかじめ作成しておいてください。また`AWS_ACCESS_KEY_ID` に指定したアクセスIDでバケットにオブジェクトを書き込む権限が設定されていることを必要とします。

#### 2.2.2. MinIOを利用する場合

`S3_ENDPOINT_URL`に`http://minio:9000`を指定してください。

サーバで実行するMinIOコンテナのアクセスキー、シークレットキーは、起動時に `AWS_ACCESS_KEY_ID`, `AWS_SECRET_KEY` に指定した値が設定されます。また`S3_BUCKET_NAME` に指定された名前のバケットが起動時に作成されます。

## 3. オブジェクトの保存形式

SINETStreamによってKafkaブローカに送信されたメッセージは、ユーザにより指定されたデータ（ペイロード）と、メッセージの送信日時を記録したタイムスタンプから構成されています。Kafka Connectでメッセージをオブジェクトストレージに保存する場合、これらを別々のオブジェクトとして保存します。保存されるオブジェクトの名前は、次のようになります。

* ペイロード
  * topics/{トピック名}/year=YYYY/month=MM/day=dd/hour=HH/{トピック名}+{パーティション}+{オフセット}.bin
* タイムスタンプ
  * topics/{トピック名}/year=YYYY/month=MM/day=dd/hour=HH/{トピック名}+{パーティション}+{オフセット}-timestamp.txt

ペイロードに対応するオブジェクト名のの拡張子 `.bin` は`.env` で指定するパラメータ `S3_OBJECT_EXTENSION` で変更することができます。

## 4. Kafka Connectの構築

### 4.1. Amazon S3を利用する場合

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

#### 4.1.1. コンテナの実行

Kafka Connectを実行するノードで以下のコマンドを実行してください。

```console
$ docker compose up -d
```

コンテナの状態を確認します。STATUSが`running`となっていることを確認してください。

```console
$ docker compose ps
NAME                         COMMAND                  SERVICE             STATUS              PORTS
kc-kafka-connect-1           "/etc/confluent/dock…"   kafka-connect       running (healthy)   0.0.0.0:8083->8083/tcp, :::8083->8083/tcp
```

コンテナが起動してからKafka Connectの起動処理が完了するまでに数分程度かかります。Kafka Connect の起動処理中は STATUS が `running (starting)`となっていますが、起動処理が完了すると`running (health)`となります。

Kafkaブローカの`.env`に指定した`BROKER_HOSTNAME`の値が（IPアドレスでない）ホスト名の場合、Kafka Connectの環境からそのホストの名前解決が可能である必要があります。DNSなどに登録していないホスト名を`BROKER_HOSTNAME`に指定した場合は`docker-compose.yml`の[extra_hosts](https://docs.docker.com/compose/compose-file/compose-file-v3/#extra_hosts)の指定などを利用してKafkaブローカの名前解決が可能なようにしてください。`docker-compose.yml`にextra_hostsを指定する場合の例を変更差分で以下に示します。この例では Kafkaブローカ `kafka.example.org` のIPアドレス `192.168.1.100`のエントリをextra_hostsに登録しています。

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

#### 4.1.2. コネクタの登録

`.env`に設定されているパラメータに応じたコネクタを登録します。`docker-compose.yml`と同じディレクトリにある `register.sh`を実行してください。

```console
$ ./register.sh
```

`register.sh` を実行すると次の２つのコネクタが登録されます。

* s3-sink-timestamp
* s3-sink-data

コネクタの登録状態やタスクの状態は Kafka Connect のREST API を実行することで確認できます。

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

`.env`のパラメータを変更してコネクタを登録しなおす場合は、登録済のコネクタを削除してください。コネクタを削除するには以下のコマンドを実行してください。

```console
$ curl -s -X DELETE http://localhost:8083/connectors/s3-sink-data
$ curl -s -X DELETE http://localhost:8083/connectors/s3-sink-timestamp
```

Kafka ConnectのREST APIの詳細については[Connect REST Interface](https://docs.confluent.io/platform/current/connect/references/restapi.html)を参照してください。

### 4.2. MinIOを利用する場合

![MinIO](system-3.svg)
<!--
```mermaid
flowchart LR
  subgraph S[Server]
    direction LR
    subgraph B["Kafka Broker"]
      T([KAFKA_TOPIC])
    end
    KC[Kafka Connect]
    subgraph M[MinIO]
      BK[S3_BUCKET_NAME]
    end
  end
  T===KC==>BK
```
-->

Kafka Connectに加えS3互換のオブジェクトストレージ のMinIO をコンテナで実行します。

MinIOのオブジェクトは docker compose を実行したディレクトリに作成されるサブディレクトリ `data/`以下のファイルとして保存されます。このため、この構成を ブローカのメッセージをファイルシステムに保存するために利用することもできます。

#### 4.2.1. コンテナの実行

Kafka Connectを実行するノードで以下のコマンドを実行してください。

```console
$ docker compose --profile minio up -d
```

コンテナの状態を確認します。STATUSが`running`となっていることを確認してください。

```console
$ docker compose ps 
NAME                               COMMAND                  SERVICE             STATUS              PORTS
kafka-connect-s3-create-bucket-1   "/bin/sh -c ' /usr/b…"   create-bucket       exited (0)
kafka-connect-s3-kafka-connect-1   "/etc/confluent/dock…"   kafka-connect       running (healthy)   0.0.0.0:8083->8083/tcp, :::8083->8083/tcp
kafka-connect-s3-minio-1           "/usr/bin/docker-ent…"   minio               running (healthy)   0.0.0.0:9000->9000/tcp, :::9000->9000/tcp
```

コンテナが起動してからKafka Connectの起動処理が完了するまでに数分程度かかります。Kafka Connect の起動処理中は STATUS が `running (starting)`となっていますが、起動処理が完了すると`running (health)`となります。

> [4.1.1. コンテナの実行](#411-コンテナの実行) に記したようにKafkaブローカのホスト名の名前解決が出来ない場合は `docker-compose.yml` に `extra_hosts` の設定を追加するなどの対応が必要となります。

#### 4.2.2. コネクタの登録

`.env`に設定されているパラメータに応じたコネクタを登録します。`docker-compose.yml`と同じディレクトリにある `register.sh`を実行してください。

```console
$ ./register.sh
```

`register.sh` を実行すると次の２つのコネクタが登録されます。

* s3-sink-timestamp
* s3-sink-data

Kafka ConnectのREST APIを利用することで、コネクタの登録状態などを確認することができます。REST APIの呼び出し方法は「[4.1.2. コネクタの登録](#412-コネクタの登録)」に記した手順と同じものになります。

#### 4.2.3. オブジェクトの保存先

MinIOに保存したオブジェクトはコンテナを実行したディレクトリに作成される `data/` にファイルとして記録されます。

トピック名`sinetstream.sensor`のメッセージをバケット名 `mybucket`に保存するように設定した場合、以下のようなディレクトリ、ファイル名で MinIO コンテナを実行しているファイルシステムに記録されます。

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