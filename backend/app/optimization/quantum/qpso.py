"""Quantum-behaved Particle Swarm Optimization (QPSO) for continuous decision genes."""

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


class QPSOOptimizer:
    """Quantum-behaved Particle Swarm Optimization (QPSO) based on delta potential well mechanics.

    Honesty disclosure: Classical quantum-inspired metaheuristic; executes on classical CPU.
    """

    def __init__(
        self,
        num_particles: int = 25,
        beta_max: float = 1.0,
        beta_min: float = 0.5,
        name: str = "QPSO",
    ):
        self.num_particles = num_particles
        self.beta_max = beta_max
        self.beta_min = beta_min
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

        # Discrete template (from greedy/eco baseline)
        fixed_disc = rng.integers(0, 5, size=discrete_dim)

        # 1. Initialize Particles (Latin hypercube / uniform)
        particles = [rng.uniform(0.0, 1.0, size=continuous_dim) for _ in range(self.num_particles)]
        pbest = [p.copy() for p in particles]
        pbest_scores = [float("inf") for _ in range(self.num_particles)]
        gbest = particles[0].copy()
        gbest_score = float("inf")

        evals_used = 0
        feasible_count = 0
        generation = 0
        best_cost = float("inf")
        best_ghg = float("inf")

        w_cost = problem.weights.get("cost", 0.5)
        w_ghg = problem.weights.get("ghg", 0.5)

        # Evaluate Initial Swarm
        for i in range(self.num_particles):
            if evals_used >= problem.budget_evals:
                break
            plan = encoder.repair(encoder.decode(fixed_disc, particles[i], plan_id=f"QPSO_INIT_{i}"))
            eval_res = evaluator.evaluate(plan, problem.active_scenarios)
            evals_used += 1

            norm_cost = eval_res.objectives.total_cost_usd / 2000000.0
            norm_ghg = eval_res.objectives.wtw_ghg_tonnes / 5000.0
            score = w_cost * norm_cost + w_ghg * norm_ghg

            pbest_scores[i] = score
            if score < gbest_score:
                gbest_score = score
                gbest = particles[i].copy()

            if eval_res.constraints.is_feasible:
                feasible_count += 1
                best_cost = min(best_cost, eval_res.objectives.total_cost_usd)
                best_ghg = min(best_ghg, eval_res.objectives.wtw_ghg_tonnes)
                sol = ParetoSolution(
                    solution_id=f"SOL_QPSO_{evals_used}",
                    plan=plan,
                    evaluation=eval_res,
                    rank=1,
                    crowding_distance=0.0,
                    provenance=Provenance.SIMULATED,
                )
                archive.add(sol)

        max_iter = max(1, problem.budget_evals // self.num_particles)

        # 2. QPSO Position Update Loop
        while evals_used < problem.budget_evals:
            generation += 1
            # Contraction-expansion coefficient beta linearly decreases
            beta = self.beta_max - (generation / max_iter) * (self.beta_max - self.beta_min)
            beta = max(self.beta_min, beta)

            # Compute mean best position (mbest)
            mbest = np.mean(pbest, axis=0)

            for i in range(self.num_particles):
                if evals_used >= problem.budget_evals:
                    break

                # Local attractor: p_i = phi * pbest_i + (1 - phi) * gbest
                phi = rng.uniform(0.0, 1.0, size=continuous_dim)
                p_attractor = phi * pbest[i] + (1.0 - phi) * gbest

                # Quantum delta-potential update:
                # X_new = p_attractor ± beta * |mbest - X| * ln(1 / u)
                u = rng.uniform(1e-6, 1.0, size=continuous_dim)
                sign = rng.choice([-1.0, 1.0], size=continuous_dim)
                delta_x = sign * beta * np.abs(mbest - particles[i]) * np.log(1.0 / u)

                particles[i] = np.clip(p_attractor + delta_x, 0.0, 1.0)

                # Decode, repair, evaluate
                plan = encoder.repair(encoder.decode(fixed_disc, particles[i], plan_id=f"QPSO_GEN{generation}_{evals_used}"))
                eval_res = evaluator.evaluate(plan, problem.active_scenarios)
                evals_used += 1

                norm_cost = eval_res.objectives.total_cost_usd / 2000000.0
                norm_ghg = eval_res.objectives.wtw_ghg_tonnes / 5000.0
                score = w_cost * norm_cost + w_ghg * norm_ghg

                if score < pbest_scores[i]:
                    pbest_scores[i] = score
                    pbest[i] = particles[i].copy()

                if score < gbest_score:
                    gbest_score = score
                    gbest = particles[i].copy()

                if eval_res.constraints.is_feasible:
                    feasible_count += 1
                    best_cost = min(best_cost, eval_res.objectives.total_cost_usd)
                    best_ghg = min(best_ghg, eval_res.objectives.wtw_ghg_tonnes)
                    sol = ParetoSolution(
                        solution_id=f"SOL_QPSO_{evals_used}",
                        plan=plan,
                        evaluation=eval_res,
                        rank=1,
                        crowding_distance=0.0,
                        provenance=Provenance.SIMULATED,
                    )
                    archive.add(sol)

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
