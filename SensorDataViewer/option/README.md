# 選択項目

直接的にはデータの可視化に関係しない選択項目に関する構築に関する資材をこのディレクトリ以下に配置しています。

現在提供している構築手順を以下に示します。

* ブローカに送信されたデータをオブジェクトストレージに保存する
  * Androidセンサーデータをオブジェクトストレージに保存する
    * [Markdown](./Server/Kafka-S3/101-kafka-connect-s3-android.md)
    * [Jupyter Notebook](./Server/Kafka-S3/101-kafka-connect-s3-android.ipynb)
  * Raspberry Piカメラの撮影データをオブジェクトストレージに保存する
    * [Markdown](./Server/Kafka-S3/102-kafka-connect-s3-picamera.md)
    * [Jupyter Notebook](./Server/Kafka-S3/102-kafka-connect-s3-picamera.ipynb)
  * perftool計測結果をオブジェクトストレージに保存する
    * [Markdown](./Server/Kafka-S3/103-kafka-connect-s3-perftool.md)
    * [Jupyter Notebook](./Server/Kafka-S3/103-kafka-connect-s3-perftool.ipynb)

ひとつの構築手順に対してMarkdownとJupyter Notebookを用意してあります。いずれかを用いて構築を行なってください。Jupyter Notebookを利用する場合は、事前にJupyter Notebook実行環境のセットアップが必要となります。詳細は[README - 2.3. Jupyter Notebook](../README.md#23-jupyter-notebook)の説明を参照してください。
