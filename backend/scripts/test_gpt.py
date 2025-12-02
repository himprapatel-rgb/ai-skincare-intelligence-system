"""
Local test script for the GPTGPT wrapper.

Usage:
  - Set `GPTGPT_API_KEY` in `backend/.env` or pass `--key`.
  - Optionally set `--base` to override the API base URL.

This script calls `GPTService.chat` and prints the result. It is intended
for local verification only and will not be executed in CI.
"""
from __future__ import annotations

import argparse
import os
import sys

from app.services.gpt_service import GPTService


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--key", help="GPTGPT API key (overrides env)")
    p.add_argument("--base", help="GPTGPT API base URL (overrides default)")
    p.add_argument("--prompt", default="Provide a short 3-line sprint status summary.", help="Prompt to send to the LLM")
    args = p.parse_args(argv)

    api_key = args.key or os.getenv("GPTGPT_API_KEY")
    base = args.base

    if not api_key:
        print("Error: GPTGPT API key not provided. Set GPTGPT_API_KEY or pass --key.")
        return 2

    kwargs = {"api_key": api_key}
    if base:
        kwargs["base_url"] = base

    try:
        svc = GPTService(**kwargs)
    except Exception as e:
        print("Failed to initialize GPTService:", e)
        return 3

    try:
        out = svc.chat(args.prompt)
        print("=== LLM response ===")
        print(out)
        return 0
    except Exception as e:
        print("LLM call failed:", e)
        return 4


if __name__ == "__main__":
    raise SystemExit(main())
