"""Vessel specifications and operational characteristics."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from .provenance import Provenance


class Vessel(BaseModel):
    """Specification of a commercial cargo vessel in the fleet."""

    vessel_id: str = Field(..., description="Unique vessel identifier, e.g. IMO9811000")
    name: str = Field(..., description="Vessel commercial name")
    vessel_type: str = Field(..., description="Vessel type: Container, Bulk Carrier, Tanker")
    dwt: float = Field(..., gt=0, description="Deadweight tonnage in metric tonnes")
    capacity_teu: Optional[int] = Field(None, ge=0, description="Container capacity in Twenty-foot Equivalent Units")
    design_speed_knots: float = Field(..., gt=0, description="Design operational speed in knots")
    min_speed_knots: float = Field(..., gt=0, description="Minimum safe maneuvering/governed speed in knots")
    max_speed_knots: float = Field(..., gt=0, description="Maximum continuous rating speed in knots")
    draft_design_m: float = Field(..., gt=0, description="Design summer draft in meters")
    engine_kw: float = Field(..., gt=0, description="Main engine Maximum Continuous Rating (MCR) in kW")
    sfoc_base_g_kwh: float = Field(..., gt=0, description="Baseline Specific Fuel Oil Consumption in g/kWh at 75% MCR")
    speed_exponent_n: float = Field(3.0, gt=1.5, lt=4.5, description="Calibrated speed-power exponent for physics baseline (P ~ v^n)")
    admiralty_coefficient: float = Field(450.0, gt=100.0, description="Admiralty coefficient baseline for the hull form")
    fuel_compat: List[str] = Field(..., min_length=1, description="Compatible fuel pathway IDs (e.g. hfo, mgo, methanol_e)")
    tank_capacities_tonnes: Dict[str, float] = Field(..., description="Fuel bunker capacity per compatible fuel type in metric tonnes")
    ops_compatible: bool = Field(False, description="Whether onshore power supply (cold-ironing) equipment is fitted")
    ops_power_kw: float = Field(800.0, ge=0, description="Auxiliary electric load demanded when berthed at port (kW)")
    hull_factor: float = Field(1.0, ge=0.8, le=2.0, description="Hull fouling degradation factor (1.0 = clean, >1.0 = fouled)")
    provenance: Provenance = Field(..., description="Data provenance of vessel specifications")
