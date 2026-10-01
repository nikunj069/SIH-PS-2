"""Q-GREEN Hybrid Multi-Objective Optimizer: QIGA (discrete) + QPSO (continuous) + NSGA-II Archive.

Honesty disclosure:
This optimizer is quantum-inspired and classical. It executes on classical CPU hardware.
No quantum advantage claims are made.
"""

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


class QGreenHybridOptimizer:
    """Flagship Q-GREEN Hybrid Algorithm.

    Combines:
      - QIGA (Quantum-Inspired Genetic Algorithm) for discrete assignment, fuel, and OPS genes
      - QPSO (Quantum-behaved Particle Swarm Optimization) for continuous speed and bunker genes
      - NSGA-II Non-dominated Sorting and Crowding Distance for Pareto frontier preservation
      - Constraint-aware repair and cataclysmic quantum diversification on stagnation
    """

    def __init__(
        self,
        population_size: int = 25,
        rotation_angle_rad: float = 0.06 * np.pi,
        beta_max: float = 1.0,
        beta_min: float = 0.5,
        stagnation_window: int = 5,
        name: str = "Q-GREEN-Hybrid",
    ):
        self.population_size = population_size
        self.rotation_angle = rotation_angle_rad
        self.beta_max = beta_max
        self.beta_min = beta_min
        self.stagnation_window = stagnation_window
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

        # 1. Step 1: Initialize Q-bit probabilities (superposition: p = 0.5)
        # and QPSO continuous particles (uniform in [0, 1])
        q_probs = [np.full(discrete_dim, 0.5) for _ in range(self.population_size)]
        particles = [rng.uniform(0.0, 1.0, size=continuous_dim) for _ in range(self.population_size)]
        pbest = [p.copy() for p in particles]
        pbest_scores = [float("inf") for _ in range(self.population_size)]

        evals_used = 0
        feasible_count = 0
        generation = 0
        best_cost = float("inf")
        best_ghg = float("inf")

        w_cost = problem.weights.get("cost", 0.5)
        w_ghg = problem.weights.get("ghg", 0.5)

        stagnation_counter = 0
        prev_hv = 0.0
        max_iter = max(1, problem.budget_evals // self.population_size)

        while evals_used < problem.budget_evals:
            generation += 1

            # Contraction-expansion parameter beta for QPSO
            beta = self.beta_max - (generation / max_iter) * (self.beta_max - self.beta_min)
            beta = max(self.beta_min, beta)

            # Continuous mean best (mbest)
            mbest = np.mean(pbest, axis=0)

            # Sample guide solution from archive (crowding-weighted)
            if len(archive.solutions) > 0:
                # Pick from top-ranked archive solutions
                guide_sol = rng.choice(archive.solutions)
                guide_disc, guide_cont = encoder.encode(guide_sol.plan)
            else:
                guide_disc = rng.integers(0, 5, size=discrete_dim)
                guide_cont = particles[0].copy()

            # Iterate through hybrid population
            for i in range(self.population_size):
                if evals_used >= problem.budget_evals:
                    break

                # 2. Measure discrete genes from Q-bit probabilities
                disc = np.zeros(discrete_dim, dtype=int)
                for d in range(discrete_dim):
                    prob = q_probs[i][d]
                    disc[d] = int(prob * 10) if rng.random() < prob else rng.integers(0, 10)

                # Update continuous genes via QPSO quantum potential attractor
                phi = rng.uniform(0.0, 1.0, size=continuous_dim)
                p_attractor = phi * pbest[i] + (1.0 - phi) * guide_cont

                u = rng.uniform(1e-6, 1.0, size=continuous_dim)
                sign = rng.choice([-1.0, 1.0], size=continuous_dim)
                delta_x = sign * beta * np.abs(mbest - particles[i]) * np.log(1.0 / u)
                particles[i] = np.clip(p_attractor + delta_x, 0.0, 1.0)

                # 3. Constraint-aware Repair
                raw_plan = encoder.decode(disc, particles[i], plan_id=f"QGREEN_GEN{generation}_{evals_used}")
                repaired_plan = encoder.repair(raw_plan)

                # 4. Independent Validation + Evaluation
                eval_res = evaluator.evaluate(repaired_plan, problem.active_scenarios)
                evals_used += 1

                norm_cost = eval_res.objectives.total_cost_usd / 2000000.0
                norm_ghg = eval_res.objectives.wtw_ghg_tonnes / 5000.0
                fitness = w_cost * norm_cost + w_ghg * norm_ghg

                # Update pbest if improved
                if fitness < pbest_scores[i]:
                    pbest_scores[i] = fitness
                    pbest[i] = particles[i].copy()

                # 5. Merge into Pareto Archive
                if eval_res.constraints.is_feasible:
                    feasible_count += 1
                    best_cost = min(best_cost, eval_res.objectives.total_cost_usd)
                    best_ghg = min(best_ghg, eval_res.objectives.wtw_ghg_tonnes)
                    sol = ParetoSolution(
                        solution_id=f"SOL_QGREEN_{evals_used}",
                        plan=repaired_plan,
                        evaluation=eval_res,
                        rank=1,
                        crowding_distance=0.0,
                        provenance=Provenance.SIMULATED,
                    )
                    archive.add(sol)

            # 6. Quantum Rotation Gate Update:
            # Rotate Q-bit probabilities toward rank-1 archive members
            if len(archive.solutions) > 0:
                best_member = min(archive.solutions, key=lambda s: s.evaluation.objectives.total_cost_usd)
                best_d, _ = encoder.encode(best_member.plan)

                for i in range(self.population_size):
                    for d in range(discrete_dim):
                        target_val = (best_d[d] % 10) / 10.0
                        delta = self.rotation_angle * (1.0 if target_val > q_probs[i][d] else -1.0)
                        q_probs[i][d] = np.clip(q_probs[i][d] + delta, 0.05, 0.95)

            # 7. Quantum Diversification on Stagnation (Hypervolume stall)
            current_hv = archive.compute_hypervolume()
            if abs(current_hv - prev_hv) < 1e-4:
                stagnation_counter += 1
            else:
                stagnation_counter = 0
            prev_hv = current_hv

            if stagnation_counter >= self.stagnation_window:
                # Cataclysmic quantum re-diversification:
                # Re-disperse 45% of Q-bits toward equal superposition & re-seed particles
                for i in range(self.population_size):
                    mask = rng.random(discrete_dim) < 0.45
                    q_probs[i][mask] = 0.5
                    c_mask = rng.random(continuous_dim) < 0.35
                    particles[i][c_mask] = rng.uniform(0.0, 1.0, size=np.sum(c_mask))
                stagnation_counter = 0

            # 8. Emit Telemetry
            if telemetry_callback and (generation % 2 == 0 or evals_used >= problem.budget_evals):
                mean_p = np.mean(q_probs, axis=0)
                entropy = float(-np.mean(mean_p * np.log(mean_p + 1e-9) + (1 - mean_p) * np.log(1 - mean_p + 1e-9)))

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
                    q_state_summary={
                        "qbit_entropy": round(entropy, 4),
                        "mbest_norm": round(float(np.linalg.norm(mbest)), 4),
                        "beta": round(beta, 3),
                    },
                    provenance=Provenance.SIMULATED,
                )
                telemetry_callback(telemetry)

        return archive.solutions
