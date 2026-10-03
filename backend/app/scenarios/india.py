"""India-specific scenarios and disruptions."""

from typing import List
from backend.app.schemas.scenario import Scenario, ScenarioType, Provenance


def get_india_scenarios() -> List[Scenario]:
    """Generates India-specific operational and strategic scenarios."""
    return [
        Scenario(
            scenario_id="SCN_IND_NOMINAL",
            name="Nominal India Operations",
            scenario_type=ScenarioType.NOMINAL,
            weather_multiplier=1.0,
            port_delay_hours={},
            fuel_price_multipliers={},
            carbon_tax_usd_tonne=0.0, # Currently no explicit ETS in India
            bunker_outages=[],
            probability=0.6,
            provenance=Provenance.SIMULATED
        ),
        Scenario(
            scenario_id="SCN_IND_SEVERE_SW_MONSOON",
            name="Severe Southwest Monsoon (July)",
            scenario_type=ScenarioType.STORM,
            weather_multiplier=1.8, # Base multiplier, monsoon.py will refine this by region
            port_delay_hours={"INMUN": 12.0, "INNSA": 18.0, "INCOK": 8.0}, # West coast ports delayed
            fuel_price_multipliers={},
            carbon_tax_usd_tonne=0.0,
            bunker_outages=[],
            probability=0.15,
            provenance=Provenance.SIMULATED
        ),
        Scenario(
            scenario_id="SCN_IND_JNPA_CONGESTION",
            name="JNPA Peak Congestion Shock",
            scenario_type=ScenarioType.CONGESTION,
            weather_multiplier=1.0,
            port_delay_hours={"INNSA": 36.0}, # Massive 36-hour added delay at JNPA
            fuel_price_multipliers={},
            carbon_tax_usd_tonne=0.0,
            bunker_outages=[],
            probability=0.10,
            provenance=Provenance.SIMULATED
        ),
        Scenario(
            scenario_id="SCN_IND_GREEN_CORRIDOR_MANDATE",
            name="Harit Sagar Green Corridor Pilot",
            scenario_type=ScenarioType.CARBON_SHOCK,
            weather_multiplier=1.0,
            port_delay_hours={},
            fuel_price_multipliers={"hfo": 1.2, "mgo": 1.1, "methanol_bio": 0.8}, # Subsidize bio-methanol, penalize fossil
            carbon_tax_usd_tonne=50.0, # Simulated domestic carbon pricing for maritime
            bunker_outages=[("INHAL", "hfo")], # HFO phased out at Haldia
            probability=0.15,
            provenance=Provenance.SIMULATED
        )
    ]
