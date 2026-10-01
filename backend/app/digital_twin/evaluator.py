"""Digital twin evaluator: Multi-scenario scoring, CVaR95 calculation, and explainability breakdown."""

import numpy as np
from typing import Dict, List, Optional
from backend.app.schemas import (
    Plan,
    Scenario,
    DigitalTwinState,
    ObjectiveVector,
    Breakdown,
    ConstraintReport,
    EvaluationResult,
    Provenance,
)
from backend.app.prediction.physics import PhysicsFuelModel
from backend.app.fuels.lca import FuelLCAEngine
from backend.app.digital_twin.validator import ConstraintValidator


class DigitalTwinEvaluator:
    """Evaluates candidate plans across operational scenarios.

    Computes expected total costs, lifecycle WtW GHG emissions, fuel tonnage,
    CVaR95 risk, and contractual deadline delay probabilities.
    """

    def __init__(self, state: DigitalTwinState, fuel_surrogate=None):
        self.state = state
        self.lca_engine = FuelLCAEngine(state.fuel_catalog)
        self.validator = ConstraintValidator(state)
        self.fuel_surrogate = fuel_surrogate

    def evaluate(self, plan: Plan, scenario_set: Optional[List[Scenario]] = None) -> EvaluationResult:
        """Score candidate plan across scenarios and produce complete evaluation."""
        scenarios = scenario_set or [
            Scenario(
                scenario_id="SCN_DEFAULT",
                name="Nominal",
                weather_multiplier=1.0,
                probability=1.0,
                provenance=Provenance.SIMULATED,
            )
        ]

        # 1. Independent validation check
        constraints = self.validator.validate(plan)

        scenario_costs: List[float] = []
        scenario_ghgs: List[float] = []
        scenario_fuels: List[float] = []
        scenario_times: List[float] = []
        scenario_probs: List[float] = []
        eta_breaches: List[float] = []

        total_fuel_costs: Dict[str, float] = {}
        total_ghg_by_pathway: Dict[str, float] = {}
        sample_leg_breakdowns: List[Dict] = []
        total_ops_costs = 0.0
        total_carbon_taxes = 0.0
        total_delay_penalties = 0.0

        vessels = self.state.vessels
        routes = self.state.routes
        ports = self.state.ports

        for scenario in scenarios:
            s_cost = 0.0
            s_ghg = 0.0
            s_fuel = 0.0
            s_time = 0.0
            s_prob = scenario.probability
            scenario_breached = False

            for v_id, r_id in plan.assignment.items():
                if r_id == "idle" or v_id not in vessels or r_id not in routes:
                    continue

                vessel = vessels[v_id]
                route = routes[r_id]
                v_time = 0.0

                # A. Voyage transit on legs
                for leg in route.legs:
                    leg_key = f"{v_id}_{leg.leg_id}"
                    speed = plan.speed.get(leg_key, vessel.design_speed_knots)
                    fuel_id = plan.fuel.get(leg_key, vessel.fuel_compat[0])

                    # Fuel consumption calculation (surrogate or physics)
                    if self.fuel_surrogate is not None:
                        calc = self.fuel_surrogate.lookup_leg_fuel(
                            vessel=vessel,
                            speed_knots=speed,
                            distance_nm=leg.distance_nm,
                            weather_multiplier=scenario.weather_multiplier,
                        )
                    else:
                        calc = PhysicsFuelModel.calculate_leg_fuel_tonnes(
                            vessel=vessel,
                            speed_knots=speed,
                            distance_nm=leg.distance_nm,
                            weather_summary=leg.weather_summary,
                            weather_multiplier=scenario.weather_multiplier,
                        )

                    hfo_eq_tonnes = calc["fuel_consumed_tonnes_hfo_eq"]
                    transit_hours = calc["transit_time_hours"]
                    v_time += transit_hours

                    # Convert to actual pathway mass
                    pathway_mass = self.lca_engine.hfo_mass_to_pathway_mass(hfo_eq_tonnes, fuel_id)
                    s_fuel += pathway_mass

                    # Financial cost with scenario price shocks
                    price_mult = scenario.fuel_price_multipliers.get(fuel_id, 1.0)
                    fuel_cost = self.lca_engine.compute_bunker_cost_usd(
                        mass_tonnes=pathway_mass,
                        pathway_id=fuel_id,
                        price_multiplier=price_mult,
                    )
                    s_cost += fuel_cost
                    total_fuel_costs[fuel_id] = total_fuel_costs.get(fuel_id, 0.0) + (fuel_cost * s_prob)

                    # WtW Lifecycle GHG emissions
                    ghg_tonnes = self.lca_engine.compute_wtw_ghg_tonnes(pathway_mass, fuel_id)
                    s_ghg += ghg_tonnes
                    total_ghg_by_pathway[fuel_id] = total_ghg_by_pathway.get(fuel_id, 0.0) + (ghg_tonnes * s_prob)

                    # Carbon tax / ETS compliance cost
                    carbon_tax_cost = ghg_tonnes * scenario.carbon_tax_usd_tonne
                    s_cost += carbon_tax_cost
                    total_carbon_taxes += carbon_tax_cost * s_prob

                    if len(sample_leg_breakdowns) < 10:
                        sample_leg_breakdowns.append({
                            "vessel_id": v_id,
                            "leg_id": leg.leg_id,
                            "speed_knots": speed,
                            "fuel_id": fuel_id,
                            "transit_hours": round(transit_hours, 1),
                            "fuel_consumed_tonnes": round(pathway_mass, 2),
                            "fuel_cost_usd": round(fuel_cost, 0),
                            "ghg_tonnes": round(ghg_tonnes, 2),
                        })

                # B. Port calls and berthing (OPS vs auxiliary boiler/engine)
                for port_id in [route.origin_port_id, route.destination_port_id]:
                    port = ports.get(port_id)
                    if not port:
                        continue

                    # Congestion waiting delay in hours
                    port_delay = port.congestion_delay_mean_h + scenario.port_delay_hours.get(port_id, 0.0)
                    berth_hours = 18.0 + port_delay
                    v_time += berth_hours

                    ops_key = f"{v_id}_{port_id}"
                    use_ops = plan.ops.get(ops_key, False) and vessel.ops_compatible and port.ops_available

                    if use_ops:
                        # Shore power electricity
                        total_kwh = vessel.ops_power_kw * berth_hours
                        ops_cost = total_kwh * port.ops_price_per_kwh
                        s_cost += ops_cost
                        total_ops_costs += ops_cost * s_prob
                        # Grid emissions
                        grid_ghg = total_kwh * port.ops_clean_grid_factor * 1e-6
                        s_ghg += grid_ghg
                        total_ghg_by_pathway["shore_grid"] = total_ghg_by_pathway.get("shore_grid", 0.0) + (grid_ghg * s_prob)
                    else:
                        # Auxiliary generator burn (MGO)
                        aux_mgo_tonnes = (vessel.ops_power_kw * 0.195 * berth_hours) / 1e6
                        s_fuel += aux_mgo_tonnes
                        aux_cost = self.lca_engine.compute_bunker_cost_usd(aux_mgo_tonnes, "mgo", port)
                        s_cost += aux_cost
                        total_fuel_costs["mgo_aux"] = total_fuel_costs.get("mgo_aux", 0.0) + (aux_cost * s_prob)
                        aux_ghg = self.lca_engine.compute_wtw_ghg_tonnes(aux_mgo_tonnes, "mgo")
                        s_ghg += aux_ghg
                        total_ghg_by_pathway["mgo_aux"] = total_ghg_by_pathway.get("mgo_aux", 0.0) + (aux_ghg * s_prob)

                # Contractual delay penalty
                if v_time > route.deadline_hours:
                    delay_hours = v_time - route.deadline_hours
                    penalty_charge = delay_hours * 1200.0  # $1,200/hr delay penalty
                    s_cost += penalty_charge
                    total_delay_penalties += penalty_charge * s_prob
                    scenario_breached = True

                s_time = max(s_time, v_time)

            scenario_costs.append(s_cost)
            scenario_ghgs.append(s_ghg)
            scenario_fuels.append(s_fuel)
            scenario_times.append(s_time)
            scenario_probs.append(s_prob)
            eta_breaches.append(1.0 if scenario_breached else 0.0)

        probs_arr = np.array(scenario_probs)
        probs_norm = probs_arr / np.sum(probs_arr)

        expected_cost = float(np.sum(np.array(scenario_costs) * probs_norm))
        expected_ghg = float(np.sum(np.array(scenario_ghgs) * probs_norm))
        expected_fuel = float(np.sum(np.array(scenario_fuels) * probs_norm))
        expected_time = float(np.sum(np.array(scenario_times) * probs_norm))
        eta_risk_prob = float(np.sum(np.array(eta_breaches) * probs_norm))

        # CVaR95 calculation (Conditional Value at Risk at 95% tail)
        # Average of costs at or above 95th percentile
        costs_arr = np.array(scenario_costs)
        if len(costs_arr) > 1:
            var95 = np.percentile(costs_arr, 95)
            tail_costs = costs_arr[costs_arr >= var95]
            cvar95 = float(np.mean(tail_costs)) if len(tail_costs) > 0 else float(var95)
        else:
            cvar95 = expected_cost

        # Add penalty if infeasible
        if not constraints.is_feasible:
            expected_cost += constraints.penalty_score * 1000.0
            cvar95 += constraints.penalty_score * 1000.0

        objectives = ObjectiveVector(
            total_cost_usd=round(expected_cost, 2),
            wtw_ghg_tonnes=round(expected_ghg, 2),
            fuel_consumed_tonnes=round(expected_fuel, 2),
            cvar95_cost_usd=round(cvar95, 2),
            eta_risk_prob=round(min(1.0, max(0.0, eta_risk_prob)), 3),
            total_time_hours=round(expected_time, 1),
            provenance=Provenance.SIMULATED,
        )

        breakdown = Breakdown(
            fuel_costs_usd={k: round(v, 2) for k, v in total_fuel_costs.items()},
            ops_costs_usd=round(total_ops_costs, 2),
            carbon_tax_cost_usd=round(total_carbon_taxes, 2),
            delay_penalties_usd=round(total_delay_penalties, 2),
            ghg_by_pathway_tonnes={k: round(v, 4) for k, v in total_ghg_by_pathway.items()},
            leg_breakdowns=sample_leg_breakdowns,
            provenance=Provenance.SIMULATED,
        )

        return EvaluationResult(
            objectives=objectives,
            constraints=constraints,
            breakdown=breakdown,
            plan_id=plan.plan_id,
            provenance=Provenance.SIMULATED,
        )
