# センサーデータの送信プログラム

センサーデータ送信プログラムのひな型となる実装例を示します。ここでは実際のセンサーデータを送信するのではなく乱数値を測定値とみなして送信する実装となっています。

## 1. 準備

### 1.1. 前提条件

* Python
  * 3.7 以降

センサーデータの送信先となる Kafka ブローカが利用可能な状態になっている必要があります。以下に示すいずれかの構成でKafkaブローカを事前に構築してください。

* [NumericalSensorData/Server/Kafka-Grafana](../../Server/Kafka-Grafana/README.md)
* [NumericalSensorData/Server/Kafka-Zabbix](../../Server/Kafka-Zabbix/README.md)
* [option/Server/Kafka](../../../option/Server/Kafka/README.md)

### 1.2. ライブラリのインストール

送信プログラムが利用する Python ライブラリをインストールします。

```console
$ pip install -U --user sinetstream-cmd sinetstream-kafka sinetstream-mqtt
```

> 既にインストールしているライブラリとconflictしてしまいエラーとなる場合は [venv](https://docs.python.org/ja/3/library/venv.html) や [pipenv](https://github.com/pypa/pipenv) などの仮想環境の利用を検討してください。また環境によっては `pip` コマンドは `pip3` となっていることがあります。必要に応じて読み替えて下さい。

### 1.3. 設定ファイル

センサーデータ送信プログラムでは[SINETStream](https://www.sinetstream.net/)ライブラリを利用して Kafka ブローカに測定値を送信します。SINETStreamではメッセージブローカのアドレス(brokers)、トピック名(topic)、タイプ(type)などのパラメータを設定ファイル`.sinetstream_config.yml`に記述しておく必要があります。設定ファイルの記述例を以下に示します。

```yaml
sensors:
  topic: sinetstream.sensor
  brokers: kafka.example.org:9092
  type: kafka
  consistency: AT_LEAST_ONCE
```

`brokers` と `topic` の値を実行環境に合せて修正してください。他パラメータなど `.sinetstream_config.yml` の記述方法の詳細については [SINETStream - 設定ファイル](https://www.sinetstream.net/docs/userguide/config.html) を参照してください。設定ファイルは送信スクリプトと同じディレクトリに配置してください。

> `.sinetstream_config.yml` の記述例となるファイルが [../example_sinetstream_config.yml](../example_sinetstream_config.yml) にあります。テンプレートとして利用してください。

## 2. 送信プログラムの実行

以下のコマンドを実行するとデータをブローカに１分毎に送信します。送信先となるブローカは設定ファイル`.sinetstream_config.yml`に記述したものになります。

```console
$ ./producer.py
```

Kafkaブローカには、以下のようなJSONデータが送信されます。

```json
{
  "random": 51.2,
  "node": "raspi"
}
```

送信データには測定値に加えて送信元となるRaspberry Piのホストに関する情報が含まれます。

送信スクリプトは通常Kafkaブローカに送信するデータを表示しませんが、コマンドライン引数 `-v` を指定することで送信データが表示されるようになります。

```console
$ ./producer.py -v
{"random": 51.2, "node": "raspi"}
{"random": 49.7, "node": "raspi"}
{"random": 48.1, "node": "raspi"}
```

センサーの測定間隔を１分以外にしたい場合は、コマンドライン引数 `-I` に測定間隔（秒）を指定してください。例えば測定間隔を５分にする場合は以下のように指定します。

```console
$ ./producer.py -I 300
```

## 3. 動作確認

[consumer.py](../../../option/Consumer/NumericalSensorData/text-consumer/consumer.py)を利用することでRaspberryPiから送信したセンサーデータを確認することができます。consumer.pyの実行手順については以下のリンク先を参照してください。

* [option/Consumer/NumericalSensorData/text-consumer/README.md](../../../option/Consumer/NumericalSensorData/text-consumer/README.md)

consumer.pyの設定ファイル `.sinetstream_config.yml` に指定するメッセージブローカのアドレス(brokers)、トピック名(topic)、タイプ(type)には、センサーデータの送信プログラムと同じ値を指定してください。