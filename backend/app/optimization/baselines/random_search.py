"""Uniform random search optimizer baseline."""

import time
import numpy as np
from typing import Callable, List, Optional
from backend.app.schemas import (
    ProblemDefinition,
    EvaluatorProtocol,
    ValidatorProtocol,
    RunTelemetry,
    ParetoSolution,
    Provenance,
)
from backend.app.optimization.archive import ParetoArchive
from backend.app.optimization.encoding import PlanGenomeEncoder


class RandomSearchOptimizer:
    """Uniform random search with constraint repair and Pareto archiving."""

    def __init__(self, name: str = "RandomSearch"):
        self.name = name

    def optimize(
        self,
        problem: ProblemDefinition,
        evaluator: EvaluatorProtocol,
        validator: ValidatorProtocol,
        telemetry_callback: Optional[Callable[[RunTelemetry], None]] = None,
    ) -> List[ParetoSolution]:
        start_time = time.time()
        archive = ParetoArchive(max_size=30)
        encoder = PlanGenomeEncoder(problem.twin_state)
        rng = np.random.default_rng(problem.seed)

        evals_used = 0
        feasible_count = 0
        best_cost = float("inf")
        best_ghg = float("inf")

        discrete_dim = encoder.num_vessels + encoder.num_legs + encoder.num_vp_pairs
        continuous_dim = encoder.num_legs + encoder.num_vp_pairs

        while evals_used < problem.budget_evals:
            # Sample discrete genes randomly
            disc = rng.integers(0, 10, size=discrete_dim)
            # Sample continuous genes in [0, 1]
            cont = rng.uniform(0.0, 1.0, size=continuous_dim)

            raw_plan = encoder.decode(disc, cont, plan_id=f"RS_PLAN_{evals_used}")
            # Apply repair
            repaired_plan = encoder.repair(raw_plan)

            # Evaluate
            eval_res = evaluator.evaluate(repaired_plan, problem.active_scenarios)
            evals_used += 1

            if eval_res.constraints.is_feasible:
                feasible_count += 1
                best_cost = min(best_cost, eval_res.objectives.total_cost_usd)
                best_ghg = min(best_ghg, eval_res.objectives.wtw_ghg_tonnes)
                sol = ParetoSolution(
                    solution_id=f"SOL_RS_{evals_used}",
                    plan=repaired_plan,
                    evaluation=eval_res,
                    rank=1,
                    crowding_distance=0.0,
                    provenance=Provenance.SIMULATED,
                )
                archive.add(sol)

            if telemetry_callback and (evals_used % 50 == 0 or evals_used == problem.budget_evals):
                telemetry = RunTelemetry(
                    run_id=problem.name,
                    algorithm=self.name,
                    generation=evals_used,
                    evaluations_used=evals_used,
                    budget_evals=problem.budget_evals,
                    hypervolume=archive.compute_hypervolume(),
                    feasible_rate=feasible_count / max(1, evals_used),
                    best_cost_usd=best_cost if best_cost < float("inf") else 0.0,
                    best_ghg_tonnes=best_ghg if best_ghg < float("inf") else 0.0,
                    seed=problem.seed,
                    elapsed_time_s=time.time() - start_time,
                    converged=evals_used >= problem.budget_evals,
                    provenance=Provenance.SIMULATED,
                )
                telemetry_callback(telemetry)

        return archive.solutions
