#!/usr/bin/env python3
from io import BytesIO
from logging import basicConfig, getLogger
from os import getenv
from queue import Empty, Queue
from sys import exit
from threading import Event, Thread
from time import sleep

from picamera2 import Picamera2
from sinetstream import BYTE_ARRAY, MessageWriter, TEXT

from cameraparams import setup_cfg_file
from cameraschedule import setup_scheduler, start_scheduler_thread

try:
    from dotenv import load_dotenv
    load_dotenv()
except (ModuleNotFoundError, ImportError):
    pass

if getenv("LOG_FORMAT"):
    basicConfig(format=getenv("LOG_FORMAT"), style="{")
else:
    basicConfig()
logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "WARNING"))

errors = Queue()
done = Event()


def start_writer_thread(queue, params, value_type=BYTE_ARRAY):
    def get_message():
        # Receive images forwarded from the thread that does the capturing.
        while not done.is_set():
            try:
                return queue.get(timeout=1)
            except Empty:
                pass

    def writer_loop():
        logger.debug("start writer loop")
        with MessageWriter(value_type=value_type, **params) as writer:
            while not done.is_set():
                msg = get_message()
                if msg is None:
                    continue
                logger.debug("send message")
                writer.publish(msg)

    def writer_task():
        try:
            writer_loop()
        except BaseException as ex:
            errors.put(ex)
            logger.exception("writer error")
            done.set()

    def wait():
        return not done.is_set()

    Thread(target=writer_task).start()
    return wait


def capture_loop(camera, queue, wait):
    logger.debug("start capture loop")
    stream = BytesIO()
    while not done.is_set():
        logger.debug("capture image")
        camera.capture_file(stream, format="jpeg")
        queue.put(stream.getvalue())
        stream.seek(0)
        stream.truncate()
        wait()


def setup_camera(camera, params, obsolete_params=None):
    logger.debug(f"setup_camera: {params}")
    config = camera.create_still_configuration()
    for k, v in params.items():
        logger.debug(f"configuration: config{k}: {v}")
        if type(config[k]) == dict:
            config[k].update(v)
        else:
            config[k] = v
    camera.align_configuration(config)
    camera.configure(config)
    camera.start()
    logger.debug(f"camera config: {camera.camera_config}")
    sleep(1)


def setup_exttool(params) -> None:
    q = Queue()
    ext_params = params["exttool"]
    ext_params["queue"] = q
    start_writer_thread(q, dict(service="ext-tools"), value_type=TEXT)


def main(params):
    logger.debug(f"params: {params}")
    photo_queue = Queue()
    start_scheduler_thread(done)
    start_writer_thread(photo_queue, params.get("sinetstream", {}))
    if "exttool" in params:
        setup_exttool(params)

    try:
        schedule = setup_scheduler(params, done)
        with Picamera2() as camera:
            setup_camera(
                camera, params.get("picamera2", {}), params.get("picamera", None)
            )
            capture_loop(camera, photo_queue, schedule)
    finally:
        done.set()


if __name__ == "__main__":
    main(setup_cfg_file())
    if not errors.empty():
        exit(1)
