import json
from inspect import classify_class_attrs, signature
from logging import getLogger
from os import environ, getenv
from pathlib import Path

from picamera import Color, PiCamera

SECRETS_DIR = Path("/run/secrets")
CONFIG_PATH = Path("~/.config/sinetstream").expanduser()
PICAMERA_PREFIX = "PICAMERA_"
CAPTURE_PREFIX = "CAPTURE_"


DEFAULT_SERVICE = "images"
logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "WARNING"))


def _get_param(name, default=None):
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


def get_param(name, default=None):
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


def setup_auth_json(auth):
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


def setup_ss_cfg_yml():
    logger.debug("generate .sinetstream_config.yml")
    key_map = [
        (x[3:].lower().split("__"), get_param(x)) for x in find_param_names("SS_")
    ]
    params = {"type": "kafka"}
    for keys, value in key_map:
        _update_params(params, keys, value)
    cfg_file = Path(".sinetstream_config.yml")
    with cfg_file.open(mode="w") as f:
        json.dump({DEFAULT_SERVICE: params}, f)


def setup_sinetstream():
    params = setup_sscfg()
    if params:
        return params
    setup_ss_cfg_yml()
    return dict(service=DEFAULT_SERVICE)


def _to_tuple(v, to_num=float):
    if type(v) == tuple:
        return v
    if type(v) != str:
        raise RuntimeError("Cannot be converted to tuple.")
    v = v.strip()
    if not (v.startswith("(") and v.endswith(")")):
        raise RuntimeError(f"Cannot be converted to tuple: {v}")
    return tuple([to_num(x) for x in v[1:-1].split(",")])


def _to_resolution(v):
    v = v.strip()
    if v == "4K":
        return (3840, 2160)
    elif v == "2K":
        return (1920, 1080)
    elif v == "QVGA":
        return (320, 240)
    if v.startswith("(") and v.endswith(")"):
        return _to_tuple(v, int)
    else:
        return v


def get_picamera_constructor_args(env_names):
    args = signature(PiCamera).parameters
    params = {}
    for env_name in env_names:
        name = env_name[len(PICAMERA_PREFIX) :].lower()
        if name not in args.keys():
            continue
        v = get_param(env_name)
        tp = type(args[name].default)
        if tp == int:
            params[name] = int(v)
        elif tp == float or name == "framerate":
            params[name] = float(v)
        elif tp == bool:
            params[name] = v.lower() == "true"
        elif tp == str:
            params[name] = v
        elif name == "famerate_range":
            params[name] = _to_tuple(v)
        elif name == "resolution":
            params[name] = _to_resolution(v)
        elif name == "led_pin":
            pass
        logger.debug(f"picamera constructor arg: {name}={params.get(name)}")
    return params


def get_picamera_attrs(env_names):
    picamera_attrs = [
        x.name for x in classify_class_attrs(PiCamera) if x.kind == "property"
    ]
    params = {}
    for env_name in env_names:
        name = env_name[len(PICAMERA_PREFIX) :].lower()
        if name not in picamera_attrs:
            err_msg = "Ignore because a non-existent attribute was specified"
            logger.warning(f"{err_msg}: {name}")
            continue
        v = get_param(env_name)
        if name in [
            "annotate_text_size",
            "brightness",
            "contrast",
            "exposure_compensation",
            "iso",
            "rotation",
            "saturation",
            "sharpness",
            "shutter_speed",
        ]:
            params[name] = int(v)
        elif name in ["aws_gains", "framerate_delta"]:
            params[name] = float(v)
        elif name in [
            "annotate_frame_num",
            "hflip",
            "image_denoise",
            "led",
            "still_stats",
            "vflip",
            "video_denoise",
        ]:
            params[name] = v.lower() == "true"
        elif name in ["color_effects", "image_effect_params"]:
            params[name] = _to_tuple(v, int)
        elif name in ["zoom"]:
            params[name] = _to_tuple(v)
        elif name in ["annotate_background", "annotate_foreground"]:
            params[name] = Color(v)
        elif name.startswith("exif_tags__"):
            exif = params.get("exif_tags", {})
            exif[env_name[len(PICAMERA_PREFIX + "exif_tags__") :]] = v
            params["exif_tags"] = exif
        else:
            params[name] = v
        logger.debug(f"picamera attr: {name}={params.get(name)}")

    return params


def get_picamera_params():
    names = find_param_names(PICAMERA_PREFIX)
    constructor_args = get_picamera_constructor_args(names)
    attrs_names = set(names) - set(
        [f"{PICAMERA_PREFIX}{x.upper()}" for x in constructor_args.keys()]
    )
    return {
        "picamera": constructor_args,
        "picamera_attrs": get_picamera_attrs(attrs_names),
    }


def get_picamera_capture_params():
    params = {
        "use_video_port": True,
        "format": "jpeg",
    }
    env_names = find_param_names(CAPTURE_PREFIX)
    for env_name in env_names:
        name = env_name[len(PICAMERA_PREFIX) :].lower()
        v = get_param(env_name)
        if name in ["splitter_port", "quality", "restart"]:
            params[name] = int(v)
        elif name in ["use_video_port", "bayer"]:
            params[name] = v.lower() == "true"
        elif name in ["resize", "thumbnail"]:
            params[name] = _to_tuple(v, int)
        else:
            params[name] = v
        logger.debug(f"picamera capture arg: {name}={params.get(name)}")

    return params


def setup_cfg_file():
    return {
        "sinetstream": setup_sinetstream(),
        "capture": get_picamera_capture_params(),
        "schedule": "10",
        **get_picamera_params(),
    }
