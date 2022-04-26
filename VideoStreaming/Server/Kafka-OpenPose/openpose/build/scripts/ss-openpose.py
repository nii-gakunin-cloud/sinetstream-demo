#!/usr/bin/python3
import logging
import signal
from argparse import ArgumentParser
from multiprocessing import Process, Queue
from os import getenv, kill

from cv2 import imencode
from sinetstream import MessageReader, MessageWriter

from ssparams import SERVICE_DST_KEY, SERVICE_SRC_KEY, setup_cfg_file

QUEUE_SIZE = 10
DEFAULT_SRC_SERVICE = "images-src"
DEFAULT_DST_SERVICE = "images-dst"

logger = logging.getLogger(__name__)
logger.setLevel(level=getenv("LOG_LEVEL", "WARNING"))
logging.basicConfig()


class OpExit(RuntimeError):
    pass


class OpProcess(Process):
    def __init__(
        self, setup=None, teardown=None, sigs=[signal.SIGINT, signal.SIGTERM], **kw
    ):
        super().__init__(**kw)
        self._setup = setup
        self._teardown = teardown
        self._sigs = sigs

    def run(self):
        if self._setup:
            self._kwargs["_setup"] = self._setup(*self._args, **self._kwargs)
        if self._teardown:

            def _handler(signum, frame):
                self._teardown(*self._args, **self._kwargs)

            for sig in self._sigs:
                signal.signal(sig, _handler)
        try:
            self._target(*self._args, **self._kwargs)
        except OpExit:
            pass


def setup_reader(q, params):
    reader_params = params["ss_params"].copy()
    reader_params["value_type"] = "image"
    reader = MessageReader(**reader_params).open()

    if hasattr(signal, "SIGUSR1"):

        def _usr1_handler(signum, frame):
            reader.seek_to_end()

        signal.signal(signal.SIGUSR1, _usr1_handler)

    return {"reader": reader}


def teardown_reader(q, _params, _setup=None):
    q.cancel_join_thread()
    reader = _setup["reader"]
    reader.close()
    logger.info("exit reader process")
    raise OpExit("exit reader process")


def do_read(q, params, _setup=None):
    reader = _setup["reader"]
    if params["seek_begin"]:
        reader.seek_to_beginning()
    if params["seek_end"]:
        reader.seek_to_end()
    for msg in reader:
        if params["decimation"] > 1 and (msg.raw.offset % params["decimation"]) != 0:
            logger.debug("SKIP: offset={}".format(msg.raw.offset))
            continue
        q.put(msg)
        logger.debug("PUT0: {}: {}".format(q.qsize(), msg.raw.offset))


def setup_writer(q, params):
    writer = MessageWriter(**params["ss_params"]).open()
    return {"writer": writer}


def teardown_writer(q, _params, _setup=None):
    q.cancel_join_thread()
    writer = _setup["writer"]
    writer.close()
    logger.info("exit writer process")
    raise OpExit("exit writer process")


def do_write(q, _params, _setup=None):
    writer = _setup["writer"]
    while True:
        offset, img = q.get()
        logger.debug("GET2: {} {}".format(q.qsize(), offset))
        writer.publish(img.tobytes())


def setup_openpose(_inq, _outq, params):
    from openpose import pyopenpose as op

    opWrapper = op.WrapperPython()
    opWrapper.configure({"model_folder": params["model_folder"], "body": 1})
    opWrapper.start()
    return {"opWrapper": opWrapper}


def teardown_openpose(inq, outq, _params, _setup=None):
    inq.cancel_join_thread()
    outq.cancel_join_thread()
    opWrapper = _setup["opWrapper"]
    opWrapper.stop()
    logger.info("exit openpose process")
    raise OpExit("exit openpose process")


def process_openpose(opWrapper, msg):
    from openpose import pyopenpose as op

    try:
        datum = op.Datum()
        datum.cvInputData = msg.value
        opWrapper.emplaceAndPop(op.VectorDatum([datum]))
        out_img = datum.cvOutputData
        ret, out_img = imencode(".jpg", out_img)
        return out_img
    except OpExit:
        raise
    except Exception as e:
        logger.exception("openpose", e)


def openpose(inq, outq, _params, _setup=None):
    opWrapper = _setup["opWrapper"]
    while True:
        msg = inq.get()
        img = process_openpose(opWrapper, msg)
        outq.put((msg.raw.offset, img))


def main(cmd_params, ss_params):
    inq = Queue(QUEUE_SIZE)
    outq = Queue(QUEUE_SIZE)
    params_reader = cmd_params.copy()
    params_reader["ss_params"] = ss_params[cmd_params[SERVICE_SRC_KEY]]
    params_writer = cmd_params.copy()
    params_writer["ss_params"] = ss_params[cmd_params[SERVICE_DST_KEY]]

    def _handler(signum, frame):
        inq.close()
        outq.close()

    for sig in [signal.SIGINT, signal.SIGTERM]:
        signal.signal(sig, _handler)

    procs = []
    procs.append(
        OpProcess(
            target=do_read,
            args=(inq, params_reader),
            setup=setup_reader,
            teardown=teardown_reader,
        )
    )
    procs.append(
        OpProcess(
            target=openpose,
            args=(inq, outq, cmd_params),
            setup=setup_openpose,
            teardown=teardown_openpose,
        )
    )
    procs.append(
        OpProcess(
            target=do_write,
            args=(outq, params_writer),
            setup=setup_writer,
            teardown=teardown_writer,
        )
    )
    for p in procs:
        p.start()

    if hasattr(signal, "SIGUSR1"):

        def _usr1_handler(signum, frame):
            kill(procs[0].pid, signal.SIGUSR1)

        signal.signal(signal.SIGUSR1, _usr1_handler)

    for p in procs:
        p.join()


def parse_args():
    parser = ArgumentParser()
    parser.add_argument("-s", "--src", default=DEFAULT_SRC_SERVICE, dest="service_src")
    parser.add_argument("-d", "--dest", default=DEFAULT_DST_SERVICE, dest="service_dst")
    parser.add_argument("-c", "--cfg", default=None, dest="cfg_name")
    parser.add_argument("-D", "--decimation", type=int, default=-1)
    parser.add_argument("-m", "--model-folder", default="/opt/openpose/models")
    parser.add_argument(
        "--begin", action="store_const", const=True, default=False, dest="seek_begin"
    )
    parser.add_argument(
        "--end", action="store_const", const=True, default=False, dest="seek_end"
    )
    return vars(parser.parse_args())


if __name__ == "__main__":
    cmd_params = parse_args()
    ss_params = setup_cfg_file(cmd_params)
    main(cmd_params, ss_params)
