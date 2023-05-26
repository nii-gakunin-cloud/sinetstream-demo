from logging import getLogger
from os import getenv
from pathlib import Path

import yaml
from sinetstream import MessageReader

SERVICE_NAME = "image-file"
logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "INFO"))


class ImagePathReader:
    def __init__(self, **params):
        self._generate_cfg_file(params)

    def _generate_cfg_file(self, params):
        path_cfg = Path(".sinetstream_config.yml")
        cfg = {
            "type": "kafka",
            "value_type": "text",
            "brokers": params["brokers"],
            "topic": params["topic"],
            "consistency": params["consistency"],
            "group_id": params["group_id"],
        }
        with path_cfg.open(mode="w") as f:
            yaml.safe_dump({SERVICE_NAME: cfg}, f)

    def __call__(self, q):
        with MessageReader(SERVICE_NAME) as reader:
            for msg in reader:
                logger.info(msg.value)
                q.put(msg.value)
