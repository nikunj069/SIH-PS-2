"""Unified Plan genome shared across all optimization algorithms.

Every optimizer (Greedy, GA, PSO, NSGA-II, QPSO, QIGA, Q-GREEN Hybrid)
operates on this identical genome representation.
"""

from typing import Dict, Optional
from pydantic import BaseModel, Field
from .provenance import Provenance


class Plan(BaseModel):
    """The complete fleet allocation, routing, speed, fuel, bunkering, and OPS decision plan."""

    plan_id: Optional[str] = Field(None, description="Deterministic hash or identifier of this plan")
    
    # 1. Assignment gene: vessel_id -> route_id (or 'idle')
    assignment: Dict[str, str] = Field(
        ...,
        description="Mapping from vessel_id to assigned route_id (or 'idle')"
    )
    
    # 2. Speed gene: f"{vessel_id}_{leg_id}" -> speed in knots
    speed: Dict[str, float] = Field(
        ...,
        description="Speed in knots for each (vessel_id, leg_id) active combination"
    )
    
    # 3. Fuel gene: f"{vessel_id}_{leg_id}" -> pathway_id
    fuel: Dict[str, str] = Field(
        ...,
        description="Selected fuel pathway for each (vessel_id, leg_id) leg transit"
    )
    
    # 4. Bunker gene: f"{vessel_id}_{port_id}" -> Dict[pathway_id, tonnes]
    bunker: Dict[str, Dict[str, float]] = Field(
        default_factory=dict,
        description="Bunkering quantity in metric tonnes at port for each (vessel, port) pair"
    )
    
    # 5. OPS (shore power / cold ironing) gene: f"{vessel_id}_{port_id}" -> bool
    ops: Dict[str, bool] = Field(
        default_factory=dict,
        description="Binary decision whether to connect to cold-ironing OPS at berth"
    )
    
    provenance: Provenance = Field(
        Provenance.SIMULATED,
        description="Data provenance for this proposed plan"
    )
