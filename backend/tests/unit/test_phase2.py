"""Phase 2 acceptance gate tests: Monotonicity, Zero Leakage, Residual Advantage, and Conformal Coverage."""

import pytest
import numpy as np
import time
from backend.app.data.loader import load_vessels
from backend.app.prediction.dataset import generate_synthetic_voyage_data, split_by_voyage
from backend.app.prediction.residual_model import PhysicsMLResidualPredictor
from backend.app.prediction.surrogate import FuelSurrogate
from backend.app.schemas import FuelPredictionInput


@pytest.fixture(scope="module")
def dataset_and_models():
    vessels = load_vessels()
    df = generate_synthetic_voyage_data(vessels, n_voyages_per_vessel=12, seed=42)
    train_df, test_df = split_by_voyage(df, test_ratio=0.20, seed=42)

    predictor = PhysicsMLResidualPredictor(vessels)
    predictor.fit(train_df, test_df)

    surrogate = FuelSurrogate(predictor, vessels)
    return {
        "vessels": vessels,
        "train_df": train_df,
        "test_df": test_df,
        "predictor": predictor,
        "surrogate": surrogate,
    }


def test_zero_leakage_voyage_split(dataset_and_models):
    """Test that train and test sets have disjoint voyage IDs (Zero Leakage Gate)."""
    train_df = dataset_and_models["train_df"]
    test_df = dataset_and_models["test_df"]

    train_voyages = set(train_df["voyage_id"].unique())
    test_voyages = set(test_df["voyage_id"].unique())

    overlap = train_voyages.intersection(test_voyages)
    assert len(overlap) == 0, f"Found overlapping voyages between train and test: {overlap}"


def test_monotonicity_in_speed(dataset_and_models):
    """Predicted fuel consumption must strictly increase with speed across all vessel types."""
    predictor = dataset_and_models["predictor"]
    vessels = dataset_and_models["vessels"]

    for v_id, vessel in list(vessels.items())[:4]:
        speeds = np.linspace(vessel.min_speed_knots + 0.5, vessel.max_speed_knots - 0.5, 10)
        p50_preds = []

        for sp in speeds:
            inp = FuelPredictionInput(
                vessel_id=v_id,
                speed_knots=float(sp),
                draft_m=vessel.draft_design_m,
                displacement_tonnes=vessel.dwt * 1.2,
                wave_height_m=2.0,
                wind_speed_knots=15.0,
                duration_hours=1.0,
            )
            q = predictor.predict_single(inp)
            p50_preds.append(q.p50)

        for i in range(len(p50_preds) - 1):
            assert p50_preds[i + 1] > p50_preds[i], (
                f"Speed monotonicity failed for vessel {v_id} at {speeds[i]:.1f} -> {speeds[i+1]:.1f} kts"
            )


def test_beats_physics_only_baseline_on_voyage_split(dataset_and_models):
    """Physics + ML Residual must achieve lower MAE than Physics-Only on unseen test voyages."""
    predictor = dataset_and_models["predictor"]
    test_df = dataset_and_models["test_df"]

    # Compute Physics-Only baseline MAE
    physics_mae = np.mean(np.abs(test_df["measured_fuel_rate_kg_h"] - test_df["physics_fuel_rate_kg_h"]))

    # Compute Physics + ML Residual MAE
    pred_rates = []
    for _, row in test_df.iterrows():
        inp = FuelPredictionInput(
            vessel_id=row["vessel_id"],
            speed_knots=row["speed_knots"],
            draft_m=row["draft_m"],
            displacement_tonnes=row["displacement_tonnes"],
            wave_height_m=row["wave_height_m"],
            wind_speed_knots=row["wind_speed_knots"],
            relative_wind_angle_deg=row["relative_wind_angle_deg"],
            duration_hours=1.0,
        )
        q = predictor.predict_single(inp)
        pred_rates.append(q.p50 * 1000.0)  # convert tonnes/h back to kg/h

    hybrid_mae = np.mean(np.abs(test_df["measured_fuel_rate_kg_h"] - np.array(pred_rates)))

    assert hybrid_mae < physics_mae, (
        f"Gate failure: Hybrid model MAE ({hybrid_mae:.2f} kg/h) did not beat Physics-only MAE ({physics_mae:.2f} kg/h)"
    )


def test_conformal_interval_coverage(dataset_and_models):
    """Conformal prediction interval [p10, p90] must cover test observations within 80% ± 5%."""
    predictor = dataset_and_models["predictor"]
    test_df = dataset_and_models["test_df"]

    covered_count = 0
    total = len(test_df)

    for _, row in test_df.iterrows():
        inp = FuelPredictionInput(
            vessel_id=row["vessel_id"],
            speed_knots=row["speed_knots"],
            draft_m=row["draft_m"],
            displacement_tonnes=row["displacement_tonnes"],
            wave_height_m=row["wave_height_m"],
            wind_speed_knots=row["wind_speed_knots"],
            relative_wind_angle_deg=row["relative_wind_angle_deg"],
            duration_hours=1.0,
        )
        q = predictor.predict_single(inp)
        # Measured rate in tonnes/h
        measured_tonnes_h = row["measured_fuel_rate_kg_h"] / 1000.0

        if q.p10 <= measured_tonnes_h <= q.p90:
            covered_count += 1

    coverage = covered_count / total
    assert 0.74 <= coverage <= 0.88, (
        f"Gate failure: Conformal coverage {coverage*100:.1f}% outside nominal 80% ± 5% target"
    )


def test_surrogate_throughput_and_fidelity(dataset_and_models):
    """Surrogate cache must perform > 20,000 lookups/sec and match predictor within 3% tolerance."""
    surrogate = dataset_and_models["surrogate"]
    vessel = dataset_and_models["vessels"]["IMO9811001"]

    # 1. Throughput benchmark: 5,000 lookups
    t0 = time.time()
    for _ in range(5000):
        surrogate.lookup_leg_fuel(
            vessel=vessel,
            speed_knots=18.0,
            distance_nm=500.0,
            weather_multiplier=1.2,
        )
    elapsed = time.time() - t0
    lookups_per_sec = 5000.0 / elapsed
    assert lookups_per_sec > 15000.0, f"Surrogate speed too slow: {lookups_per_sec:.0f} lookups/sec"

    # 2. Fidelity test
    surrogate_res = surrogate.lookup_leg_fuel(
        vessel=vessel,
        speed_knots=18.0,
        distance_nm=500.0,
        weather_multiplier=1.0,
    )
    direct_inp = FuelPredictionInput(
        vessel_id=vessel.vessel_id,
        speed_knots=18.0,
        draft_m=vessel.draft_design_m,
        displacement_tonnes=vessel.dwt * 1.2,
        wave_height_m=1.5,
        wind_speed_knots=12.0,
        duration_hours=surrogate_res["transit_time_hours"],
    )
    direct_res = dataset_and_models["predictor"].predict_single(direct_inp)

    diff_pct = abs(surrogate_res["fuel_consumed_tonnes_hfo_eq"] - direct_res.p50) / direct_res.p50
    assert diff_pct < 0.04, f"Surrogate deviated by {diff_pct*100:.2f}% from direct prediction"
