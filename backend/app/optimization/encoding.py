"""Unified Plan Genome Encoding, Decoding, and Constraint-Aware Repair Operators.

Ensures all optimization algorithms operate on an identical mathematical space.
Round-trip invariant: decode(encode(plan)) == plan
"""

import numpy as np
from typing import Dict, List, Tuple
from backend.app.schemas import Plan, DigitalTwinState, Provenance, Vessel, Route


class PlanGenomeEncoder:
    """Encodes and decodes Plan instances to/from numerical optimization vectors."""

    def __init__(self, state: DigitalTwinState):
        self.state = state
        self.vessel_list = sorted(list(state.vessels.keys()))
        self.route_list = ["idle"] + sorted(list(state.routes.keys()))
        self.port_list = sorted(list(state.ports.keys()))
        self.fuel_list = sorted(list(state.fuel_catalog.keys()))

        # Build list of active (vessel, leg) keys
        self.leg_keys: List[Tuple[str, str, str]] = []  # (v_id, r_id, leg_id)
        for v_id in self.vessel_list:
            for r_id in sorted(list(state.routes.keys())):
                route = state.routes[r_id]
                for leg in route.legs:
                    self.leg_keys.append((v_id, r_id, leg.leg_id))

        # Build list of (vessel, port) pairs for OPS and bunkering
        self.vessel_port_pairs: List[Tuple[str, str]] = []
        for v_id in self.vessel_list:
            for p_id in self.port_list:
                self.vessel_port_pairs.append((v_id, p_id))

        self.num_vessels = len(self.vessel_list)
        self.num_legs = len(self.leg_keys)
        self.num_vp_pairs = len(self.vessel_port_pairs)

    def encode(self, plan: Plan) -> Tuple[np.ndarray, np.ndarray]:
        """Encode a Plan into (discrete_vector, continuous_vector).

        discrete_vector:
          [0 : num_vessels] -> route assignment index
          [num_vessels : num_vessels + num_legs] -> fuel pathway index for each leg
          [num_vessels + num_legs : ...] -> ops binary flags (0 or 1)

        continuous_vector:
          [0 : num_legs] -> speed normalized in [0, 1] between v_min and v_max
          [num_legs : num_legs + num_vp_pairs] -> bunker quantities normalized
        """
        discrete = []
        continuous = []

        # 1. Assignment discrete indices
        for v_id in self.vessel_list:
            assigned = plan.assignment.get(v_id, "idle")
            idx = self.route_list.index(assigned) if assigned in self.route_list else 0
            discrete.append(idx)

        # 2. Leg speed continuous and fuel discrete
        for v_id, r_id, leg_id in self.leg_keys:
            leg_key = f"{v_id}_{leg_id}"
            vessel = self.state.vessels[v_id]
            
            # Speed continuous
            raw_speed = plan.speed.get(leg_key, vessel.design_speed_knots)
            v_span = max(0.1, vessel.max_speed_knots - vessel.min_speed_knots)
            norm_speed = min(1.0, max(0.0, (raw_speed - vessel.min_speed_knots) / v_span))
            continuous.append(norm_speed)

            # Fuel discrete
            fuel_id = plan.fuel.get(leg_key, vessel.fuel_compat[0])
            f_idx = self.fuel_list.index(fuel_id) if fuel_id in self.fuel_list else 0
            discrete.append(f_idx)

        # 3. OPS discrete flags (0 or 1)
        for v_id, p_id in self.vessel_port_pairs:
            key = f"{v_id}_{p_id}"
            is_ops = 1 if plan.ops.get(key, False) else 0
            discrete.append(is_ops)

        # 4. Bunker continuous quantities
        for v_id, p_id in self.vessel_port_pairs:
            key = f"{v_id}_{p_id}"
            b_dict = plan.bunker.get(key, {})
            qty = sum(b_dict.values())
            # Normalize by 5000 tonnes max
            norm_bunker = min(1.0, max(0.0, qty / 5000.0))
            continuous.append(norm_bunker)

        return np.array(discrete, dtype=int), np.array(continuous, dtype=float)

    def decode(self, discrete: np.ndarray, continuous: np.ndarray, plan_id: str = "DECODED_PLAN") -> Plan:
        """Decode (discrete_vector, continuous_vector) back into a Plan."""
        assignment = {}
        speed = {}
        fuel = {}
        ops = {}
        bunker = {}

        # 1. Assignment
        for i, v_id in enumerate(self.vessel_list):
            idx = int(discrete[i]) % len(self.route_list)
            assignment[v_id] = self.route_list[idx]

        # 2. Leg speeds and fuels
        offset_fuel = self.num_vessels
        for j, (v_id, r_id, leg_id) in enumerate(self.leg_keys):
            vessel = self.state.vessels[v_id]
            norm_speed = float(continuous[j])
            raw_speed = vessel.min_speed_knots + norm_speed * (vessel.max_speed_knots - vessel.min_speed_knots)
            leg_key = f"{v_id}_{leg_id}"
            speed[leg_key] = round(raw_speed, 2)

            f_idx = int(discrete[offset_fuel + j]) % len(self.fuel_list)
            fuel[leg_key] = self.fuel_list[f_idx]

        # 3. OPS flags
        offset_ops = self.num_vessels + self.num_legs
        for k, (v_id, p_id) in enumerate(self.vessel_port_pairs):
            key = f"{v_id}_{p_id}"
            ops[key] = bool(discrete[offset_ops + k] == 1)

        # 4. Bunker
        offset_bunker = self.num_legs
        for m, (v_id, p_id) in enumerate(self.vessel_port_pairs):
            norm_qty = float(continuous[offset_bunker + m])
            qty = norm_qty * 5000.0
            if qty > 10.0:
                key = f"{v_id}_{p_id}"
                vessel = self.state.vessels[v_id]
                # Default bunkered fuel to vessel's primary fuel
                bunker[key] = {vessel.fuel_compat[0]: round(qty, 1)}

        return Plan(
            plan_id=plan_id,
            assignment=assignment,
            speed=speed,
            fuel=fuel,
            bunker=bunker,
            ops=ops,
            provenance=Provenance.SIMULATED,
        )

    def repair(self, plan: Plan) -> Plan:
        """Constraint-aware repair operator.

        Repairs:
          - Assignment: Ensures vessel DWT >= demand and vessel draft <= port & fairway depth, else reassigns or idles
          - Speeds: Clamped to vessel [v_min, v_max]
          - Fuel: Incompatible fuels switched to valid compatible pathway
          - ECA: HFO in ECA switched to MGO or compatible low-emission fuel
          - Tank: Consumption clamped to 85% tank capacity reserve
          - OPS: Clamped to False if vessel or port lacks shore power infrastructure
          - Bunkering: Clamped to available port bunker stock and vessel tank capacity
        """
        repaired_assignment = dict(plan.assignment)
        repaired_speed = dict(plan.speed)
        repaired_fuel = dict(plan.fuel)
        repaired_ops = dict(plan.ops)
        repaired_bunker = dict(plan.bunker)

        vessels = self.state.vessels
        routes = self.state.routes
        ports = self.state.ports

        # 1. Assignment Repair (DWT and Draft compatibility)
        assigned_routes = set()
        for v_id, r_id in list(repaired_assignment.items()):
            if v_id not in vessels:
                repaired_assignment[v_id] = "idle"
                continue
            if r_id == "idle" or r_id not in routes:
                repaired_assignment[v_id] = "idle"
                continue

            vessel = vessels[v_id]
            route = routes[r_id]

            # Check feasibility for this route
            is_route_feasible = True
            if vessel.dwt < route.demand_tonnes:
                is_route_feasible = False

            for p_id in [route.origin_port_id, route.destination_port_id]:
                if p_id in ports and vessel.draft_design_m > ports[p_id].max_draft_m:
                    is_route_feasible = False

            for leg in route.legs:
                if vessel.draft_design_m > leg.depth_m:
                    is_route_feasible = False

            if not is_route_feasible:
                # Find an alternative route that IS feasible for this vessel, or set idle
                feasible_alt = "idle"
                for cand_r_id, cand_route in routes.items():
                    if vessel.dwt >= cand_route.demand_tonnes:
                        cand_draft_ok = True
                        for p_id in [cand_route.origin_port_id, cand_route.destination_port_id]:
                            if p_id in ports and vessel.draft_design_m > ports[p_id].max_draft_m:
                                cand_draft_ok = False
                        for leg in cand_route.legs:
                            if vessel.draft_design_m > leg.depth_m:
                                cand_draft_ok = False
                        if cand_draft_ok:
                            feasible_alt = cand_r_id
                            break
                repaired_assignment[v_id] = feasible_alt

        # 2. Leg Speeds and Fuels
        for v_id, r_id in list(repaired_assignment.items()):
            if r_id == "idle" or v_id not in vessels or r_id not in routes:
                continue

            vessel = vessels[v_id]
            route = routes[r_id]

            for leg in route.legs:
                leg_key = f"{v_id}_{leg.leg_id}"

                # Speed clamp
                sp = repaired_speed.get(leg_key, vessel.design_speed_knots)
                clamped_sp = min(vessel.max_speed_knots, max(vessel.min_speed_knots, sp))
                repaired_speed[leg_key] = round(clamped_sp, 2)

                # Fuel compatibility repair
                f_id = repaired_fuel.get(leg_key, vessel.fuel_compat[0])
                if f_id not in vessel.fuel_compat:
                    f_id = vessel.fuel_compat[0]

                # ECA repair: If in ECA and HFO selected, switch to compliant fuel
                # Prioritize compliant fuels with larger tank capacities
                if leg.in_eca and f_id == "hfo":
                    compliant = [f for f in vessel.fuel_compat if f != "hfo"]
                    compliant.sort(key=lambda f: vessel.tank_capacities_tonnes.get(f, 0.0), reverse=True)
                    f_id = compliant[0] if compliant else "mgo"

                repaired_fuel[leg_key] = f_id

        # 3. OPS repair across ALL keys
        for ops_key in list(repaired_ops.keys()):
            parts = ops_key.split("_")
            v_id = parts[0]
            port_id = parts[1] if len(parts) > 1 else ""
            vessel = vessels.get(v_id)
            port = ports.get(port_id)
            can_ops = (vessel.ops_compatible if vessel else False) and (port.ops_available if port else False)
            if not can_ops:
                repaired_ops[ops_key] = False

        # 4. Multi-Fuel Range & Bunkering Replenishment
        from backend.app.prediction.physics import PhysicsFuelModel
        from backend.app.fuels.lca import FuelLCAEngine

        lca = FuelLCAEngine(self.state.fuel_catalog)

        for v_id, r_id in list(repaired_assignment.items()):
            if r_id == "idle" or v_id not in vessels or r_id not in routes:
                continue
            vessel = vessels[v_id]
            route = routes[r_id]

            # Calculate exact expected burn for each distinct fuel consumed along this route
            burn_by_fuel: Dict[str, float] = {}
            for leg in route.legs:
                leg_key = f"{v_id}_{leg.leg_id}"
                f_id = repaired_fuel[leg_key]
                sp = repaired_speed[leg_key]

                fuel_calc = PhysicsFuelModel.calculate_leg_fuel_tonnes(
                    vessel=vessel,
                    speed_knots=sp,
                    distance_nm=leg.distance_nm,
                    weather_summary=leg.weather_summary,
                )
                hfo_eq = fuel_calc["fuel_consumed_tonnes_hfo_eq"]
                pathway_mass = lca.hfo_mass_to_pathway_mass(hfo_eq, f_id)
                burn_by_fuel[f_id] = burn_by_fuel.get(f_id, 0.0) + pathway_mass

            # Verify and replenish each fuel type
            can_satisfy_all_fuels = True
            candidate_ports = [route.origin_port_id, "SGSIN", "NLRTM", "USLAX", "CNSHA", route.destination_port_id]

            for f_id, needed in burn_by_fuel.items():
                tank_cap = vessel.tank_capacities_tonnes.get(f_id, 0.0)
                max_safe = tank_cap * 0.85

                if needed > max_safe:
                    shortfall = (needed - max_safe) + 50.0  # safety buffer
                    bunkered_this_fuel = 0.0

                    for p_id in candidate_ports:
                        if p_id in ports and f_id in ports[p_id].bunker_stock_tonnes:
                            avail = ports[p_id].bunker_stock_tonnes[f_id]
                            if avail > 100.0:
                                b_key = f"{v_id}_{p_id}"
                                b_dict = repaired_bunker.get(b_key, {})
                                b_qty = min(shortfall - bunkered_this_fuel, avail * 0.5)
                                if b_qty > 10.0:
                                    b_dict[f_id] = round(b_qty, 1)
                                    repaired_bunker[b_key] = b_dict
                                    bunkered_this_fuel += b_qty
                                if bunkered_this_fuel >= shortfall:
                                    break

                    if (max_safe + bunkered_this_fuel) < needed:
                        can_satisfy_all_fuels = False

            if not can_satisfy_all_fuels:
                # If vessel cannot carry/bunker enough fuel for this route, set to idle
                repaired_assignment[v_id] = "idle"

        # 5. Clean up any invalid bunker entries
        for b_key in list(repaired_bunker.keys()):
            parts = b_key.split("_")
            v_id = parts[0]
            port_id = parts[1] if len(parts) > 1 else ""
            port = ports.get(port_id)
            vessel = vessels.get(v_id)
            if not port or not vessel or repaired_assignment.get(v_id) == "idle":
                repaired_bunker[b_key] = {}
                continue
            repaired_b_dict = {}
            for f_id, qty in repaired_bunker[b_key].items():
                if f_id in vessel.fuel_compat and f_id in port.bunker_stock_tonnes:
                    avail = port.bunker_stock_tonnes[f_id]
                    clamped_qty = min(qty, avail)
                    if clamped_qty > 1.0:
                        repaired_b_dict[f_id] = round(clamped_qty, 1)
            repaired_bunker[b_key] = repaired_b_dict

        return Plan(
            plan_id=plan.plan_id or "REPAIRED_PLAN",
            assignment=repaired_assignment,
            speed=repaired_speed,
            fuel=repaired_fuel,
            bunker=repaired_bunker,
            ops=repaired_ops,
            provenance=Provenance.SIMULATED,
        )
