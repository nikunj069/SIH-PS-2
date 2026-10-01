"""Quantum-Inspired Genetic Algorithm (QIGA) with Q-bit registers and quantum rotation gates."""

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


class QIGAOptimizer:
    """Quantum-Inspired Genetic Algorithm (QIGA) for discrete decision spaces.

    Employs Q-bit probability registers, measurement sampling, and quantum rotation gates.
    Honesty disclosure: Classical quantum-inspired metaheuristic; no quantum hardware used.
    """

    def __init__(
        self,
        population_size: int = 25,
        rotation_angle_rad: float = 0.05 * np.pi,
        name: str = "QIGA",
    ):
        self.population_size = population_size
        self.rotation_angle = rotation_angle_rad
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
        fixed_cont = np.full(continuous_dim, 0.5)  # fixed mid-range continuous baseline

        # 1. Initialize Q-bit population: each individual has probability vector p in [0, 1]^D
        # Initially p_d = 0.5 (equal superposition |0> and |1>)
        q_probs = [np.full(discrete_dim, 0.5) for _ in range(self.population_size)]

        evals_used = 0
        feasible_count = 0
        generation = 0
        best_cost = float("inf")
        best_ghg = float("inf")
        best_discrete: Optional[np.ndarray] = None
        best_fitness = float("inf")

        w_cost = problem.weights.get("cost", 0.5)
        w_ghg = problem.weights.get("ghg", 0.5)

        stagnation_counter = 0
        prev_hv = 0.0

        while evals_used < problem.budget_evals:
            generation += 1
            pop_solutions = []
            pop_discretes = []
            pop_fitnesses = []

            # 2. Measurement step: Collapse Q-bits into classical discrete plans
            for i in range(self.population_size):
                if evals_used >= problem.budget_evals:
                    break

                # Sample discrete decisions from Q-bit probabilities
                # Each gene d in [0, max_val_d]
                disc = np.zeros(discrete_dim, dtype=int)
                for d in range(discrete_dim):
                    prob = q_probs[i][d]
                    # Map probability into categorical integer index
                    # Uses quantum probability to bias selection
                    disc[d] = int(prob * 10) if rng.random() < prob else rng.integers(0, 10)

                plan = encoder.repair(encoder.decode(disc, fixed_cont, plan_id=f"QIGA_GEN{generation}_{evals_used}"))
                eval_res = evaluator.evaluate(plan, problem.active_scenarios)
                evals_used += 1

                norm_cost = eval_res.objectives.total_cost_usd / 2000000.0
                norm_ghg = eval_res.objectives.wtw_ghg_tonnes / 5000.0
                fitness = w_cost * norm_cost + w_ghg * norm_ghg

                pop_discretes.append(disc)
                pop_fitnesses.append(fitness)

                if fitness < best_fitness:
                    best_fitness = fitness
                    best_discrete = disc.copy()

                if eval_res.constraints.is_feasible:
                    feasible_count += 1
                    best_cost = min(best_cost, eval_res.objectives.total_cost_usd)
                    best_ghg = min(best_ghg, eval_res.objectives.wtw_ghg_tonnes)
                    sol = ParetoSolution(
                        solution_id=f"SOL_QIGA_{evals_used}",
                        plan=plan,
                        evaluation=eval_res,
                        rank=1,
                        crowding_distance=0.0,
                        provenance=Provenance.SIMULATED,
                    )
                    archive.add(sol)

            # 3. Quantum Rotation Gate Update
            # Shift Q-bit probabilities toward the best observed discrete genome
            if best_discrete is not None:
                for i in range(len(q_probs)):
                    for d in range(discrete_dim):
                        target_val = (best_discrete[d] % 10) / 10.0
                        # Rotate toward target
                        delta = self.rotation_angle * (1.0 if target_val > q_probs[i][d] else -1.0)
                        q_probs[i][d] = np.clip(q_probs[i][d] + delta, 0.05, 0.95)

            # 4. Cataclysmic Quantum Diversification on stagnation
            current_hv = archive.compute_hypervolume()
            if abs(current_hv - prev_hv) < 1e-4:
                stagnation_counter += 1
            else:
                stagnation_counter = 0
            prev_hv = current_hv

            if stagnation_counter >= 5:
                # Re-disperse toward equal superposition
                for i in range(len(q_probs)):
                    mask = rng.random(discrete_dim) < 0.40
                    q_probs[i][mask] = 0.5
                stagnation_counter = 0

            if telemetry_callback and (generation % 2 == 0 or evals_used >= problem.budget_evals):
                # Compute Q-bit probability entropy as quantum state summary
                mean_probs = np.mean(q_probs, axis=0)
                entropy = float(-np.mean(mean_probs * np.log(mean_probs + 1e-9) + (1 - mean_probs) * np.log(1 - mean_probs + 1e-9)))

                telemetry = RunTelemetry(
                    run_id=problem.name,
                    algorithm=self.name,
                    generation=generation,
                    evaluations_used=evals_used,
                    budget_evals=problem.budget_evals,
                    hypervolume=current_hv,
                    feasible_rate=feasible_count / max(1, evals_used),
                    best_cost_usd=best_cost if best_cost < float("inf") else 0.0,
                    best_ghg_tonnes=best_ghg if best_ghg < float("inf") else 0.0,
                    seed=problem.seed,
                    elapsed_time_s=time.time() - start_time,
                    converged=evals_used >= problem.budget_evals,
                    q_state_summary={"qbit_entropy": round(entropy, 4)},
                    provenance=Provenance.SIMULATED,
                )
                telemetry_callback(telemetry)

        return archive.solutions
