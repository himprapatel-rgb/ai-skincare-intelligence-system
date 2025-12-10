PYTHON := python3
VENV := .venv

.PHONY: help venv install test run-gpt

help:
	@echo "Makefile targets:"
	@echo "  venv       - create and activate virtualenv"
	@echo "  install    - install Python dependencies into $(VENV)"
	@echo "  test       - run pytest (requires install)"
	@echo "  run-gpt    - run backend/scripts/test_gpt.py (requires GPTGPT_API_KEY)"
	@echo "  seed-data        - seed database with all datasets (requires DB connection)"
	@echo "  seed-data-skip   - seed database skipping specific datasets"
	@echo "  seed-data-only   - seed only specific datasets"

venv:
	$(PYTHON) -m venv $(VENV)
	@echo "Virtualenv created at $(VENV). Activate with: source $(VENV)/bin/activate"

install: venv
	$(VENV)/bin/pip install -r requirements.txt

test:
	$(VENV)/bin/pytest -q

run-gpt:
	$(VENV)/bin/python backend/scripts/test_gpt.py --prompt "Provide a one-paragraph summary of current sprint status."


seed-data:
	$(VENV)/bin/python backend/scripts/seed_database.py

seed-data-skip:
	$(VENV)/bin/python backend/scripts/seed_database.py --skip core products ml

seed-data-only:
	@echo "Usage: make seed-data-only DATASETS='core products'"
	$(VENV)/bin/python backend/scripts/seed_database.py --only $(DATASETS)
