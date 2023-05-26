#!/bin/bash

set -eu

# shellcheck source=/dev/null
. /etc/config.env

mc alias set minio "http://localhost:${MINIO_PORT:-9000}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"
mc admin service restart minio
mc mb "minio/${BUCKET_NAME}"
mc anonymous set download "minio/${BUCKET_NAME}"
mc event add "minio/${BUCKET_NAME}" arn:minio:sqs::_:postgresql --event "put,delete" --suffix .jpg
