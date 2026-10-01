"""Phase 4 acceptance gate tests: Prediction-Optimization integration, Robust CVaR, Storm Re-planning."""

import pytest
import time
from backend.app.data.loader import get_default_twin_state, load_scenarios
from backend.app.digital_twin.validator import ConstraintValidator
from backend.app.digital_twin.evaluator import DigitalTwinEvaluator
from backend.app.prediction.service import get_surrogate
from backend.app.optimization.quantum.qgreen_hybrid import QGreenHybridOptimizer
from backend.app.optimization.reoptimizer import DisruptionReoptimizer
from backend.app.schemas import ProblemDefinition, Provenance, Plan


@pytest.fixture
def twin_state():
    return get_default_twin_state()


@pytest.fixture
def scenarios():
    return load_scenarios()


def test_robust_cvar95_pricing_property(twin_state, scenarios):
    """By statistical definition, CVaR95 must be greater than or equal to Expected Cost."""
    evaluator = DigitalTwinEvaluator(twin_state)
    validator = ConstraintValidator(twin_state)

    problem = ProblemDefinition(
        name="Test-CVaR",
        twin_state=twin_state,
        active_scenarios=scenarios,  # all 6 uncertainty scenarios
        budget_evals=20,
        seed=42,
        provenance=Provenance.SYNTHETIC,
    )

    optimizer = QGreenHybridOptimizer(population_size=10)
    solutions = optimizer.optimize(problem, evaluator, validator)

    assert len(solutions) >= 1
    for sol in solutions:
        obj = sol.evaluation.objectives
        # CVaR at 95% tail must be >= expected cost
        assert obj.cvar95_cost_usd >= obj.total_cost_usd, (
            f"CVaR violation: CVaR95 (${obj.cvar95_cost_usd:.2f}) < Expected (${obj.total_cost_usd:.2f})"
        )


def test_storm_scenario_replan_completes_under_target_time(twin_state, scenarios):
    """Gate test: Storm re-plan must complete in < 2.0s with computed before/after deltas."""
    surrogate = get_surrogate()
    evaluator = DigitalTwinEvaluator(twin_state, fuel_surrogate=surrogate)
    validator = ConstraintValidator(twin_state)

    nominal_scenario = [s for s in scenarios if s.scenario_type == "nominal"][0]
    storm_scenario = [s for s in scenarios if s.scenario_type == "storm"][0]

    # Initial run on nominal scenario
    initial_prob = ProblemDefinition(
        name="Initial-Dispatch",
        twin_state=twin_state,
        active_scenarios=[nominal_scenario],
        budget_evals=25,
        seed=101,
        provenance=Provenance.SYNTHETIC,
    )
    initial_opt = QGreenHybridOptimizer(population_size=10)
    initial_solutions = initial_opt.optimize(initial_prob, evaluator, validator)
    assert len(initial_solutions) >= 1

    # Sudden storm disruption triggers rapid re-optimizer
    reoptimizer = DisruptionReoptimizer()
    t0 = time.time()
    reopt_solutions, delta = reoptimizer.reoptimize(
        problem=initial_prob,
        prior_solutions=initial_solutions,
        disruption_scenario=storm_scenario,
        evaluator=evaluator,
        validator=validator,
        eval_budget=30,
        seed=202,
    )
    elapsed = time.time() - t0

    # Gate: Must complete under target time (< 2.0 seconds)
    assert elapsed < 2.0, f"Gate failure: Re-planning took {elapsed:.2f}s, target was < 2.0s"
    assert len(reopt_solutions) >= 1

    # Verify deltas are properly computed
    assert delta.cost_delta_usd is not None
    assert delta.ghg_delta_tonnes is not None
    assert delta.eta_risk_before is not None
    assert delta.eta_risk_after is not None
    assert len(delta.actions_taken) >= 1
    assert any("Storm mitigation" in a for a in delta.actions_taken)


def test_ops_cold_ironing_reduces_berth_emissions(twin_state, scenarios):
    """OPS shore power connection must reduce port emissions compared to burning MGO at berth."""
    evaluator = DigitalTwinEvaluator(twin_state)
    route = twin_state.routes["RTE_INTRA_EUR_01"]
    vessel = twin_state.vessels["IMO9811004"]  # Baltic Feeder: ops_compatible = True

    # Plan with OPS enabled at both ports (Rotterdam and Hamburg)
    plan_ops = Plan(
        assignment={vessel.vessel_id: route.route_id},
        speed={f"{vessel.vessel_id}_{leg.leg_id}": 14.0 for leg in route.legs},
        fuel={f"{vessel.vessel_id}_{leg.leg_id}": "mgo" for leg in route.legs},
        ops={f"{vessel.vessel_id}_NLRTM": True, f"{vessel.vessel_id}_DEHAM": True},
        bunker={},
        provenance=Provenance.SIMULATED,
    )

    # Plan with OPS disabled
    plan_no_ops = Plan(
        assignment={vessel.vessel_id: route.route_id},
        speed={f"{vessel.vessel_id}_{leg.leg_id}": 14.0 for leg in route.legs},
        fuel={f"{vessel.vessel_id}_{leg.leg_id}": "mgo" for leg in route.legs},
        ops={f"{vessel.vessel_id}_NLRTM": False, f"{vessel.vessel_id}_DEHAM": False},
        bunker={},
        provenance=Provenance.SIMULATED,
    )

    nominal = [s for s in scenarios if s.scenario_type == "nominal"]
    res_ops = evaluator.evaluate(plan_ops, nominal)
    res_no_ops = evaluator.evaluate(plan_no_ops, nominal)

    assert res_ops.breakdown.ops_costs_usd > 0.0
    assert res_no_ops.breakdown.ops_costs_usd == 0.0
    # MGO auxiliary emissions at berth must be significantly lower when OPS is used at Rotterdam
    mgo_aux_ops = res_ops.breakdown.ghg_by_pathway_tonnes.get("mgo_aux", 0.0)
    mgo_aux_no_ops = res_no_ops.breakdown.ghg_by_pathway_tonnes.get("mgo_aux", 0.0)
    assert mgo_aux_ops < mgo_aux_no_ops, f"OPS did not reduce auxiliary MGO emissions: {mgo_aux_ops} vs {mgo_aux_no_ops}"
