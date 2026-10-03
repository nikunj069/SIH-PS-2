"""Vessel Performance Degradation tracking.

Tracks the performance health index of a vessel over time to adjust the baseline 
fuel consumption based on factors like age, hull condition, and drydock history.
"""

from typing import Dict, Any
from pydantic import BaseModel, Field
from backend.app.schemas.vessel import Vessel


class VesselHealthState(BaseModel):
    """Dynamic health state of a vessel tracking performance drift."""
    vessel_id: str
    months_since_drydock: int = 0
    months_since_cleaning: int = 0
    vessel_age_years: float = 0.0
    performance_degradation_index: float = Field(1.0, ge=1.0, description="Multiplier on baseline fuel consumption")


class DegradationModel:
    """Calculates performance degradation index."""

    @staticmethod
    def calculate_current_index(health_state: VesselHealthState) -> float:
        """Computes the degradation multiplier (>= 1.0) based on time since interventions."""
        
        # Base penalty for age (e.g. 0.5% per year)
        age_penalty = (health_state.vessel_age_years * 0.005)
        
        # Biofouling proxy (e.g. 1% per month since cleaning, capped at 15%)
        # Note: We explicitly refer to this as a proxy per the Master Prompt.
        fouling_proxy = min(0.15, health_state.months_since_cleaning * 0.01)
        
        # Engine/propeller wear (e.g. 0.2% per month since drydock, capped at 10%)
        wear_proxy = min(0.10, health_state.months_since_drydock * 0.002)

        index = 1.0 + age_penalty + fouling_proxy + wear_proxy
        return round(index, 3)

    @staticmethod
    def apply_degradation(base_fuel_tonnes: float, index: float) -> float:
        """Applies the degradation index to the baseline fuel consumption."""
        return base_fuel_tonnes * max(1.0, index)
