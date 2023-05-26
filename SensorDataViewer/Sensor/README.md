# データ送信環境の構築

データ送信環境の構築手順は実行環境に応じて以下に示す３つのサブディレクトリに配置されています。必要に応じてそれぞれのディレクトリ以下にある手順書を実行してください。またperftoolをRaspberry Piでカメラデータの送信と合わせて行う場合は`Perftool/`にある手順書ではなく`RaspberryPi/`の手順書を用いて構築を行なってください。カメラデータの送信とperftoolが協調して交互に実行する環境を構築する手順となっています。

* Android端末
  * [Android/](Android/11-setup-android.md)
* Raspberry Pi
  * [RaspberryPi/](RaspberryPi/README.md)
* perftool実行環境
  * [Perftool/](Perftool/README.md)

ひとつの構築手順に対してMarkdownとJupyter Notebookを用意してあります。いずれかを用いて構築を行なってください。Jupyter Notebookを利用する場合は、事前にJupyter Notebook実行環境のセットアップが必要となります。詳細は[README - 2.3. Jupyter Notebook](../README.md#23-jupyter-notebook)の説明を参照してください。
