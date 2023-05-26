#!/bin/sh

if [ "$#" -eq 0 -o "${1#-}" != "$1" ]; then
    set -- /opt/ss-camera/ss-camera.py "$@"
fi

exec "$@"
