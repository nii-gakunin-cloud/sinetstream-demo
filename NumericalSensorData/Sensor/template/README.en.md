# Sensor data transmission program

The following is an example implementation that serves as a model for a sensor data transmission program. Here, instead of transmitting actual sensor data, random values are regarded as measurement values and transmitted.

## 1. Preparation

### 1.1. Prerequisites

* Python
  * Python 3.7 or later

The Kafka broker to which the sensor data will be sent must be available. Please pre-build the Kafka broker with one of the following configurations.

* [NumericalSensorData/Server/Kafka-Grafana](../../Server/Kafka-Grafana/README.en.md)
* [NumericalSensorData/Server/Kafka-Zabbix](../../Server/Kafka-Zabbix/README.en.md)
* [option/Server/Kafka](../../../option/Server/Kafka/README.en.md)

### 1.2. Installing Libraries

Install the Python libraries that the sending program will use.

```console
$ pip install -U --user sinetstream-cmd sinetstream-kafka sinetstream-mqtt
```

> If you get an error because of conflicts with libraries you have already installed, use [venv](https://docs.python.org/ja/3/library/venv.html) or [pipenv](https://github.com/pypa/pipenv). Also, the `pip` command may be `pip3` in some environments. Replace it as necessary.

### 1.3. Configuration file

The sensor data transmission program uses the [SINETStream](https://www.sinetstream.net/) library to send measurements to the Kafka broker. SINETStream requires parameters such as the address of the message broker (brokers), topic name (topic), and type (type) to be described in the configuration file `.sinetstream_config.yml`. An example of the configuration file is shown below.

```yaml
sensors:
  topic: sinetstream.sensor
  brokers: kafka.example.org:9092
  type: kafka
  consistency: AT_LEAST_ONCE
```

Modify the values of `brokers` and `topic` to match your environment. See [SINETstream - Configuration File](https://www.sinetstream.net/docs/userguide/config.html) for details on how to write `.sinetstream_config.yml`, including other parameters. The configuration file should be placed in the same directory as the sending script.

> An example file of `.sinetstream_config.yml` is [../example_sinetstream_config.yml](../example_sinetstream_config.yml). Use it as a template.

## 2. Execute the sending program

Execute the following command to send data to the broker every minute. The destination broker is the one described in the configuration file `.sinetstream_config.yml`.

```console
$ . /producer.py
```

The following JSON data will be sent to the Kafka broker.

```json
{
  "random": 51.2,
  "node": "raspi"
}
```

In addition to the measurements, the sent data will contain information about the Raspberry Pi host from which it is being sent.

The sending script normally does not display the data it sends to the Kafka broker, but you can specify the command line argument `-v` to display the sent data.

```console
$ ./producer.py -v
{"random": 51.2, "node": "raspi"}
{"random": 49.7, "node": "raspi"}
{"random": 48.1, "node": "raspi"}
```

If you want to set the interval between sensor measurements to something other than 1 minute, specify the measurement interval (in seconds) in the command line argument `-I`. For example, to set the interval to 5 minutes, specify the following.

```console
$ ./producer.py -I 300
```

## 3. Verify operation

Use [consumer.py](../../../option/Consumer/NumericalSensorData/text-consumer/consumer.py) to check the sensor data sent from the RaspberryPi. For instructions on how to run consumer.py, please refer to the following link.

* [option/Consumer/NumericalSensorData/text-consumer/README.en.md](../../../option/Consumer/NumericalSensorData/text-consumer/README.en.md)

Specify the same values for the message broker addresses (brokers), topic name (topic), and type (type) in the `.sinetstream_config.yml` configuration file for consumer.py as for the sensor data transmission program.