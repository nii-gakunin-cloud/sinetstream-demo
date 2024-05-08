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

import datetime
from argparse import ArgumentParser, Namespace

from sinetstream import MessageReader
from soundfile import SoundFile, available_formats, available_subtypes


def consumer(params: Namespace) -> None:
    with (
        MessageReader(
            service=params.service, config=params.config, value_type="ndarray"
        ) as reader,
    ):
        try:
            time_delta = datetime.timedelta(hours=9)
            jst = datetime.timezone(time_delta, "JST")

            border = params.file.rfind(".")
            if border == -1:
                file_name = (
                    params.file
                    + "_"
                    + datetime.datetime.now(jst).strftime("%Y%m%d%H%M%S")
                )
            else:
                file_name = (
                    params.file[0:border]
                    + "_"
                    + datetime.datetime.now(jst).strftime("%Y%m%d%H%M%S")
                    + params.file[border:]
                )

            standard_bytes = 10680000 * params.rotation
            file_rotation_bytes = standard_bytes

            f = SoundFile(
                file=file_name,
                mode="x" if not params.force else "w",
                samplerate=params.samplerate,
                channels=params.channels,
                format=params.format,
                subtype=params.subtype,
            )
            print(f"\nrecording start: {file_name}")
            for message in reader:
                f.write(message.value)
                f.flush()
                m = reader.metrics
                if m.msg_bytes_total > file_rotation_bytes:
                    print(f"recording finished: {file_name}\n")
                    f.flush()
                    f.close()
                    file_rotation_bytes += standard_bytes

                    if border == -1:
                        file_name = (
                            params.file
                            + "_"
                            + datetime.datetime.now(jst).strftime("%Y%m%d%H%M%S")
                        )
                    else:
                        file_name = (
                            params.file[0:border]
                            + "_"
                            + datetime.datetime.now(jst).strftime("%Y%m%d%H%M%S")
                            + params.file[border:]
                        )

                    f = SoundFile(
                        file=file_name,
                        mode="x" if not params.force else "w",
                        samplerate=params.samplerate,
                        channels=params.channels,
                        format=params.format,
                        subtype=params.subtype,
                    )
                    print(f"recording start: {file_name}")
        except KeyboardInterrupt:
            f.flush()
            f.close()
            print(f"\nrecording finished: {file_name}\n")


def get_parser() -> ArgumentParser:
    parser = ArgumentParser(description="sound consumer")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("-s", "--service", type=str, help="service name")
    group.add_argument("-c", "--config", type=str, help="config name")
    parser.add_argument(
        "-f", "--file", type=str, help="file name", default="output.flac"
    )
    parser.add_argument("--force", action="store_true", help="overwrite existing file")
    parser.add_argument(
        "-r",
        "--samplerate",
        type=int,
        default=44100,
        help="sample rate (default: 44100)",
    )
    parser.add_argument(
        "-C", "--channels", type=int, default=1, help="number of channels (default: 1)"
    )
    parser.add_argument(
        "--format",
        type=str,
        default="FLAC",
        help="file format (default: FLAC)",
    )
    parser.add_argument(
        "--subtype",
        type=str,
        default="PCM_16",
        help="file subtype (default: PCM_16)",
    )
    parser.add_argument("--list-format", action="store_true", help="show file formats")
    parser.add_argument(
        "--list-subtype", action="store_true", help="show file subtypes"
    )
    parser.add_argument(
        "--rotation",
        type=int,
        default=1,
        help="file split time (default: 1 min)",
    )
    return parser


def show_formats() -> None:
    for k, v in available_formats().items():
        print(f"{k}: {v}")


def show_subtypes(file_format: str) -> None:
    print(f"format: {file_format}")
    print("-" * 20)
    for k, v in available_subtypes(file_format).items():
        print(f"{k}: {v}")


def get_args() -> Namespace:
    parser = get_parser()
    args = parser.parse_args()

    if args.list_format:
        show_formats()
        parser.exit(0)
    if args.list_subtype:
        show_subtypes(args.format)
        parser.exit(0)

    if args.format != "FLAC" and args.file == "output.flac":
        args.file = f"output.{args.format.lower()}"
    return args


def main() -> None:
    try:
        consumer(get_args())
    except Exception as exc:  # pylint: disable=broad-except
        print(exc)


if __name__ == "__main__":
    main()
