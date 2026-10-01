# Q-GREEN FLEET

> **Adaptive Maritime Digital Twin**: Physics-informed fuel prediction + classical quantum-inspired multi-objective optimization (Q-GREEN Hybrid: QIGA + QPSO + NSGA-II archive) for joint fleet allocation, routing, speed scheduling, alternative fuel selection, bunkering, and cold ironing (shore power / OPS) under uncertainty and lifecycle-emission constraints.

---

## Honesty Rule & Core Principles
- **Quantum-inspired and classical:** The optimizer algorithms (QPSO, QIGA, Q-GREEN Hybrid) run entirely on classical hardware with no quantum advantage claims.
- **Empirical improvements:** Every improvement percentage shown anywhere is computed by experiments executed directly in this repository.
- **Strict Data Provenance:** Every record, parameter, and API payload carries a verified `Provenance` tag (`measured`, `reported`, `estimated`, `simulated`, `synthetic`).
- **Independent Feasibility Validation:** Constraint satisfaction is verified by an independent `Validator`, never solely by the optimizer's internal repair operators.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│ L6  PRESENTATION   React/TS dashboard · Pareto explorer · Storm mode │
├──────────────────────────────────────────────────────────────────────┤
│ L5  API/ORCH       FastAPI · job runner · WS telemetry · run registry│
├──────────────────────────────────────────────────────────────────────┤
│ L4  DECISION       Optimizers · Pareto archive · Robust (CVaR) ·     │
│                    Explainability · Re-optimizer                     │
├──────────────────────────────────────────────────────────────────────┤
│ L3  DIGITAL TWIN   State · Scenario engine · Evaluator ·             │
│                    Constraint/Compliance validator                   │
├──────────────────────────────────────────────────────────────────────┤
│ L2  MODELS         Fuel (physics+ML+uncertainty) · Fuel catalog /    │
│                    LCA engine · Shore-power model · Delay model      │
├──────────────────────────────────────────────────────────────────────┤
│ L1  DATA           Ingest · Validate · Voyage reconstruction ·       │
│                    Weather join · Feature store (Parquet)            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Quickstart

### 1. Requirements
- Python 3.11+
- Node.js 18+ (for frontend)

### 2. Backend Setup
```bash
py -3.11 -m venv .venv
.venv\Scripts\python.exe -m pip install -e .
.venv\Scripts\python.exe scripts\make_sample_data.py
.venv\Scripts\pytest backend/tests/ -v
```

### 3. Run API Server
```bash
.venv\Scripts\uvicorn backend.app.api.main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.
