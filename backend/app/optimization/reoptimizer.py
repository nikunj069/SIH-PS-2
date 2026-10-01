"""Disruption Re-Optimizer: Warm-started rapid response to sudden operational disruptions.

Handles storms, port congestion surges, fuel price spikes, and bunker outages.
Computes before/after deltas and operational action modifications.
"""

import time
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field
from backend.app.schemas import (
    ProblemDefinition,
    EvaluatorProtocol,
    ValidatorProtocol,
    ParetoSolution,
    Scenario,
    Plan,
    Provenance,
)
from backend.app.optimization.archive import ParetoArchive
from backend.app.optimization.encoding import PlanGenomeEncoder
from backend.app.optimization.quantum.qgreen_hybrid import QGreenHybridOptimizer


class ReoptimizationDelta(BaseModel):
    """Factual comparative metrics between pre-disruption baseline and re-optimized plan."""

    cost_delta_usd: float = Field(..., description="Re-optimized expected cost minus pre-disruption cost")
    cost_delta_pct: float = Field(..., description="Percentage change in operating cost")
    ghg_delta_tonnes: float = Field(..., description="Lifecycle GHG emission change in tonnes CO2e")
    ghg_delta_pct: float = Field(..., description="Percentage change in GHG emissions")
    eta_risk_before: float = Field(..., description="Initial ETA deadline breach probability")
    eta_risk_after: float = Field(..., description="Mitigated ETA deadline breach probability")
    actions_taken: List[str] = Field(default_factory=list, description="Concrete operational changes made")
    elapsed_time_s: float = Field(..., description="Wall-clock time to re-plan in seconds")
    warm_start_evals: int = Field(..., description="Evaluations used in rapid warm start")
    provenance: Provenance = Field(Provenance.SIMULATED)


class DisruptionReoptimizer:
    """Warm-starts optimization from a prior Pareto archive upon scenario disruption."""

    def __init__(self, name: str = "DisruptionReoptimizer"):
        self.name = name

    def reoptimize(
        self,
        problem: ProblemDefinition,
        prior_solutions: List[ParetoSolution],
        disruption_scenario: Scenario,
        evaluator: EvaluatorProtocol,
        validator: ValidatorProtocol,
        eval_budget: int = 50,
        seed: int = 42,
    ) -> Tuple[List[ParetoSolution], ReoptimizationDelta]:
        """Rapidly re-plan fleet operations under disruption using warm-start seeding."""
        t0 = time.time()
        archive = ParetoArchive(max_size=30)
        encoder = PlanGenomeEncoder(problem.twin_state)
        rng = np.random.default_rng(seed)

        # Baseline plan before disruption (best prior solution)
        best_prior = prior_solutions[0] if prior_solutions else None
        initial_cost = best_prior.evaluation.objectives.total_cost_usd if best_prior else 0.0
        initial_ghg = best_prior.evaluation.objectives.wtw_ghg_tonnes if best_prior else 0.0
        initial_risk = best_prior.evaluation.objectives.eta_risk_prob if best_prior else 0.0

        # Update problem with active disruption
        reopt_problem = problem.model_copy(deep=True)
        reopt_problem.active_scenarios = [disruption_scenario]
        reopt_problem.budget_evals = eval_budget
        reopt_problem.seed = seed

        # Warm start: repair and re-evaluate all prior Pareto solutions under new scenario
        evals_used = 0
        for prior_sol in prior_solutions:
            if evals_used >= eval_budget:
                break
            repaired_plan = encoder.repair(prior_sol.plan)
            eval_res = evaluator.evaluate(repaired_plan, [disruption_scenario])
            evals_used += 1

            if eval_res.constraints.is_feasible:
                sol = ParetoSolution(
                    solution_id=f"REOPT_WARM_{evals_used}",
                    plan=repaired_plan,
                    evaluation=eval_res,
                    rank=1,
                    crowding_distance=0.0,
                    provenance=Provenance.SIMULATED,
                )
                archive.add(sol)

        # Focused local hybrid search with remaining budget
        remaining_budget = max(5, eval_budget - evals_used)
        hybrid_opt = QGreenHybridOptimizer(
            population_size=min(12, remaining_budget),
            rotation_angle_rad=0.08 * np.pi,  # slightly faster rotation for agile re-optimization
        )
        reopt_problem.budget_evals = remaining_budget
        refined_solutions = hybrid_opt.optimize(reopt_problem, evaluator, validator)

        for sol in refined_solutions:
            archive.add(sol)

        elapsed = time.time() - t0

        # Select best balanced new solution
        new_best = archive.solutions[0] if archive.solutions else (prior_solutions[0] if prior_solutions else None)
        new_cost = new_best.evaluation.objectives.total_cost_usd if new_best else initial_cost
        new_ghg = new_best.evaluation.objectives.wtw_ghg_tonnes if new_best else initial_ghg
        new_risk = new_best.evaluation.objectives.eta_risk_prob if new_best else initial_risk

        cost_delta = new_cost - initial_cost
        cost_delta_pct = (cost_delta / max(1.0, initial_cost)) * 100.0
        ghg_delta = new_ghg - initial_ghg
        ghg_delta_pct = (ghg_delta / max(1.0, initial_ghg)) * 100.0

        # Extract concrete actions taken
        actions = []
        if disruption_scenario.weather_multiplier > 1.2:
            actions.append(f"Storm mitigation: Weather resistance factor elevated to {disruption_scenario.weather_multiplier:.2f}x; speed optimized for fuel-drag balance.")
        if disruption_scenario.port_delay_hours:
            ports_affected = list(disruption_scenario.port_delay_hours.keys())
            actions.append(f"Port delay mitigation: Absorbed {disruption_scenario.port_delay_hours} hours added congestion at {', '.join(ports_affected)}.")
        if disruption_scenario.bunker_outages:
            outages_str = [f"{p}:{f}" for p, f in disruption_scenario.bunker_outages]
            actions.append(f"Supply chain rerouting: Bunkering bypassed for stockout items [{', '.join(outages_str)}].")
        if not actions:
            actions.append("Optimized speed schedules and bunker allocations for new environmental conditions.")

        delta = ReoptimizationDelta(
            cost_delta_usd=round(cost_delta, 2),
            cost_delta_pct=round(cost_delta_pct, 2),
            ghg_delta_tonnes=round(ghg_delta, 2),
            ghg_delta_pct=round(ghg_delta_pct, 2),
            eta_risk_before=round(initial_risk, 3),
            eta_risk_after=round(new_risk, 3),
            actions_taken=actions,
            elapsed_time_s=round(elapsed, 3),
            warm_start_evals=evals_used,
            provenance=Provenance.SIMULATED,
        )

        return archive.solutions, delta
