#!/usr/bin/env python3
from io import BytesIO
from logging import basicConfig, getLogger
from os import getenv
from queue import Empty, Queue
from sys import exit
from threading import Event, Thread
from time import sleep

from dotenv import load_dotenv
from picamera import PiCamera
from sinetstream import BYTE_ARRAY, MessageWriter

from cameraparams import setup_cfg_file
from cameraschedule import setup_scheduler, start_scheduler

load_dotenv()
if getenv("LOG_FORMAT"):
    basicConfig(format=getenv("LOG_FORMAT"), style="{")
else:
    basicConfig()
logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "WARNING"))
error_event = Event()


def start_writer(q, params):
    ev = Event()

    def get_image():
        # Receive images forwarded from the thread that does the capturing.
        while not ev.is_set():
            try:
                return q.get(timeout=1)
            except Empty:
                pass

    def writer_loop():
        logger.debug("start writer loop")
        with MessageWriter(value_type=BYTE_ARRAY, **params) as writer:
            while not ev.is_set():
                img = get_image()
                if img is None:
                    continue
                logger.debug("send image")
                writer.publish(img)

    def writer_task():
        try:
            writer_loop()
        except BaseException:
            logger.exception("writer error")
            error_event.set()

    Thread(target=writer_task).start()
    return ev


def capture_loop(camera, q, wait, params):
    logger.debug("start capture loop")
    stream = BytesIO()
    for _ in camera.capture_continuous(stream, **params.get("capture", {})):
        logger.debug("capture image")

        # Forward the image to the thread to which it is sent.
        q.put(stream.getvalue())

        stream.seek(0)
        stream.truncate()
        wait()
        if error_event.is_set():
            break


def setup_camera(camera, params):
    for k, v in params.items():
        logger.debug(f"camera: {k}={v}")
        setattr(camera, k, v)


def main(params):
    q = Queue()
    stop_scheduler = start_scheduler()
    stop_writer = start_writer(q, params.get("sinetstream", {}))
    try:
        with PiCamera(**params.get("picamera", {})) as camera:
            setup_camera(camera, params.get("picamera_attrs", {}))
            sleep(2)
            wait = setup_scheduler(error_event)
            capture_loop(camera, q, wait, params)
    finally:
        stop_scheduler.set()
        stop_writer.set()


if __name__ == "__main__":
    main(setup_cfg_file())
    if error_event.is_set():
        exit(1)
