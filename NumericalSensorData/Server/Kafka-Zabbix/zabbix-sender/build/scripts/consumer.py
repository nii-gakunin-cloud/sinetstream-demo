#!/usr/bin/env python
from argparse import ArgumentParser
from datetime import datetime
import json
import math
import socket
import struct
from sinetstream import MessageReader
from pathlib import Path

SERVICE = 'sensors'


class Consumer(object):
    def __init__(self):
        self._parse_args()
        self._generate_conf()

    def _parse_args(self):
        parser = ArgumentParser(description="SINETStream Consumer")
        parser.add_argument("-b", "--brokers", required=True)
        parser.add_argument("-t", "--topics", required=True)
        parser.add_argument("-T", "--broker-type", default="kafka")
        parser.add_argument("-A", "--zabbix-address", required=True)
        parser.add_argument("-P", "--zabbix-port", type=int, default=10051)
        parser.add_argument("-H", "--zabbix-host", required=True)
        parser.add_argument(
            "-k", "--zabbix-key", default="sinetstream.connector")
        parser.parse_args(namespace=self)

    def _generate_conf(self):
        params = {
            SERVICE: {
                'brokers': [x.strip() for x in self.brokers.split(',')],
                'topics': self.topics,
                'type': self.broker_type,
                'consistency': 'AT_LEAST_ONCE',
                'value_type': 'text',
            },
        }
        with Path('.sinetstream_config.yml').open(mode='w') as f:
            json.dump(params, f)

    def run(self):
        with MessageReader(SERVICE) as reader:
            for msg in reader:
                self.zabbix_sender(msg)

    def zabbix_sender(self, msg):
        f, n = math.modf(msg.timestamp)
        clock = int(n)
        ns = round(f * 1000000000)
        payload = json.dumps({
            'request': 'sender data',
            'data': [
                {
                    'host': self.zabbix_host,
                    'key': self.zabbix_key,
                    'value': msg.value,
                    'clock': clock,
                    'ns': ns,
                },
            ],
        }).encode('utf-8')
        header = struct.pack('<4sBQ', b'ZBXD', 1, len(payload))
        resp = b''
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as zabbix:      
            zabbix.connect((self.zabbix_address, self.zabbix_port))
            zabbix.sendall(header + payload)

            while True:
                r = zabbix.recv(4096)
                if not r:
                    break
                resp += r

            (h, v, size) = struct.unpack('<4sBQ', resp[:13])
            if h != b'ZBXD':
                raise ValueError('invalid response')
            resp = resp[13:13+size]



def main():
    cons = Consumer()
    cons.run()


if __name__ == '__main__':
    main()
