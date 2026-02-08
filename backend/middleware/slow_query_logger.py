"""
Slow Query Logging Middleware

Logs database operations that exceed threshold.
Stability tasks: #23, #83
"""

import logging
import time
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import event
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

# Threshold in seconds for logging slow queries
SLOW_QUERY_THRESHOLD = 0.5


@contextmanager
def track_query_time(label: str = "query") -> Generator[None, None, None]:
    """Context manager to track and log slow operations."""
    start = time.time()
    try:
        yield
    finally:
        duration = time.time() - start
        if duration > SLOW_QUERY_THRESHOLD:
            logger.warning(f"Slow {label}: {duration:.3f}s")


def setup_slow_query_logging(engine: Engine, threshold_seconds: float = 0.5):
    """
    Register SQLAlchemy event listeners for slow query logging.
    
    Args:
        engine: SQLAlchemy engine instance
        threshold_seconds: Log queries slower than this (default 0.5s)
    """
    
    @event.listens_for(engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        conn.info.setdefault("query_start_time", []).append(time.time())
    
    @event.listens_for(engine, "after_cursor_execute")
    def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        if "query_start_time" in conn.info and conn.info["query_start_time"]:
            start = conn.info["query_start_time"].pop(-1)
            duration = time.time() - start
            
            if duration > threshold_seconds:
                # Truncate statement for logging
                stmt_preview = statement[:200].replace("\n", " ")
                logger.warning(
                    f"Slow query ({duration:.3f}s): {stmt_preview}... | params: {parameters}"
                )
