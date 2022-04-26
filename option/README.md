# option

このディレクトリには任意の設定項目やテストツールなどに関する手順書と資材が含まれています。

* Server
  * サーバ部分の任意の設定項目に関する手順書とその資材が含まれています。
    * [Kafkaブローカの構築](Server/Kafka/README.md)
    * [Kafkaブローカのメッセージをオブジェクトストレージに保存する](Server/Kafka-S3/README.md)
      * この構成はKafkaブローカのメッセージをファイルシステムに保存する場合にも利用できます
    * [MQTTのメッセージをKafkaブローカに転送する](Server/Kafka-MQTT/README.md)
* Producer
  * テストデータをKafkaブローカに送信するテストツールが含まれています。
    * [動画から切り出した画像をサーバに送信する](Producer/VideoStreaming/image-sender/README.md)
* Consumer
  * Kafkaブローカのデータを読み出すテストツールが含まれています。
    * [ブローカに送られたテキストデータを表示する](Consumer/NumericalSensorData/text-consumer/README.md)
