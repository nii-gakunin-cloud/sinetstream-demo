# Send CO2 concentration measured by SCD41 to the server

The data measured by the CO2 sensor ([SCD41](https://sensirion.com/jp/products/product-catalog/?filter_series=7d9d4a77-bd13-4545-8e68-f8e03c184ddd)) is sent to the Kafka broker.

## 1. Preparation

### 1.1. Prerequisites

* Raspberry Pi
  * The procedure shown here has been tested on the Raspberry Pi OS
* Python
  * 3.7 or later

The Kafka broker to which the sensor data will be sent must be available. Please build the Kafka broker in advance with one of the following configurations.

* [NumericalSensorData/Server/Kafka-Grafana](../../Server/Kafka-Grafana/README.en.md)
* [NumericalSensorData/Server/Kafka-Zabbix](../../Server/Kafka-Zabbix/README.en.md)
* [option/Server/Kafka](../../../option/Server/Kafka/README.en.md)

### 1.2. Enabling I2C

To enable I2C on the RaspberryPi, execute the following command.

```
$ sudo raspi-config nonint do_i2c 0
```

### 1.3. Installing Libraries

Install the Python libraries that the sending program will use. Here we will install the library [sensirion-i2c-scd](https://github.com/sensirion/python-i2c-scd) to use the CO2 sensor (SCD41) in addition to the SINETStream library.

```console
$ pip install -U --user sinetstream-kafka sinetstream-cmd sensirion-i2c-scd
```


> If you get an error because of conflicts with libraries you have already installed, use [venv](https://docs.python.org/ja/3/library/venv.html) or [pipenv](https://github.com/pypa/pipenv). Also, the `pip` command may be `pip3` in some environments. Replace it as necessary.

### 1.4. Configuration file

The sensor data transmission program uses the [SINETStream](https://www.sinetstream.net/) library to send measurements to the Kafka broker. SINETStream requires parameters such as the address of the message broker (brokers), topic name (topic), and type (type) to be described in the configuration file `.sinetstream_config.yml`. An example of the configuration file is shown below.

```yaml
sensors:
  topic: sinetstream.sensor
  brokers: kafka.example.org:9092
  type: kafka
  consistency: AT_LEAST_ONCE
```

Modify the values of `brokers` and `topic` to match your environment. See [SINETstream - Configuration File](https://www.sinetstream.net/docs/userguide/config.html) for details on how to write `.sinetstream_config.yml`, including other parameters. The configuration file should be placed in the same directory as the sending script.

The data sent to the broker by the send program includes the sensor type and the hostname of the sender, so the same topic name can be specified for all sensor types and clients.

## 2. Executing the sending program

Execute the following command to measure CO2 with SCD41 every minute and send the measurement results to the Kafka broker specified in the configuration file ``.sinetstream_config.yml``:


```console
$ . /producer-scd41.py
```

The Kafka broker will be sent the following JSON data:

```json
{
  "co2": 612,
  "node": "raspi3b"
}
```

The data to be sent includes the CO2 value measured by the sensor as well as information about the host of the Raspberry Pi on which the measurement was taken.

The send script does not normally display the data sent to the Kafka broker, but you can specify the command line argument `-v` to display the sent data.

```console
$ . /producer-scd41.py -v
{"co2": 612, "node": "raspi3b"}
{"co2": 638, "node": "raspi3b"}
{"co2": 649, "node": "raspi3b"}
```

If you want the measurement interval of the sensor to be something other than 1 minute, specify the measurement interval (in seconds) in the command line argument `-I`. For example, to set the interval to 5 minutes, specify the following:

```console
$ . /producer-scd41.py -I 300
```

## 3. Verify operation

Use [consumer.py](../../../option/Consumer/NumericalSensorData/text-consumer/consumer.py) to check the sensor data sent from the RaspberryPi. For instructions on how to run consumer.py, please refer to the following link.

* [option/Consumer/NumericalSensorData/text-consumer/README.en.md](../../../option/Consumer/NumericalSensorData/text-consumer/README.en.md)

Specify the same values for the message broker addresses (brokers), topic name (topic), and type (type) in the `.sinetstream_config.yml` configuration file for consumer.py as for the sensor data transmission program.