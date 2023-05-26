import json
from argparse import ArgumentParser
from logging import getLogger
from os import environ, getenv
from pathlib import Path

SECRETS_DIR = Path("/run/secrets")
CONFIG_PATH = Path("~/.config/sinetstream").expanduser()
SERVICE_TARGET = "perf-target"
SERVICE_RESULT = "perf-result"


logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "WARNING"))


def config() -> dict:
    args = parse_args()
    sscfg = [
        {
            "name": SERVICE_TARGET,
            "env_prefix": "PERF_TGT_",
        },
    ]
    if args.tcp_port is None and args.unix_domain is None:
        sscfg.append(
            {
                "name": SERVICE_RESULT,
                "env_prefix": "PERF_RST_",
            },
        )
    setup_sinetstream(sscfg)
    ret = {
        "target": SERVICE_TARGET,
        "name": (args.name if args.name is not None else get_param("NAME", "perftool")),
        **get_perftool_params(),
    }
    if args.tcp_port is None and args.unix_domain is None:
        ret["schedule"] = (
            args.schedule if args.schedule is not None else get_param("SCHEDULE", 60)
        )
    if args.tcp_port is not None:
        ret["server"] = args.tcp_port
    elif args.unix_domain is not None:
        ret["server"] = args.unix_domain
    else:
        ret["result"] = SERVICE_RESULT
    return ret


def parse_args():
    parser = ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument("-T", "--tcp-port", type=int)
    group.add_argument("-U", "--unix-domain")
    parser.add_argument("-n", "--name")
    parser.add_argument("-s", "--schedule", type=int)
    return parser.parse_args()


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


def get_service_params(prefix="SS_", defaults={"type": "kafka"}) -> dict:
    pl = len(prefix)
    key_map = [
        (x[pl:].lower().split("__"), get_param(x)) for x in find_param_names(prefix)
    ]
    params = defaults.copy()
    for keys, value in key_map:
        _update_params(params, keys, value)
    return params


def setup_ss_cfg_yml(services=[]) -> None:
    logger.debug("generate .sinetstream_config.yml")
    cfg_file = Path(".sinetstream_config.yml")
    with cfg_file.open(mode="w") as f:
        json.dump(
            dict([(x["name"], get_service_params(x["env_prefix"])) for x in services]),
            f,
        )


def setup_sinetstream(services=[]) -> None:
    params = setup_sscfg()
    if params:
        return params
    setup_ss_cfg_yml(services)


def get_perftool_params() -> dict:
    return {
        "perftool": get_service_params("PERFTOOL_", {}),
    }
