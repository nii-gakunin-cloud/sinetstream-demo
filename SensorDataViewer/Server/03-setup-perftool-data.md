# Perftoolデータの可視化サーバを構築する

## 1. 概要

SINETStreamを利用した性能評価ツールperftoolを[GitHub](https://github.com/nii-gakunin-cloud/sinetstream/tree/main/java/sample/perftool)で公開しています。この構築手順ではperftoolの評価対象となるMQTTサーバとその計測結果を可視化するサーバを構築する手順を示します。

### 1.1. システム構成

システム構成を次図に示します。`server`と示されている枠内がここで示す手順で構築する対象になります。

```mermaid
flowchart LR
  subgraph S1[server]
    K[Kafka]-->DB[("PostgreSQL")]---App["Hasura\nGraphQL Engine"]-->P["NGINX"]
    N[NATS]
  end
  subgraph R["Raspberry Pi"]
    PT["perftool"]
    PT---|"target(MQTT)"|N
    PT-->|"result"|K
  end
  P-->W["Web Browser"]
```

サーバを構成するコンポーネントの簡単な説明を以下に記します。

* [Apache Kafka](https://kafka.apache.org/)
  * 分散型イベントストリーミングプラットフォーム
  * コンポーネント間で統一的なインターフェースによるメッセージ処理を行うために利用する
* [PostgreSQL](https://www.postgresql.org/)
  * リレーショナルデータベース
  * perftoolデータの最終的な保管先として利用する
  * 長期間にわたるデータを可視化するために[TimescaleDB](https://www.timescale.com/)拡張を利用する
* [Hasura](https://hasura.io/)
  * GraphQLエンジン
  * データベースに保管されているperftoolデータを取得するためのインタフェースとして利用する
* [NGINX](https://nginx.org/)
  * Webサーバ
  * perftoolデータを可視化するWebアプリを配信する
  
また、コンポーネント間でのデータを受け渡すために以下のものを利用します。

* [Kafka Connect](https://kafka.apache.org/documentation/#connect)
  * Kafkaブローカと他コンポーネントの間でデータ転送を行うための枠組み
  * Kafkaブローカに送信されたデータをデータベース(PostgreSQL)に保存するために利用する

### 1.2. 前提条件

サーバを構築、実行するために必要となる前提条件を示します。

* docker, docker compose v2
  * サーバを構成するコンテナを実行するために必要となる
* Python, [jinja2 cli](https://github.com/mattrobenolt/jinja2-cli)
  * サーバを構成する各サービスの設定ファイルなどを生成するために必要となる

## 2. パラメータの指定

サーバを構築するために必要となるパラメータを指定します。

### 2.1. 配置場所

サーバを構成する資材を配置するディレクトリを変数`target_dir`に指定してください。

```bash
target_dir=$HOME/srv/sensor-viewer
```

資材を配置するディレクトリを作成します。

```bash
mkdir -p $target_dir
```

### 2.2. サーバ構成

サーバ構成を指定する設定ファイル`00-config.yml`にサーバ構成名`perftool`を追加します。

```bash
mkdir -p ${target_dir}/params
touch ${target_dir}/params/.vars_config.yml
[ ! -f ${target_dir}/params/00-config.yml ] || \
cp ${target_dir}/params/00-config.yml ${target_dir}/params/.vars_config.yml
jinja2 \
    -D new_target=perftool \
    -o ${target_dir}/params/00-config.yml \
    files/template/config/00-config.yml.j2 \
    ${target_dir}/params/.vars_config.yml
```

更新後の設定ファイル`00-config.yml`の記述例を示します。

```yaml
target:
  - perftool
```

### 2.3. Perftool

perftoolに関するパラメータを指定します。

ここでは以下に示す２つのトピック名を指定します。

* 計測結果の送信先となるKafkaのトピック名
* 計測対象となるMQTTブローカのトピック名

perftool計測結果の送信先となるKafkaのトピック名を指定してください。トピック名は英数字または`-`, `_`のみで構成された文字列として下さい。

```bash
perftool_result_topic=perftool-sinetstream-result
```

計測対象となるMQTTブローカのトピック名を指定してください。

計測対象のトピック名は構築するサーバに直接関与するパラメータではありません。そのため指定は必須ではありません。ここで指定した値はセンサーデータを可視化するウェブサイトにてデフォルトの設定値として参照されます。

```bash
perftool_target_topic=perftool-sinetstream-target
```

Perftoolに関するパラメータを保存します。

```bash
cat > ${target_dir}/params/01-perftool.yml <<EOF
perftool:
  result:
    topic: "${perftool_result_topic:?ERROR: データ送信先となるトピック名が指定されていません}"
  target:
    topic: "${perftool_target_topic:-perftool-sinetstream-target}"
EOF
```

設定ファイル`01-perftool.yml`の記述例を示します。

```yaml
perftool:
  result:
    topic: "perftool-sinetstream-result"
  target:
    topic: "perftool-sinetstream-target"
```

### 2.4. Kafka

perftoolデータの送信先となるKafkaブローカに関するパラメータを指定します。

Kafkaブローカのポート番号を指定して下さい。

```bash
kafka_port=9092
```

Kafkaの外部公開ホスト名を指定してください。Raspberry PiからKafkaブローカにアクセスするときは、ここで指定したホスト名（またはIPアドレス）でアクセス出来るように設定する必要があります。

```bash
kafka_host=kafka.example.org
```

指定されたパラメータをファイルに保存します。

```bash
cat > ${target_dir}/params/01-kafka.yml <<EOF
kafka:
  port: ${kafka_port}
  hostname: ${kafka_hostname}
EOF
```

設定ファイル`01-kafka.yml`の記述例を示します。

```yaml
kafka:
  port: 9092
  hostname: 192.168.5.108
```

### 2.5. NATS

MQTTブローカとして利用する[NATS](https://nats.io/)のパラメータを指定します。

MQTTブローカのポート番号を指定して下さい。

```bash
mqtt_port=1883
```

指定されたパラメータをファイルに保存します。

```bash
cat > ${target_dir}/params/01-nats.yml <<EOF
nats:
  mqtt:
    port: ${mqtt_port}
EOF
```

設定ファイル`01-nats.yml`の記述例を示します。

```yaml
nats:
  mqtt:
    port: 1883
```

### 2.6. NGINX

送信されたperftoolのデータを可視化して表示するwebサーバ(NGINX)に関するパラメータを指定します。

webサーバのプロトコルを指定します。`http`または`https`のどちらかの値を指定して下さい。

```bash
www_protocol=https
```

#### 2.6.1. サーバ証明書などの指定

webサーバをhttpsで公開する場合はサーバ証明書と秘密鍵などを指定する必要があります。

> `www_protocol`の値に`http`を指定した場合は、この節をスキップして次の「パラメータの保存」からの手順を進めて下さい。

webサーバのホスト名を指定してください。サーバ証明書の内容と一致するホスト名を指定してください。

```bash
hostname=www.example.org
```

サーバ証明書のパスを指定してください。

```bash
cert_file_path=certs/server.crt
```

サーバ証明書の秘密鍵のパスを指定してください。

```bash
cert_key_path=certs/server.key
```

#### 2.6.2. パラメータの保存

指定されたパラメータをファイルに保存します。

```bash
cat > ${target_dir}/params/01-www.yml <<EOF
www:
  hostname: ${hostname:-localhost}
  protocol: $www_protocol
EOF
```

設定ファイル`01-www.yml`の記述例を示します。

```bash
www:
  hostname: www.example.org
  protocol: https
```

### 2.7. PostgreSQL

perftoolデータを保存するデータベースのパラメータを指定します。

データベース名を指定してください。

```bash
POSTGRES_DB=sensor
```

ユーザ名を指定してください。

```bash
POSTGRES_USER=sensor
```

パスワードを指定してください。

```bash
POSTGRES_PASSWORD=db-pass-00
```

指定されたパラメータをファイルに保存します。

```bash
cat > ${target_dir}/params/01-postgres.yml <<EOF
postgres:
  database: ${POSTGRES_DB}
  user: ${POSTGRES_USER}
  password: ${POSTGRES_PASSWORD}
  url: postgres://${POSTGRES_USER}:$(
      python -c "import urllib.parse; print(urllib.parse.quote('$POSTGRES_PASSWORD'))"
  )@postgres:5432/${POSTGRES_DB}?sslmode=disable
EOF
```

設定ファイル`01-postgres.yml`の記述例を示します。

```yaml
postgres:
  database: sensor
  user: sensor
  password: db-pass-00
  url: postgres://sensor:db-pass-00@postgres:5432/sensor?sslmode=disable
```

## 3. 資材の配置

サーバを構成するための資材の配置を行います。

### 3.1. NATS

NATSの設定ファイルを配置します。

NATSサーバの設定ファイルを配置します。

```bash
mkdir -p ${target_dir}/conf/nats/
cat ${target_dir}/params/*.yml | \
jinja2 --strict \
    -o ${target_dir}/conf/nats/nats-server.conf \
    files/template/nats/nats-server.conf.j2
```

設定ファイル`nats-server.conf`の記述例を示します。

```
server_name: "mqtt1"
port: 4222
jetstream: enabled
mqtt {
  port: 1883
}
```

### 3.2. NGINX

Webサーバとして利用するNGINXの設定ファイルなどを配置します。

NGINXの設定ファイルを配置します。

```bash
mkdir -p ${target_dir}/conf/nginx

cat ${target_dir}/params/*.yml | \
jinja2 --strict \
    -o ${target_dir}/conf/nginx/default.conf \
    files/template/nginx/default.conf.j2 
```

設定ファイル`nginx/default.conf`の記述例を示します。

```
server {
    listen 443 ssl;
    server_name www.example.org;

    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;  # about 40000 sessions
    ssl_session_tickets off;
    ssl_protocols TLSv1.3;
    ssl_prefer_server_ciphers off;
    add_header Strict-Transport-Security "max-age=63072000" always;

    ignore_invalid_headers off;
    client_max_body_size 0;
    proxy_buffering off;

    location /v1/graphql {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;

        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        chunked_transfer_encoding off;

        proxy_pass http://graphql:8080;
    }

    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;

        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        chunked_transfer_encoding off;

        alias /var/www/html/;
        try_files $uri $uri/ /index.html;
    }
}
```

NGINXをHTTPSで公開する場合に必要となるサーバ証明書と秘密鍵を配置します。サーバ証明書とその秘密鍵を指定している場合のみ、ファイルの配置が行われます。

```bash
mkdir -p ${target_dir}/secrets
[ -z "$cert_file_path" ] || cp $cert_file_path ${target_dir}/secrets/CERT_FILE
[ -z "$cert_key_path" ] || cp $cert_key_path ${target_dir}/secrets/CERT_KEY
```

### 3.3. PostgreSQL

データベースに関する設定ファイルなどを配置します。

データベース名、ユーザ名、パスワードなどを記録したファイルを配置します。これらのパラメータは[docker secret](https://docs.docker.com/engine/swarm/secrets/)として管理します。既に設定済みのファイルが存在している場合は既存のファイルが優先され、ファイルへの書き込みは行いません。

```bash
mkdir -p ${target_dir}/secrets

[ -f ${target_dir}/secrets/POSTGRES_DB ] || \
cat > ${target_dir}/secrets/POSTGRES_DB <<EOF
$POSTGRES_DB
EOF

[ -f ${target_dir}/secrets/POSTGRES_USER ] || \
cat > ${target_dir}/secrets/POSTGRES_USER <<EOF
$POSTGRES_USER
EOF

[ -f ${target_dir}/secrets/POSTGRES_PASSWORD ] || \
cat > ${target_dir}/secrets/POSTGRES_PASSWORD <<EOF
$POSTGRES_PASSWORD
EOF
```

データベースの初期投入SQLファイルを配置します。perftoolのデータを記録するテーブルやビューを定義するSQLになっています。

```bash
mkdir -p ${target_dir}/init/sql

cat ${target_dir}/params/*.yml | \
jinja2 --strict \
    -o ${target_dir}/params/.vars_sql.yml \
    files/template/sql/vars_sql.yml.j2

cat ${target_dir}/params/.vars_sql.yml ${target_dir}/params/00-config.yml | \
jinja2 --strict \
    -o ${target_dir}/init/sql/create_table.sql \
    files/template/sql/create_table.sql.j2
```

### 3.4. Hasura

GraphQLサーバとして利用するHasuraのメタデータを配置します。

```bash
mkdir -p ${target_dir}/init/hasura

cp -a files/template/hasura/metadata/* \
    ${target_dir}/init/hasura/

jinja2 --strict \
    -o ${target_dir}/init/hasura/databases/sensor-data/tables/tables.yaml \
    files/template/hasura/tables.yaml.j2 \
    ${target_dir}/params/00-config.yml
```

### 3.5. docker-compose.yml

サーバを構成するコンテナに関する設定ファイルを配置します。

`docker-compose.yml`を配置します。

```bash
cat ${target_dir}/params/*.yml | \
jinja2 --strict \
    -o ${target_dir}/docker-compose.yml \
    files/template/docker/docker-compose.yml.j2
```

設定ファイル`docker-compose.yml`の記述例を示します。

```yaml
services:
  nats:
    image: nats:2.9.15
    restart: always
    ports:
      - ${MQTT_PORT:-1883}:1883
    volumes:
      - ./conf/nats/nats-server.conf:/nats-server.conf
  kafka:
    image: confluentinc/cp-kafka:7.3.3
    restart: always
    volumes:
      - ./data/kafka:/var/lib/kafka/data
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:19092,PUBLIC://${KAFKA_HOSTNAME}:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PUBLIC:PLAINTEXT
    ports:
      - "9092:9092"
    depends_on:
      zookeeper:
        condition: service_healthy
    healthcheck:
      test: nc -z localhost 19092 || exit 1
      interval: 10s
      timeout: 5s
      retries: 3
  zookeeper:
    image: confluentinc/cp-zookeeper:7.3.3
    restart: always
    volumes:
      - ./data/zookeeper/data:/var/lib/zookeeper/data
      - ./data/zookeeper/txn-logs:/var/lib/zookeeper/log
    environment:
      ZOOKEEPER_CLIENT_PORT: "2181"
      KAFKA_OPTS: "-Dzookeeper.4lw.commands.whitelist=ruok"
    healthcheck:
      test: echo ruok | nc localhost 2181 || exit -1
      interval: 10s
      timeout: 5s
      retries: 3
  postgres:
    image: timescale/timescaledb:2.10.1-pg15-oss
    restart: always
    user: "${UID:-1000}:${GID:-1000}"
    volumes:
      - /etc/passwd:/etc/passwd:ro
      - ./init/sql/create_table.sql:/docker-entrypoint-initdb.d/020_create_table.sql:ro
      - ./data/postgres:/var/lib/postgresql/data
    environment:
      POSTGRES_DB_FILE: /run/secrets/POSTGRES_DB
      POSTGRES_USER_FILE: /run/secrets/POSTGRES_USER
      POSTGRES_PASSWORD_FILE: /run/secrets/POSTGRES_PASSWORD
    secrets:
      - POSTGRES_DB
      - POSTGRES_USER
      - POSTGRES_PASSWORD
    healthcheck:
      test: pg_isready -U $(cat $$POSTGRES_USER_FILE) -d $(cat $$POSTGRES_DB_FILE)
      interval: 10s
      timeout: 5s
      retries: 5
  kafka-connect:
    image: harbor.vcloud.nii.ac.jp/sinetstream/kafka-connect:20230408
    restart: always
    environment:
      CONNECT_BOOTSTRAP_SERVERS: kafka:19092
      CONNECT_GROUP_ID: connect-cluster
      CONNECT_CONFIG_STORAGE_TOPIC: connect-configs
      CONNECT_OFFSET_STORAGE_TOPIC: connect-offsets
      CONNECT_STATUS_STORAGE_TOPIC: connect-status
      CONNECT_CONFIG_STORAGE_REPLICATION_FACTOR: '1'
      CONNECT_OFFSET_STORAGE_REPLICATION_FACTOR: '1'
      CONNECT_STATUS_STORAGE_REPLICATION_FACTOR: '1'
      CONNECT_KEY_CONVERTER: org.apache.kafka.connect.storage.StringConverter
      CONNECT_VALUE_CONVERTER: org.apache.kafka.connect.converters.ByteArrayConverter
      CONNECT_REST_ADVERTISED_HOST_NAME: kafka-connect
      CONNECT_REST_PORT: 8083
      CONNECT_PLUGIN_PATH: /usr/share/java,/usr/share/confluent-hub-components
    ports:
      - ${KAFKA_CONNECT_PORT:-8083}:8083
    depends_on:
      kafka:
        condition: service_healthy
  graphql:
    image: hasura/graphql-engine:v2.23.0-ce.cli-migrations-v3
    restart: always
    volumes:
      - ./init/hasura:/hasura-metadata
    environment:
      PG_DATABASE_URL: ${PG_URL}
      HASURA_GRAPHQL_METADATA_DATABASE_URL: ${PG_URL}
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true"
#     HASURA_GRAPHQL_ENABLED_LOG_TYPES: startup, http-log, webhook-log, websocket-log, query-log
#   ports:
#     - 8080:8080
    depends_on:
      postgres:
        condition: service_healthy
  nginx:
    image: harbor.vcloud.nii.ac.jp/sinetstream/sensor-viewer:0.1.4
    ports:
      - "443:443"
    restart: always
    volumes:
      - ./conf/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    secrets:
      - source: CERT_FILE
        target: /etc/nginx/certs/server.crt
      - source: CERT_KEY
        target: /etc/nginx/certs/server.key
    depends_on:
      graphql:
        condition: service_healthy

secrets:
  POSTGRES_DB:
    file: ./secrets/POSTGRES_DB
  POSTGRES_USER:
    file: ./secrets/POSTGRES_USER
  POSTGRES_PASSWORD:
    file: ./secrets/POSTGRES_PASSWORD
  CERT_FILE:
    file: ./secrets/CERT_FILE
  CERT_KEY:
    file: ./secrets/CERT_KEY
```

`docker compose`の環境変数を記した`.env`ファイルを作成します。

```bash
cat ${target_dir}/params/*.yml | \
jinja2 --strict \
    -o ${target_dir}/.env \
    -D uid=$(id -u) -D gid=$(id -g) \
    files/template/docker/dot_env.j2
```

配置したファイルの内容を表示します。

```bash
UID=501
GID=20
PG_URL=postgres://sensor:db-pass-00@postgres:5432/sensor?sslmode=disable
KAFKA_HOSTNAME=www.example.org
```

必要となるディレクトリを作成します。

```bash
mkdir -p ${target_dir}/data/postgres
```

## 4. コンテナの起動

サーバを構成するコンテナを起動します。

利用するコンテナイメージを取得します。

```bash
docker compose --project-directory ${target_dir} pull -q
```

コンテナを起動します。

```bash
docker compose --project-directory ${target_dir} up -d --remove-orphans
```

コンテナの実行状況を確認します。

```bash
docker compose --project-directory ${target_dir} ps
```

## 5. 初期設定

起動したコンテナに対して初期設定を行います。

### 5.1. PostgreSQL

テーブル定義やビュー定義などを記述したSQLファイルを実行します。

```bash
docker compose --project-directory ${target_dir} exec postgres \
    psql -U $POSTGRES_USER -d $POSTGRES_DB \
    -f /docker-entrypoint-initdb.d/020_create_table.sql
```

テーブル定義の変更を反映するためにgraphqlコンテナを再起動します。

```bash
docker compose --project-directory ${target_dir} restart graphql
```

### 5.2. Kafka Connect

Kafkaブローカと他コンポーネントの間でデータの送受信を処理するKafka Connectの設定を行います。

Raspberry PiからKafkaブローカに送信されたカメラ画像のタイムスタンプなどのメタデータをデータベースに保存する設定を行います。

```bash
env POSTGRES_DB=$POSTGRES_DB POSTGRES_USER=$POSTGRES_USER POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
files/setup/kafka-connect/setup-sink-psql.sh -t $perftool_result_topic -n sink-psql-perftool
```

登録状況を確認します。エラーが表示されないことを確認して下さい。`jq`コマンドが利用できない場合は、末尾の`| jq .`の部分をコメントアウトして実行して下さい。

```bash
curl -s http://localhost:8083/connectors/sink-psql-perftool | jq .
```

## 6. perftoolデータの可視化結果の表示

構築したwebサーバにアクセスして可視化結果を表示してみます。次のコマンドを実行すると表示されるアドレスにアクセスして下さい。

```bash
echo "${www_protocol}://${hostname:-localhost}"
```

表示されたアドレスに初めてアクセスすると下図のような設定画面が表示されます。

> 既に初回設定を済ませている場合はグラフ表示画面が表示されます。

![viewer初期画面](img/viewer-001.png)

設定画面で直接各項目を入力することもできますが、サーバ構築時に登録されたデフォルト設定をダウンロードすることもできます。

デフォルト設定をダウンロードする場合は上図の赤丸で示したアイコンを選択して下さい。次図のような画面が表示されます。ドロップダウンリストによりサーバ側に登録された設定内容を選択することができます。初回設定では、サーバ構築時に登録された`default`という設定内容のみが存在しています。

![viewerダウンロード画面](img/viewer-008.png)

ドロップダウンリストで`default`を選択し、画面下部に表示されている`Apply`ボタンをクリックして下さい。次図に示すようにサーバ側に登録されている内容が設定画面に取り込まれます。

![viewer設定画面](img/viewer-009.png)

設定画面の`name`欄に設定名を入力して画面下部の`Save`ボタンをクリックすることで設定内容がWebブラウザに保存されます。その後、次図のようなperftoolデータを可視化する画面が表示されます。

![viewer可視化画面](img/viewer-010.png)

## 7. 送信側の環境構築

perftoolコマンドの計測結果を送信する環境の構築手順については[13-setup-perftool.md](../Sensor/Perftool/13-setup-perftool.md)を参照して下さい。
