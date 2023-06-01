# SHT3xで測定した温度、湿度をサーバに送信する

温湿度センサー([SHT3x](https://sensirion.com/jp/products/product-catalog/?filter_series=370b616d-de4c-469f-a22b-e5e8737481b5))で測定したデータをKafkaブローカに送信します。

## 1. 準備

### 1.1. 前提条件

* Raspberry Pi
  * ここで示す手順は Raspberry Pi OS で動作確認を行っています
* Python
  * 3.8 以降

センサーデータの送信先となる Kafka ブローカが利用可能な状態になっている必要があります。以下に示すいずれかの構成でKafkaブローカを事前に構築してください。

* [NumericalSensorData/Server/Kafka-Grafana](../../Server/Kafka-Grafana/README.md)
* [NumericalSensorData/Server/Kafka-Zabbix](../../Server/Kafka-Zabbix/README.md)
* [option/Server/Kafka](../../../option/Server/Kafka/README.md)

### 1.2. I2Cの有効化

RaspberryPiのI2Cを有効化するために、以下のコマンドを実行してください。

```console
sudo raspi-config nonint do_i2c 0
```

### 1.3. ライブラリのインストール

送信プログラムが利用する Python ライブラリをインストールします。ここではSINETStreamのライブラリに加えて、温度湿度センサー(SHT3x)を利用するためのライブラリ[sensirion-i2c-sht](https://github.com/sensirion/python-i2c-sht)をインストールします。

```console
pip install -U --user sinetstream-kafka sinetstream-cmd sensirion-i2c-sht
```

> 既にインストールしているライブラリとconflictしてしまいエラーとなる場合は [venv](https://docs.python.org/ja/3/library/venv.html) や [pipenv](https://github.com/pypa/pipenv) などの仮想環境の利用を検討してください。また環境によっては `pip` コマンドは `pip3` となっていることがあります。必要に応じて読み替えて下さい。

### 1.4. 設定ファイル

センサーデータ送信プログラムでは[SINETStream](https://www.sinetstream.net/)ライブラリを利用して Kafka ブローカに測定値を送信します。SINETStreamではメッセージブローカのアドレス(brokers)、トピック名(topic)、タイプ(type)などのパラメータを設定ファイル`.sinetstream_config.yml`に記述しておく必要があります。設定ファイルの記述例を以下に示します。

```yaml
sensors:
  topic: sinetstream.sensor
  brokers: kafka.example.org:9092
  type: kafka
  consistency: AT_LEAST_ONCE
```

`brokers` と `topic` の値を実行環境に合せて修正してください。他パラメータなど `.sinetstream_config.yml` の記述方法の詳細については [SINETStream - 設定ファイル](https://www.sinetstream.net/docs/userguide/config.html) を参照してください。設定ファイルは送信スクリプトと同じディレクトリに配置してください。

送信プログラムによりブローカに送られるデータにはセンサー種別と送信元のホスト名が含まれているため全てのセンサータイプ、クライアントで同じトピック名を指定することができます。

## 2. 送信プログラムの実行

以下のコマンドを実行すると１分毎に SHT3x で温度と湿度を測定し、設定ファイル`.sinetstream_config.yml`に指定したKafkaブローカに測定結果を送信します。

```console
./producer-sht3x.py
```

Kafkaブローカには、以下のようなJSONデータが送信されます。

```json
{
  "temperature": 24.1,
  "humidity": 48.4,
  "node": "raspi3b"
}
```

送信データにはセンサーで測定した温度、湿度の値に加えて計測を行ったRaspberry Piのホストに関する情報が含まれます。

送信スクリプトは通常Kafkaブローカに送信するデータを表示しませんが、コマンドライン引数 `-v` を指定することで送信データが表示されるようになります。

```console
$ ./producer-sht3x.py -v
{"temperature": 24.1, "humidity": 48.4, "node": "raspi3b"}
{"temperature": 24.8, "humidity": 47.9, "node": "raspi3b"}
{"temperature": 25.2, "humidity": 47.1, "node": "raspi3b"}
```

センサーの測定間隔を１分以外にしたい場合は、コマンドライン引数 `-I` に測定間隔（秒）を指定してください。例えば測定間隔を５分にする場合は以下のように指定します。

```console
./producer-sht3x.py -I 300
```

## 3. 動作確認

[consumer.py](../../../option/Consumer/NumericalSensorData/text-consumer/consumer.py)を利用することでRaspberryPiから送信したセンサーデータを確認することができます。consumer.pyの実行手順については以下のリンク先を参照してください。

* [option/Consumer/NumericalSensorData/text-consumer/README.md](../../../option/Consumer/NumericalSensorData/text-consumer/README.md)

consumer.pyの設定ファイル `.sinetstream_config.yml` に指定するメッセージブローカのアドレス(brokers)、トピック名(topic)、タイプ(type)には、センサーデータの送信プログラムと同じ値を指定してください。
