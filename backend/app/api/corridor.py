"""Green Corridor Infrastructure Planner API.

Strategic optimization endpoint for deciding where to deploy Shore Power (OPS) 
and alternative fuel bunkering based on fleet traffic and potential ROI.
"""

from typing import List
from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.schemas.provenance import Provenance
from backend.app.data.loader import load_ports, load_routes, load_vessels

router = APIRouter()


class PortUpgradeROI(BaseModel):
    port_id: str
    port_name: str
    upgrade_type: str # "shore_power" or "green_methanol_bunker"
    estimated_capex_usd: float
    annual_ghg_reduction_tonnes: float
    roi_score: float # Arbitrary score for ranking
    provenance: Provenance = Provenance.SIMULATED


class GreenCorridorResponse(BaseModel):
    corridor_name: str
    recommended_upgrades: List[PortUpgradeROI]


@router.get("/plan", response_model=GreenCorridorResponse)
async def plan_green_corridor() -> GreenCorridorResponse:
    """Returns strategic recommendations for port infrastructure upgrades."""
    
    ports = load_ports()
    routes = load_routes()
    vessels = load_vessels()

    # Heuristic: Count visits to each port to determine high-traffic hubs
    port_visits = {p_id: 0 for p_id in ports}
    for r in routes.values():
        port_visits[r.origin_port_id] = port_visits.get(r.origin_port_id, 0) + 1
        port_visits[r.destination_port_id] = port_visits.get(r.destination_port_id, 0) + 1
        for leg in r.legs:
            port_visits[leg.to_port_id] = port_visits.get(leg.to_port_id, 0) + 1

    # Count vessels ready for OPS
    ops_ready_count = sum(1 for v in vessels.values() if v.ops_compatible)

    upgrades = []
    for port_id, visits in port_visits.items():
        if visits > 0 and port_id in ports:
            port = ports[port_id]
            
            # 1. Shore Power ROI
            # If the port doesn't have OPS, what's the benefit of adding it?
            if not port.ops_available:
                # Benefit scales with traffic and fleet OPS readiness
                ops_benefit = (visits * ops_ready_count * 150.0) # Mock tonnes saved
                capex = 5_000_000.0 # $5M typical install
                roi = ops_benefit / capex * 1000 # Scaling factor for readability
                
                upgrades.append(PortUpgradeROI(
                    port_id=port_id,
                    port_name=port.name,
                    upgrade_type="shore_power",
                    estimated_capex_usd=capex,
                    annual_ghg_reduction_tonnes=round(ops_benefit, 2),
                    roi_score=round(roi, 3)
                ))

            # 2. Green Methanol Bunkering ROI
            # If the port doesn't have methanol bunkering
            if port.bunker_stock_tonnes.get("methanol_green", 0) <= 0:
                meth_benefit = (visits * 800.0)
                meth_capex = 12_000_000.0
                meth_roi = meth_benefit / meth_capex * 1000
                
                upgrades.append(PortUpgradeROI(
                    port_id=port_id,
                    port_name=port.name,
                    upgrade_type="green_methanol_bunker",
                    estimated_capex_usd=meth_capex,
                    annual_ghg_reduction_tonnes=round(meth_benefit, 2),
                    roi_score=round(meth_roi, 3)
                ))

    # Sort by highest ROI
    upgrades.sort(key=lambda x: x.roi_score, reverse=True)

    return GreenCorridorResponse(
        corridor_name="Harit Sagar West Coast Corridor",
        recommended_upgrades=upgrades[:10] # Top 10 recommendations
    )
