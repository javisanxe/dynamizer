"""
Logging configuration for the Dynamizer API.

Sets up a coloured, human-readable logger for development and a plain
(no ANSI codes) logger for production.  Call setup_logging() once at
application startup (main.py) before any other module emits log records.

Usage in any module:
    import logging
    logger = logging.getLogger(__name__)
    logger.info("something happened")
    logger.error("something went wrong", exc_info=True)
"""

import logging
import sys


# ── ANSI colour codes ──────────────────────────────────────────────────────────

_RESET = "\x1b[0m"
_BOLD = "\x1b[1m"
_DIM = "\x1b[2m"

_LEVEL_COLOURS = {
    logging.DEBUG:    "\x1b[36m",   # cyan
    logging.INFO:     "\x1b[32m",   # green
    logging.WARNING:  "\x1b[33m",   # yellow
    logging.ERROR:    "\x1b[31m",   # red
    logging.CRITICAL: "\x1b[35m",   # magenta
}

_LEVEL_LABELS = {
    logging.DEBUG:    "DBG",
    logging.INFO:     "INF",
    logging.WARNING:  "WRN",
    logging.ERROR:    "ERR",
    logging.CRITICAL: "CRT",
}


# ── Custom formatter ───────────────────────────────────────────────────────────

class _ColourFormatter(logging.Formatter):
    """
    Format:  HH:MM:SS  LVL  logger.name  message
    Example: 14:03:22  INF  app.sockets.game  game:make_move room=ABC01 player=p1 cell=4
    """

    def __init__(self, use_colours: bool = True) -> None:
        super().__init__()
        self.use_colours = use_colours

    def format(self, record: logging.LogRecord) -> str:  # noqa: A003
        ts = self.formatTime(record, datefmt="%H:%M:%S")
        label = _LEVEL_LABELS.get(record.levelno, record.levelname[:3])
        name = record.name

        msg = record.getMessage()
        if record.exc_info:
            if not record.exc_text:
                record.exc_text = self.formatException(record.exc_info)
        if record.exc_text:
            msg = f"{msg}\n{record.exc_text}"

        if self.use_colours:
            colour = _LEVEL_COLOURS.get(record.levelno, "")
            line = (
                f"{_DIM}{ts}{_RESET}  "
                f"{colour}{_BOLD}{label}{_RESET}  "
                f"{_DIM}{name}{_RESET}  "
                f"{msg}"
            )
        else:
            line = f"{ts}  {label}  {name}  {msg}"

        return line


# ── Public setup function ──────────────────────────────────────────────────────

def setup_logging(env: str = "development") -> None:
    """
    Configure the root logger and silence noisy third-party loggers.

    Args:
        env: "development" → DEBUG level + colours.
             Anything else  → INFO level, no ANSI codes.
    """
    is_dev = env == "development"
    level = logging.DEBUG if is_dev else logging.INFO

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_ColourFormatter(use_colours=is_dev))

    root = logging.getLogger()
    root.setLevel(level)
    # Remove any handlers that may have been added before setup_logging() runs
    root.handlers.clear()
    root.addHandler(handler)

    # ── Silence noisy third-party loggers ─────────────────────────────────────
    # socketio / engineio are controlled separately via sio's own logger flag;
    # keep them quiet unless we explicitly enable them.
    for noisy in (
        "socketio",
        "engineio",
        "uvicorn.access",   # keep HTTP access log via uvicorn's own handler
        "asyncio",
    ):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    # uvicorn.error carries startup banners and worker errors — keep at WARNING
    # in prod, INFO in dev so we see "Application startup complete" etc.
    logging.getLogger("uvicorn.error").setLevel(
        logging.INFO if is_dev else logging.WARNING
    )
