# SINETStream demo

Demo packege for SINETStream

## デモパッケージ

[国立情報学研究所](https://www.nii.ac.jp/) [クラウド基盤研究開発センター](https://www.nii.ac.jp/research/centers/ccrd/)では、広域データ収集・解析プログラム開発支援ソフトウェアパッケージ [SINETStream](https://www.sinetstream.net/)を提供しています。

本サイトにおいて、SINETStreamを用いたIoTシステムを構築するための以下のデモパッケージを公開いたしました。

* [numerical sensor data](NumericalSensorData/README.md)
  * 数値センサデータを収集、可視化するIoTシステムを構築することができます。
  Raspberry Piに接続したセンサーで計測した数値をサーバに送信し、[Zabbix](https://www.zabbix.com/)または[Grafana](https://grafana.com/grafana/)で可視化します。
    * Sensor<br>
    SINETStreamライブラリを利用して温度湿度センサー(DHT11/SHT3x)、CO２センサー(SCD41)の計測値をサーバに送信する実装例と手順書を提供します。
    * Server<br>
    [Kafka](https://kafka.apache.org/)ブローカで受信したセンサーの計測値を SINETStreamライブラリを利用して Zabbix/Grafanaでグラフ表示などの可視化を行う手順と資材を提供します。

* [video streaming](VideoStreaming/README.md)
  * 動画像データを収集、加工、可視化するIoTシステムを構築することができます。
  Raspberry Piのカメラで撮影した画像をサーバのGPUノードで処理し、その結果をクライアントで表示するシステムを構築します。
    * Sensor<br>
    画像をサーバに送信するSINETStreamライブラリと実行手順を示します。
    * Server<br>
    Kafkaブローカで受信した画像をSINETStreamライブラリを利用してGPUノードの [OpenPose](https://github.com/CMU-Perceptual-Computing-Lab/openpose)/[YOLOv5](https://docs.ultralytics.com/) で処理する手順と資材を提供します。
    * Viewer<br>
    SINETStreamライブラリを利用してサーバ(Kafkaブローカ)の画像をクライアントで表示する Pythonプログラムと実行手順を示します。

* [option](option/README.md)
  * 本パッケージの任意の設定項目やテストツールなどに関する手順書と資材です。
    * Server<br>
    サーバ部分の任意の設定項目(Kafkaブローカの構築、メッセージの保存、MQTT ([Mosquitto](https://mosquitto.org/))メッセージのKafkaブローカ転送)に関する手順書とその資材を提供します。
    * Producer<br>
    テストデータ(動画ファイルから切り出した画像)をサーバ(Kafkaブローカ)に送信する環境を構築する手順を示します。
    * Consumer<br>
    サーバ(Kafkaブローカ)送られたテキストデータをクライアントで表示する Pythonプログラムと実行手順を示します。

## 関連情報
- SINETStream https://www.sinetstream.net/ <br>
- A. Takefusa, J. Sun, I. Fujiwara, H. Yoshida, K. Aida and C. Pu, <br>
"SINETStream: Enabling Research IoT Applications with Portability, Security and Performance Requirements," <br>
2021 IEEE 45th Annual Computers, Software, and Applications Conference (COMPSAC), 2021, pp. 482-492, doi: 10.1109/COMPSAC51774.2021.00073.<br>

- 国立情報学研究所 クラウド支援室 https://cloud.gakunin.jp/
- モバイルSINET https://www.sinet.ad.jp/wadci
