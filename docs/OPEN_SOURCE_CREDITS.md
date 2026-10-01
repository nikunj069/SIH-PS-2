# Q-GREEN FLEET: Open-Source Software & Licensing Credits

**Governance Rule**: Verify licenses before copying or referencing external open-source code. Never copy repositories wholesale. Reimplement pure-Python cores with mathematical citations where appropriate.

---

## 1. Candidate Repositories & License Audit

| Repository / Package | Author / Organization | Official License | Attribution Required? | Maintenance / Activity | Quality Score (1-5) | Project Status | Decision | Architectural Rationale |
|---|---|---|---|---|---|---|---|---|
| **pymoo** | Blank & Deb (MSU / COIN Lab) | Apache 2.0 | Yes (NOTICE + License) | Active (v0.6+) | 5/5 | Installed in `.venv` | **Dependency** | Core baseline for NSGA-II non-dominated sorting and crowding distance calculations. Clean, robust, well-tested. |
| **searoute-py / searoute** | Eurostat / C. Jouneau | MIT | Yes (Copyright notice) | Active | 4/5 | None | **Ideas Only** | Uses GeoJSON fairways for shortest path routing between ports. We use exact georeferenced corridors in `data/sample/routes.json` with bathymetry depth checks. |
| **windmar** | Maritime Engineering Research | MIT | Yes | Low / Archived | 3/5 | None | **Ideas Only** | Wave resistance equations based on empirical towing tank regressions. Hydrodynamic wave formulas implemented cleanly in `backend/app/prediction/physics.py`. |
| **ngroup/qpso** | NGroup Research | GPL v3.0 | Yes (GPL copyleft risk) | Low activity | 2/5 | None | **Reject / Reimplement** | GPL v3 copyleft introduces license contamination risk. Reimplemented pure-Python classical QPSO from Sun et al. (2004) equations in `backend/app/optimization/quantum/qpso.py`. |
| **py-open-IMO-CII-calculator** | Maritime Open Source | MIT | Yes | Low activity | 3/5 | None | **Ideas Only** | Implements IMO Carbon Intensity Indicator (CII) rating curves (A to E). Verified directly against official IMO MEPC.354(78) resolution. |
| **spartalab/port-simulation** | SpartaLab | MIT | Yes | Moderate | 3/5 | None | **Ideas Only** | Discrete-event berth simulation. Too slow for direct inclusion in candidate evaluation loops; inspirator for the port congestion Markov waiting distribution. |
| **USEPA Marine_Emissions_Tools** | US Environmental Protection Agency | Public Domain / CC0 | No (Federal Gov work) | Periodic updates | 4/5 | None | **Ideas Only** | Harbor craft and auxiliary boiler emission factors. Data adapted into our IMO MEPC.391(81) WtW LCA engine for port auxiliary emissions. |
| **BoTorch** | Meta AI Research | MIT | Yes | Very Active | 5/5 | None | **Ideas Only** | State-of-the-art Bayesian optimization. Heavy PyTorch dependency not suitable for core offline demo; plan-level surrogate screening will use pure-Python Gaussian Process / scikit-learn. |
| **PyTorch Geometric (PyG)** | Fey, Lenssen et al. | MIT | Yes | Very Active | 5/5 | Not in core | **Optional [research]** | Isolated to optional `[research]` extra for Stage U4 experimental dynamic GNN view. Core engine and offline demo must never require it. |
| **SimPy** | Team SimPy | MIT | Yes | Stable | 4/5 | None | **Reject** | Process-based discrete-event simulation engine. Not vectorized; creates massive CPU bottleneck if evaluated inside multi-generation optimization loops. |
| **Mesa** | Project Mesa | Apache 2.0 | Yes | Active | 4/5 | None | **Reject** | Agent-based modeling framework. Belongs to Tier 3 (locked); out of scope for joint fleet Pareto scheduling. |
| **Stable-Baselines3** | DLR-RM / Raffin et al. | MIT | Yes | Very Active | 5/5 | None | **Reject** | Deep Reinforcement Learning suite. Belongs to Tier 3 (locked); RL maritime routing is unstable under non-stationary weather without huge training regimes. |
| **Gymnasium** | Farama Foundation | MIT | Yes | Active | 5/5 | None | **Reject** | Standard RL environment API. Locked under Tier 3. |

---

## 2. Active Core Python Dependencies (`pyproject.toml`)

```toml
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn>=0.30.0",
    "pydantic>=2.8.0",
    "numpy>=1.26.0",
    "scipy>=1.13.0",
    "pandas>=2.2.0",
    "scikit-learn>=1.5.0",
    "pymoo>=0.6.1",
    "pyyaml>=6.0.0",
    "websockets>=12.0"
]
```
All core dependencies carry permissive commercial licenses (**MIT**, **BSD-3-Clause**, or **Apache 2.0**). Zero copyleft contamination.
