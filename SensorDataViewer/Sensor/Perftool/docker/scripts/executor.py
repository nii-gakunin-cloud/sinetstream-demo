import json
import re
from concurrent.futures import Executor, ThreadPoolExecutor
from logging import getLogger
from os import getenv
from queue import Empty, Queue
from threading import Event, Thread
from typing import Callable

import schedule
from perftool import exec_perftool
from sinetstream import TEXT, MessageWriter

logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "WARNING"))
done = Event()
errors = Queue()


def start_repeat_executor(cfg: dict) -> bool:
    logger.debug(cfg)
    result_que = Queue()
    start_scheduler_thread()
    start_writer_thread(cfg, result_que)
    try:
        wait = setup_scheduler(cfg)
        with ThreadPoolExecutor(max_workers=1) as executor:
            perftool_loop(result_que, executor, wait, cfg.get("perftool", {}))
    finally:
        done.set()

    return errors.empty()


def start_writer_thread(cfg: dict, que: Queue) -> None:
    def get_result() -> None:
        while not done.is_set():
            try:
                return que.get(timeout=1)
            except Empty:
                pass

    def writer_loop(**params: dict) -> None:
        logger.debug("start writer loop")
        with MessageWriter(value_type=TEXT, **params) as writer:
            while not done.is_set():
                result = get_result()
                if result is None:
                    continue
                result["name"] = cfg["name"]
                logger.debug("send result")
                writer.publish(json.dumps(result))

    def writer_task() -> None:
        try:
            writer_loop(service=cfg["result"])
        except BaseException as ex:
            errors.put(ex)
            logger.exception("writer error")
            done.set()

    Thread(target=writer_task).start()


def start_scheduler_thread():
    def schedule_loop():
        logger.debug("start schedule loop")
        while not done.wait(timeout=1):
            schedule.run_pending()

    Thread(target=schedule_loop).start()


def _get_job(cfg: dict) -> schedule.Job | None:
    param = cfg.get("schedule")
    if param is None:
        logger.debug("schedule: None")
        return None
    if type(param) is str:
        param = param.strip()
    if type(param) is not str or re.match(r"\d+$", param):
        secs = int(param)
        logger.debug(f"schedule: every {secs} seconds")
        return schedule.every(secs).seconds

    pat = re.compile(
        r"""
        every  \s*
        (\d+)? \s*
        (
            second | seconds |
            minute | minutes |
            hour | hours |
            day | days |
            week | weeks |
            monday | tuesday | wednesday | thursday | friday | saturday | sunday
        )
        (?:
            \s*
            at
            \s*
            (
                (?:
                    (?: [0-2]\d : )?
                    [0-5]\d
                )?
                : [0-5]\d
            )
        )?
        $
        """,
        re.X,
    )
    m = pat.match(param)
    if m is None:
        raise RuntimeError(f"Invalid schedule value: {param}")

    interval = int(m.group(1)) if m.group(1) is not None else 1
    job = getattr(schedule.every(interval), m.group(2))
    if m.group(3) is None:
        logger.debug(f"schedule: every {interval} {m.group(2)}")
        return job

    logger.debug(f"schedule: every {interval} {m.group(2)} at {m.group(3)}")
    return job.at(m.group(3))


def setup_scheduler(cfg: dict) -> Callable[[], None]:
    ev = Event()
    job = _get_job(cfg)

    def wakeup() -> None:
        ev.set()

    def wait() -> None:
        ev.clear()
        while not (ev.wait(1) or done.is_set()):
            pass

    if job is None:
        return lambda: None

    job.do(wakeup)
    return wait


def perftool_loop(
    result_que: Queue,
    executor: Executor,
    wait_schedule: Callable[[], None],
    params: dict,
) -> None:
    while not done.is_set():
        logger.debug("start perftool")
        ret = executor.submit(exec_perftool, **params)
        result = ret.result()
        logger.debug(f"perftool result: {result}")
        if type(result) is list:
            for x in result:
                result_que.put(x)
        else:
            result_que.put(result)
        wait_schedule()
