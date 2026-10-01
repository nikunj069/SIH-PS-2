# Q-GREEN FLEET: Innovation Roadmap & Analytical Scope

**Evaluation Rule**: Every prospective innovation starts behind a feature flag defaulting to `OFF`. It is promoted to `ON` only after beating its benchmark on matched evaluations (≥30 seeds or ≥5 voyage-split folds) without compromising feasibility, latency, or conformal coverage.

---

## 1. Scope Recommendations Summary

| Tier | Module ID | Name | Recommendation | Data Available | Promotion Evidence Required |
|---|---|---|---|---|---|
| **Tier 1** | **1.1** | **ETA Distribution & Conformal Decomposition** | **BUILD (High Priority)** | ERA5 weather severity, leg fairway lengths, vessel speed curves | Nominal-90% interval coverage within ±5 pts on held-out voyages; variance attribution sums to 100% within tolerance. |
| **Tier 1** | **1.2** | **Port Congestion Probabilistic Forecast** | **BUILD (High Priority)** | Port stay distributions in `data/sample/ports.json`, historical turnaround variance | Beats seasonal-naive baseline on Continuous Ranked Probability Score (CRPS); well-calibrated. |
| **Tier 1** | **1.3** | **Performance Degradation Index** | **BUILD (High Priority)** | Physics Admiralty baseline, synthetic linear/exponential fouling injection | Recovers injected drift within ±8% error margin; false positive rate on clean hulls < 5%. |
| **Tier 1** | **1.4** | **Plan-Level Surrogate Optimization** | **BUILD (High Priority)** | High-throughput synthetic plan evaluations, genome feature representations | Spearman rank correlation $\rho \ge 0.85$; equal or higher hypervolume with $\ge 30\%$ fewer true Evaluator calls. |
| **Tier 1** | **1.5** | **Algorithm Portfolio & Arena** | **BUILD (High Priority)** | 6 benchmark instance families (small, medium, storm, fuel shock, port congestion, large) | Portfolio achieves lower average regret than any single fixed optimizer across held-out instance families. |
| **Tier 1** | **1.6** | **Temporal / Graph Fuel Model (GNN View)** | **EXPERIMENT (Behind `[research]`)** | Digital Twin node/edge connectivity, dynamic sea-state vectors | Must improve voyage-split RMSE by $\ge 5\%$ over HistGradientBoosting baseline without exceeding 5ms latency. |
| **Tier 2** | **2.1** | **Trust / Disagreement Engine** | **BUILD (Conditional on 1.6)** | Multi-model predictions (Physics, HistGradient, Surrogate) | Disagreement score strictly correlates with absolute test error ($r \ge 0.60$). |
| **Tier 2** | **2.2** | **Adaptive Operator Learning** | **BUILD** | Mutation / crossover operator success history in Q-GREEN | Better hypervolume or evals-to-target than uniform random operator selection. |
| **Tier 2** | **2.3** | **Fleet Memory (Case-Based Reasoning)** | **BUILD** | SQLite store of instance fingerprints, Pareto plans, regimes | Warm-start from historical instances achieves target hypervolume $\ge 2\times$ faster than cold start. |
| **Tier 2** | **2.4** | **Distributionally Robust Optimization (DRO)**| **BUILD** | Wasserstein ambiguity ball $\mathcal{B}_\epsilon(\hat{\mathbb{P}})$ around scenarios | Out-of-sample cost on shifted storm/fuel shock distributions $\le$ nominal stochastic optimization. |
| **Tier 2** | **2.5** | **Local MPC Speed Controller** | **BUILD** | Dynamic voyage simulator with injected gust and wave drift | Lower total fuel deviation from optimal plan under unforecasted head-seas; solve time $< 50$ms. |
| **Tier 2** | **2.6** | **Regret & Resilience Metrics** | **BUILD** | Realized scenario costs vs hindsight ex-post optimal cost | Mathematically verified on toy deterministic cases ($Regret \ge 0$ always). |
| **Tier 2** | **2.7** | **Maintenance-for-Mission** | **BUILD** | Drydock cleaning costs, bunker fuel prices, degradation index | Net Present Value break-even point unit-tested; supports INR and USD formatting. |
| **Tier 2** | **2.8** | **Sensitivity & "Why This Plan?" v2** | **BUILD** | Real Evaluator counterfactual single-intervention runs | 100% of reported deltas match exact Evaluator outputs; zero LLM hallucination. |
| **Tier 2** | **2.9** | **Scenario Morphing** | **CUT / DEFER** | Correlated joint distributions | High risk of over-complicating benchmark generation without clear operational gain; defer to after SIH. |
| **Tier 2** | **2.10**| **Marginal Abatement Cost Curve (MACC)** | **BUILD** | Verified IMO MEPC.391(81) WtW fuel pathways & carbon prices | Abatement curve monotonically non-decreasing in USD/tCO₂e avoided. |
| **Tier 3** | **3.1-3.6**| **Green Corridors, RL Routing, Agent Ports** | **LOCKED** | Out of scope | Requires external approval; do not start. |
| **Tier 4** | **4.1-4.3**| **QAOA/D-Wave, Federated Learning, LLM** | **LOCKED** | Out of scope | Violates honesty rule / hardware constraints; do not start. |

---

## 2. Recommended Scope Cuts & Rationale

1. **Cut: Scenario Morphing via High-Dimensional Copulas (2.9)**  
   *Rationale*: The current 6 discrete operational scenarios (`data/scenarios/scenarios.json`) provide clear, explainable, and reproducible perturbations (typhoon, canal delay, fuel shock, carbon shock). Introducing parametric Gaussian or Clayton copulas adds statistical opacity without changing Pareto ranking dynamics.

2. **Cut: Heavy Process Simulation (SimPy / Mesa)**  
   *Rationale*: Simulating individual port crane movements and tugboat schedules destroys evaluation throughput (>20,000 lookups/s needed for 300-eval Pareto optimization). We use analytical Markov queuing turnaround distributions instead.

3. **Isolate: PyG Graph Neural Networks to `[research]` Extra (1.6)**  
   *Rationale*: PyTorch and PyTorch Geometric add 1.8 GB of wheel dependencies and introduce binary compilation fragility on Windows/Linux environments. The offline deterministic demo must run purely on lightweight NumPy/SciPy/scikit-learn.

---

## 3. Promotion Gates & Verification Workflow

```text
[New Innovation Module] 
         │
         ▼
[Default: OFF in innovation_flags.yaml]
         │
         ▼
[Run Matched Benchmark (>=30 Seeds, Voyage-Split)]
         │
         ├──> Beats Baseline + Zero Constraint Regressions? 
         │        ├── YES: Promote to ON (document in docs/DECISIONS.md)
         │        └── NO:  Keep OFF (document in docs/NEGATIVE_RESULTS.md)
```
