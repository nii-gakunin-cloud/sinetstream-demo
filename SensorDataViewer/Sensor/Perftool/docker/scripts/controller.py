#!/usr/bin/env python
from logging import basicConfig, getLogger
from os import getenv

from executor import start_repeat_executor
from parseargs import config
from server import is_server_mode, start_server

if getenv("LOG_FORMAT"):
    basicConfig(format=getenv("LOG_FORMAT"), style="{")
else:
    basicConfig()
logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "WARNING"))


def main(cfg: dict) -> bool:
    if is_server_mode(cfg):
        return start_server(cfg)
    else:
        return start_repeat_executor(cfg)


if __name__ == "__main__":
    error = main(config())
    if error:
        exit(1)
