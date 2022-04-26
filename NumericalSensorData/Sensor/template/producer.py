#!/usr/bin/env python3
from random import normalvariate, seed

from sinetstream.cmd.producer import SimpleProducer


def get_sensor_data(device):
    """センサーの測定値を返す。"""
    device["value"] += normalvariate(0, 5)
    return {"random": device["value"]}


def init():
    """センサーオブジェクトを初期化する。"""
    seed()
    return {"value": 50.0}


def main():
    """メインループを呼び出す。"""
    device = init()
    producer = SimpleProducer(lambda: get_sensor_data(device))
    producer.run()


if __name__ == "__main__":
    main()
