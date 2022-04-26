import json
from logging import getLogger
from os import environ, getenv
from pathlib import Path

import yaml

SECRETS_DIR = Path("/run/secrets")
CONFIG_PATH = Path("~/.config/sinetstream").expanduser()
SERVICE_SRC_KEY = "service_src"
SERVICE_DST_KEY = "service_dst"
ENV_PREFIX_COMMON = "SS_"
ENV_PREFIX_SRC = "SSSRC_"
ENV_PREFIX_DST = "SSDST_"

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


def setup_sscfg(params):
    name = get_param("SSCFG_NAME")
    if name is None:
        if params["cfg_name"] is None:
            return None
        name = params["cfg_name"]

    logger.debug("use config server")
    auth = get_param("SSCFG_AUTH")
    private_key = get_param("SSCFG_PRIVATE_KEY")
    setup_auth_json(auth)
    if private_key is not None:
        setup_private_key(private_key)

    keys = [SERVICE_SRC_KEY, SERVICE_DST_KEY]
    return dict(
        [(params[name], {"service": params[name], "config": name}) for name in keys]
    )


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


def _get_ss_param_names(prefix):
    return [
        (x[len(prefix) :].lower().split("__"), get_param(x))
        for x in find_param_names(prefix)
    ]


def _get_ss_params(prefix):
    key_map = _get_ss_param_names(prefix)
    key_map.extend(_get_ss_param_names(ENV_PREFIX_COMMON))
    params = {"type": "kafka"}
    for keys, value in key_map:
        _update_params(params, keys, value)
    return params


def _validate_ss_params(params):
    if not all(["brokers" in srv for srv in params.values()]):
        raise RuntimeError("Brokers must be specified.")
    num_topic = len(set([srv["topic"] for srv in params.values()]))
    if num_topic == 0:
        raise RuntimeError("Topic must be specified.")
    elif num_topic == 1:
        raise RuntimeError("Input and output topics must not be the same.")


def setup_ss_cfg_yml(src, dst):
    cfg_path = Path(".sinetstream_config.yml")
    if cfg_path.exists():
        return
    logger.debug("generate .sinetstream_config.yml")
    params = {
        src: _get_ss_params(ENV_PREFIX_SRC),
        dst: _get_ss_params(ENV_PREFIX_DST),
    }
    _validate_ss_params(params)
    with cfg_path.open(mode="w") as f:
        yaml.safe_dump(params, f)


def setup_cfg_file(params):
    sscfg = setup_sscfg(params)
    if sscfg is not None:
        return sscfg

    keys = [SERVICE_SRC_KEY, SERVICE_DST_KEY]
    setup_ss_cfg_yml(*[params[x] for x in keys])
    return dict([(params[name], {"service": params[name]}) for name in keys])
