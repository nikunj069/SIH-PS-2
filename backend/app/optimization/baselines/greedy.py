"""Greedy heuristic baseline optimizer."""

import time
from typing import Callable, List, Optional
from backend.app.schemas import (
    ProblemDefinition,
    EvaluatorProtocol,
    ValidatorProtocol,
    RunTelemetry,
    ParetoSolution,
    Plan,
    Provenance,
)
from backend.app.optimization.archive import ParetoArchive


class GreedyOptimizer:
    """Greedy heuristic: matches vessels to routes by capacity, runs at eco-speed, chooses lowest cost compliant fuel."""

    def __init__(self, name: str = "Greedy"):
        self.name = name

    def optimize(
        self,
        problem: ProblemDefinition,
        evaluator: EvaluatorProtocol,
        validator: ValidatorProtocol,
        telemetry_callback: Optional[Callable[[RunTelemetry], None]] = None,
    ) -> List[ParetoSolution]:
        start_time = time.time()
        archive = ParetoArchive(max_size=20)
        state = problem.twin_state
        routes = sorted(list(state.routes.values()), key=lambda r: r.demand_tonnes, reverse=True)
        vessels = sorted(list(state.vessels.values()), key=lambda v: v.dwt, reverse=True)

        evals_used = 0
        speed_variants = [0.85, 0.90, 0.95, 1.00]  # Speeds relative to design speed

        for speed_factor in speed_variants:
            if evals_used >= problem.budget_evals:
                break

            assignment = {}
            speed = {}
            fuel = {}
            ops = {}
            bunker = {}

            assigned_vessel_ids = set()

            for route in routes:
                assigned_vessel = None
                for v in vessels:
                    if v.vessel_id in assigned_vessel_ids:
                        continue
                    if v.dwt < route.demand_tonnes:
                        continue

                    # Draft compatibility checks
                    orig_p = state.ports.get(route.origin_port_id)
                    dest_p = state.ports.get(route.destination_port_id)
                    draft_ok = True
                    if orig_p and v.draft_design_m > orig_p.max_draft_m:
                        draft_ok = False
                    if dest_p and v.draft_design_m > dest_p.max_draft_m:
                        draft_ok = False
                    for leg in route.legs:
                        if v.draft_design_m > leg.depth_m:
                            draft_ok = False

                    if draft_ok:
                        assigned_vessel = v
                        assigned_vessel_ids.add(v.vessel_id)
                        break

                if assigned_vessel:
                    assignment[assigned_vessel.vessel_id] = route.route_id
                    for leg in route.legs:
                        leg_key = f"{assigned_vessel.vessel_id}_{leg.leg_id}"
                        target_sp = assigned_vessel.design_speed_knots * speed_factor
                        speed[leg_key] = max(assigned_vessel.min_speed_knots, min(assigned_vessel.max_speed_knots, target_sp))

                        # Select fuel: compliant with ECA and prioritizing capacity
                        if leg.in_eca:
                            compliant = [f for f in assigned_vessel.fuel_compat if f != "hfo"]
                            compliant.sort(key=lambda f: assigned_vessel.tank_capacities_tonnes.get(f, 0.0), reverse=True)
                            fuel[leg_key] = compliant[0] if compliant else "mgo"
                        else:
                            fuel[leg_key] = assigned_vessel.fuel_compat[0]

                    # Intermediate bunkering for long-haul voyages
                    if route.total_distance_nm > 6000.0:
                        primary_f = assigned_vessel.fuel_compat[0]
                        if "SGSIN" in state.ports:
                            bunker[f"{assigned_vessel.vessel_id}_SGSIN"] = {primary_f: 1500.0}

                    # Port OPS
                    for p_id in [route.origin_port_id, route.destination_port_id]:
                        port = state.ports.get(p_id)
                        ops_key = f"{assigned_vessel.vessel_id}_{p_id}"
                        ops[ops_key] = assigned_vessel.ops_compatible and (port.ops_available if port else False)

            # Mark unassigned vessels idle
            for v in vessels:
                if v.vessel_id not in assignment:
                    assignment[v.vessel_id] = "idle"

            plan = Plan(
                plan_id=f"GREEDY_SF_{int(speed_factor * 100)}",
                assignment=assignment,
                speed=speed,
                fuel=fuel,
                ops=ops,
                bunker=bunker,
                provenance=Provenance.SIMULATED,
            )

            eval_res = evaluator.evaluate(plan, problem.active_scenarios)
            evals_used += 1

            sol = ParetoSolution(
                solution_id=f"SOL_GREEDY_{evals_used}",
                plan=plan,
                evaluation=eval_res,
                rank=1,
                crowding_distance=0.0,
                provenance=Provenance.SIMULATED,
            )
            archive.add(sol)

            if telemetry_callback:
                telemetry = RunTelemetry(
                    run_id=problem.name,
                    algorithm=self.name,
                    generation=evals_used,
                    evaluations_used=evals_used,
                    budget_evals=problem.budget_evals,
                    hypervolume=archive.compute_hypervolume(),
                    feasible_rate=1.0 if eval_res.constraints.is_feasible else 0.0,
                    best_cost_usd=eval_res.objectives.total_cost_usd,
                    best_ghg_tonnes=eval_res.objectives.wtw_ghg_tonnes,
                    seed=problem.seed,
                    elapsed_time_s=time.time() - start_time,
                    converged=evals_used >= problem.budget_evals,
                    provenance=Provenance.SIMULATED,
                )
                telemetry_callback(telemetry)

        return archive.solutions
