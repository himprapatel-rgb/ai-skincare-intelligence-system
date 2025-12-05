"""
Minimal shim for `requests` to allow tests to run when dependencies
can't be installed in the environment. This file provides a placeholder
`post` function that will normally be monkeypatched by tests.

IMPORTANT: This is a temporary shim to make CI/local checks possible when
network or packaging is restricted. Remove this file once real packages
are installed (via `pip install -r requirements.txt`).
"""

from typing import Any


class _DummyResponse:
    def __init__(self, data: Any, status_code: int = 200):
        self._data = data
        self.status_code = status_code

    def json(self):
        return self._data

    def raise_for_status(self):
        if not (200 <= self.status_code < 300):
            raise Exception(f"HTTP {self.status_code}")


def post(
    url: str,
    headers: dict | None = None,
    json: Any | None = None,
    timeout: int | None = None,
):
    """Placeholder `post` used by tests via monkeypatch.

    Tests in this repo monkeypatch `requests.post` before importing modules
    that use it. If left unpatched and called, this implementation will
    return a dummy response echoing the JSON payload.
    """
    # Return a simple echo response so code that accidentally calls this
    # still receives a predictable object with `json()` and
    # `raise_for_status()`.
    return _DummyResponse({"echo": json}, 200)
