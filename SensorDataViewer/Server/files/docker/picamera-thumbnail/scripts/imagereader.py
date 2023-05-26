from io import BytesIO
from logging import getLogger
from os import getenv

import boto3

logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "INFO"))


class ImageReader:
    def __init__(self, **params):
        self.params = dict(
            service_name="s3",
            endpoint_url=params["endpoint_url"],
            aws_access_key_id=params["access_key_id"],
            aws_secret_access_key=params["secret_access_key"],
        )
        self.check_s3()

    def check_s3(self):
        s3 = boto3.client(**self.params)
        resp = s3.list_buckets()
        for bucket in resp["Buckets"]:
            logger.debug(bucket)

    def get_image(self, s3, bucket, obj_name):
        img = BytesIO()
        s3.download_fileobj(bucket, obj_name, img)
        return img.getvalue()

    def __call__(self, inq, outq):
        s3 = boto3.client(**self.params)
        while True:
            path = inq.get()
            bucket, obj_name = path.split("/", maxsplit=1)
            logger.debug(f"{bucket} {obj_name}")
            image = self.get_image(s3, bucket, obj_name)
            outq.put(
                dict(
                    bucket=bucket,
                    path=obj_name,
                    image=image,
                )
            )
