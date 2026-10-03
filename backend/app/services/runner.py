"""Job runner and registry for asynchronous optimization runs and WebSocket telemetry."""

import asyncio
import threading
import time
import uuid
from typing import Dict, List, Optional, Set
from backend.app.schemas import (
    ProblemDefinition,
    RunTelemetry,
    ParetoSolution,
    Scenario,
)
from backend.app.data.loader import get_default_twin_state, load_scenarios
from backend.app.digital_twin.validator import ConstraintValidator
from backend.app.digital_twin.evaluator import DigitalTwinEvaluator
from backend.app.prediction.service import get_surrogate
from backend.app.optimization.baselines.greedy import GreedyOptimizer
from backend.app.optimization.baselines.random_search import RandomSearchOptimizer
from backend.app.optimization.baselines.ga import GeneticAlgorithmOptimizer
from backend.app.optimization.baselines.nsga2 import NSGA2Optimizer
from backend.app.optimization.quantum.qpso import QPSOOptimizer
from backend.app.optimization.quantum.qiga import QIGAOptimizer
from backend.app.optimization.quantum.qgreen_hybrid import QGreenHybridOptimizer
from backend.app.optimization.reoptimizer import DisruptionReoptimizer
from backend.app.memory.store import FleetMemoryStore, ProblemFingerprint, ExperienceRecord


memory_store = FleetMemoryStore()


class RunRegistry:
    """Manages background optimization runs and live WebSocket subscriber queues."""

    def __init__(self):
        self.runs: Dict[str, Dict] = {}
        self.subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def _get_loop(self):
        try:
            return asyncio.get_running_loop()
        except RuntimeError:
            return None

    def start_job(
        self,
        problem: ProblemDefinition,
        algorithm_name: str = "Q-GREEN-Hybrid",
        seed: int = 42,
        eval_budget: int = 2000,
    ) -> str:
        run_id = f"RUN_{uuid.uuid4().hex[:8].upper()}"
        self.runs[run_id] = {
            "run_id": run_id,
            "status": "running",
            "algorithm": algorithm_name,
            "seed": seed,
            "eval_budget": eval_budget,
            "telemetry_history": [],
            "solutions": [],
            "start_time": time.time(),
        }
        self.subscribers[run_id] = set()

        thread = threading.Thread(
            target=self._execute_run,
            args=(run_id, problem, algorithm_name, seed, eval_budget),
            daemon=True,
        )
        thread.start()
        return run_id

    def _execute_run(
        self,
        run_id: str,
        problem: ProblemDefinition,
        algorithm_name: str,
        seed: int,
        eval_budget: int,
    ):
        state = problem.twin_state
        validator = ConstraintValidator(state)
        surrogate = get_surrogate()
        evaluator = DigitalTwinEvaluator(state, fuel_surrogate=surrogate)

        # Select algorithm
        alg_map = {
            "Greedy": GreedyOptimizer(),
            "Random Search": RandomSearchOptimizer(),
            "GA": GeneticAlgorithmOptimizer(population_size=15),
            "NSGA-II": NSGA2Optimizer(population_size=20),
            "QPSO": QPSOOptimizer(num_particles=20),
            "QIGA": QIGAOptimizer(population_size=20),
            "Q-GREEN-Hybrid": QGreenHybridOptimizer(population_size=20),
        }
        optimizer = alg_map.get(algorithm_name, QGreenHybridOptimizer(population_size=20))

        def on_telemetry(tel: RunTelemetry):
            self.runs[run_id]["telemetry_history"].append(tel)
            # Notify subscribers
            queues = self.subscribers.get(run_id, set())
            for q in list(queues):
                try:
                    q.put_nowait(tel)
                except Exception:
                    pass

        try:
            problem.budget_evals = eval_budget
            problem.seed = seed
            solutions = optimizer.optimize(problem, evaluator, validator, telemetry_callback=on_telemetry)
            self.runs[run_id]["solutions"] = solutions
            self.runs[run_id]["status"] = "completed"
            
            # Store experience for future warm starts
            if solutions and len(solutions) >= 3:
                try:
                    sorted_by_cost = sorted(solutions, key=lambda s: s.evaluation.objectives.total_cost_usd)
                    sorted_by_ghg = sorted(solutions, key=lambda s: s.evaluation.objectives.wtw_ghg_tonnes)
                    sorted_by_risk = sorted(solutions, key=lambda s: s.evaluation.objectives.eta_risk_prob)
                    
                    fp = ProblemFingerprint(
                        vessel_count=len(state.vessels),
                        active_route_count=len(state.routes),
                        mean_fuel_price=550.0,
                        weather_severity=1.0,
                        congestion_level=1.0
                    )
                    rec = ExperienceRecord(
                        record_id=f"MEM_{run_id}",
                        fingerprint=fp,
                        best_cost_plan=sorted_by_cost[0].plan,
                        best_ghg_plan=sorted_by_ghg[0].plan,
                        best_robust_plan=sorted_by_risk[0].plan,
                        timestamp=time.time()
                    )
                    memory_store.store_experience(rec)
                except Exception as ex:
                    print(f"Failed to store memory: {ex}")
        except Exception as e:
            self.runs[run_id]["status"] = "failed"
            self.runs[run_id]["error"] = str(e)
        finally:
            queues = self.subscribers.get(run_id, set())
            for q in list(queues):
                q.put_nowait(None)  # Sentinel to close subscriber

    def start_reoptimization(
        self,
        prior_run_id: str,
        disruption_scenario: Scenario,
        warm_start_archive_size: int = 20,
        eval_budget: int = 1000,
        seed: int = 42,
    ) -> str:
        run_id = f"REOPT_{uuid.uuid4().hex[:8].upper()}"
        prior_run = self.runs.get(prior_run_id)
        prior_solutions = prior_run["solutions"] if prior_run else []

        self.runs[run_id] = {
            "run_id": run_id,
            "status": "running",
            "algorithm": "Q-GREEN-Reopt",
            "seed": seed,
            "eval_budget": eval_budget,
            "telemetry_history": [],
            "solutions": [],
            "delta": None,
            "start_time": time.time(),
        }
        self.subscribers[run_id] = set()

        def _execute_reopt():
            state = get_default_twin_state()
            validator = ConstraintValidator(state)
            surrogate = get_surrogate()
            evaluator = DigitalTwinEvaluator(state, fuel_surrogate=surrogate)
            reoptimizer = DisruptionReoptimizer()

            prob = ProblemDefinition(
                name="Disruption-Replan",
                twin_state=state,
                active_scenarios=[disruption_scenario],
                budget_evals=eval_budget,
                seed=seed,
                provenance=disruption_scenario.provenance,
            )

            # Retrieve memory warm starts
            fp = ProblemFingerprint(
                vessel_count=len(state.vessels),
                active_route_count=len(state.routes),
                mean_fuel_price=550.0,
                weather_severity=1.0 * disruption_scenario.weather_multiplier,
                congestion_level=1.0 + (list(disruption_scenario.port_delay_hours.values())[0] if disruption_scenario.port_delay_hours else 0.0)
            )
            warm_start_plans = memory_store.retrieve_similar_plans(fp)
            warm_start_sols = [ParetoSolution(solution_id=f"WS_{i}", plan=p, rank=1, crowding_distance=0.0, evaluation=None, provenance=Provenance.SIMULATED) for i, p in enumerate(warm_start_plans)]

            combined_prior = (prior_solutions[:warm_start_archive_size] + warm_start_sols)

            solutions, delta = reoptimizer.reoptimize(
                problem=prob,
                prior_solutions=combined_prior,
                disruption_scenario=disruption_scenario,
                evaluator=evaluator,
                validator=validator,
                eval_budget=eval_budget,
                seed=seed,
            )
            self.runs[run_id]["solutions"] = solutions
            self.runs[run_id]["delta"] = delta.model_dump()
            self.runs[run_id]["status"] = "completed"

        threading.Thread(target=_execute_reopt, daemon=True).start()
        return run_id

    def get_result(self, run_id: str) -> Optional[Dict]:
        return self.runs.get(run_id)

    def subscribe(self, run_id: str) -> asyncio.Queue:
        q = asyncio.Queue()
        if run_id not in self.subscribers:
            self.subscribers[run_id] = set()
        self.subscribers[run_id].add(q)
        return q

    def unsubscribe(self, run_id: str, queue: asyncio.Queue):
        if run_id in self.subscribers:
            self.subscribers[run_id].discard(queue)


run_registry = RunRegistry()
