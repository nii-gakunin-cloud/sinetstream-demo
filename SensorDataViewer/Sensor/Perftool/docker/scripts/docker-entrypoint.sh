#!/bin/sh

if [ "$#" -eq 0 ] || [ "${1#-}" != "$1" ]; then
    set -- /perftool/controller.py "$@"
fi

exec "$@"
