.PHONY: help install test test-unit test-property sample run-backend run-frontend

help:
	@echo "Q-GREEN FLEET Commands:"
	@echo "  make install       - Install backend Python dependencies"
	@echo "  make sample        - Generate deterministic sample data and fuel catalog"
	@echo "  make test          - Run all pytest suites"
	@echo "  make test-unit     - Run unit tests"
	@echo "  make test-property - Run property-based Hypothesis tests"
	@echo "  make bench         - Run full benchmark suite and generate report"
	@echo "  make run-backend   - Start FastAPI server on port 8000"
	@echo "  make run-frontend  - Start Vite dev server on port 5173"

bench:
	.venv\Scripts\python.exe scripts\run_benchmarks.py

install:
	.venv\Scripts\python.exe -m pip install -e .

sample:
	.venv\Scripts\python.exe scripts\make_sample_data.py

test:
	.venv\Scripts\pytest backend/tests/ -v

test-unit:
	.venv\Scripts\pytest backend/tests/unit -v

test-property:
	.venv\Scripts\pytest backend/tests/property -v

run-backend:
	.venv\Scripts\uvicorn backend.app.api.main:app --host 0.0.0.0 --port 8000 --reload

run-frontend:
	npm --prefix frontend run dev
