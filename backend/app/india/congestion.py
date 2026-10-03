"""Port Congestion Prediction Twin.

Generates probabilistic congestion delay distributions rather than static averages.
Accounts for seasonal spikes, capacity constraints, and explicit disruption scenarios.
"""

import numpy as np
from typing import Dict, Any, Tuple
from pydantic import BaseModel
from backend.app.schemas.port import Port
from backend.app.schemas.scenario import Scenario, ScenarioType


class CongestionPrediction(BaseModel):
    expected_delay_hours: float
    p10_delay_hours: float
    p50_delay_hours: float
    p90_delay_hours: float
    prob_wait_under_2h: float
    prob_wait_under_6h: float
    prob_wait_under_12h: float
    prob_wait_over_24h: float
    provenance: str = "simulated"


class PortCongestionEngine:
    """Predicts waiting time distributions for Indian and global ports."""

    def __init__(self, rng_seed: int = 42):
        self.rng = np.random.default_rng(rng_seed)

    def predict_congestion(self, port: Port, scenario: Scenario) -> CongestionPrediction:
        """Returns a probabilistic delay forecast for a port under a given scenario.
        
        Uses a log-normal distribution approximation for waiting times.
        """
        # Base parameters from port metadata
        base_mean = port.congestion_delay_mean_h
        base_std = port.congestion_delay_std_h

        # Apply Scenario Shock
        scenario_added_delay = scenario.port_delay_hours.get(port.port_id, 0.0)
        
        # If it's a general congestion scenario, bump everything
        multiplier = 1.0
        if scenario.scenario_type == ScenarioType.CONGESTION:
            multiplier = 1.5
            base_std *= 1.8 # Variance goes up drastically during congestion
        elif scenario.scenario_type == ScenarioType.STORM:
            multiplier = 1.3
            base_std *= 1.5
            
        adjusted_mean = (base_mean * multiplier) + scenario_added_delay
        adjusted_std = max(0.5, base_std)

        # Approximate Log-Normal parameters
        # mean = exp(mu + sigma^2 / 2), var = (exp(sigma^2) - 1) * exp(2*mu + sigma^2)
        # Solving for mu and sigma:
        var = adjusted_std ** 2
        sigma_sq = np.log((var / (adjusted_mean ** 2)) + 1)
        sigma = np.sqrt(sigma_sq)
        mu = np.log(adjusted_mean) - (sigma_sq / 2)

        # Use deterministic seeding based on scenario and port
        port_int = sum(ord(c) for c in port.port_id)
        local_seed = scenario.seed + port_int
        rng = np.random.default_rng(local_seed)

        # Generate samples to compute empirical quantiles and probabilities
        samples = rng.lognormal(mean=mu, sigma=sigma, size=10000)

        p10 = float(np.percentile(samples, 10))
        p50 = float(np.percentile(samples, 50))
        p90 = float(np.percentile(samples, 90))

        prob_2h = float(np.mean(samples < 2.0))
        prob_6h = float(np.mean(samples < 6.0))
        prob_12h = float(np.mean(samples < 12.0))
        prob_24h = float(np.mean(samples > 24.0))

        return CongestionPrediction(
            expected_delay_hours=round(float(np.mean(samples)), 2),
            p10_delay_hours=round(p10, 2),
            p50_delay_hours=round(p50, 2),
            p90_delay_hours=round(p90, 2),
            prob_wait_under_2h=round(prob_2h, 3),
            prob_wait_under_6h=round(prob_6h, 3),
            prob_wait_under_12h=round(prob_12h, 3),
            prob_wait_over_24h=round(prob_24h, 3)
        )
