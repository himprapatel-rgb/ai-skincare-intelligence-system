"""
Minimal shim for `pydantic.Field` used by `app.config` when real
`pydantic` isn't available in constrained environments.

This shim implements a small `Field` function that simply returns the
default value provided. It's intentionally tiny and should be removed
once `pydantic` is installed from `requirements.txt`.
"""

from typing import Any


def Field(default: Any = None, description: str | None = None, **kwargs) -> Any:
    return default
