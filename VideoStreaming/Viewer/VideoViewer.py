#!/usr/bin/env python3
import logging
from argparse import ArgumentParser
from os import getenv
from queue import Empty, Queue
from threading import Thread

import cv2
import numpy as np
from sinetstream import MessageReader

skip_visible_check = False
logger = logging.getLogger(__name__)
logger.setLevel(level=getenv("LOG_LEVEL", "WARNING"))
logging.basicConfig()


def consumer(q, service):
    logger.debug("start reader")
    with MessageReader(service, value_type="image") as reader:
        reader.seek_to_end()
        logger.debug("seek to end!")
        for msg in reader:
            logger.debug(f"image fetch {msg.raw.offset}")
            q.put(msg)
    logger.debug("end reader")


def is_visible(title):
    global skip_visible_check
    if skip_visible_check:
        return True
    try:
        ret = cv2.getWindowProperty(title, cv2.WND_PROP_VISIBLE)
        return ret > 0
    except cv2.error:
        logger.exception("cv2 error!")
        skip_visible_check = True
        return True


def show_image(q, title):
    logger.debug("start viewer")
    cv2.imshow(title, np.zeros((240, 320, 3), np.uint8))
    cv2.waitKey(10)
    while is_visible(title):
        try:
            msg = q.get(True, 0.1)
            cv2.imshow(title, msg.value)
        except Empty:
            pass
        except Exception:
            logger.exception(f"{msg.topic}: Incorrect image format")
        cv2.waitKey(1)
    for _ in range(5):
        cv2.destroyAllWindows()
        cv2.waitKey(1)
    logger.debug("end viewer")


def parse_arg():
    parser = ArgumentParser()
    parser.add_argument("-s", "--service", required=True)
    parser.add_argument("-T", "--title")
    args = parser.parse_args()
    if args.title is None:
        args.title = f"VideoViwer - {args.service}"
    return args


def main():
    args = parse_arg()
    que = Queue(1)
    Thread(target=consumer, args=(que, args.service), daemon=True).start()
    show_image(que, args.title)


if __name__ == "__main__":
    main()
