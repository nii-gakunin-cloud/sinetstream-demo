import asyncio
from logging import getLogger
from os import getenv
from pathlib import Path

from jsonrpc import JSONRPCResponseManager, dispatcher
from perftool import exec_perftool

logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "WARNING"))
perftool_name = None


@dispatcher.add_method
def perftool(**params) -> dict:
    global perftool_name
    logger.debug(f"perftool params: {params}")
    ret = exec_perftool(**params)
    if type(ret) is list:
        for r in ret:
            r["name"] = perftool_name
    elif type(ret) is dict:
        ret["name"] = perftool_name
    return ret


def is_server_mode(cfg: dict) -> bool:
    return "server" in cfg


def start_server(cfg: dict) -> bool:
    name = cfg.get("name")
    if name is not None:
        global perftool_name
        perftool_name = name
    logger.debug(f"name : {perftool_name}")
    srv = cfg.get("server")
    if type(srv) is int:
        asyncio.run(socket_server(srv))
    else:
        asyncio.run(unix_socket_server(srv))
    return True


async def socket_server(port=9999):
    logger.debug(f"start socket server: {port}")
    server = await asyncio.start_server(handler, port=port)
    async with server:
        await server.serve_forever()


async def unix_socket_server(path="/run/perftool/socket"):
    pth = Path(path)
    logger.debug(f"start unix domain socket server: {pth}")
    pth.parent.mkdir(parents=True, exist_ok=True)
    server = await asyncio.start_unix_server(handler, path=pth)
    async with server:
        await server.serve_forever()


async def handler(reader, writer):
    logger.debug("json-rpc handler")
    data = await reader.read()
    message = data.decode()
    logger.debug(f"rpc call: {message}")
    loop = asyncio.get_running_loop()
    resp = await loop.run_in_executor(
        None,
        JSONRPCResponseManager.handle,
        message,
        dispatcher,
    )

    ret = resp.json.encode()
    logger.debug(f"rpc resp: {ret}")
    writer.write(ret)
    await writer.drain()
    writer.close()
    await writer.wait_closed()
    logger.debug("close handler")
