"""Fleet Memory and Experience Store for Optimizer Warm-starting.

Stores past problem fingerprints and their best discovered Pareto plans to
warm-start search when disruptions hit, dramatically accelerating recovery.
"""

import numpy as np
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.plan import Plan


class ProblemFingerprint(BaseModel):
    """A low-dimensional hash of the optimization problem state."""
    vessel_count: int
    active_route_count: int
    mean_fuel_price: float
    weather_severity: float  # e.g., mean wave height
    congestion_level: float  # e.g., mean wait time
    
    def distance(self, other: "ProblemFingerprint") -> float:
        """Computes similarity distance between two problem states."""
        return float(np.sqrt(
            (self.vessel_count - other.vessel_count)**2 * 0.1 +
            (self.active_route_count - other.active_route_count)**2 * 0.1 +
            ((self.mean_fuel_price - other.mean_fuel_price)/100.0)**2 +
            (self.weather_severity - other.weather_severity)**2 +
            (self.congestion_level - other.congestion_level)**2
        ))


class ExperienceRecord(BaseModel):
    """A stored memory of a past successful optimization run."""
    record_id: str
    fingerprint: ProblemFingerprint
    best_cost_plan: Plan
    best_ghg_plan: Plan
    best_robust_plan: Plan
    timestamp: float


class FleetMemoryStore:
    """In-memory store of past fleet operations to accelerate replanning."""
    
    def __init__(self):
        self._records: List[ExperienceRecord] = []

    def store_experience(self, record: ExperienceRecord):
        """Save an optimization outcome to memory."""
        self._records.append(record)

    def retrieve_similar_plans(self, fingerprint: ProblemFingerprint, k: int = 3, threshold: float = 5.0) -> List[Plan]:
        """Retrieve plans from the K most similar historical problem states."""
        if not self._records:
            return []

        # Sort by distance
        scored_records = [
            (rec.fingerprint.distance(fingerprint), rec) 
            for rec in self._records
        ]
        scored_records.sort(key=lambda x: x[0])
        
        warm_start_plans = []
        for dist, rec in scored_records[:k]:
            if dist <= threshold:
                warm_start_plans.extend([
                    rec.best_cost_plan, 
                    rec.best_ghg_plan, 
                    rec.best_robust_plan
                ])
                
        return warm_start_plans
