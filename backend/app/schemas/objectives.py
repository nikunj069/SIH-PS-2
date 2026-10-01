"""Objective vector and cost/emission breakdown schemas."""

from typing import Any, Dict, List
from pydantic import BaseModel, Field
from .provenance import Provenance


class ObjectiveVector(BaseModel):
    """The multi-objective performance vector evaluated across scenarios."""

    total_cost_usd: float = Field(..., description="Expected total operating cost across all scenarios (fuel, ops, carbon tax, delay)")
    wtw_ghg_tonnes: float = Field(..., description="Expected Well-to-Wake greenhouse gas emissions in metric tonnes CO2e")
    fuel_consumed_tonnes: float = Field(..., description="Expected total fuel mass consumed in metric tonnes")
    cvar95_cost_usd: float = Field(..., description="Conditional Value at Risk (95th percentile worst-case cost)")
    eta_risk_prob: float = Field(..., ge=0.0, le=1.0, description="Probability of exceeding contractual arrival deadlines: P(ETA > deadline)")
    total_time_hours: float = Field(0.0, ge=0.0, description="Expected fleet voyage and waiting duration in hours")
    provenance: Provenance = Field(Provenance.SIMULATED, description="Provenance of evaluation metrics")


class Breakdown(BaseModel):
    """Detailed explainable breakdown of costs, emissions, and schedule."""

    fuel_costs_usd: Dict[str, float] = Field(default_factory=dict, description="Fuel cost by pathway ID")
    ops_costs_usd: float = Field(0.0, description="Total Onshore Power Supply electricity cost")
    carbon_tax_cost_usd: float = Field(0.0, description="Emissions tax / ETS compliance cost")
    delay_penalties_usd: float = Field(0.0, description="Contractual delay penalty charges")
    ghg_by_pathway_tonnes: Dict[str, float] = Field(default_factory=dict, description="CO2e tonnes emitted by fuel pathway")
    leg_breakdowns: List[Dict[str, Any]] = Field(default_factory=list, description="Per-vessel and per-leg detailed metrics")
    provenance: Provenance = Field(Provenance.SIMULATED, description="Provenance of breakdown metrics")
