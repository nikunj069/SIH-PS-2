"""Constraint verification report, evaluation result, and Pareto solution schemas."""

from typing import List, Optional
from pydantic import BaseModel, Field
from .plan import Plan
from .objectives import ObjectiveVector, Breakdown
from .provenance import Provenance


class ConstraintReport(BaseModel):
    """Detailed report from the independent constraint validator."""

    is_feasible: bool = Field(..., description="True if and only if all physical and regulatory constraints pass")
    violations: List[str] = Field(default_factory=list, description="List of specific constraint violation messages")
    draft_ok: bool = Field(True, description="Vessel draft does not exceed port fairway or berth depths")
    tank_ok: bool = Field(True, description="Tank capacity and reserve thresholds are respected")
    compat_ok: bool = Field(True, description="Selected fuel pathway is supported by the vessel's propulsion plant")
    cargo_ok: bool = Field(True, description="Vessel capacity satisfies cargo demand on assigned routes")
    ops_ok: bool = Field(True, description="OPS selected only where both vessel and port infrastructure support it")
    eca_ok: bool = Field(True, description="High-sulfur / non-compliant fuel is never used in Emission Control Areas")
    speed_bounds_ok: bool = Field(True, description="All speeds are within [v_min, v_max] safe envelope")
    bunker_availability_ok: bool = Field(True, description="Bunkered volumes do not exceed local port stock or encounter outages")
    penalty_score: float = Field(0.0, ge=0.0, description="Sum of penalty weights for optimizer soft-guidance")
    provenance: Provenance = Field(Provenance.SIMULATED, description="Provenance of validation report")


class EvaluationResult(BaseModel):
    """Comprehensive evaluation returned for every candidate plan."""

    objectives: ObjectiveVector = Field(..., description="Evaluated objective metrics")
    constraints: ConstraintReport = Field(..., description="Independent feasibility report")
    breakdown: Breakdown = Field(..., description="Itemized cost, emission, and leg metrics")
    plan_id: Optional[str] = Field(None, description="Identifier of the evaluated plan")
    provenance: Provenance = Field(Provenance.SIMULATED, description="Provenance of evaluation outcome")


class ParetoSolution(BaseModel):
    """A non-dominated solution in the Pareto optimal frontier."""

    solution_id: str = Field(..., description="Unique solution identifier, e.g. SOL_001")
    plan: Plan = Field(..., description="The complete decision plan")
    evaluation: EvaluationResult = Field(..., description="The evaluated performance vector")
    rank: int = Field(1, ge=1, description="Non-domination rank (1 = Pareto front)")
    crowding_distance: float = Field(0.0, ge=0.0, description="NSGA-II crowding distance for diversity maintenance")
    provenance: Provenance = Field(Provenance.SIMULATED, description="Provenance of solution")
