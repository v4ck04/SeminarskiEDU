"""Logging with secret redaction.

API keys must never reach a log file or the console. Every record passes a
filter that masks the values of secret-looking environment variables and
common key formats.
"""
from __future__ import annotations

import logging
import os
import re
import sys
from logging.handlers import RotatingFileHandler

from . import paths

_SECRET_ENV_HINTS = ("KEY", "TOKEN", "SECRET", "PASSWORD")
_KEY_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9_\-]{12,}"),
    re.compile(r"sk-ant-[A-Za-z0-9_\-]{8,}"),
    re.compile(r"(?i)(authorization|xi-api-key|x-api-key)(\s*[:=]\s*)(\S+)"),
    re.compile(r"(?i)([?&]key=)([A-Za-z0-9_\-]{8,})"),
]


def _secret_values() -> list[str]:
    vals = []
    for k, v in os.environ.items():
        if v and len(v) >= 8 and any(h in k.upper() for h in _SECRET_ENV_HINTS):
            vals.append(v)
    return sorted(vals, key=len, reverse=True)


def redact(text: str) -> str:
    if not text:
        return text
    for v in _secret_values():
        text = text.replace(v, "***")
    text = _KEY_PATTERNS[0].sub("sk-***", text)
    text = _KEY_PATTERNS[1].sub("sk-ant-***", text)
    text = _KEY_PATTERNS[2].sub(lambda m: f"{m.group(1)}{m.group(2)}***", text)
    text = _KEY_PATTERNS[3].sub(lambda m: f"{m.group(1)}***", text)
    return text


class RedactFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
        except Exception:  # pragma: no cover - malformed record
            return True
        record.msg = redact(msg)
        record.args = ()
        return True


_configured = False
_project_handlers: dict[str, logging.Handler] = {}


def setup(level: str = "INFO", console: bool = True) -> logging.Logger:
    global _configured
    logger = logging.getLogger("rcstudio")
    if _configured:
        return logger
    logger.setLevel(logging.DEBUG)
    fmt = logging.Formatter("%(asctime)s %(levelname)-7s %(name)s: %(message)s")
    fh = RotatingFileHandler(paths.logs_dir() / "studio.log", maxBytes=5_000_000,
                             backupCount=3, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    fh.addFilter(RedactFilter())
    logger.addHandler(fh)
    if console:
        ch = logging.StreamHandler(sys.stderr)
        ch.setLevel(getattr(logging, level.upper(), logging.INFO))
        ch.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
        ch.addFilter(RedactFilter())
        ch.addFilter(lambda r: r.levelno >= logging.WARNING)
        logger.addHandler(ch)
    _configured = True
    return logger


def project_log(slug: str) -> None:
    """Also write everything to logs/<slug>.log while a project is active."""
    logger = logging.getLogger("rcstudio")
    if slug in _project_handlers:
        return
    h = logging.FileHandler(paths.logs_dir() / f"{slug}.log", encoding="utf-8")
    h.setLevel(logging.DEBUG)
    h.setFormatter(logging.Formatter("%(asctime)s %(levelname)-7s %(message)s"))
    h.addFilter(RedactFilter())
    logger.addHandler(h)
    _project_handlers[slug] = h


def get(name: str = "") -> logging.Logger:
    return logging.getLogger("rcstudio" + (f".{name}" if name else ""))
