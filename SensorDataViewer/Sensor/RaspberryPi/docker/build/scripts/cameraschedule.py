import re
from logging import getLogger
from os import getenv
from threading import Event, Thread

import schedule
from exttool import call_exttool

from cameraparams import get_param

logger = getLogger(__name__)
logger.setLevel(getenv("LOG_LEVEL", "WARNING"))


def start_scheduler_thread(done):
    def schedule_loop():
        logger.debug("start schedule loop")
        while not done.wait(timeout=1):
            schedule.run_pending()

    Thread(target=schedule_loop).start()


def _get_job():
    param = get_param("SCHEDULE")
    if param is None:
        logger.debug("schedule: None")
        return param
    if type(param) is str:
        param = param.strip()
    if type(param) is not str or re.match(r"\d+$", param):
        secs = int(param)
        logger.debug(f"schedule: every {secs} seconds")
        return schedule.every(secs).seconds

    pat = re.compile(
        """
        every \s*
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


def setup_scheduler(params, done):
    ev = Event()
    job = _get_job()

    if "server" in params:

        def ext_tool():
            call_exttool(params)

    else:

        def ext_tool():
            pass

    def wakeup():
        ev.set()

    def wait():
        ev.clear()
        ext_tool()
        while not (ev.wait(1) or done.is_set()):
            pass

    if job is None:
        return ext_tool

    job.do(wakeup)
    return wait
