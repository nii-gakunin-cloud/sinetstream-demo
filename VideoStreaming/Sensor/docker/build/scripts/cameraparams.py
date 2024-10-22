from argparse import ArgumentParser
import json

from logging import getLogger
from os import environ, getenv
from pathlib import Path
from typing import Any
from libcamera import Transform, ColorSpace, controls


SECRETS_DIR = Path("/run/secrets")
CONFIG_PATH = Path("~/.config/sinetstream").expanduser()
PICAMERA_PREFIX = "PICAMERA_"
PICAMERA2_PREFIX = "PICAMERA2_"


DEFAULT_SERVICE = "images"
EXT_SERVICE = "ext-tools"
logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "WARNING"))


def _get_param(name: str, default=None) -> Any:
    secrets = SECRETS_DIR / name
    if secrets.exists():
        with secrets.open() as f:
            return f.read()
    return getenv(name, default)


def _asNumeric(v, tp=int):
    try:
        return tp(v)
    except ValueError:
        return None


def get_param(name: str, default=None) -> Any:
    v = _get_param(name, default)
    if v is None:
        return v
    if v.find(".") >= 0:
        vFloat = _asNumeric(v, tp=float)
        if vFloat is not None:
            return vFloat
    vInt = _asNumeric(v)
    if vInt is not None:
        return vInt
    return v


def setup_auth_json(auth) -> None:
    auth_json = CONFIG_PATH / "auth.json"
    if auth_json.exists():
        return
    if auth is None:
        raise RuntimeError("To use the config server, auth.json must be set.")
    auth_json.parent.mkdir(exist_ok=True, parents=True)
    params = json.loads(auth)
    logger.debug("generate auth.json")
    with auth_json.open(mode="w") as f:
        json.dump(params, f)
    auth_json.chmod(0o400)


def setup_private_key(private_key):
    key_path = CONFIG_PATH / "private_key.pem"
    key_path.parent.mkdir(exist_ok=True, parents=True)
    with key_path.open(mode="w") as f:
        f.write(private_key)
    key_path.chmod(0o400)


def setup_sscfg():
    name = get_param("SSCFG_NAME")
    auth = get_param("SSCFG_AUTH")
    service = get_param("SSCFG_SERVICE")
    private_key = get_param("SSCFG_PRIVATE_KEY")
    if name is None:
        return None

    logger.debug("use config server")
    setup_auth_json(auth)
    if private_key is not None:
        setup_private_key(private_key)

    return {
        "config": name,
        "service": service,
    }


def find_param_names(prefix):
    env_names = [x for x in environ.keys() if x.startswith(prefix)]
    secret_names = [x.name for x in SECRETS_DIR.glob(f"{prefix}*")]
    return env_names + secret_names


def _update_params(params, keys, value):
    key = keys[0]
    if len(keys) == 1:
        params[key] = value
    else:
        p = params.get(key, {})
        _update_params(p, keys[1:], value)
        params[key] = p


def get_service_params(prefix="SS_", defaults={"type": "kafka"}) -> dict:
    pl = len(prefix)
    key_map = [
        (x[pl:].lower().split("__"), get_param(x)) for x in find_param_names(prefix)
    ]
    params = defaults.copy()
    for keys, value in key_map:
        _update_params(params, keys, value)
    return params


def setup_ss_cfg_yml() -> None:
    logger.debug("generate .sinetstream_config.yml")
    cfg_file = Path(".sinetstream_config.yml")
    with cfg_file.open(mode="w") as f:
        json.dump(
            {
                DEFAULT_SERVICE: get_service_params("SS_"),
                EXT_SERVICE: get_service_params("EXT_SS_"),
            },
            f,
        )


def setup_sinetstream():
    params = setup_sscfg()
    if params:
        return params
    setup_ss_cfg_yml()
    return dict(service=DEFAULT_SERVICE)


def _to_tuple(v, to_num=float, separator=","):
    if type(v) == tuple:
        return v
    if type(v) != str:
        raise RuntimeError("Cannot be converted to tuple.")
    v = v.strip()
    if not (v.startswith("(") and v.endswith(")")):
        raise RuntimeError(f"Cannot be converted to tuple: {v}")
    return tuple([to_num(x) for x in v[1:-1].split(separator)])


def _to_resolution(v):
    v = v.strip()
    if v == "4K":
        return (3840, 2160)
    if v == "2K" or v == "FHD":
        return (1920, 1080)
    if v == "HD":
        return (1280, 720)
    if v == "SVGA":
        return (800, 600)
    if v == "VGA":
        return (640, 480)
    if v == "QVGA":
        return (320, 240)
    ret = _to_tuple(v, int, "x")
    if len(ret) != 2:
        raise RuntimeError(f"The image size parameter is incorrect: {v}")
    return ret


def get_picamera2_transform_params():
    prefix = PICAMERA2_PREFIX + "TRANSFORM_"
    names = find_param_names(prefix)
    params = dict(
        [(name[len(prefix) :].lower(), 1) for name in names if get_param(name)]
    )
    return {"transform": Transform(**params)} if len(params) > 0 else {}


def get_picamera2_config_params():
    params = {}
    colour_space_name = get_param(PICAMERA2_PREFIX + "COLOUR_SPACE")
    if colour_space_name is not None:
        params["colour_space"] = getattr(ColorSpace, colour_space_name)()

    buffer_count = get_param(PICAMERA2_PREFIX + "BUFFER_COUNT")
    if buffer_count is not None:
        params["buffer_count"] = buffer_count

    return params


def get_picamera2_main_params():
    params = {}

    size = get_param(PICAMERA2_PREFIX + "MAIN_SIZE")
    if size is None:
        size = get_param(PICAMERA2_PREFIX + "SIZE")
    if size is None:
        size = get_param(PICAMERA_PREFIX + "RESOLUTION")
    if size is not None:
        params["size"] = _to_resolution(size)

    format = get_param(PICAMERA2_PREFIX + "MAIN_FORMAT")
    if format is None:
        format = get_param(PICAMERA2_PREFIX + "FORMAT")
    if format is not None:
        params["format"] = format

    return dict(main=params) if len(params) > 0 else {}


def get_picamera2_enum(name, value):
    enum = getattr(controls, f"{name}Enum", None)
    if enum is not None:
        return getattr(enum, value)
    return value


def update_framerate_param(params):
    if "FrameRate" not in params:
        return params
    framerate = float(params["FrameRate"])
    del params["FrameRate"]
    params["FrameDurationLimits"] = (int(1000000 / framerate), int(1000000 / framerate))
    return params


def get_picamera2_controls_params():
    params = {}

    framerate = get_param(PICAMERA_PREFIX + "FRAMERATE")
    if framerate is not None:
        params["FrameRate"] = framerate

    prefix = PICAMERA2_PREFIX + "CONTROLS_"
    names = find_param_names(prefix)
    for env_name in names:
        value = get_param(env_name)
        name = "".join([x.capitalize() for x in env_name[len(prefix) :].split("_")])
        params[name] = value if type(value) != str else get_picamera2_enum(name, value)
    params = update_framerate_param(params)

    return dict(controls=params) if len(params) > 0 else {}


def get_picamera_params():
    params = {}
    framerate = get_param(PICAMERA_PREFIX + "FRAMERATE")
    if framerate is not None:
        params["framerate"] = float(framerate)
    return dict(picamera=params) if len(params) > 0 else {}


def get_picamera2_params():
    params = {
        **get_picamera2_transform_params(),
        **get_picamera2_config_params(),
        **get_picamera2_main_params(),
        **get_picamera2_controls_params(),
    }
    logger.debug(f"picamera2 params: {params}")
    return dict(picamera2=params) if len(params) > 0 else {}


def get_exttool_params() -> dict:
    args = parse_args()
    if len(args) == 0:
        return {}
    return {
        "server": args["server"],
        "exttool": {
            "function": args["function"],
            "split": args["split"],
            "args": get_service_params("EXT_ARG_", {}),
            "result": get_service_params("EXT_SS_"),
        },
    }


def parse_args() -> dict:
    parser = ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument("-U", "--unix-domain")
    group.add_argument("-T", "--tcp-host")
    parser.add_argument("-P", "--tcp-port", type=int, default=9999)
    parser.add_argument("-F", "--function", default="perftool")
    parser.add_argument("-S", "--split", action="store_true")
    args = parser.parse_args()
    if args.tcp_host is not None:
        return {
            "server": {"host": args.tcp_host, "port": args.tcp_port},
            "function": args.function,
            "split": args.split,
        }
    elif args.unix_domain is not None:
        return {
            "server": {"path": args.unix_domain},
            "function": args.function,
            "split": args.split,
        }
    else:
        return {}


def setup_cfg_file():
    return {
        "sinetstream": setup_sinetstream(),
        "schedule": "10",
        **get_picamera2_params(),
        **get_exttool_params(),
    }
