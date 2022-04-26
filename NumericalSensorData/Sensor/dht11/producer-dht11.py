#!/usr/bin/env python3
import RPi.GPIO as GPIO
from dht11 import DHT11
from sinetstream.cmd.producer import SimpleProducer

SENSOR_PIN = 14


def get_sensor_data(device):
    result = device.read()
    if not result.is_valid():
        raise RuntimeError(f"Error in reading from sensor.({result.error_code})")

    return {
        "temperature": round(result.temperature, 2),
        "humidity": round(result.humidity, 2),
    }


def init():
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    return DHT11(pin=SENSOR_PIN)


def main():
    device = init()
    producer = SimpleProducer(lambda: get_sensor_data(device))
    producer.run()


if __name__ == "__main__":
    main()
