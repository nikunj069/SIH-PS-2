"""Carbon Abatement Curve API.

Provides data for the Marginal Abatement Cost Curve (MACC).
Evaluates various interventions to compute their cost-effectiveness.
"""

from typing import List
from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.schemas.provenance import Provenance

router = APIRouter()


class AbatementIntervention(BaseModel):
    id: str
    name: str
    cost_per_tonne_usd: float
    total_abatement_potential_tonnes: float
    category: str
    provenance: Provenance = Provenance.SIMULATED


class AbatementCurveResponse(BaseModel):
    interventions: List[AbatementIntervention]


@router.get("/curve", response_model=AbatementCurveResponse)
async def get_abatement_curve() -> AbatementCurveResponse:
    """Returns the marginal abatement cost curve data for the fleet."""
    
    # In a full production system, this would dynamically evaluate the fleet
    # against interventions. For the digital twin prototype, we provide
    # representative, physically consistent baseline data based on typical values.
    
    interventions = [
        AbatementIntervention(
            id="speed_reduction_10",
            name="10% Speed Reduction",
            cost_per_tonne_usd=-25.0, # Negative cost = savings!
            total_abatement_potential_tonnes=1200.0,
            category="operational"
        ),
        AbatementIntervention(
            id="hull_cleaning_opt",
            name="Optimized Hull Cleaning",
            cost_per_tonne_usd=-10.0,
            total_abatement_potential_tonnes=850.0,
            category="maintenance"
        ),
        AbatementIntervention(
            id="shore_power_jnpa",
            name="Shore Power (JNPA)",
            cost_per_tonne_usd=45.0,
            total_abatement_potential_tonnes=2100.0,
            category="infrastructure"
        ),
        AbatementIntervention(
            id="bio_methanol_30",
            name="30% Bio-methanol Drop-in",
            cost_per_tonne_usd=120.0,
            total_abatement_potential_tonnes=4500.0,
            category="fuel"
        ),
        AbatementIntervention(
            id="green_ammonia_newbuild",
            name="Green Ammonia Fleet Renewal",
            cost_per_tonne_usd=280.0,
            total_abatement_potential_tonnes=15000.0,
            category="fleet_renewal"
        )
    ]
    
    # Sort by cost-effectiveness (lowest cost per tonne first)
    interventions.sort(key=lambda x: x.cost_per_tonne_usd)
    
    return AbatementCurveResponse(interventions=interventions)
