#!/usr/bin/env python

# Copyright (C) 2023 National Institute of Informatics
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

from argparse import ArgumentParser, Namespace
from functools import partial
from logging import basicConfig, getLogger
from os import environ
from queue import Empty, Queue
from sys import stderr
from threading import Event, Thread
from typing import Any, Union

import numpy as np
import sounddevice as sd
from sinetstream import MessageReader

basicConfig(
    level=environ.get("LOG_LEVEL", "WARNING"),
    format=environ.get("LOG_FORMAT", "%(levelname)s: %(message)s"),
)
logger = getLogger(__name__)


def consumer(params: Namespace, q: Queue, ev: Event) -> None:
    with MessageReader(
        service=params.service, config=params.config, value_type="ndarray"
    ) as reader:
        reader.seek_to_end()
        for message in reader:
            q.put(message.value)
            if not ev.is_set() and q.qsize() > params.buffer_size:
                ev.set()


def callback(
    outdata: np.ndarray,
    _frames: int,
    _time: Any,
    status: sd.CallbackFlags,
    q: Queue,
    ev: Event,
) -> None:
    if status.output_underflow:
        logger.warning("Output underflow: increase blocksize?")
        raise sd.CallbackAbort
    try:
        data = q.get_nowait()
    except Empty as e:
        logger.warning("no data is available")
        ev.set()
        raise sd.CallbackStop from e
    if len(data) != len(outdata):
        logger.warning(
            "block size mismatch: expected %s, got %s", len(outdata), len(data)
        )
        ev.set()
        raise sd.CallbackAbort
    outdata[:] = data


def int_or_str(text: str) -> Union[int, str]:
    try:
        return int(text)
    except ValueError:
        return text


def get_parser() -> ArgumentParser:
    parser = ArgumentParser(description="sound consumer")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("-s", "--service", type=str, help="service name")
    group.add_argument("-c", "--config", type=str, help="config name")
    parser.add_argument(
        "-d",
        "--device",
        type=int_or_str,
        help="output device (numeric ID or substring)",
    )
    parser.add_argument(
        "-r",
        "--samplerate",
        type=int,
        default=44100,
        help="sample rate (default: 44100)",
    )
    parser.add_argument(
        "-b",
        "--blocksize",
        type=int,
        default=4096,
        help="block size (default: 4096)",
    )
    parser.add_argument(
        "-C", "--channels", type=int, default=1, help="number of channels (default: 1)"
    )
    parser.add_argument(
        "-B",
        "--buffer-size",
        type=int,
        default=20,
        help="buffer size (default: 20)",
    )
    parser.add_argument(
        "-T",
        "--not-terminate",
        action="store_true",
        help="not terminate when an error occurs. (default: False)",
    )
    parser.add_argument("--list-device", action="store_true", help="show device list")
    return parser


def get_args() -> Namespace:
    parser = get_parser()
    args = parser.parse_args()
    if args.list_device:
        print(sd.query_devices(), file=stderr)
        parser.exit()
    return args


def loop_stream(params: Namespace, q: Queue, ev_start: Event, ev_error: Event) -> None:
    while True:
        ev_start.wait()
        ev_error.clear()
        stream = sd.OutputStream(
            samplerate=params.samplerate,
            channels=params.channels,
            blocksize=params.blocksize,
            device=params.device,
            callback=partial(callback, q=q, ev=ev_error),
        )
        stream.start()
        ev_error.wait()
        if not params.not_terminate:
            break
        ev_start.clear()


def main() -> None:
    args = get_args()
    q: Queue = Queue()
    ev_start = Event()
    ev_error = Event()

    Thread(target=consumer, args=(args, q, ev_start), daemon=True).start()
    try:
        loop_stream(args, q, ev_start, ev_error)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
