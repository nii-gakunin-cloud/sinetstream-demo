#!/usr/bin/env python3
from sensirion_i2c_driver import I2cConnection, LinuxI2cTransceiver
from sensirion_i2c_sht.sht3x import Sht3xI2cDevice
from sinetstream.cmd.producer import SimpleProducer

I2C_DEVICE = "/dev/i2c-1"


def get_sensor_data(device):
    temperature, humidity = device.single_shot_measurement()
    return {
        "temperature": round(temperature.degrees_celsius, 2),
        "humidity": round(humidity.percent_rh, 2),
    }


def init(transceiver):
    return Sht3xI2cDevice(I2cConnection(transceiver))


def main():
    with LinuxI2cTransceiver(I2C_DEVICE) as transceiver:
        device = init(transceiver)
        producer = SimpleProducer(lambda: get_sensor_data(device))
        producer.run()


if __name__ == "__main__":
    main()
