VENV := .venv
PYTHON := $(VENV)/bin/python
PYTEST := $(VENV)/bin/pytest
RUFF   := $(VENV)/bin/ruff
MYPY   := $(VENV)/bin/mypy

.PHONY: install test lint format

$(VENV):
	uv venv $(VENV)

install: $(VENV)
	uv pip install --python $(PYTHON) -e ".[dev]"

test: install
	$(PYTEST)

lint: install
	$(RUFF) check src tests
	$(MYPY) src

format: install
	$(RUFF) check --fix src tests
	$(RUFF) format src tests
