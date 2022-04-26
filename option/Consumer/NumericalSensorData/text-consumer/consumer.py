#!/usr/bin/env python3
from argparse import ArgumentParser
from os.path import basename
from sys import argv, stderr

from sinetstream import TEXT, MessageReader


def consumer(**kwargs):
    with MessageReader(value_type=TEXT, **kwargs) as reader:
        for message in reader:
            print(message.value)


def parse_arg():
    parser = ArgumentParser(description="SINETStream Consumer")
    parser.add_argument("-s", "--service")
    parser.add_argument("-c", "--config")
    args = vars(parser.parse_args())
    if args["service"] is None and args["config"] is None:
        err_msg = "-s/--service must be specified if -c/--config is not specified."
        print(f"{basename(argv[0])}: error: {err_msg}")
        exit(1)
    return args


if __name__ == "__main__":
    args = parse_arg()
    print("Press ctrl-c to exit the program.", file=stderr)
    try:
        consumer(**args)
    except KeyboardInterrupt:
        pass
