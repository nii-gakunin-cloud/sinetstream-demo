#!/bin/sh

set -eu

if [ -f /run/secrets/MINIO_CONFIG ]; then
    # shellcheck source=/dev/null
    . /run/secrets/MINIO_CONFIG
fi
: "${AWS_ACCESS_KEY_ID:=$MINIO_ROOT_USER}"
: "${AWS_SECRET_ACCESS_KEY:=$MINIO_ROOT_PASSWORD}"

export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY

if [ "$#" -eq 0 ] || [ "${1#-}" != "$1" ]; then
    set -- /srv/generator.py "$@"
fi

exec "$@"
