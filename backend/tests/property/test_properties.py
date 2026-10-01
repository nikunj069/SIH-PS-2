"""Property-based tests using Hypothesis.

Invariants verified:
1. decode(encode(plan)) round-trips correctly.
2. For arbitrary random genome vectors, repair(decode(x)) guarantees:
   - speed within [v_min, v_max]
   - fuel in vessel.fuel_compat
   - ECA compliance (no HFO in ECA)
   - OPS validity (ops=False if port/vessel lacks OPS)
"""

import numpy as np
from hypothesis import given, settings, strategies as st
from backend.app.data.loader import get_default_twin_state
from backend.app.optimization.encoding import PlanGenomeEncoder
from backend.app.digital_twin.validator import ConstraintValidator
from backend.app.schemas import Plan, Provenance

twin_state = get_default_twin_state()
encoder = PlanGenomeEncoder(twin_state)
validator = ConstraintValidator(twin_state)


@given(
    speed_factor=st.floats(min_value=0.0, max_value=1.0),
    fuel_idx=st.integers(min_value=0, max_value=len(encoder.fuel_list) - 1),
    ops_flag=st.booleans(),
)
@settings(max_examples=25, deadline=None)
def test_encode_decode_roundtrip(speed_factor, fuel_idx, ops_flag):
    """decode(encode(plan)) preserves core genome assignments."""
    v_id = encoder.vessel_list[0]
    r_id = encoder.route_list[1]
    route = twin_state.routes[r_id]
    vessel = twin_state.vessels[v_id]

    speed_val = vessel.min_speed_knots + speed_factor * (vessel.max_speed_knots - vessel.min_speed_knots)
    fuel_val = encoder.fuel_list[fuel_idx]

    plan = Plan(
        plan_id="ROUNDTRIP_TEST",
        assignment={v_id: r_id},
        speed={f"{v_id}_{leg.leg_id}": round(speed_val, 2) for leg in route.legs},
        fuel={f"{v_id}_{leg.leg_id}": fuel_val for leg in route.legs},
        ops={f"{v_id}_{route.origin_port_id}": ops_flag},
        bunker={},
        provenance=Provenance.SIMULATED,
    )

    discrete, continuous = encoder.encode(plan)
    decoded = encoder.decode(discrete, continuous)

    assert decoded.assignment[v_id] == r_id
    for leg in route.legs:
        key = f"{v_id}_{leg.leg_id}"
        assert abs(decoded.speed[key] - plan.speed[key]) < 0.25
        assert decoded.fuel[key] == plan.fuel[key]


@given(
    seed=st.integers(min_value=0, max_value=10000)
)
@settings(max_examples=20, deadline=None)
def test_repair_operator_guarantees_safety(seed):
    """Repair operator must enforce speeds, fuel compatibility, ECA rules, and OPS validity on random plans."""
    rng = np.random.default_rng(seed)
    discrete_dim = encoder.num_vessels + encoder.num_legs + encoder.num_vp_pairs
    continuous_dim = encoder.num_legs + encoder.num_vp_pairs

    random_disc = rng.integers(0, 50, size=discrete_dim)
    random_cont = rng.uniform(-1.0, 2.0, size=continuous_dim)  # includes out-of-bound speeds

    raw_plan = encoder.decode(random_disc, random_cont)
    repaired = encoder.repair(raw_plan)

    report = validator.validate(repaired)

    # Core physical and regulatory repairs must be 100% satisfied
    assert report.speed_bounds_ok, f"Speed bounds violated: {report.violations}"
    assert report.compat_ok, f"Fuel compatibility violated: {report.violations}"
    assert report.eca_ok, f"ECA compliance violated: {report.violations}"
    assert report.ops_ok, f"OPS validity violated: {report.violations}"
