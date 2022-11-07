# option

This directory contains procedures and materials related to optional configuration items and testing tools.

* server
  * This directory contains documentation and materials related to optional configuration items for the server part.
    * [Building Kafka Broker](Server/Kafka/README.en.md)
    * [Storing Kafka broker messages in object storage](Server/Kafka-S3/README.en.md)
      * This configuration can also be used to store Kafka broker messages on the file system
    * [Forward MQTT messages to the Kafka broker](Server/Kafka-MQTT/README.en.md)
* Producer
  * Includes a test tool to send test data to the Kafka broker.
    * [Sending an image cut from a video to the server](Producer/VideoStreaming/image-sender/README.en.md)
* Consumer
  * Contains a test tool that reads data from the Kafka broker.
    * [Display text data sent to the broker](Consumer/NumericalSensorData/text-consumer/README.en.md)
