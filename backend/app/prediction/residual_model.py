"""Physics + ML Residual model with monotonic speed constraints and conformal quantiles."""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from sklearn.ensemble import HistGradientBoostingRegressor
from backend.app.schemas import (
    FuelPredictionInput,
    Quantiles,
    Vessel,
    Provenance,
)
from backend.app.prediction.physics import PhysicsFuelModel


FEATURE_COLS = [
    "speed_ratio",
    "draft_m",
    "wave_height_m",
    "wind_speed_knots",
    "relative_wind_angle_deg",
    "hull_factor",
]

# Monotonic constraints:
# 1 for speed_ratio (higher speed ratio increases residual drag)
# 0 for draft_m
# 1 for wave_height (waves increase residual reflection)
# 1 for wind_speed (wind increases yaw drag)
# 0 for wind angle
# 1 for hull_factor (fouling increases skin friction)
MONOTONIC_CST = [1, 0, 1, 1, 0, 1]


class PhysicsMLResidualPredictor:
    """Hybrid predictor: Physics baseline + Monotonic HistGradientBoosting residual + Conformal quantiles."""

    def __init__(self, vessels: Dict[str, Vessel]):
        self.vessels = vessels
        # Models for p10, p50 (median), p90
        self.model_p50 = HistGradientBoostingRegressor(
            loss="squared_error",
            monotonic_cst=MONOTONIC_CST,
            max_iter=150,
            learning_rate=0.08,
            random_state=42,
        )
        self.model_p10 = HistGradientBoostingRegressor(
            loss="quantile",
            quantile=0.10,
            monotonic_cst=MONOTONIC_CST,
            max_iter=150,
            learning_rate=0.08,
            random_state=42,
        )
        self.model_p90 = HistGradientBoostingRegressor(
            loss="quantile",
            quantile=0.90,
            monotonic_cst=MONOTONIC_CST,
            max_iter=150,
            learning_rate=0.08,
            random_state=42,
        )
        self.is_fitted = False
        self.conformal_margin = 0.0

    def _extract_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        # Compute speed_ratio
        v_design_map = {v_id: v.design_speed_knots for v_id, v in self.vessels.items()}
        speed_ratio = df["speed_knots"] / df["vessel_id"].map(v_design_map)
        
        feats = np.column_stack([
            speed_ratio.to_numpy(),
            df["draft_m"].to_numpy(),
            df["wave_height_m"].to_numpy(),
            df["wind_speed_knots"].to_numpy(),
            df["relative_wind_angle_deg"].to_numpy(),
            df["hull_factor"].to_numpy(),
        ])
        
        # Target: relative percentage residual = (measured - physics) / physics
        physics = df["physics_fuel_rate_kg_h"].to_numpy()
        measured = df["measured_fuel_rate_kg_h"].to_numpy()
        y_pct = (measured - physics) / np.maximum(10.0, physics)
        return feats, y_pct

    def fit(self, train_df: pd.DataFrame, val_df: Optional[pd.DataFrame] = None):
        """Fit residual models on relative residual percentage."""
        X, y_residual_pct = self._extract_features(train_df)

        self.model_p50.fit(X, y_residual_pct)
        self.model_p10.fit(X, y_residual_pct)
        self.model_p90.fit(X, y_residual_pct)
        self.is_fitted = True

        # Conformal calibration on validation holdout
        if val_df is not None and len(val_df) > 0:
            X_val, y_val_pct = self._extract_features(val_df)

            pred_p10 = self.model_p10.predict(X_val)
            pred_p90 = self.model_p90.predict(X_val)

            # Compute non-conformity scores
            err_lower = pred_p10 - y_val_pct
            err_upper = y_val_pct - pred_p90
            scores = np.maximum(err_lower, err_upper)
            # 80th percentile for 80% coverage
            self.conformal_margin = float(np.percentile(scores, 80))
        else:
            self.conformal_margin = 0.0

    def predict_single(self, inp: FuelPredictionInput) -> Quantiles:
        """Predict p10, p50, p90 total fuel consumption for an input segment in metric tonnes."""
        vessel = self.vessels.get(inp.vessel_id)
        if not vessel:
            raise KeyError(f"Vessel {inp.vessel_id} not found in fleet dictionary")

        # 1. Physics baseline
        p_metrics = PhysicsFuelModel.calculate_power_kw(
            vessel=vessel,
            speed_knots=inp.speed_knots,
            draft_m=inp.draft_m,
            wave_height_m=inp.wave_height_m,
            wind_speed_knots=inp.wind_speed_knots,
            relative_wind_angle_deg=inp.relative_wind_angle_deg,
        )
        sfoc = PhysicsFuelModel.calculate_sfoc(vessel, p_metrics["engine_load"])
        physics_rate_kg_h = p_metrics["power_total_kw"] * (sfoc / 1000.0)

        # 2. ML Residual prediction
        if self.is_fitted:
            speed_ratio = inp.speed_knots / vessel.design_speed_knots
            x_vec = np.array([[
                speed_ratio,
                inp.draft_m,
                inp.wave_height_m,
                inp.wind_speed_knots,
                inp.relative_wind_angle_deg,
                vessel.hull_factor,
            ]])
            pct_p50 = float(self.model_p50.predict(x_vec)[0])
            pct_p10 = float(self.model_p10.predict(x_vec)[0]) - self.conformal_margin
            pct_p90 = float(self.model_p90.predict(x_vec)[0]) + self.conformal_margin
        else:
            pct_p50 = 0.0
            pct_p10 = -0.05
            pct_p90 = 0.05

        rate_p10 = max(10.0, physics_rate_kg_h * (1.0 + pct_p10))
        rate_p50 = max(10.0, physics_rate_kg_h * (1.0 + pct_p50))
        rate_p90 = max(rate_p50, physics_rate_kg_h * (1.0 + pct_p90))

        # Convert kg/h * duration_hours to metric tonnes
        fuel_p10 = (rate_p10 * inp.duration_hours) / 1000.0
        fuel_p50 = (rate_p50 * inp.duration_hours) / 1000.0
        fuel_p90 = (rate_p90 * inp.duration_hours) / 1000.0

        return Quantiles(
            p10=round(fuel_p10, 3),
            p50=round(fuel_p50, 3),
            p90=round(fuel_p90, 3),
            confidence=0.80,
            provenance=Provenance.ESTIMATED,
        )

    def predict(self, batch: List[FuelPredictionInput]) -> List[Quantiles]:
        """Batch prediction satisfying FuelPredictorProtocol."""
        return [self.predict_single(inp) for inp in batch]
