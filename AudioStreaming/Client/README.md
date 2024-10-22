# 音声データの送受信

SINETStreamを用いて音声データの送受信を行うスクリプトを示します。音声データの録音には[python-sounddevice](https://python-sounddevice.readthedocs.io/)を、音声ファイルの保存には[python-soundfile](https://python-soundfile.readthedocs.io/)を利用します。

## 1. 準備

### 1.1. 前提条件

スクリプトの実行環境からアクセスできるKakfaブローカーが用意されていることを前提条件とします。

### 1.2. ミキサーの設定

Raspberry Piで音声データの送信を行う場合は、以下に示すコマンドを実行してマイクのボリュームを設定してください。

```console
arecord -l                      # デバイス一覧
amixer                          # 現在の状態確認
amixer -D hw:1 sset Mic 100%    # マイクのボリュームを設定する
```

### 1.3. ライブラリのインストール

スクリプトの実行環境を準備します。

以下に示す手順でPythonの仮想環境の作成とライブラリのインストールを行なってください。

```console
python -mvenv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Pythonの実行環境によっては仮想環境の有効化(`source .venv/bin/activate`)を実行したときに`No such file or directory`のようなエラーとなる場合があります。その場合は、以下のように`virtualenv`などを利用して実行環境を準備してください。

```console
pip install --upgrade virtualenv
virtualenv -p python .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 1.4. 設定ファイル

送信先、受信元となるブローカ、トピックなどの情報はSINETStreamの設定ファイル`.sinetstream_config.yml`に記述します。以下に示す記述例の`brokers`, `topic`などのパラメータを利用する環境に応じた値に変更してスクリプトを実行するディレクトリに保存してください。

```yaml
header:
  version: 2
config:
  sound:
    type: kafka
    brokers: kafka.example.org
    topic: sound-topic
    consistency: AT_LEAST_ONCE
```

## 2. 音声データ送受信スクリプトの実行

### 2.1. 音声データの送信

デフォルトのサウンドデバイスで録音を行い、デフォルトのブローカに送信する場合は以下のようにコマンドを実行してください。

```console
./producer.py
```

SINETStreamの設定ファイル`.sinetstream_config.yml`に複数のサービス設定がある場合はどちらを送信対象のブローカとして利用するのかを指定する必要があります。

```console
./producer.py -s sound
```

また録音するサウンドデバイスを選択する場合は `-d` オプションで対象となるデバイスを指定することができます。

```console
./producer.py -d 1
```

サウンドデバイスを特定するためのIDの値は`--list-device`オプションで確認することができます。

```console
$ ./producer.py --list-device
  0 bcm2835 Headphones: - (hw:0,0), ALSA (0 in, 8 out)
> 1 USB PnP Sound Device: Audio (hw:1,0), ALSA (1 in, 0 out)
  2 sysdefault, ALSA (0 in, 128 out)
< 3 default, ALSA (0 in, 128 out)
  4 dmix, ALSA (0 in, 2 out)
```

### 2.2. 音声データの受信

デフォルトのブローカからデータを受信する場合は以下のようにコマンドを実行してください。音声データの受信を終了するにはキーボードで ctrl-c を押してください。受信したデータを音声ファイル`output_{yyyymmddHHMMSS}.flac`に保存します。なお、必ず音声ファイルを分割する仕様のため、ファイル名の`{yyyymmddHHMMSS}`の部分にその音声ファイルが作成された日時を設定し、ファイル名の重複を防ぎます。

```console
$ ./consumer.py

recording start: output_20240401134038.flac
^C
recording finished: output_20240401134038.flac
```

出力先となる音声ファイルの名前を変更する場合は`-f`オプションを指定してください。なお、必ず音声ファイルを分割する仕様によるファイル名の重複を防ぐため、ファイル名（拡張子の前の部分）にその音声ファイルが作成された日時を付与します。

```console
$ ./consumer.py -f sound-01.flac

recording start: sound-01_20240401134038.flac
^C
recording finished: sound-01_20240401134038.flac
```

デフォルトの音声ファイルフォーマットはFLACになっています。他のフォーマットで保存する場合は`--format`オプションを指定してください。

```console
$ ./consumer.py --format wav

recording start: output_20240401134038.wav
^C
recording finished: output_20240401134038.wav
```

SINETStreamの設定ファイル`.sinetstream_config.yml`に複数のサービス設定がある場合は`-s`オプションでどちらのブローカを利用するのか指定する必要があります。

```console
./consumer.py -s sound
```

`./consumer.py`では一定時間毎（分単位以上）の音声データに分割してファイルへ保存します。デフォルトでは１分毎の音声データに分割します。分割する間隔を変更する場合は`--rotation`オプションを指定してください。指定する値は分単位の値となります。

```console
./consumer.py --rotation 2

recording start: output_20240401134038.flac
recording finished: output_20240401134038.flac

recording start: output_20240401134138.flac
recording finished: output_20240401134138.flac

recording start: output_20240401134238.flac
recording finished: output_20240401134238.flac

（以下省略）
```

### 2.3. 音声データの再生

ブローカから受信したデータを直接再生する場合は以下のようにコマンドを実行してください。音声データの再生を終了するにはキーボードで ctrl-c を押してください。

```console
./player.py
```

直接、音声データを再生する場合は、送信側`producer.py`と受信側`player.py`とでブロックサイズなどのパラメータを合わせる必要があります。デフォルトのブロックサイズは`producer.py`, `player.py`ともに`4096`になっています。ブロックサイズを変更する場合は`-b`オプションで指定してください。

送信側のブロックサイズを`8192`に変更する場合は以下のようにコマンドを実行してください。

```console
./producer.py -b 8192
```

受信側のブロックサイズを`8192`に変更する場合は以下のようにコマンドを実行してください。

```console
./player.py -b 8192
```
