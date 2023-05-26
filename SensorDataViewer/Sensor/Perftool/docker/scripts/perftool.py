import json
from logging import getLogger
from os import getenv
from subprocess import run

from parseargs import SERVICE_TARGET

logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "WARNING"))


def exec_perftool(**params) -> dict:
    cmd = _perftool_cmdline(params)
    logger.debug(f"perftool cli: {cmd}")
    ret = run(cmd, capture_output=True, text=True)
    result = [json.loads(x) for x in ret.stdout.splitlines()]
    logger.debug(f"perftool result: {result}")
    return result[0] if len(result) == 1 else result


def _perftool_cmdline(params: dict) -> list[str]:
    flags = ["async-api"]
    cmd = [getenv("CMD_PERFTOOL", "perftool")]
    for k, v in params.items():
        key = k.replace("_", "-")
        cmd.append(f"--{key}")
        if key not in flags:
            cmd.append(str(v))
    cmd.append("--service")
    cmd.append(SERVICE_TARGET)
    return cmd
