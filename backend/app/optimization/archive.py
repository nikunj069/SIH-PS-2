"""Pareto frontier archive, non-dominated sorting, and hypervolume calculation."""

import numpy as np
from typing import List, Tuple
from backend.app.schemas import ParetoSolution, ObjectiveVector


class ParetoArchive:
    """Maintains a bounded non-dominated Pareto frontier archive with crowding distance."""

    def __init__(self, max_size: int = 50, ref_point: Tuple[float, float, float] = (5000000.0, 15000.0, 1.0)):
        self.max_size = max_size
        self.ref_point = np.array(ref_point)  # [Cost USD, GHG tonnes, Risk prob]
        self.solutions: List[ParetoSolution] = []

    @staticmethod
    def dominates(a: ObjectiveVector, b: ObjectiveVector) -> bool:
        """True if solution 'a' dominates solution 'b' in cost, GHG, and risk (all minimized)."""
        a_vec = np.array([a.total_cost_usd, a.wtw_ghg_tonnes, a.eta_risk_prob])
        b_vec = np.array([b.total_cost_usd, b.wtw_ghg_tonnes, b.eta_risk_prob])
        return bool(np.all(a_vec <= b_vec) and np.any(a_vec < b_vec))

    def add(self, solution: ParetoSolution) -> bool:
        """Add a solution to the archive if it is not dominated. Remove solutions it dominates."""
        new_obj = solution.evaluation.objectives

        # If any existing solution dominates new_obj, reject
        for existing in self.solutions:
            if self.dominates(existing.evaluation.objectives, new_obj):
                return False

        # Remove solutions dominated by the new one
        self.solutions = [s for s in self.solutions if not self.dominates(new_obj, s.evaluation.objectives)]
        self.solutions.append(solution)

        # Update ranks and crowding distances
        self._update_crowding_and_prune()
        return True

    def _update_crowding_and_prune(self):
        """Compute NSGA-II crowding distances and prune archive if size exceeds max_size."""
        n = len(self.solutions)
        if n == 0:
            return

        for s in self.solutions:
            s.rank = 1
            s.crowding_distance = 0.0

        if n <= 2:
            for s in self.solutions:
                s.crowding_distance = float("inf")
            return

        # Compute crowding distance across cost and GHG objectives
        costs = np.array([s.evaluation.objectives.total_cost_usd for s in self.solutions])
        ghgs = np.array([s.evaluation.objectives.wtw_ghg_tonnes for s in self.solutions])

        for obj_vals in [costs, ghgs]:
            sorted_indices = np.argsort(obj_vals)
            # Boundary solutions get infinite distance
            self.solutions[sorted_indices[0]].crowding_distance = float("inf")
            self.solutions[sorted_indices[-1]].crowding_distance = float("inf")

            val_range = obj_vals[sorted_indices[-1]] - obj_vals[sorted_indices[0]]
            if val_range > 0:
                for i in range(1, n - 1):
                    dist = (obj_vals[sorted_indices[i + 1]] - obj_vals[sorted_indices[i - 1]]) / val_range
                    self.solutions[sorted_indices[i]].crowding_distance += float(dist)

        # Prune lowest crowding distance if over max_size
        if len(self.solutions) > self.max_size:
            self.solutions.sort(key=lambda x: x.crowding_distance, reverse=True)
            self.solutions = self.solutions[: self.max_size]

    def compute_hypervolume(self) -> float:
        """Compute 2D normalized hypervolume (Cost x GHG) relative to the reference point."""
        if not self.solutions:
            return 0.0

        # Extract costs and ghgs
        pts = np.array([[s.evaluation.objectives.total_cost_usd, s.evaluation.objectives.wtw_ghg_tonnes] for s in self.solutions])
        ref = self.ref_point[:2]

        # Filter points within reference bounds
        valid = pts[np.all(pts <= ref, axis=1)]
        if len(valid) == 0:
            return 0.0

        # Normalize points into [0, 1]
        norm_pts = 1.0 - (valid / ref)
        # Sort by first objective
        sorted_pts = norm_pts[np.argsort(norm_pts[:, 0])]

        # 2D Hypervolume Lebesgue measure calculation
        hv = 0.0
        max_y = 0.0
        for i in range(len(sorted_pts) - 1, -1, -1):
            x, y = sorted_pts[i]
            if y > max_y:
                hv += x * (y - max_y)
                max_y = y

        return float(min(1.0, max(0.0, hv)))
