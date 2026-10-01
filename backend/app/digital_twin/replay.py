"""Voyage replay: Compares historical/reported voyage telemetry against counterfactual model-optimized execution."""

from typing import Dict, List, Any
from backend.app.schemas import Provenance
from backend.app.api.main import VoyageReplayResponse


def get_voyage_replay(voyage_id: str) -> VoyageReplayResponse:
    """Return actual historical voyage vs counterfactual model-optimized plan."""
    # Historical actual timeline (simulated AIS reported track)
    actual_timeline = [
        {"leg": "Departure CNSHA", "time_h": 0.0, "speed_knots": 19.5, "fuel_burned_tonnes": 0.0, "fuel_type": "HFO", "lat": 30.62, "lon": 122.06},
        {"leg": "Passing Singapore Strait", "time_h": 115.0, "speed_knots": 19.2, "fuel_burned_tonnes": 1120.0, "fuel_type": "HFO", "lat": 1.28, "lon": 103.85},
        {"leg": "Transit Red Sea / Suez", "time_h": 270.0, "speed_knots": 18.8, "fuel_burned_tonnes": 2450.0, "fuel_type": "HFO", "lat": 27.85, "lon": 34.30},
        {"leg": "Arrival Rotterdam", "time_h": 538.0, "speed_knots": 17.5, "fuel_burned_tonnes": 4820.0, "fuel_type": "MGO", "lat": 51.95, "lon": 4.13},
    ]

    # Counterfactual Q-GREEN Optimized timeline
    counterfactual_timeline = [
        {"leg": "Departure CNSHA", "time_h": 0.0, "speed_knots": 16.8, "fuel_burned_tonnes": 0.0, "fuel_type": "HFO", "lat": 30.62, "lon": 122.06},
        {"leg": "Optimized Bunker Call SGSIN", "time_h": 133.0, "speed_knots": 16.8, "fuel_burned_tonnes": 890.0, "fuel_type": "Bio-Methanol Bunkered", "lat": 1.28, "lon": 103.85},
        {"leg": "Transit Red Sea / Suez", "time_h": 305.0, "speed_knots": 17.2, "fuel_burned_tonnes": 1820.0, "fuel_type": "HFO", "lat": 27.85, "lon": 34.30},
        {"leg": "Arrival Rotterdam (OPS Berth)", "time_h": 560.0, "speed_knots": 16.2, "fuel_burned_tonnes": 3610.0, "fuel_type": "Bio-Methanol / OPS", "lat": 51.95, "lon": 4.13},
    ]

    delta_metrics = {
        "actual_total_fuel_tonnes": 4820.0,
        "counterfactual_total_fuel_tonnes": 3610.0,
        "fuel_saved_tonnes": 1210.0,
        "fuel_reduction_pct": 25.1,
        "actual_wtw_ghg_tonnes": 14942.0,
        "counterfactual_wtw_ghg_tonnes": 8664.0,
        "ghg_abatement_pct": 42.0,
        "cost_savings_usd": 428000.0,
        "time_delta_hours": 22.0,  # +22h slower eco-speed but within contractual deadline
    }

    return VoyageReplayResponse(
        voyage_id=voyage_id,
        vessel_id="IMO9811001",
        route_id="RTE_ASIA_EUR_01",
        actual_timeline=actual_timeline,
        counterfactual_optimal_timeline=counterfactual_timeline,
        delta_metrics=delta_metrics,
        provenance=Provenance.ESTIMATED,
    )
