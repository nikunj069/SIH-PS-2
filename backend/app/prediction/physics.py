"""Physics-based naval architectural power and fuel consumption baseline model."""

import math
from typing import Dict, Any, Optional
from backend.app.schemas import Vessel, Leg, Provenance


class PhysicsFuelModel:
    """Calibrated naval architecture physics baseline.

    Propulsion power: P_prop ≈ k_vessel * v^n_vessel * Δ^(2/3)
    + added resistance from wind/waves
    * parabolic SFOC engine load curve.
    """

    @staticmethod
    def calculate_power_kw(
        vessel: Vessel,
        speed_knots: float,
        draft_m: Optional[float] = None,
        wave_height_m: float = 1.5,
        wind_speed_knots: float = 12.0,
        relative_wind_angle_deg: float = 45.0,
        weather_multiplier: float = 1.0,
    ) -> Dict[str, float]:
        """Compute brake power in kW for calm water + added environmental resistance."""
        actual_draft = draft_m if draft_m is not None else vessel.draft_design_m
        draft_ratio = max(0.5, min(1.2, actual_draft / vessel.draft_design_m))
        
        # Estimate displacement: deadweight + lightweight estimate (~0.2 * dwt)
        displacement_tonnes = (vessel.dwt * 1.22) * draft_ratio
        
        # 1. Calm water resistance & propulsion power
        # P_prop = k_vessel * v^n * Δ^(2/3) * hull_factor
        k_hull = (displacement_tonnes ** (2.0 / 3.0)) / vessel.admiralty_coefficient
        p_calm = k_hull * (speed_knots ** vessel.speed_exponent_n) * vessel.hull_factor

        # 2. Added wind resistance
        # Angle penalty: head winds (0 deg) exert maximum resistance; tail winds (180 deg) reduce it
        wind_angle_rad = math.radians(relative_wind_angle_deg)
        angle_factor = max(0.0, math.cos(wind_angle_rad))  # headwind component
        p_wind = 0.04 * p_calm * ((wind_speed_knots / 15.0) ** 1.6) * (0.4 + 0.6 * angle_factor)

        # 3. Added wave resistance (quadratic reflection / STAWAVE principle)
        p_wave = 0.06 * p_calm * ((wave_height_m / 2.0) ** 1.8)

        # Apply scenario weather multiplier
        total_p = p_calm + (p_wind + p_wave) * weather_multiplier

        # Engine load fraction bounded [0.15, 1.05]
        engine_load = min(1.05, max(0.15, total_p / vessel.engine_kw))

        return {
            "power_calm_kw": p_calm,
            "power_wind_kw": p_wind * weather_multiplier,
            "power_wave_kw": p_wave * weather_multiplier,
            "power_total_kw": total_p,
            "engine_load": engine_load,
        }

    @staticmethod
    def calculate_sfoc(vessel: Vessel, engine_load: float) -> float:
        """Parabolic SFOC curve vs engine load, reaching minimum around 75% MCR."""
        # Baseline SFOC curve with optimal efficiency at 75% load
        # sfoc(load) = base * (1 + 0.45 * (load - 0.75)^2)
        load_penalty = 0.45 * ((engine_load - 0.75) ** 2)
        return vessel.sfoc_base_g_kwh * (1.0 + load_penalty)

    @classmethod
    def calculate_leg_fuel_tonnes(
        cls,
        vessel: Vessel,
        speed_knots: float,
        distance_nm: float,
        draft_m: Optional[float] = None,
        weather_summary: Optional[Dict[str, Any]] = None,
        weather_multiplier: float = 1.0,
    ) -> Dict[str, float]:
        """Compute leg transit time and HFO-equivalent baseline fuel in metric tonnes."""
        if speed_knots <= 0:
            raise ValueError(f"Speed must be positive, got {speed_knots}")

        transit_time_h = distance_nm / speed_knots

        w_summary = weather_summary or {}
        wave_m = w_summary.get("significant_wave_height_m", 1.5)
        wind_kts = w_summary.get("wind_speed_knots", 12.0)
        angle_deg = w_summary.get("relative_wind_angle_deg", 45.0)

        power_metrics = cls.calculate_power_kw(
            vessel=vessel,
            speed_knots=speed_knots,
            draft_m=draft_m,
            wave_height_m=wave_m,
            wind_speed_knots=wind_kts,
            relative_wind_angle_deg=angle_deg,
            weather_multiplier=weather_multiplier,
        )

        p_total = power_metrics["power_total_kw"]
        engine_load = power_metrics["engine_load"]
        sfoc_effective = cls.calculate_sfoc(vessel, engine_load)

        # fuel_rate in kg/h
        fuel_rate_kg_h = p_total * (sfoc_effective / 1000.0)
        fuel_tonnes = (fuel_rate_kg_h * transit_time_h) / 1000.0

        return {
            "transit_time_hours": transit_time_h,
            "power_kw": p_total,
            "engine_load": engine_load,
            "sfoc_g_kwh": sfoc_effective,
            "fuel_rate_tonnes_h": fuel_rate_kg_h / 1000.0,
            "fuel_consumed_tonnes_hfo_eq": fuel_tonnes,
        }
