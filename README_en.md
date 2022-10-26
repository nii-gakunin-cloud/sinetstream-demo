# SINETStream demo

Demo package for SINETStream

[日本語版はこちら。](README.md)

## Demo package

The [National Institute of Informatics](https://www.nii.ac.jp/) [Cloud Infrastructure Research and Development Center](https://www.nii.ac.jp/research/centers/ccrd/) provides a software package [SINETStream](https://www.sinetstream.net/).

The following demo package for building an IoT system using SINETStream is now available on this website.

* [numerical sensor data](NumericalSensorData/README_en.md)
  * [numerical sensor data](NumericalSensorData/README_en.md) allows you to build an IoT system that collects and visualizes numerical sensor data.
  Send numerical values measured by sensors connected to Raspberry Pi to a server and visualize them with [Zabbix](https://www.zabbix.com/) or [Grafana](https://grafana.com/grafana/).
    * Sensor<br>
    Provides example implementation and instructions for sending measured values of temperature/humidity sensor (DHT11/SHT3x) and CO2 sensor (SCD41) to a server using SINETStream library.
    * Server<br>
    Provides procedures and materials for visualization of sensor readings received by the [Kafka](https://kafka.apache.org/) broker using SINETStream library, including graph display in Zabbix/Grafana.

* [video streaming](VideoStreaming/README_en.md)
  * Build an IoT system to collect, process, and visualize video image data.
  Build a system where images captured by a Raspberry Pi camera are processed by a GPU node on the server and the results are displayed on the client.
    * Sensor<br>
    SINETStream library and execution steps to send images to the server.
    * Server<br>
    The image received by the Kafka broker is sent to the GPU node using the SINETStream library [OpenPose](https://github.com/CMU-Perceptual-Computing-Lab/openpose)/[YOLOv5](https://docs.ultralytics.com/) and the procedure and materials to process them.
    * Viewer<br>
    Provides a Python program and execution steps to display images from the server (Kafka broker) on the client using the SINETStream library.

* [option](option/README_en.md)
  * Procedures and materials related to optional configuration items and test tools for this package.
    * Server<br>
    Provides instructions and materials related to optional configuration items for the server part (building the Kafka broker, storing messages, and forwarding MQTT ([Mosquitto](https://mosquitto.org/)) messages to the Kafka broker).
    * Producer<br>
    Provides instructions for building an environment to send test data (images cut from video files) to a server (Kafka broker).
    * Consumer<br>
    This is a Python program that displays text data sent by the server (Kafka broker) on the client.

## Related Information
- SINETStream https://www.sinetstream.net/ <br>
- A. Takefusa, J. Sun, I. Fujiwara, H. Yoshida, K. Aida and C. Pu, <br>
"SINETStream: Enabling Research IoT Applications with Portability, Security and Performance Requirements,"<br>
2021 IEEE 45th Annual Computers, Software, and Applications Conference (COMPSAC), pp. 482-492, 2021.<br>
doi: 10.1109/COMPSAC51774.2021.00073.<br>
- SINETStream external publication https://nii-gakunin-cloud.github.io/#sinetstream
- Cloud Support Office, National Institute of Informatics https://cloud.gakunin.jp/
- Mobile SINET https://www.sinet.ad.jp/wadci
