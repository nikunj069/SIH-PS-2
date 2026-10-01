"""Voyage routes and leg segments with environmental and regulatory constraints."""

from typing import Any, Dict, List
from pydantic import BaseModel, Field
from .provenance import Provenance


class Leg(BaseModel):
    """Segment between two sequential waypoints or ports."""

    leg_id: str = Field(..., description="Unique leg identifier, e.g. LEG_NLRTM_SGSIN_01")
    from_port_id: str = Field(..., description="Origin port ID or waypoint")
    to_port_id: str = Field(..., description="Destination port ID or waypoint")
    distance_nm: float = Field(..., gt=0, description="Nautical miles for this leg")
    depth_m: float = Field(..., gt=0, description="Minimum water depth on navigation fairway in meters")
    in_eca: bool = Field(False, description="Whether this leg falls inside an IMO Emission Control Area (SOx/NOx)")
    baseline_eta_h: float = Field(..., gt=0, description="Baseline transit duration at design speed in hours")
    weather_summary: Dict[str, Any] = Field(
        default_factory=lambda: {
            "significant_wave_height_m": 1.8,
            "wind_speed_knots": 14.0,
            "relative_wind_angle_deg": 45.0,
            "current_speed_knots": 0.5,
        },
        description="Environmental parameters along the leg segment",
    )
    provenance: Provenance = Field(..., description="Data provenance of leg geometry and bathymetry")


class Route(BaseModel):
    """Complete maritime service corridor consisting of one or more sequential legs."""

    route_id: str = Field(..., description="Unique route identifier, e.g. RTE_EUR_ASIA_01")
    name: str = Field(..., description="Human-readable corridor name")
    origin_port_id: str = Field(..., description="Initial departure port")
    destination_port_id: str = Field(..., description="Final arrival port")
    legs: List[Leg] = Field(..., min_length=1, description="Sequential legs composing the voyage")
    total_distance_nm: float = Field(..., gt=0, description="Total nautical miles across all legs")
    demand_tonnes: float = Field(15000.0, ge=0, description="Nominal cargo volume to transport on this service (tonnes)")
    deadline_hours: float = Field(..., gt=0, description="Commercial contractual deadline in hours from departure")
    provenance: Provenance = Field(..., description="Data provenance of route specifications")
