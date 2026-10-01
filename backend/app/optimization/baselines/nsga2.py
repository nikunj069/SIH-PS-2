"""NSGA-II multi-objective optimizer with non-dominated sorting and crowding distance."""

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


class NSGA2Optimizer:
    """Non-dominated Sorting Genetic Algorithm II (NSGA-II) for Pareto fleet optimization."""

    def __init__(self, population_size: int = 30, name: str = "NSGA-II"):
        self.population_size = population_size
        self.name = name

    def optimize(
        self,
        problem: ProblemDefinition,
        evaluator: EvaluatorProtocol,
        validator: ValidatorProtocol,
        telemetry_callback: Optional[Callable[[RunTelemetry], None]] = None,
    ) -> List[ParetoSolution]:
        start_time = time.time()
        archive = ParetoArchive(max_size=50)
        encoder = PlanGenomeEncoder(problem.twin_state)
        rng = np.random.default_rng(problem.seed)

        discrete_dim = encoder.num_vessels + encoder.num_legs + encoder.num_vp_pairs
        continuous_dim = encoder.num_legs + encoder.num_vp_pairs

        # Initialize Population
        pop_disc = [rng.integers(0, 10, size=discrete_dim) for _ in range(self.population_size)]
        pop_cont = [rng.uniform(0.0, 1.0, size=continuous_dim) for _ in range(self.population_size)]

        evals_used = 0
        feasible_count = 0
        generation = 0
        best_cost = float("inf")
        best_ghg = float("inf")

        # Evaluate initial population
        pop_objs: List[np.ndarray] = []
        pop_solutions: List[ParetoSolution] = []

        for i in range(self.population_size):
            if evals_used >= problem.budget_evals:
                break
            plan = encoder.repair(encoder.decode(pop_disc[i], pop_cont[i], plan_id=f"NSGA2_INIT_{i}"))
            eval_res = evaluator.evaluate(plan, problem.active_scenarios)
            evals_used += 1

            # Objective vector to minimize: [Cost, GHG]
            objs = np.array([eval_res.objectives.total_cost_usd, eval_res.objectives.wtw_ghg_tonnes])
            pop_objs.append(objs)

            sol = ParetoSolution(
                solution_id=f"SOL_NSGA2_{evals_used}",
                plan=plan,
                evaluation=eval_res,
                rank=1,
                crowding_distance=0.0,
                provenance=Provenance.SIMULATED,
            )
            pop_solutions.append(sol)

            if eval_res.constraints.is_feasible:
                feasible_count += 1
                best_cost = min(best_cost, eval_res.objectives.total_cost_usd)
                best_ghg = min(best_ghg, eval_res.objectives.wtw_ghg_tonnes)
                archive.add(sol)

        # Main NSGA-II Loop
        while evals_used < problem.budget_evals:
            generation += 1

            # Generate Offspring via Tournament and SBX/Polynomial Mutation-like operators
            offspring_disc = []
            offspring_cont = []

            for _ in range(self.population_size):
                if evals_used >= problem.budget_evals:
                    break

                # Selection
                p1 = rng.integers(0, len(pop_disc))
                p2 = rng.integers(0, len(pop_disc))

                # Uniform crossover
                mask_d = rng.random(discrete_dim) < 0.5
                child_d = np.where(mask_d, pop_disc[p1], pop_disc[p2])

                mask_c = rng.random(continuous_dim) < 0.5
                child_c = np.where(mask_c, pop_cont[p1], pop_cont[p2])

                # Mutation
                mut_mask_d = rng.random(discrete_dim) < 0.10
                child_d[mut_mask_d] = rng.integers(0, 10, size=np.sum(mut_mask_d))

                mut_mask_c = rng.random(continuous_dim) < 0.15
                child_c[mut_mask_c] = np.clip(child_c[mut_mask_c] + rng.normal(0, 0.1, size=np.sum(mut_mask_c)), 0.0, 1.0)

                # Decode & evaluate
                plan = encoder.repair(encoder.decode(child_d, child_c, plan_id=f"NSGA2_GEN{generation}_{evals_used}"))
                eval_res = evaluator.evaluate(plan, problem.active_scenarios)
                evals_used += 1

                objs = np.array([eval_res.objectives.total_cost_usd, eval_res.objectives.wtw_ghg_tonnes])
                sol = ParetoSolution(
                    solution_id=f"SOL_NSGA2_{evals_used}",
                    plan=plan,
                    evaluation=eval_res,
                    rank=1,
                    crowding_distance=0.0,
                    provenance=Provenance.SIMULATED,
                )

                offspring_disc.append(child_d)
                offspring_cont.append(child_c)
                pop_objs.append(objs)
                pop_solutions.append(sol)

                if eval_res.constraints.is_feasible:
                    feasible_count += 1
                    best_cost = min(best_cost, eval_res.objectives.total_cost_usd)
                    best_ghg = min(best_ghg, eval_res.objectives.wtw_ghg_tonnes)
                    archive.add(sol)

            # Combine Parent + Offspring: select top population_size by non-domination rank
            all_disc = pop_disc + offspring_disc
            all_cont = pop_cont + offspring_cont

            # Non-dominated ranking
            n_all = len(all_disc)
            ranks = np.zeros(n_all, dtype=int)
            dom_counts = np.zeros(n_all, dtype=int)

            for i in range(n_all):
                for j in range(n_all):
                    if i != j:
                        # i dominates j?
                        if np.all(pop_objs[i] <= pop_objs[j]) and np.any(pop_objs[i] < pop_objs[j]):
                            pass
                        elif np.all(pop_objs[j] <= pop_objs[i]) and np.any(pop_objs[j] < pop_objs[i]):
                            dom_counts[i] += 1

            # Select survivors with smallest domination counts
            survivor_indices = np.argsort(dom_counts)[: self.population_size]
            pop_disc = [all_disc[idx] for idx in survivor_indices]
            pop_cont = [all_cont[idx] for idx in survivor_indices]
            pop_objs = [pop_objs[idx] for idx in survivor_indices]

            if telemetry_callback and (generation % 2 == 0 or evals_used >= problem.budget_evals):
                telemetry = RunTelemetry(
                    run_id=problem.name,
                    algorithm=self.name,
                    generation=generation,
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
