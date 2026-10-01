"""Real-time optimization run telemetry and streaming schema."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from .provenance import Provenance


class RunTelemetry(BaseModel):
    """Streaming progress snapshot emitted by optimizers during execution."""

    run_id: str = Field(..., description="Unique optimization task run identifier")
    algorithm: str = Field(..., description="Active optimizer algorithm name (e.g. Q-GREEN-Hybrid, NSGA-II, PSO)")
    generation: int = Field(..., ge=0, description="Current generation or iteration index")
    evaluations_used: int = Field(..., ge=0, description="Total objective evaluations consumed so far")
    budget_evals: int = Field(..., gt=0, description="Total budget of evaluations allocated")
    hypervolume: float = Field(0.0, ge=0.0, description="Current Pareto archive hypervolume relative to reference point")
    feasible_rate: float = Field(..., ge=0.0, le=1.0, description="Fraction of candidate plans that pass independent validation [0.0 - 1.0]")
    best_cost_usd: float = Field(..., description="Lowest cost observed among feasible solutions")
    best_ghg_tonnes: float = Field(..., description="Lowest GHG emissions observed among feasible solutions")
    seed: int = Field(..., description="Reproducibility seed for this run")
    elapsed_time_s: float = Field(..., ge=0.0, description="Wall-clock time elapsed in seconds")
    converged: bool = Field(False, description="True if termination criteria or budget exhaustion met")
    q_state_summary: Optional[Dict[str, float]] = Field(
        None,
        description="Quantum-inspired bit probability entropy or mean attractor distance (for QIGA/QPSO)"
    )
    provenance: Provenance = Field(Provenance.SIMULATED, description="Telemetry provenance")
