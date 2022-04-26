#!/usr/bin/env python3
from time import sleep

from sensirion_i2c_driver import I2cConnection, LinuxI2cTransceiver
from sensirion_i2c_scd import Scd4xI2cDevice
from sinetstream.cmd.producer import SimpleProducer

I2C_DEVICE = "/dev/i2c-1"


def get_sensor_data(device):
    co2, _temperature, _humidity = device.read_measurement()
    # CO2の値のみを送信する
    return {"co2": co2.co2}


def init(transceiver):
    device = Scd4xI2cDevice(I2cConnection(transceiver))
    device.stop_periodic_measurement()
    device.start_periodic_measurement()
    sleep(5)
    return device


def main():
    with LinuxI2cTransceiver(I2C_DEVICE) as transceiver:
        device = init(transceiver)
        producer = SimpleProducer(lambda: get_sensor_data(device))
        producer.run()


if __name__ == "__main__":
    main()
