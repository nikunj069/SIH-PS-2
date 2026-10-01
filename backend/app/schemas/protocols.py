"""Protocols and core contracts for Digital Twin, Prediction, and Optimization layers.

These abstract interfaces ensure strict decoupling and enable clean interchangeable
implementations of optimizers, predictors, evaluators, and validators.
"""

from typing import Any, Callable, Dict, List, Optional, Protocol, runtime_checkable
from pydantic import BaseModel, Field
from .vessel import Vessel
from .port import Port
from .route import Route
from .fuel import FuelPathway
from .scenario import Scenario
from .plan import Plan
from .objectives import ObjectiveVector, Breakdown
from .reports import ConstraintReport, EvaluationResult, ParetoSolution
from .telemetry import RunTelemetry
from .provenance import Provenance


class FuelPredictionInput(BaseModel):
    """Input parameters for a single leg or segment fuel prediction."""

    vessel_id: str
    speed_knots: float = Field(..., gt=0)
    draft_m: float = Field(..., gt=0)
    displacement_tonnes: float = Field(..., gt=0)
    wave_height_m: float = Field(1.5, ge=0)
    wind_speed_knots: float = Field(12.0, ge=0)
    relative_wind_angle_deg: float = Field(0.0, ge=0, le=360)
    current_knots: float = Field(0.0)
    pathway_id: str = "hfo"
    duration_hours: float = Field(..., gt=0)
    provenance: Provenance = Field(Provenance.ESTIMATED)


class Quantiles(BaseModel):
    """Calibrated quantile predictions with conformal uncertainty bands."""

    p10: float = Field(..., description="10th percentile conservative lower bound")
    p50: float = Field(..., description="50th percentile median expected estimate")
    p90: float = Field(..., description="90th percentile upper bound for robust worst-case")
    confidence: float = Field(0.80, ge=0.0, le=1.0, description="Nominal confidence coverage [p10, p90]")
    provenance: Provenance = Field(Provenance.ESTIMATED)


class DigitalTwinState(BaseModel):
    """Snapshot of the maritime operational environment."""

    vessels: Dict[str, Vessel]
    ports: Dict[str, Port]
    routes: Dict[str, Route]
    fuel_catalog: Dict[str, FuelPathway]
    current_time_epoch_h: float = 0.0
    provenance: Provenance = Field(Provenance.SIMULATED)


class ProblemDefinition(BaseModel):
    """Self-contained optimization problem instance."""

    name: str = "Standard-Fleet-Dispatch"
    twin_state: DigitalTwinState
    active_scenarios: List[Scenario]
    budget_evals: int = Field(2000, gt=0)
    seed: int = 42
    weights: Dict[str, float] = Field(
        default_factory=lambda: {"cost": 0.45, "ghg": 0.40, "risk": 0.15}
    )
    provenance: Provenance = Field(Provenance.SYNTHETIC)


@runtime_checkable
class FuelPredictorProtocol(Protocol):
    """Protocol for physics + ML fuel prediction engines."""

    def predict(self, batch: List[FuelPredictionInput]) -> List[Quantiles]:
        """Predict fuel consumption with p10/p50/p90 quantiles for a batch of segments."""
        ...


@runtime_checkable
class ValidatorProtocol(Protocol):
    """Protocol for independent constraint checking (never coupled to optimizer repair)."""

    def validate(self, plan: Plan, state: DigitalTwinState) -> ConstraintReport:
        """Verify whether a candidate plan satisfies all physical, cargo, and regulatory constraints."""
        ...


@runtime_checkable
class EvaluatorProtocol(Protocol):
    """Protocol for scoring plans across scenarios."""

    def evaluate(self, plan: Plan, scenarios: List[Scenario]) -> EvaluationResult:
        """Compute expected objectives, CVaR95 risk, and explainability breakdown."""
        ...


@runtime_checkable
class OptimizerProtocol(Protocol):
    """Protocol implemented identically by all optimizers."""

    def optimize(
        self,
        problem: ProblemDefinition,
        evaluator: EvaluatorProtocol,
        validator: ValidatorProtocol,
        telemetry_callback: Optional[Callable[[RunTelemetry], None]] = None,
    ) -> List[ParetoSolution]:
        """Execute optimization within fixed evaluation budget and return Pareto archive."""
        ...
