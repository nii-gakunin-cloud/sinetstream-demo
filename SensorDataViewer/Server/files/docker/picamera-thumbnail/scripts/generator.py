#!/usr/bin/env python
import multiprocessing as mp
from argparse import ArgumentParser
from logging import basicConfig, getLogger
from os import getenv
from pathlib import Path
from sys import exit

from imageconv import ImageConv
from imageinfo import ImagePathReader
from imagereader import ImageReader

basicConfig()
logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "INFO"))

SECRETS_DIR = Path("/run/secrets")


def main(ctx, params):
    q_size = params.get("queue", {}).get("max_size", 100)
    img_path = ctx.Queue(maxsize=q_size)
    img_data = ctx.Queue(maxsize=q_size)
    procs = [
        ctx.Process(
            target=ImageConv(**params["s3"], **params["image"]), args=(img_data,)
        ),
        ctx.Process(target=ImageReader(**params["s3"]), args=(img_path, img_data)),
        ctx.Process(target=ImagePathReader(**params["ss"]), args=(img_path,)),
    ]
    for p in procs:
        p.start()

    err = None
    while any([p.is_alive() for p in procs]):
        for p in procs:
            p.join(1)
            if not p.is_alive() and p.exitcode != 0:
                logger.debug(f"EXIT: {p.name} {p.exitcode}")
                err = p.exitcode
                for x in [x for x in procs if x.is_alive()]:
                    x.terminate()
                    x.join()
                break

    return err


def get_param(name):
    secret = SECRETS_DIR / name
    if secret.exists() and secret.is_file():
        with secret.open() as f:
            return f.read().strip()
    ret = getenv(name)
    return ret.strip() if ret is not None else ret


def parse_args():
    parser = ArgumentParser()
    parser.add_argument("--access-key-id")
    parser.add_argument("--secret-access-key")
    parser.add_argument("--endpoint-url", default="http://minio:9000")
    parser.add_argument("--brokers", default="kafka:19092")
    parser.add_argument("--topic", "-T")
    parser.add_argument("--consistency", default="AT_LEAST_ONCE")
    parser.add_argument("--group_id")
    parser.add_argument("--format", "-F", default="webp")
    parser.add_argument("--sizes", "-S", default="1280,640,320")
    parser.add_argument("--max-queue-size", "-Q", default="100")
    args = parser.parse_args()

    if args.topic is None:
        args.topic = get_param("TOPIC")
    if args.access_key_id is None:
        args.access_key_id = get_param("AWS_ACCESS_KEY_ID")
    if args.secret_access_key is None:
        args.secret_access_key = get_param("AWS_SECRET_ACCESS_KEY")
    if (
        args.topic is None
        or args.access_key_id is None
        or args.secret_access_key is None
    ):
        parser.print_help()
        exit(1)
    if args.group_id is None:
        args.group_id = f"generator-{args.topic}"

    return {
        "ss": {
            "brokers": args.brokers,
            "topic": args.topic,
            "consistency": args.consistency,
            "group_id": args.group_id,
        },
        "s3": {
            "endpoint_url": args.endpoint_url,
            "access_key_id": args.access_key_id,
            "secret_access_key": args.secret_access_key,
        },
        "image": {
            "format": args.format,
            "sizes": [int(x) for x in args.sizes.split(",")],
        },
        "queue": {
            "max_size": int(args.max_queue_size),
        },
    }


if __name__ == "__main__":
    params = parse_args()
    ctx = mp.get_context("forkserver")
    ret = main(ctx, params)
    if ret is not None:
        exit(1)
