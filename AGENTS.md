# AGENTS.md — Q-GREEN FLEET Agent Guardrails & Principles

## Principles (Ranked)
`correctness > benchmarkability > working optimization loop > data realism > UI polish > extras`

1. **Deterministic demo mode with cached sample data.** Must run fully offline.
2. **Layered pure-Python core.** Every module has a pure-Python core (no web/DB imports) + thin adapters. Optimizer and digital twin are importable libraries.
3. **Seeds everywhere.** Same seed -> same Pareto front and results.
4. **No fabricated numbers.** Placeholders render as `—` until computed. Every improvement figure shown anywhere must be computed by an experiment in this repo.
5. **Feasibility checked independently.** Feasibility is checked by an independent validator, never solely by the optimizer's own repair step.
6. **Honesty rule:** The optimizer is *quantum-inspired and classical*. No quantum-advantage claims.
7. **Provenance is mandatory:** `Provenance` enum (`measured`, `reported`, `estimated`, `simulated`, `synthetic`) is a required field on every data record and API output.

## Agent Guardrails (Non-negotiable)
- **Never**:
  - Fabricate measured fuel data or benchmark gains.
  - Call synthetic data real.
  - Claim quantum advantage.
  - Claim regulatory compliance without verified current rules.
  - Treat "green fuel" as a label (use WtW pathways).
  - Present a toy TSP as the whole system.
  - Ignore uncertainty in reliability claims.
  - Pick only benchmarks the algorithm wins.
- **Always**:
  - Separate fact / assumption / estimate.
  - Prefer official sources (IMO, EC, EMSA, NOAA, Copernicus, EMODnet, Eurostat).
  - Log seeds and configuration.
  - Check for data leakage across voyage/vessel/time splits.
  - Validate feasibility independently.
  - Keep a deterministic offline demo.
  - Verify licenses before using external open-source code.

## Layered Architecture & Dependency Rule
A layer may import only from layers **below** it:
- L6: Presentation (`frontend`)
- L5: API & Orchestration (`backend/app/api`)
- L4: Decision & Optimization (`backend/app/optimization`, `backend/app/explainability`, `backend/app/benchmark`)
- L3: Digital Twin (`backend/app/digital_twin`, `backend/app/scenarios`)
- L2: Models (`backend/app/prediction`, `backend/app/fuels`, `backend/app/compliance`)
- L1: Data (`backend/app/data`, `backend/app/schemas`, `backend/app/utils`)
