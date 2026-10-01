"""Scenario generation and digital twin uncertainty representation."""

from enum import Enum
from typing import Dict, List, Tuple
from pydantic import BaseModel, Field
from .provenance import Provenance


class ScenarioType(str, Enum):
    """Categories of operational uncertainties and disruptions."""

    NOMINAL = "nominal"
    STORM = "storm"
    CONGESTION = "congestion"
    FUEL_SHOCK = "fuel_shock"
    CARBON_SHOCK = "carbon_shock"
    DEMAND_SHOCK = "demand_shock"
    BUNKER_OUTAGE = "bunker_outage"


class Scenario(BaseModel):
    """An operational scenario realization with environmental, market, and port modifiers."""

    scenario_id: str = Field(..., description="Unique scenario identifier, e.g. SCN_STORM_001")
    name: str = Field(..., description="Human-readable scenario title")
    scenario_type: ScenarioType = Field(ScenarioType.NOMINAL, description="Classification of the disruption")
    weather_multiplier: float = Field(1.0, ge=0.5, le=3.0, description="Multiplier on wave/wind added resistance")
    port_delay_hours: Dict[str, float] = Field(default_factory=dict, description="Port ID to added berth delay hours")
    fuel_price_multipliers: Dict[str, float] = Field(default_factory=dict, description="Pathway ID to price surge multiplier")
    carbon_tax_usd_tonne: float = Field(80.0, ge=0.0, description="ETS / IMO carbon tax price in USD per tonne CO2e")
    bunker_outages: List[Tuple[str, str]] = Field(
        default_factory=list,
        description="List of (port_id, pathway_id) pairs experiencing temporary supply stockouts"
    )
    seed: int = Field(42, description="RNG seed used to generate this scenario")
    probability: float = Field(1.0, gt=0.0, le=1.0, description="Monte Carlo weighting / scenario probability")
    provenance: Provenance = Field(Provenance.SIMULATED, description="Data provenance of scenario parameters")
