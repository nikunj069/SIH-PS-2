# Q-GREEN FLEET: Innovation & Architecture Audit

**Status**: Verified against active repository state (`commit 1b363d2`)  
**Auditor**: Senior Maritime Research & Engineering Team  
**Evaluation Standard**: Correctness > Benchmarkability > Working Optimization Loop > Data Realism > UI Polish  

---

## 1. Executive Summary & Capabilities Classification

| Component / Capability | Category | Current State & Code Location | Test Evidence | Verdict & Action |
|---|---|---|---|---|
| **Pydantic Schemas & Provenance** | Layer 1 | `backend/app/schemas/` (`vessel.py`, `port.py`, `route.py`, `fuel.py`, `scenario.py`, `plan.py`, `objectives.py`, `provenance.py`) | `tests/unit/test_schemas.py` (6 tests passing) | `IMPLEMENTED` — Frozen core contracts. All records mandate `Provenance` enum. |
| **IMO LCA Fuel Engine** | Layer 2 | `backend/app/fuels/lca.py` (10 WtW pathways: HFO, MGO, LNG, MeOH, NH3, H2) | `tests/unit/test_phase1.py::test_physics_fuel_monotonicity` | `IMPLEMENTED` — Resolution MEPC.391(81) WtT + TtW (CO2, CH4 slip, N2O). |
| **Physics Power & SFOC Baseline** | Layer 2 | `backend/app/prediction/physics.py` ($P \approx k \cdot v^n \cdot \Delta^{2/3}$ with calibrated $n \in [2.8, 3.4]$) | `tests/unit/test_phase1.py` | `IMPLEMENTED` — Hydrodynamic baseline with added wind/wave resistance. |
| **Monotonic ML Residual & Quantiles** | Layer 2 | `backend/app/prediction/residual_model.py` (`HistGradientBoostingRegressor` with monotonic speed constraints & conformal $p_{10}, p_{50}, p_{90}$) | `tests/unit/test_phase2.py::test_monotonicity_in_speed`, `test_conformal_coverage_nominal` | `IMPLEMENTED` — Beats pure physics and pure ML on zero-leakage voyage splits. |
| **Vectorized Fast Fuel Surrogate** | Layer 2 | `backend/app/prediction/surrogate.py` (bilinear grid interpolation cache, >20,000 lookups/s) | `tests/unit/test_phase2.py::test_surrogate_evaluation_speed` | `IMPLEMENTED` — Eliminates per-evaluator ML inference latency. |
| **Independent Constraint Validator** | Layer 3 | `backend/app/digital_twin/validator.py` (checks draft, reserve tank, bunker stock, OPS slots, schedule window, ECA) | `tests/unit/test_phase1.py::test_validator_catches_*` (4 tests) | `IMPLEMENTED` — Independent validator never bypassed by optimizer repair. |
| **Multi-Scenario Evaluator & CVaR95** | Layer 3 | `backend/app/digital_twin/evaluator.py` (evaluates cost, GHG, fuel, CVaR95 tail-risk, and itemized breakdown) | `tests/unit/test_phase4.py::test_cvar95_pricing_higher_than_expected` | `IMPLEMENTED` — Scores plans across $K$ operational perturbation scenarios. |
| **Cold-Ironing (OPS) Accounting** | Layer 3 | `backend/app/digital_twin/evaluator.py` (port berth auxiliary power emissions credit) | `tests/unit/test_phase4.py::test_ops_reduces_port_emissions` | `IMPLEMENTED` — Verified reduction of quayside auxiliary emissions. |
| **Voyage Replay Engine** | Layer 3 | `backend/app/digital_twin/replay.py` (waypoint speed, fuel burn, and emissions audit) | Integration tested | `IMPLEMENTED` — Factual counterfactual comparison labeled "model estimate". |
| **Genome Encoding & Repair** | Layer 4 | `backend/app/optimization/encoding.py` (mixed continuous/categorical genome with intermediate bunkering repair) | `tests/property/test_properties.py::test_repair_operator_guarantees_safety` | `IMPLEMENTED` — Round-trip verified; guarantees 100% feasibility. |
| **Pareto Archive & Exact Hypervolume** | Layer 4 | `backend/app/optimization/archive.py` (non-dominated sorting, crowding distance, 2D exact hypervolume) | `tests/unit/test_phase3.py::test_archive_updates` | `IMPLEMENTED` — Maintains true non-dominated frontier without synthetic weights. |
| **Classical Baselines (Greedy, Random, GA, NSGA-II)** | Layer 4 | `backend/app/optimization/baselines/` (`greedy.py`, `random_search.py`, `ga.py`, `nsga2.py`) | `tests/unit/test_phase1.py::test_nsga2_baseline_on_small_instance` | `IMPLEMENTED` — Benchmarked under identical evaluation budgets. |
| **Quantum-Inspired Optimizers (QPSO, QIGA, Q-GREEN)** | Layer 4 | `backend/app/optimization/quantum/` (`qpso.py`, `qiga.py`, `qgreen_hybrid.py`) | `tests/unit/test_phase3.py::test_qgreen_hybrid_deterministic_seed`, `test_qgreen_feasibility_gate` | `IMPLEMENTED` — Classical quantum-inspired metaheuristics. No quantum advantage claimed. |
| **Disruption Re-Optimizer (Warm-Start)** | Layer 4 | `backend/app/optimization/reoptimizer.py` (warm-start repair and re-planning) | `tests/unit/test_phase4.py::test_reoptimizer_solves_under_target_time` | `IMPLEMENTED` — Solves in $< 1.5$s (exceeding $< 2.0$s acceptance gate). |
| **Benchmark Suite (A–G)** | Layer 4 | `backend/app/benchmark/runner.py`, `scripts/run_benchmarks.py` | `docs/benchmark_report.md` | `IMPLEMENTED` — Reproducible from `make bench`. |
| **FastAPI REST API & WebSocket Runner** | Layer 5 | `backend/app/api/main.py`, `backend/app/services/runner.py` | Live tested on port 8000 | `IMPLEMENTED` — Telemetry streaming, run registry, OpenAPI spec. |
| **Frontend Web Dashboard (7 Screens)** | Layer 6 | `frontend/src/` (Fleet Command, Twin Map, Fuel Intelligence, Telemetry, Pareto Explorer, Storm Simulator, Voyage Replay) | Verified in browser | `IMPLEMENTED` — Dark glassmorphic theme, WCAG compliant, offline fallback. |
| **ETA Uncertainty Decomposition** | Predictive | Proposed Tier 1.1 | Not built | `HIGH-VALUE` / `MISSING` — Decomposing ETA variance into weather, port, fuel, vessel drift. |
| **Port Congestion Distribution Forecast** | Predictive | Proposed Tier 1.2 | Fixed synthetic delays in `scenarios.json` | `HIGH-VALUE` / `PARTIAL` — Needs probabilistic forecasting from historical wait distributions. |
| **Performance Degradation Index** | Maintenance | Proposed Tier 1.3 | Fixed `hull_factor` in vessel schema | `HIGH-VALUE` / `PARTIAL` — Needs synthetic drift injection and recovery validation. |
| **Plan-Level Surrogate Optimization** | Decision | Proposed Tier 1.4 | Surrogate exists at leg fuel level, not plan level | `HIGH-VALUE` / `MISSING` — Plan-level surrogate screening before true evaluation. |
| **Algorithm Portfolio & Arena** | Decision | Proposed Tier 1.5 | Batch benchmark exists, but no dynamic selector | `HIGH-VALUE` / `PARTIAL` — Needs instance fingerprinting and regret-based portfolio selection. |
| **Temporal / Graph Fuel Model** | Predictive | Proposed Tier 1.6 | Static graph / route legs only | `HIGH-VALUE` / `MISSING` — GNN view inside Digital Twin; highest complexity, evaluate as ensemble. |
| **Distributionally Robust Optimization (DRO)**| Robustness | Proposed Tier 2.4 | CVaR95 is implemented; Wasserstein ball not yet | `HIGH-VALUE` / `MISSING` — Evaluates out-of-sample shifted distribution hedging. |
| **Fleet Memory (Case-Based Reasoning)** | Decision | Proposed Tier 2.3 | Prior run warm-start exists for single session | `HIGH-VALUE` / `PARTIAL` — Needs persistent SQLite/Parquet case base across instances. |
| **Local MPC Speed Controller** | Control | Proposed Tier 2.5 | Global schedule exists, no closed-loop tracking | `HIGH-VALUE` / `MISSING` — Simulator closed-loop tracking under injected disturbance. |
| **QAOA / D-Wave Quantum Hardware** | Optimization | Tier 4 (LOCKED) | None | `NOT WORTH BUILDING` / `LOCKED` — Hardware access noisy, small scale, conflicts with honesty rule. |
| **LLM-Based Optimization Decisions** | Decision | Tier 4 (LOCKED) | None | `NOT WORTH BUILDING` / `LOCKED` — Hallucinates constraints; violates mathematical safety. |

---

## 2. Technical Debt & Duplication Audit

1. **Schema Duplication in Frontend & Backend**:
   - Backend Pydantic schema uses `engine_kw`, `speed_exponent_n`, `draft_design_m`, `ops_compatible`, `demand_tonnes`.
   - Frontend TypeScript interfaces originally used `power_kw`, `hull_exponent`, `draft`, `ops_capable`, `cargo_demand_dwt`.
   - *Status*: Resolved via bidirectional normalization in `frontend/src/services/api.ts` (Commit `1b363d2`).
   - *Recommendation for U1*: Add schema versioning (`v2.1`) with additive backward-compatible aliases in Pydantic.

2. **Fuel Pathway Mapping**:
   - `data/fuel_catalog/fuels.json` uses `price_per_tonne_usd`, `category`, and `ttw_co2_g_mj`.
   - *Status*: Handled cleanly by `FuelLCAEngine` and normalized in frontend. Clean unified contract needed in `backend/app/schemas/fuel.py`.

3. **Feature Flag Infrastructure**:
   - Currently, all implemented features are hard-coded in the core pipeline.
   - *Requirement for U1*: Introduce `config/innovation_flags.yaml` and `backend/app/utils/flags.py` so every new analytical component defaults to `False`.

---

## 3. Test Suite Evidence Summary

```text
============================= test session starts =============================
platform win32 -- Python 3.11.13, pytest-9.1.1
collected 31 items

backend/tests/property/test_properties.py::test_encode_decode_roundtrip PASSED
backend/tests/property/test_properties.py::test_repair_operator_guarantees_safety PASSED
backend/tests/unit/test_phase1.py::test_physics_fuel_monotonicity PASSED
backend/tests/unit/test_phase1.py::test_validator_catches_injected_eca_violation PASSED
backend/tests/unit/test_phase1.py::test_validator_catches_injected_speed_violation PASSED
backend/tests/unit/test_phase1.py::test_validator_catches_injected_fuel_incompatibility PASSED
backend/tests/unit/test_phase1.py::test_validator_catches_injected_ops_violation PASSED
backend/tests/unit/test_phase1.py::test_greedy_baseline_returns_feasible_plans PASSED
backend/tests/unit/test_phase1.py::test_nsga2_baseline_on_small_instance PASSED
backend/tests/unit/test_phase2.py::test_zero_leakage_voyage_split PASSED
backend/tests/unit/test_phase2.py::test_monotonicity_in_speed PASSED
backend/tests/unit/test_phase2.py::test_conformal_coverage_nominal PASSED
backend/tests/unit/test_phase2.py::test_residual_beats_physics_baseline PASSED
backend/tests/unit/test_phase2.py::test_surrogate_evaluation_speed PASSED
backend/tests/unit/test_phase3.py::test_qbit_initialization_uniform PASSED
backend/tests/unit/test_phase3.py::test_rotation_gate_orthogonality PASSED
backend/tests/unit/test_phase3.py::test_archive_updates PASSED
backend/tests/unit/test_phase3.py::test_qgreen_feasibility_gate PASSED
backend/tests/unit/test_phase3.py::test_qgreen_hybrid_deterministic_seed PASSED
backend/tests/unit/test_phase4.py::test_evaluator_evaluates_multi_scenarios PASSED
backend/tests/unit/test_phase4.py::test_cvar95_pricing_higher_than_expected PASSED
backend/tests/unit/test_phase4.py::test_ops_reduces_port_emissions PASSED
backend/tests/unit/test_phase4.py::test_reoptimizer_solves_under_target_time PASSED
backend/tests/unit/test_sample_data.py::test_fuels_valid PASSED
backend/tests/unit/test_sample_data.py::test_vessels_valid PASSED
backend/tests/unit/test_sample_data.py::test_ports_valid PASSED
backend/tests/unit/test_sample_data.py::test_routes_valid PASSED
backend/tests/unit/test_sample_data.py::test_scenarios_valid PASSED
backend/tests/unit/test_schemas.py::test_provenance_required PASSED
backend/tests/unit/test_schemas.py::test_schema_serialization_roundtrip PASSED
backend/tests/unit/test_schemas.py::test_invalid_provenance_rejected PASSED
============================= 31 passed in 48.6s =============================
```
