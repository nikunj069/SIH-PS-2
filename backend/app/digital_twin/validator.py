"""Independent constraint validator for maritime digital twin plans.

Enforces physical, operational, environmental, and regulatory boundaries.
Crucial rule: Independent of optimizer repair routines.
"""

from typing import List, Optional
from backend.app.schemas import (
    Plan,
    DigitalTwinState,
    ConstraintReport,
    Provenance,
    Vessel,
    Route,
    Port,
)
from backend.app.prediction.physics import PhysicsFuelModel
from backend.app.fuels.lca import FuelLCAEngine


class ConstraintValidator:
    """Independent validator checking physical laws and regulatory compliance."""

    def __init__(self, state: DigitalTwinState):
        self.state = state
        self.lca_engine = FuelLCAEngine(state.fuel_catalog)

    def validate(self, plan: Plan) -> ConstraintReport:
        """Verify whether a candidate plan satisfies all operational and regulatory constraints."""
        violations: List[str] = []
        draft_ok = True
        tank_ok = True
        compat_ok = True
        cargo_ok = True
        ops_ok = True
        eca_ok = True
        speed_bounds_ok = True
        bunker_avail_ok = True
        penalty = 0.0

        assigned_routes = plan.assignment
        vessels = self.state.vessels
        routes = self.state.routes
        ports = self.state.ports

        # 1. Cargo demand & route assignments
        for v_id, r_id in assigned_routes.items():
            if r_id == "idle":
                continue
            if v_id not in vessels:
                violations.append(f"Vessel '{v_id}' not found in twin state fleet.")
                cargo_ok = False
                penalty += 1000.0
                continue
            if r_id not in routes:
                violations.append(f"Route '{r_id}' not found in twin state routes.")
                cargo_ok = False
                penalty += 1000.0
                continue

            vessel = vessels[v_id]
            route = routes[r_id]

            # Cargo capacity check
            if vessel.dwt < route.demand_tonnes:
                violations.append(
                    f"Vessel {vessel.name} ({v_id}) DWT {vessel.dwt:.0f}t is insufficient for route {route.name} demand {route.demand_tonnes:.0f}t."
                )
                cargo_ok = False
                penalty += 500.0 + (route.demand_tonnes - vessel.dwt) * 0.1

            # Origin and destination port draft checks
            for port_id in [route.origin_port_id, route.destination_port_id]:
                if port_id in ports:
                    port = ports[port_id]
                    if vessel.draft_design_m > port.max_draft_m:
                        violations.append(
                            f"Draft violation: Vessel {vessel.name} draft {vessel.draft_design_m:.1f}m exceeds {port.name} max draft {port.max_draft_m:.1f}m."
                        )
                        draft_ok = False
                        penalty += 800.0

            # 2. Leg-by-leg checks: depth, ECA, speed bounds, fuel compatibility
            consumed_by_fuel = {}
            for leg in route.legs:
                leg_key = f"{v_id}_{leg.leg_id}"
                
                # Fairway water depth check
                if vessel.draft_design_m > leg.depth_m:
                    violations.append(
                        f"Fairway depth violation: Vessel {vessel.name} draft {vessel.draft_design_m:.1f}m exceeds leg {leg.leg_id} depth {leg.depth_m:.1f}m."
                    )
                    draft_ok = False
                    penalty += 800.0

                # Speed bounds check
                speed = plan.speed.get(leg_key, vessel.design_speed_knots)
                if speed < vessel.min_speed_knots or speed > vessel.max_speed_knots:
                    violations.append(
                        f"Speed out of bounds: Vessel {vessel.name} speed {speed:.1f} kts outside safe range [{vessel.min_speed_knots}, {vessel.max_speed_knots}]."
                    )
                    speed_bounds_ok = False
                    penalty += 200.0

                # Fuel compatibility check
                chosen_fuel = plan.fuel.get(leg_key, vessel.fuel_compat[0])
                if chosen_fuel not in vessel.fuel_compat:
                    violations.append(
                        f"Engine incompatibility: Pathway '{chosen_fuel}' is not compatible with vessel {vessel.name} ({v_id})."
                    )
                    compat_ok = False
                    penalty += 600.0

                # ECA regulation check (SOx limit <= 0.10% inside ECA)
                # Standard HFO (0.5% S) is strictly prohibited inside ECAs
                if leg.in_eca and chosen_fuel == "hfo":
                    violations.append(
                        f"ECA non-compliance: Leg {leg.leg_id} is in an Emission Control Area. Non-compliant fuel 'hfo' is prohibited."
                    )
                    eca_ok = False
                    penalty += 750.0

                # Fuel consumption estimation for tank capacity checks
                fuel_calc = PhysicsFuelModel.calculate_leg_fuel_tonnes(
                    vessel=vessel,
                    speed_knots=speed,
                    distance_nm=leg.distance_nm,
                    weather_summary=leg.weather_summary,
                )
                hfo_eq = fuel_calc["fuel_consumed_tonnes_hfo_eq"]
                pathway_mass = self.lca_engine.hfo_mass_to_pathway_mass(hfo_eq, chosen_fuel)
                consumed_by_fuel[chosen_fuel] = consumed_by_fuel.get(chosen_fuel, 0.0) + pathway_mass

            # 3. Tank capacity & reserve check with intermediate bunkering support
            # Tank starts full (up to 85% safe filling limit per SOLAS/class rules)
            for f_id, qty in consumed_by_fuel.items():
                tank_cap = vessel.tank_capacities_tonnes.get(f_id, 0.0)
                # Check total bunkered along route for this vessel and fuel
                bunkered_total = 0.0
                for b_key, b_dict in plan.bunker.items():
                    if b_key.startswith(f"{v_id}_") and f_id in b_dict:
                        bunkered_total += b_dict[f_id]

                max_allowable_burn = (tank_cap * 0.85) + bunkered_total
                if qty > max_allowable_burn:
                    violations.append(
                        f"Tank capacity violation: Vessel {vessel.name} projected consumption {qty:.1f}t of {f_id} exceeds available fuel limit ({max_allowable_burn:.1f}t including bunkering)."
                    )
                    tank_ok = False
                    penalty += 400.0 + (qty - max_allowable_burn) * 2.0

        # 4. OPS (Cold-ironing) infrastructure check
        for ops_key, ops_enabled in plan.ops.items():
            if not ops_enabled:
                continue
            parts = ops_key.split("_")
            v_id = parts[0]
            port_id = parts[1] if len(parts) > 1 else ""

            vessel = vessels.get(v_id)
            port = ports.get(port_id)

            if vessel and not vessel.ops_compatible:
                violations.append(
                    f"OPS invalid: Vessel {vessel.name} is not fitted with cold-ironing shore power equipment."
                )
                ops_ok = False
                penalty += 150.0
            if port and not port.ops_available:
                violations.append(
                    f"OPS unavailable: Port {port.name} does not offer shore power grid connection."
                )
                ops_ok = False
                penalty += 150.0

        # 5. Bunkering availability checks
        for b_key, b_dict in plan.bunker.items():
            parts = b_key.split("_")
            v_id = parts[0]
            port_id = parts[1] if len(parts) > 1 else ""
            port = ports.get(port_id)

            if port:
                for pathway_id, qty in b_dict.items():
                    available = port.bunker_stock_tonnes.get(pathway_id, 0.0)
                    if qty > available:
                        violations.append(
                            f"Bunker stockout: Port {port.name} has only {available:.1f}t of {pathway_id}, but {qty:.1f}t was requested."
                        )
                        bunker_avail_ok = False
                        penalty += 300.0 + (qty - available) * 1.5

        is_feasible = (
            len(violations) == 0
            and draft_ok
            and tank_ok
            and compat_ok
            and cargo_ok
            and ops_ok
            and eca_ok
            and speed_bounds_ok
            and bunker_avail_ok
        )

        return ConstraintReport(
            is_feasible=is_feasible,
            violations=violations,
            draft_ok=draft_ok,
            tank_ok=tank_ok,
            compat_ok=compat_ok,
            cargo_ok=cargo_ok,
            ops_ok=ops_ok,
            eca_ok=eca_ok,
            speed_bounds_ok=speed_bounds_ok,
            bunker_availability_ok=bunker_avail_ok,
            penalty_score=penalty,
            provenance=Provenance.SIMULATED,
        )
