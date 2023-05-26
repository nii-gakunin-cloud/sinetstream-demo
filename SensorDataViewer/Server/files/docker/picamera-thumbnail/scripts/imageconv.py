from io import BytesIO
from logging import getLogger
from os import getenv
from pathlib import Path

import boto3
from PIL import Image

logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "INFO"))


class ImageConv:
    def __init__(self, **params):
        self.params = dict(
            service_name="s3",
            endpoint_url=params["endpoint_url"],
            aws_access_key_id=params["access_key_id"],
            aws_secret_access_key=params["secret_access_key"],
        )
        self.format = params["format"]
        self.sizes = params["sizes"]
        self.check_s3()

    def check_s3(self):
        s3 = boto3.client(**self.params)
        resp = s3.list_buckets()
        for bucket in resp["Buckets"]:
            logger.debug(bucket)

    def resize(self, img, width):
        orig_width, orig_height = img.size
        height = int(orig_height * (width / orig_width))
        new_img = img.resize((width, height))
        io = BytesIO()
        new_img.save(io, format=self.format)
        return io.getvalue()

    def save_image(self, s3, img, width, bucket, orig_path):
        orig = Path(orig_path)
        paths = str(orig.with_suffix("." + self.format)).split("/")
        paths[0] = f"resize-{width}"
        logger.debug("/".join(paths))
        io = BytesIO(img)
        s3.upload_fileobj(
            io, bucket, "/".join(paths), ExtraArgs={"ContentType": "image/webp"}
        )

    def __call__(self, q):
        s3 = boto3.client(**self.params)
        while True:
            data = q.get()
            io = BytesIO(data["image"])
            img = Image.open(io)
            for width in self.sizes:
                new_img = self.resize(img, width)
                self.save_image(s3, new_img, width, data["bucket"], data["path"])
