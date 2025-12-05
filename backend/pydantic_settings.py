"""
Tiny shim for `pydantic_settings.BaseSettings` to allow import-time
creation of `Settings` in `app.config` when the real package isn't
available in the environment. This provides just enough behavior for the
tests to import `app.config` and to set attributes on the created
`settings` instance.

Remove this shim after installing `pydantic-settings` from
`requirements.txt`.
"""

from typing import Any


class BaseSettings:
    """A minimal stand-in for pydantic_settings.BaseSettings.

    Subclasses may declare attributes at class level; when instantiated,
    this simple implementation will not perform validation but will allow
    attribute access and assignment as used by tests.
    """

    def __init__(self, **values: Any):
        # Do nothing special; actual Settings class will set defaults via
        # class attributes. Allow tests to mutate attributes later.
        for k, v in values.items():
            setattr(self, k, v)

    # Allow subclassing without raising
    def __init_subclass__(cls, **kwargs):
        return super().__init_subclass__(**kwargs)
