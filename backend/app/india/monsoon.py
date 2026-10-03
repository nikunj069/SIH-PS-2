"""Monsoon Intelligence Module for Q-GREEN INDIA.

Classifies routes into seasonal monsoon regimes (Southwest, Northeast, Pre, Post)
and geographic regions (Arabian Sea, Bay of Bengal) to dynamically adjust
environmental parameters.
"""

from enum import Enum
from typing import Dict, Any, Tuple
from pydantic import BaseModel
from backend.app.schemas.route import Leg


class MonsoonSeason(str, Enum):
    SOUTHWEST = "southwest"     # Jun-Sep
    NORTHEAST = "northeast"     # Oct-Dec
    PRE_MONSOON = "pre_monsoon" # Mar-May
    POST_MONSOON = "post_monsoon" # Jan-Feb


class MaritimeRegion(str, Enum):
    ARABIAN_SEA = "arabian_sea"
    BAY_OF_BENGAL = "bay_of_bengal"
    INDIAN_OCEAN = "indian_ocean"
    OTHER = "other"


class MonsoonRegimeState(BaseModel):
    season: MonsoonSeason
    region: MaritimeRegion
    wave_multiplier: float
    wind_multiplier: float
    wind_direction_shift: float


class MonsoonIntelligenceEngine:
    """Predicts weather degradation based on Indian monsoon mechanics."""

    def __init__(self, current_month: int = 7):
        """Initialize with simulated month (1-12)."""
        self.current_month = current_month
        self.season = self._determine_season(current_month)

    def _determine_season(self, month: int) -> MonsoonSeason:
        if 6 <= month <= 9:
            return MonsoonSeason.SOUTHWEST
        elif 10 <= month <= 12:
            return MonsoonSeason.NORTHEAST
        elif 3 <= month <= 5:
            return MonsoonSeason.PRE_MONSOON
        else:
            return MonsoonSeason.POST_MONSOON

    def _classify_region(self, lon: float) -> MaritimeRegion:
        """Rough bounding box classification for India maritime."""
        if 60.0 <= lon < 77.0:
            return MaritimeRegion.ARABIAN_SEA
        elif 77.0 <= lon <= 95.0:
            return MaritimeRegion.BAY_OF_BENGAL
        elif 50.0 <= lon < 100.0:
            return MaritimeRegion.INDIAN_OCEAN
        return MaritimeRegion.OTHER

    def _get_regime_modifiers(self, region: MaritimeRegion) -> Tuple[float, float, float]:
        """Returns (wave_multiplier, wind_multiplier, wind_angle_shift)."""
        
        # Base modifiers
        wave_mult = 1.0
        wind_mult = 1.0
        wind_shift = 0.0

        if self.season == MonsoonSeason.SOUTHWEST:
            if region == MaritimeRegion.ARABIAN_SEA:
                wave_mult = 2.5   # Fierce SW monsoon in Arabian Sea
                wind_mult = 1.8
                wind_shift = 225.0 # SW winds
            elif region == MaritimeRegion.BAY_OF_BENGAL:
                wave_mult = 1.8
                wind_mult = 1.5
                wind_shift = 210.0

        elif self.season == MonsoonSeason.NORTHEAST:
            if region == MaritimeRegion.BAY_OF_BENGAL:
                wave_mult = 2.2   # Cyclonic NE monsoon in BoB
                wind_mult = 1.7
                wind_shift = 45.0 # NE winds
            elif region == MaritimeRegion.ARABIAN_SEA:
                wave_mult = 1.3
                wind_mult = 1.2
                wind_shift = 45.0

        elif self.season == MonsoonSeason.PRE_MONSOON:
            # Heat, calm before storms, but some cyclone risk in BoB
            if region == MaritimeRegion.BAY_OF_BENGAL:
                wave_mult = 1.2
                wind_mult = 1.1
            else:
                wave_mult = 0.9
                wind_mult = 0.9

        elif self.season == MonsoonSeason.POST_MONSOON:
            # Generally calm
            wave_mult = 0.85
            wind_mult = 0.85

        return wave_mult, wind_mult, wind_shift

    def apply_monsoon_to_leg(self, leg: Leg, start_lon: float) -> Dict[str, Any]:
        """Dynamically adjusts the leg weather summary based on the monsoon regime.
        
        Returns a modified weather_summary dictionary.
        """
        region = self._classify_region(start_lon)
        wave_mult, wind_mult, wind_shift = self._get_regime_modifiers(region)

        original = leg.weather_summary
        
        # Don't apply to "OTHER" regions outside the Indian subcontinent
        if region == MaritimeRegion.OTHER:
            return dict(original)

        # Calculate new parameters
        new_wave = round(original.get("significant_wave_height_m", 1.5) * wave_mult, 2)
        new_wind = round(original.get("wind_speed_knots", 10.0) * wind_mult, 1)
        
        # Heuristic for relative wind angle shift (simplified for demo)
        new_angle = (original.get("relative_wind_angle_deg", 0.0) + wind_shift) % 360.0
        
        return {
            "significant_wave_height_m": new_wave,
            "wind_speed_knots": new_wind,
            "relative_wind_angle_deg": round(new_angle, 1),
            "current_speed_knots": original.get("current_speed_knots", 0.5), # Assuming constant for now
            "provenance": "simulated",
            "monsoon_regime": f"{self.season.value}_{region.value}"
        }
