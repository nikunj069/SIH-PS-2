"""Genetic Algorithm baseline optimizer with crossover, mutation, and elitism."""

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


class GeneticAlgorithmOptimizer:
    """Genetic Algorithm operating on encoded discrete & continuous chromosomes."""

    def __init__(self, population_size: int = 24, mutation_rate: float = 0.15, name: str = "GA"):
        self.population_size = population_size
        self.mutation_rate = mutation_rate
        self.name = name

    def optimize(
        self,
        problem: ProblemDefinition,
        evaluator: EvaluatorProtocol,
        validator: ValidatorProtocol,
        telemetry_callback: Optional[Callable[[RunTelemetry], None]] = None,
    ) -> List[ParetoSolution]:
        start_time = time.time()
        archive = ParetoArchive(max_size=40)
        encoder = PlanGenomeEncoder(problem.twin_state)
        rng = np.random.default_rng(problem.seed)

        discrete_dim = encoder.num_vessels + encoder.num_legs + encoder.num_vp_pairs
        continuous_dim = encoder.num_legs + encoder.num_vp_pairs

        # 1. Initialize Population
        pop_disc = [rng.integers(0, 10, size=discrete_dim) for _ in range(self.population_size)]
        pop_cont = [rng.uniform(0.0, 1.0, size=continuous_dim) for _ in range(self.population_size)]

        evals_used = 0
        feasible_count = 0
        generation = 0
        best_cost = float("inf")
        best_ghg = float("inf")

        # Evaluate initial population
        pop_scores: List[float] = []
        pop_solutions: List[ParetoSolution] = []

        for i in range(self.population_size):
            if evals_used >= problem.budget_evals:
                break
            plan = encoder.repair(encoder.decode(pop_disc[i], pop_cont[i], plan_id=f"GA_GEN0_{i}"))
            eval_res = evaluator.evaluate(plan, problem.active_scenarios)
            evals_used += 1

            # Weighted fitness scalar for tournament selection
            w_cost = problem.weights.get("cost", 0.5)
            w_ghg = problem.weights.get("ghg", 0.5)
            norm_cost = eval_res.objectives.total_cost_usd / 2000000.0
            norm_ghg = eval_res.objectives.wtw_ghg_tonnes / 5000.0
            fitness = w_cost * norm_cost + w_ghg * norm_ghg
            pop_scores.append(fitness)

            if eval_res.constraints.is_feasible:
                feasible_count += 1
                best_cost = min(best_cost, eval_res.objectives.total_cost_usd)
                best_ghg = min(best_ghg, eval_res.objectives.wtw_ghg_tonnes)
                sol = ParetoSolution(
                    solution_id=f"SOL_GA_{evals_used}",
                    plan=plan,
                    evaluation=eval_res,
                    rank=1,
                    crowding_distance=0.0,
                    provenance=Provenance.SIMULATED,
                )
                archive.add(sol)
                pop_solutions.append(sol)

        # 2. Evolutionary Loop
        while evals_used < problem.budget_evals:
            generation += 1
            new_disc = []
            new_cont = []
            new_scores = []

            for _ in range(self.population_size):
                if evals_used >= problem.budget_evals:
                    break

                # Binary tournament selection
                i1, i2 = rng.choice(len(pop_scores), 2, replace=False)
                p1_idx = i1 if pop_scores[i1] < pop_scores[i2] else i2
                j1, j2 = rng.choice(len(pop_scores), 2, replace=False)
                p2_idx = j1 if pop_scores[j1] < pop_scores[j2] else j2

                # Crossover
                cx_point_disc = rng.integers(1, discrete_dim)
                child_disc = np.concatenate([pop_disc[p1_idx][:cx_point_disc], pop_disc[p2_idx][cx_point_disc:]])

                cx_point_cont = rng.integers(1, continuous_dim)
                child_cont = np.concatenate([pop_cont[p1_idx][:cx_point_cont], pop_cont[p2_idx][cx_point_cont:]])

                # Mutation
                for d in range(discrete_dim):
                    if rng.random() < self.mutation_rate:
                        child_disc[d] = rng.integers(0, 10)

                for c in range(continuous_dim):
                    if rng.random() < self.mutation_rate:
                        child_cont[c] = np.clip(child_cont[c] + rng.normal(0.0, 0.15), 0.0, 1.0)

                # Decode, repair, evaluate
                plan = encoder.repair(encoder.decode(child_disc, child_cont, plan_id=f"GA_GEN{generation}_{evals_used}"))
                eval_res = evaluator.evaluate(plan, problem.active_scenarios)
                evals_used += 1

                norm_cost = eval_res.objectives.total_cost_usd / 2000000.0
                norm_ghg = eval_res.objectives.wtw_ghg_tonnes / 5000.0
                fitness = w_cost * norm_cost + w_ghg * norm_ghg

                new_disc.append(child_disc)
                new_cont.append(child_cont)
                new_scores.append(fitness)

                if eval_res.constraints.is_feasible:
                    feasible_count += 1
                    best_cost = min(best_cost, eval_res.objectives.total_cost_usd)
                    best_ghg = min(best_ghg, eval_res.objectives.wtw_ghg_tonnes)
                    sol = ParetoSolution(
                        solution_id=f"SOL_GA_{evals_used}",
                        plan=plan,
                        evaluation=eval_res,
                        rank=1,
                        crowding_distance=0.0,
                        provenance=Provenance.SIMULATED,
                    )
                    archive.add(sol)

            if new_disc:
                pop_disc = new_disc
                pop_cont = new_cont
                pop_scores = new_scores

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
