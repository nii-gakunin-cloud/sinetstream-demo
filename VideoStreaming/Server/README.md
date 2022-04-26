# サーバの構築

ここではGPUによる処理の例として[OpenPose](https://github.com/CMU-Perceptual-Computing-Lab/openpose)と[YOLOv5](https://github.com/ultralytics/yolov5) を利用するシステムの構築手順を示します。構築手順と資材を格納したディレクトリを以下に示します。

* OpenPose
  * [Kafka-OpenPose/README.md](Kafka-OpenPose/README.md)
* YOLOv5
  * [Kafka-YOLO/README.md](Kafka-YOLO/README.md)


OpenPose, YOLOv5 などの画像処理を行わずに Kafka ブローカのみを構築する場合は `../../option/Server/` にある構築手順を参照してください。

* Kafka broker
  * [Kafka/README](../../option/Server/Kafka/README.md)

> Kafka-OpenPose/, Kafka-YOLO/ の手順にも Kafka ブローカの構築手順が含まれています。Kafkaブローカの構築部分については３つの構成いずれも同じ内容となっています。