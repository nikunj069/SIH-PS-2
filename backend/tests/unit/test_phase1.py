"""Phase 1 acceptance gate tests: Evaluator, Validator, Physics Model, and Baselines."""

import pytest
from backend.app.data.loader import get_default_twin_state, load_scenarios
from backend.app.digital_twin.validator import ConstraintValidator
from backend.app.digital_twin.evaluator import DigitalTwinEvaluator
from backend.app.prediction.physics import PhysicsFuelModel
from backend.app.optimization.encoding import PlanGenomeEncoder
from backend.app.optimization.baselines.greedy import GreedyOptimizer
from backend.app.optimization.baselines.nsga2 import NSGA2Optimizer
from backend.app.schemas import Plan, ProblemDefinition, Provenance


@pytest.fixture
def twin_state():
    return get_default_twin_state()


@pytest.fixture
def scenarios():
    return load_scenarios()


def test_physics_fuel_monotonicity(twin_state):
    """Fuel consumption and power must monotonically increase with speed."""
    vessel = twin_state.vessels["IMO9811001"]
    speeds = [12.0, 14.0, 16.0, 18.0, 20.0, 22.0]
    fuel_rates = []

    for sp in speeds:
        res = PhysicsFuelModel.calculate_leg_fuel_tonnes(
            vessel=vessel,
            speed_knots=sp,
            distance_nm=1000.0,
        )
        fuel_rates.append(res["fuel_rate_tonnes_h"])

    for i in range(len(fuel_rates) - 1):
        assert fuel_rates[i + 1] > fuel_rates[i], f"Monotonicity failed at speed {speeds[i]} -> {speeds[i+1]}"


def test_validator_catches_injected_eca_violation(twin_state):
    """Validator must catch non-compliant HFO used inside an Emission Control Area."""
    validator = ConstraintValidator(twin_state)
    # RTE_INTRA_EUR_01 legs are inside North Sea ECA
    route = twin_state.routes["RTE_INTRA_EUR_01"]
    vessel = twin_state.vessels["IMO9811001"]

    bad_plan = Plan(
        assignment={vessel.vessel_id: route.route_id},
        speed={f"{vessel.vessel_id}_{leg.leg_id}": 15.0 for leg in route.legs},
        fuel={f"{vessel.vessel_id}_{leg.leg_id}": "hfo" for leg in route.legs},  # Prohibited in ECA
        ops={},
        bunker={},
        provenance=Provenance.SIMULATED,
    )

    report = validator.validate(bad_plan)
    assert not report.is_feasible
    assert not report.eca_ok
    assert any("ECA non-compliance" in v for v in report.violations)


def test_validator_catches_injected_speed_violation(twin_state):
    """Validator must catch speeds outside [v_min, v_max]."""
    validator = ConstraintValidator(twin_state)
    route = twin_state.routes["RTE_INTRA_EUR_01"]
    vessel = twin_state.vessels["IMO9811001"]  # max speed is 22.5 kts

    bad_plan = Plan(
        assignment={vessel.vessel_id: route.route_id},
        speed={f"{vessel.vessel_id}_{leg.leg_id}": 35.0 for leg in route.legs},  # 35 knots is impossible
        fuel={f"{vessel.vessel_id}_{leg.leg_id}": "mgo" for leg in route.legs},
        ops={},
        bunker={},
        provenance=Provenance.SIMULATED,
    )

    report = validator.validate(bad_plan)
    assert not report.is_feasible
    assert not report.speed_bounds_ok
    assert any("Speed out of bounds" in v for v in report.violations)


def test_validator_catches_injected_fuel_incompatibility(twin_state):
    """Validator must catch fuels not supported by the vessel's propulsion."""
    validator = ConstraintValidator(twin_state)
    route = twin_state.routes["RTE_INTRA_EUR_01"]
    vessel = twin_state.vessels["IMO9811003"]  # Nordic Express only supports ["hfo", "mgo"]

    bad_plan = Plan(
        assignment={vessel.vessel_id: route.route_id},
        speed={f"{vessel.vessel_id}_{leg.leg_id}": 14.0 for leg in route.legs},
        fuel={f"{vessel.vessel_id}_{leg.leg_id}": "ammonia_green" for leg in route.legs},  # Incompatible
        ops={},
        bunker={},
        provenance=Provenance.SIMULATED,
    )

    report = validator.validate(bad_plan)
    assert not report.is_feasible
    assert not report.compat_ok
    assert any("Engine incompatibility" in v for v in report.violations)


def test_validator_catches_injected_ops_violation(twin_state):
    """Validator must catch OPS requests when vessel or port lacks OPS capability."""
    validator = ConstraintValidator(twin_state)
    route = twin_state.routes["RTE_ASIA_EUR_01"]
    # AEJEA port has ops_available = False
    vessel = twin_state.vessels["IMO9811001"]

    bad_plan = Plan(
        assignment={vessel.vessel_id: route.route_id},
        speed={f"{vessel.vessel_id}_{leg.leg_id}": 15.0 for leg in route.legs},
        fuel={f"{vessel.vessel_id}_{leg.leg_id}": "mgo" for leg in route.legs},
        ops={f"{vessel.vessel_id}_AEJEA": True},  # Jebel Ali has no OPS
        bunker={},
        provenance=Provenance.SIMULATED,
    )

    report = validator.validate(bad_plan)
    assert not report.is_feasible
    assert not report.ops_ok
    assert any("OPS unavailable" in v for v in report.violations)


def test_greedy_baseline_returns_feasible_plans(twin_state, scenarios):
    """Greedy baseline optimizer must produce feasible plans that pass validator."""
    evaluator = DigitalTwinEvaluator(twin_state)
    validator = ConstraintValidator(twin_state)

    problem = ProblemDefinition(
        name="Test-Greedy",
        twin_state=twin_state,
        active_scenarios=scenarios[:2],
        budget_evals=10,
        seed=42,
        provenance=Provenance.SYNTHETIC,
    )

    optimizer = GreedyOptimizer()
    solutions = optimizer.optimize(problem, evaluator, validator)

    assert len(solutions) >= 1
    for sol in solutions:
        assert sol.evaluation.constraints.is_feasible
        assert sol.evaluation.objectives.total_cost_usd > 0
        assert sol.evaluation.objectives.wtw_ghg_tonnes > 0


def test_nsga2_baseline_on_small_instance(twin_state, scenarios):
    """NSGA-II baseline must run within budget and return non-dominated solutions."""
    evaluator = DigitalTwinEvaluator(twin_state)
    validator = ConstraintValidator(twin_state)

    problem = ProblemDefinition(
        name="Test-NSGA2",
        twin_state=twin_state,
        active_scenarios=scenarios[:2],
        budget_evals=40,
        seed=123,
        provenance=Provenance.SYNTHETIC,
    )

    optimizer = NSGA2Optimizer(population_size=15)
    solutions = optimizer.optimize(problem, evaluator, validator)

    assert len(solutions) >= 1
    # Check that solutions returned are feasible
    for sol in solutions:
        assert sol.evaluation.constraints.is_feasible
        assert sol.evaluation.objectives.total_cost_usd > 0
