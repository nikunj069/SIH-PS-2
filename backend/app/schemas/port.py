"""Port infrastructure, geographic location, and bunkering capabilities."""

from typing import Dict
from pydantic import BaseModel, Field
from .provenance import Provenance


class Port(BaseModel):
    """Port node in the maritime logistics network."""

    port_id: str = Field(..., description="Unique port code or UN/LOCODE, e.g. NLRTM")
    name: str = Field(..., description="Port official name")
    unlocode: str = Field(..., description="UN/LOCODE 5-character string")
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    max_draft_m: float = Field(..., gt=0, description="Maximum allowable approach and berth draft in meters")
    ops_available: bool = Field(False, description="Whether Onshore Power Supply (OPS/cold-ironing) is operational")
    ops_price_per_kwh: float = Field(0.25, ge=0, description="Electricity price per kWh for cold ironing (USD)")
    ops_clean_grid_factor: float = Field(220.0, ge=0, description="Regional grid carbon intensity in gCO2e/kWh")
    bunker_stock_tonnes: Dict[str, float] = Field(default_factory=dict, description="Available stock per fuel pathway (tonnes)")
    bunker_price_spread: Dict[str, float] = Field(default_factory=dict, description="Price multiplier relative to global spot baseline")
    congestion_delay_mean_h: float = Field(4.0, ge=0, description="Expected berth waiting time in hours")
    congestion_delay_std_h: float = Field(2.0, ge=0, description="Congestion delay standard deviation in hours")
    coastal_traffic: float = Field(0.0, ge=0, description="Annual coastal throughput (tonnes/TEUs)")
    overseas_traffic: float = Field(0.0, ge=0, description="Annual EXIM/overseas throughput (tonnes/TEUs)")
    green_hydrogen_status: str = Field("none", description="Green hydrogen availability status")
    green_methanol_status: str = Field("none", description="Green methanol availability status")
    green_ammonia_status: str = Field("none", description="Green ammonia availability status")
    electrification_status: str = Field("planned", description="Port electrification status")
    rail_connectivity: bool = Field(True, description="Whether port has direct rail connectivity")
    road_connectivity: bool = Field(True, description="Whether port has highway connectivity")
    iwt_connectivity: bool = Field(False, description="Whether port connects to Inland Water Transport (National Waterways)")
    provenance: Provenance = Field(..., description="Data provenance of port parameters")
