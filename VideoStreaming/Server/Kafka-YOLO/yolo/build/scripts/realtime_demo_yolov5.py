#!/usr/bin/env python
from argparse import ArgumentParser
from io import BytesIO
import logging
from threading import Thread
from queue import Queue
from os import getenv

import cv2
import numpy as np
import torch
from PIL import Image
from sinetstream import MessageReader, MessageWriter, BYTE_ARRAY

from ssparams import SERVICE_DST_KEY, SERVICE_SRC_KEY, setup_cfg_file

logger = logging.getLogger(__name__)
logger.setLevel(level=getenv("LOG_LEVEL", "WARNING"))
logging.basicConfig()


def arg_parse():
    """
    Parse arguements to the detect module
    """
    parser = ArgumentParser(description="YOLO v5 Cam Demo")
    parser.add_argument("--sub_service", default="image-queue", dest=SERVICE_SRC_KEY)
    parser.add_argument("--pub_service", default="yolo-video", dest=SERVICE_DST_KEY)
    parser.add_argument("-c", "--cfg", default=None, dest="cfg_name")
    parser.add_argument(
        "-m",
        "--model",
        dest="model_type",
        help="VOLO v5 pre-trained model",
        default="yolov5s",
    )
    parser.add_argument(
        "--confidence",
        dest="confidence",
        help="Object Confidence to filter predictions",
        type=float,
        default=0.25,
    )
    parser.add_argument(
        "--nms_thresh",
        dest="nms_thresh",
        help="NMS Threshhold",
        type=float,
        default=0.4,
    )
    return vars(parser.parse_args())


def consumer(q, ss_params):
    ss_params["value_type"] = BYTE_ARRAY
    with MessageReader(**ss_params) as reader:
        reader.seek_to_end()
        for msg in reader:
            q.put(msg)


def producer(q, ss_params):
    frame = 0
    ss_params["value_type"] = BYTE_ARRAY
    with MessageWriter(**ss_params) as writer:
        while True:
            img = q.get()
            _r, jpg = cv2.imencode(".jpg", img)
            writer.publish(jpg.tobytes())
            logger.debug("Published %d frames" % (frame))
            frame += 1


def process_image(sub_que, pub_que, model):
    while True:
        try:
            msg = sub_que.get()
            img = Image.open(BytesIO(msg.value))
            img_numpy = np.asarray(img)
            img_numpy_bgr = cv2.cvtColor(img_numpy, cv2.COLOR_RGBA2BGR)

            # Inference
            results = model(img_numpy_bgr)

            # Results
            results.print()
            res_img = results.render()[0]

            pub_que.put(res_img)
        except Exception:
            logger.exception(
                f"{msg.topic}(offset={msg.raw.offset}): Incorrect image format"
            )


def get_model(args):
    # Model
    model = torch.hub.load("ultralytics/yolov5", args["model_type"])
    # or yolov5m, yolov5x, custom

    model.conf = args["confidence"]  # confidence threshold (0-1)
    model.iou = args["nms_thresh"]  # NMS IoU threshold (0-1)
    return model


def main():
    video_que = Queue(1)
    yolo_que = Queue(10)

    cmd_args = arg_parse()
    model = get_model(cmd_args)

    ss_params = setup_cfg_file(cmd_args)
    src_ss_params = ss_params[cmd_args[SERVICE_SRC_KEY]]
    dst_ss_params = ss_params[cmd_args[SERVICE_DST_KEY]]

    Thread(target=consumer, args=(video_que, src_ss_params), daemon=True).start()
    Thread(target=producer, args=(yolo_que, dst_ss_params), daemon=True).start()
    process_image(video_que, yolo_que, model)


if __name__ == "__main__":
    main()
