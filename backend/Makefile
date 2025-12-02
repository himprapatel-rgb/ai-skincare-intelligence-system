PYTHON := python3
VENV := .venv

.PHONY: help venv install test run-gpt

help:
	@echo "Makefile targets:"
	@echo "  venv       - create and activate virtualenv"
	@echo "  install    - install Python dependencies into $(VENV)"
	@echo "  test       - run pytest (requires install)"
	@echo "  run-gpt    - run backend/scripts/test_gpt.py (requires GPTGPT_API_KEY)"

venv:
	$(PYTHON) -m venv $(VENV)
	@echo "Virtualenv created at $(VENV). Activate with: source $(VENV)/bin/activate"

install: venv
	$(VENV)/bin/pip install -r requirements.txt

test:
	$(VENV)/bin/pytest -q

run-gpt:
	$(VENV)/bin/python backend/scripts/test_gpt.py --prompt "Provide a one-paragraph summary of current sprint status."
