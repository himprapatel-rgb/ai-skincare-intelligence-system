"""Structured JSON logging for Pellicura backend.

Usage:
    from app.core.logging import get_logger
    logger = get_logger(__name__)
    logger.info("user.login", user_id=42, duration_ms=12)
"""
import json
import logging
import time
from typing import Any


class JSONFormatter(logging.Formatter):
    """Emit log records as single-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        log: dict[str, Any] = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        # Attach any extra kwargs passed to the logger call
        for key, value in record.__dict__.items():
            if key not in {
                "name", "msg", "args", "levelname", "levelno", "pathname",
                "filename", "module", "exc_info", "exc_text", "stack_info",
                "lineno", "funcName", "created", "msecs", "relativeCreated",
                "thread", "threadName", "processName", "process", "message",
            }:
                log[key] = value

        if record.exc_info:
            log["exc"] = self.formatException(record.exc_info)

        return json.dumps(log, default=str)


def get_logger(name: str) -> logging.Logger:
    """Return a logger that emits structured JSON."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.propagate = False
    return logger


def configure_root_logging(level: str = "INFO") -> None:
    """Configure root logger with JSON formatter. Call once at startup."""
    root = logging.getLogger()
    # Remove any existing handlers added by uvicorn / gunicorn
    root.handlers.clear()
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    root.addHandler(handler)
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
