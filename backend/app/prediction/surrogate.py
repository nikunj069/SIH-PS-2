"""Vectorized precomputed surrogate cache for ultra-fast L4 optimization evaluations."""

import numpy as np
from typing import Dict
from backend.app.schemas import Vessel
from backend.app.prediction.residual_model import PhysicsMLResidualPredictor
from backend.app.schemas import FuelPredictionInput


class FuelSurrogate:
    """Precomputed 2D/3D lookup table for each vessel class.

    Enables tens of thousands of evaluations per second during evolutionary optimization.
    """

    def __init__(self, predictor: PhysicsMLResidualPredictor, vessels: Dict[str, Vessel]):
        self.predictor = predictor
        self.vessels = vessels
        self.grids: Dict[str, Dict] = {}
        self._build_tables()

    def _build_tables(self):
        """Precompute fuel rate tables across discrete grid points."""
        weather_grid = np.linspace(0.8, 2.0, 10)  # 10 weather multipliers

        for v_id, vessel in self.vessels.items():
            speed_grid = np.linspace(vessel.min_speed_knots, vessel.max_speed_knots, 20)  # 20 speed points
            table = np.zeros((len(speed_grid), len(weather_grid)))

            for i, sp in enumerate(speed_grid):
                for j, wm in enumerate(weather_grid):
                    inp = FuelPredictionInput(
                        vessel_id=v_id,
                        speed_knots=float(sp),
                        draft_m=vessel.draft_design_m,
                        displacement_tonnes=vessel.dwt * 1.2,
                        wave_height_m=1.5 * wm,
                        wind_speed_knots=12.0 * wm,
                        duration_hours=1.0,
                    )
                    quant = self.predictor.predict_single(inp)
                    table[i, j] = quant.p50

            self.grids[v_id] = {
                "speed_grid": speed_grid,
                "weather_grid": weather_grid,
                "table": table,
            }

    def lookup_leg_fuel(
        self,
        vessel: Vessel,
        speed_knots: float,
        distance_nm: float,
        weather_multiplier: float = 1.0,
    ) -> Dict[str, float]:
        """Ultra-fast bilinear interpolation of leg fuel consumption."""
        v_id = vessel.vessel_id
        if v_id not in self.grids:
            # Fallback to direct physics if vessel not in surrogate grid
            return PhysicsFuelModel.calculate_leg_fuel_tonnes(
                vessel=vessel,
                speed_knots=speed_knots,
                distance_nm=distance_nm,
                weather_multiplier=weather_multiplier,
            )

        grid_data = self.grids[v_id]
        s_grid = grid_data["speed_grid"]
        w_grid = grid_data["weather_grid"]
        table = grid_data["table"]

        # Clamp to grid ranges
        s_clamped = min(float(s_grid[-1]), max(float(s_grid[0]), float(speed_knots)))
        w_clamped = min(float(w_grid[-1]), max(float(w_grid[0]), float(weather_multiplier)))

        # Find bounding indices
        i = int(np.searchsorted(s_grid, s_clamped) - 1)
        i = max(0, min(len(s_grid) - 2, i))
        j = int(np.searchsorted(w_grid, w_clamped) - 1)
        j = max(0, min(len(w_grid) - 2, j))

        s0, s1 = s_grid[i], s_grid[i + 1]
        w0, w1 = w_grid[j], w_grid[j + 1]

        # Bilinear interpolation weights
        ds = (s_clamped - s0) / (s1 - s0)
        dw = (w_clamped - w0) / (w1 - w0)

        f00 = table[i, j]
        f10 = table[i + 1, j]
        f01 = table[i, j + 1]
        f11 = table[i + 1, j + 1]

        fuel_rate_tonnes_h = (
            (1 - ds) * (1 - dw) * f00
            + ds * (1 - dw) * f10
            + (1 - ds) * dw * f01
            + ds * dw * f11
        )

        transit_time_h = distance_nm / speed_knots
        total_fuel_tonnes = fuel_rate_tonnes_h * transit_time_h

        return {
            "transit_time_hours": transit_time_h,
            "fuel_rate_tonnes_h": float(fuel_rate_tonnes_h),
            "fuel_consumed_tonnes_hfo_eq": float(total_fuel_tonnes),
            "power_kw": float(fuel_rate_tonnes_h * 1000.0 * 1000.0 / 175.0),
            "engine_load": 0.75,
            "sfoc_g_kwh": 175.0,
        }
