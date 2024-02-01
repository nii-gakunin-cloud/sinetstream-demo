#!/usr/bin/env python3

import os
import random
import shutil
import signal
import ssl
import string
import subprocess
import sys
import threading
import time

import paho.mqtt.publish as publish

if len(sys.argv) != 3:
    print("Usage: python script.py <mqtt-broker-address> <mqtt-topic-receiving-msg>")
    exit(1)

config = {
    "MQTT_BROKER_ADDR": sys.argv[1],
    "MQTT_TOPIC_PUB": sys.argv[2],
    "MQTT_QOS": 0,
    "SLEEP_TIME": 5,
    "SLEEP_TIME_SD": 0,
    "PING_SLEEP_TIME": 120,
    "PING_SLEEP_TIME_SD": 1,
    "ACTIVE_TIME": 600,
    "ACTIVE_TIME_SD": 0,
    "INACTIVE_TIME": 0,
    "INACTIVE_TIME_SD": 0,
}


def generate_random_string(length):
    characters = string.ascii_letters + string.digits
    return "".join(random.choice(characters) for _ in range(length))


def signal_handler(signum, stackframe, event):
    """Set the event flag to signal all threads to terminate."""
    print(f"Handling signal {signum}")
    event.set()


def ping(bin_path, destination, attempts=3, wait=10):
    """Check if destination responds to ICMP echo requests."""
    for i in range(attempts):
        result = subprocess.run(
            [bin_path, "-c1", destination], capture_output=False, check=False
        )
        if result.returncode == 0 or i == attempts - 1:
            return result.returncode == 0
        time.sleep(wait)
    return result.returncode == 0


def broker_ping(sleep_t, sleep_t_sd, die_event, broker_addr, ping_bin):
    """Periodically send ICMP echo requests to the MQTT broker."""
    while not die_event.is_set():
        print(f"[  ping   ] pinging {broker_addr}...", end="")

        if ping(ping_bin, broker_addr, attempts=1, wait=1):
            print("...OK.")
        else:
            print("...ERROR!")

        sleep_time = random.gauss(sleep_t, sleep_t_sd)
        sleep_time = sleep_t if sleep_time < 0 else sleep_time
        print(f"[  ping   ] sleeping for {sleep_time}s")
        die_event.wait(timeout=sleep_time)
    print("[  ping   ] killing thread")


def telemetry(sleep_t, sleep_t_sd, event, die_event, mqtt_topic, broker_addr):
    """Periodically send sensor data to the MQTT broker."""
    print("[telemetry] starting thread")

    port = 1883

    while not die_event.is_set():
        if event.is_set():

            payload = generate_random_string(30)

            print(
                f"[telemetry] sending to `{broker_addr}' topic: `{mqtt_topic}'; payload: `{payload}'"
            )
            # publish a single message to the broker and disconnect cleanly.

            try:
                # publish.single modifies the tls dictionary (pops 'insecure' key). Pass a copy.
                publish.single(
                    topic=mqtt_topic,
                    payload=payload,
                    hostname=broker_addr,
                    port=port,
                    tls=None,
                )
            except ConnectionRefusedError as e:
                print(f"[telemetry] {e}")
                die_event.set()
            except ssl.SSLError as e:
                print(f"[telemetry] {e}")
                die_event.set()

            sleep_time = random.gauss(sleep_t, sleep_t_sd)
            sleep_time = sleep_t if sleep_time < 0 else sleep_time
            print(f"[telemetry] sleeping for {sleep_time}s")
            die_event.wait(timeout=sleep_time)
        else:
            # print("[telemetry] zZzzZZz sleeping... zzZzZZz")
            event.wait(timeout=1)
    print("[telemetry] killing thread")


def main(conf):
    """Manages the other threads."""
    event = threading.Event()
    die_event = threading.Event()
    signal.signal(signal.SIGTERM, lambda a, b: signal_handler(a, b, die_event))

    telemetry_thread = threading.Thread(
        target=telemetry,
        name="telemetry",
        args=(
            conf["SLEEP_TIME"],
            conf["SLEEP_TIME_SD"],
            event,
            die_event,
            conf["MQTT_TOPIC_PUB"],
            conf["MQTT_BROKER_ADDR"],
        ),
        kwargs={},
    )
    broker_ping_thread = threading.Thread(
        target=broker_ping,
        name="broker_ping",
        args=(
            conf["PING_SLEEP_TIME"],
            conf["PING_SLEEP_TIME_SD"],
            die_event,
            conf["MQTT_BROKER_ADDR"],
            conf["ping_bin"],
        ),
        kwargs={},
        daemon=False,
    )

    die_event.clear()
    broker_ping_thread.start()
    telemetry_thread.start()

    die_event.wait(timeout=5)

    print("[  main   ] starting loop")

    while not die_event.is_set():
        event.set()
        print("[  main   ] telemetry ON")
        die_event.wait(
            timeout=max(0, random.gauss(conf["ACTIVE_TIME"], conf["ACTIVE_TIME_SD"]))
        )
        if conf["INACTIVE_TIME"] > 0:
            event.clear()
            print("[  main   ] telemetry OFF")
            die_event.wait(
                timeout=max(
                    0, random.gauss(conf["INACTIVE_TIME"], conf["INACTIVE_TIME_SD"])
                )
            )

    print("[  main   ] exit")


if __name__ == "__main__":
    for key in config.keys():
        try:
            config[key] = os.environ[key]
        except KeyError:
            pass

    config["MQTT_QOS"] = int(config["MQTT_QOS"])
    for c in (
        "SLEEP_TIME",
        "SLEEP_TIME_SD",
        "PING_SLEEP_TIME",
        "PING_SLEEP_TIME_SD",
        "ACTIVE_TIME",
        "ACTIVE_TIME_SD",
        "INACTIVE_TIME",
        "INACTIVE_TIME_SD",
    ):
        config[c] = float(config[c])

    print(f"[  setup  ] selected MQTT topic: {config['MQTT_TOPIC_PUB']}")

    config["ping_bin"] = shutil.which("ping")
    if not config["ping_bin"]:
        sys.exit("[  setup  ] No 'ping' binary found. Exiting.")

    if not ping(config["ping_bin"], config["MQTT_BROKER_ADDR"]):
        sys.exit(f"[  setup  ] {config['MQTT_BROKER_ADDR']} is down")

    main(config)
