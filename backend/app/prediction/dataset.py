"""Voyage dataset generation with realistic operational residuals and strict leakage-free splits."""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
from backend.app.schemas import Vessel, Provenance
from backend.app.prediction.physics import PhysicsFuelModel


def generate_synthetic_voyage_data(
    vessels: Dict[str, Vessel],
    n_voyages_per_vessel: int = 15,
    seed: int = 42,
) -> pd.DataFrame:
    """Generate voyage segment records with physics baseline + real-world hydrodynamic residual.

    Residual reflects trim variations, shallow water squat, and thermal efficiency variations.
    Never random rows; grouped by voyage_id, vessel_id, and time.
    """
    rng = np.random.default_rng(seed)
    records: List[Dict] = []
    voyage_counter = 1

    for v_id, vessel in sorted(vessels.items()):
        for v_num in range(n_voyages_per_vessel):
            voyage_id = f"VOY_{v_id}_{v_num + 1:03d}"
            n_segments = rng.integers(8, 16)
            base_timestamp = 1704067200 + (v_num * 86400 * 14)  # 14 days apart

            # Voyage operating condition
            draft_m = vessel.draft_design_m * rng.uniform(0.70, 1.0)
            displacement = (vessel.dwt * 1.22) * (draft_m / vessel.draft_design_m)

            for seg in range(n_segments):
                timestamp = base_timestamp + seg * 14400  # 4-hour segments
                speed_knots = rng.uniform(vessel.min_speed_knots + 0.5, vessel.max_speed_knots - 0.5)
                wave_m = float(np.clip(rng.rayleigh(scale=1.6), 0.5, 6.5))
                wind_kts = float(np.clip(rng.weibull(2.0) * 12.0, 2.0, 45.0))
                rel_angle_deg = float(rng.uniform(0.0, 180.0))
                duration_hours = 4.0

                # 1. Physics baseline fuel rate (kg/h)
                p_metrics = PhysicsFuelModel.calculate_power_kw(
                    vessel=vessel,
                    speed_knots=speed_knots,
                    draft_m=draft_m,
                    wave_height_m=wave_m,
                    wind_speed_knots=wind_kts,
                    relative_wind_angle_deg=rel_angle_deg,
                )
                sfoc = PhysicsFuelModel.calculate_sfoc(vessel, p_metrics["engine_load"])
                physics_fuel_rate_kg_h = p_metrics["power_total_kw"] * (sfoc / 1000.0)

                # 2. Operational ML residual:
                # Real-world naval hydrodynamic deviations not captured in simplified calm-water formulas:
                # - Speed squat & trim variation at higher Froude numbers: ~2-5%
                # - Crosswind yaw resistance: ~1-3%
                # - Wave spectrum non-linear reflection: ~2-4%
                v_ratio = speed_knots / vessel.design_speed_knots
                froude_trim_effect = 0.035 * (v_ratio ** 2.2)
                crosswind_yaw_effect = 0.02 * (wind_kts / 20.0) * np.sin(np.radians(rel_angle_deg))
                wave_spectrum_effect = 0.025 * ((wave_m / 2.5) ** 1.5)
                sensor_noise = rng.normal(0.0, 0.008)

                ml_residual_pct = froude_trim_effect + crosswind_yaw_effect + wave_spectrum_effect + sensor_noise

                # Observed fuel rate
                measured_fuel_rate_kg_h = physics_fuel_rate_kg_h * (1.0 + ml_residual_pct)
                actual_residual_kg_h = measured_fuel_rate_kg_h - physics_fuel_rate_kg_h

                records.append({
                    "voyage_id": voyage_id,
                    "vessel_id": v_id,
                    "vessel_type": vessel.vessel_type,
                    "timestamp": timestamp,
                    "speed_knots": round(speed_knots, 2),
                    "draft_m": round(draft_m, 2),
                    "displacement_tonnes": round(displacement, 1),
                    "wave_height_m": round(wave_m, 2),
                    "wind_speed_knots": round(wind_kts, 2),
                    "relative_wind_angle_deg": round(rel_angle_deg, 1),
                    "hull_factor": vessel.hull_factor,
                    "duration_hours": duration_hours,
                    "physics_fuel_rate_kg_h": round(physics_fuel_rate_kg_h, 2),
                    "measured_fuel_rate_kg_h": round(measured_fuel_rate_kg_h, 2),
                    "actual_residual_kg_h": round(actual_residual_kg_h, 2),
                    "provenance": Provenance.SYNTHETIC.value,
                })
            voyage_counter += 1

    return pd.DataFrame(records)


def split_by_voyage(
    df: pd.DataFrame,
    test_ratio: float = 0.20,
    seed: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Strict voyage-level split. Ensures zero leakage of voyage segments across train and test."""
    voyage_ids = df["voyage_id"].unique()
    rng = np.random.default_rng(seed)
    shuffled = rng.permutation(voyage_ids)

    n_test = max(1, int(len(voyage_ids) * test_ratio))
    test_voyages = set(shuffled[:n_test])
    train_voyages = set(shuffled[n_test:])

    train_df = df[df["voyage_id"].isin(train_voyages)].copy().reset_index(drop=True)
    test_df = df[df["voyage_id"].isin(test_voyages)].copy().reset_index(drop=True)

    # Verification of zero leakage
    train_v_set = set(train_df["voyage_id"].unique())
    test_v_set = set(test_df["voyage_id"].unique())
    assert len(train_v_set.intersection(test_v_set)) == 0, "Leakage detected between train and test voyages!"

    return train_df, test_df
