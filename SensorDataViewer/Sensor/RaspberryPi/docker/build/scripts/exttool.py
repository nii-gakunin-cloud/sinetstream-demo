import json
from logging import getLogger
from os import getenv
from socket import AF_INET, AF_UNIX, SHUT_WR, SOCK_STREAM, socket

from jsonrpcclient import Ok, parse, request

logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "WARNING"))


def get_request(func: str, params: dict) -> bytes:
    r = request(func, params=params)
    logger.debug(f"request: {r}")
    return json.dumps(r).encode()


def get_response(sock: socket) -> dict:
    data = b""
    while True:
        chunk = sock.recv(4096)
        if not chunk:
            break
        data += chunk
    result = parse(json.loads(data))
    logger.debug(f"response: {result}")
    if isinstance(result, Ok):
        return result.result
    else:
        raise RuntimeError(result.message)


def call_exttool(params: dict) -> None:
    logger.debug(f"call exttool: {params}")
    ext_params = params["exttool"]
    que = ext_params.get("queue")
    with create_socket(params.get("server")) as sock:
        payload = get_request(ext_params.get("function"), ext_params.get("args", {}))
        sock.sendall(payload)
        sock.shutdown(SHUT_WR)
        resp = get_response(sock)
        if ext_params.get("split", False) and type(resp) == list:
            for r in resp:
                que.put(json.dumps(r))
        else:
            que.put(json.dumps(resp))


def create_socket(params: dict) -> socket:
    if "path" in params:
        logger.debug(f"create unix socket: {params['path']}")
        s = socket(AF_UNIX, SOCK_STREAM)
        s.connect(params["path"])
    else:
        logger.debug(f"create tcp socket: {params['host']}:{params['port']}")
        s = socket(AF_INET, SOCK_STREAM)
        s.connect((params["host"], params["port"]))
    return s
