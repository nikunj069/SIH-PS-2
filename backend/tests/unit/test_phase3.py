"""Phase 3 acceptance gate tests: QPSO, QIGA, Q-GREEN Hybrid, 95% Feasibility, and Determinism by Seed."""

import pytest
from backend.app.data.loader import get_default_twin_state, load_scenarios
from backend.app.digital_twin.validator import ConstraintValidator
from backend.app.digital_twin.evaluator import DigitalTwinEvaluator
from backend.app.optimization.quantum.qpso import QPSOOptimizer
from backend.app.optimization.quantum.qiga import QIGAOptimizer
from backend.app.optimization.quantum.qgreen_hybrid import QGreenHybridOptimizer
from backend.app.schemas import ProblemDefinition, Provenance


@pytest.fixture
def twin_state():
    return get_default_twin_state()


@pytest.fixture
def scenarios():
    return load_scenarios()


def test_qpso_optimizer(twin_state, scenarios):
    """QPSO continuous optimizer must run within budget and return feasible solutions."""
    evaluator = DigitalTwinEvaluator(twin_state)
    validator = ConstraintValidator(twin_state)

    problem = ProblemDefinition(
        name="Test-QPSO",
        twin_state=twin_state,
        active_scenarios=scenarios[:2],
        budget_evals=40,
        seed=42,
        provenance=Provenance.SYNTHETIC,
    )

    telemetry_logs = []
    optimizer = QPSOOptimizer(num_particles=15)
    solutions = optimizer.optimize(problem, evaluator, validator, telemetry_callback=telemetry_logs.append)

    assert len(solutions) >= 1
    assert len(telemetry_logs) >= 1
    for sol in solutions:
        assert sol.evaluation.constraints.is_feasible


def test_qiga_optimizer(twin_state, scenarios):
    """QIGA discrete optimizer with quantum rotation gates must produce feasible solutions and state entropy."""
    evaluator = DigitalTwinEvaluator(twin_state)
    validator = ConstraintValidator(twin_state)

    problem = ProblemDefinition(
        name="Test-QIGA",
        twin_state=twin_state,
        active_scenarios=scenarios[:2],
        budget_evals=40,
        seed=101,
        provenance=Provenance.SYNTHETIC,
    )

    telemetry_logs = []
    optimizer = QIGAOptimizer(population_size=15)
    solutions = optimizer.optimize(problem, evaluator, validator, telemetry_callback=telemetry_logs.append)

    assert len(solutions) >= 1
    assert len(telemetry_logs) >= 1
    assert "qbit_entropy" in telemetry_logs[-1].q_state_summary


def test_qgreen_hybrid_feasible_rate_gate(twin_state, scenarios):
    """Gate test: Q-GREEN Hybrid feasible rate must be >= 95%."""
    evaluator = DigitalTwinEvaluator(twin_state)
    validator = ConstraintValidator(twin_state)

    problem = ProblemDefinition(
        name="Gate-QGREEN-Feasible",
        twin_state=twin_state,
        active_scenarios=scenarios[:2],
        budget_evals=80,
        seed=777,
        provenance=Provenance.SYNTHETIC,
    )

    telemetry_logs = []
    optimizer = QGreenHybridOptimizer(population_size=15)
    solutions = optimizer.optimize(problem, evaluator, validator, telemetry_callback=telemetry_logs.append)

    assert len(solutions) >= 1
    assert len(telemetry_logs) >= 1
    final_telemetry = telemetry_logs[-1]

    # Gate: Feasible rate >= 95%
    assert final_telemetry.feasible_rate >= 0.95, (
        f"Gate failure: Feasible rate was {final_telemetry.feasible_rate*100:.1f}%, expected >= 95.0%"
    )


def test_qgreen_hybrid_deterministic_by_seed(twin_state, scenarios):
    """Gate test: Same seed must produce identical Pareto objectives."""
    evaluator = DigitalTwinEvaluator(twin_state)
    validator = ConstraintValidator(twin_state)

    problem1 = ProblemDefinition(
        name="Determinism-1",
        twin_state=twin_state,
        active_scenarios=scenarios[:2],
        budget_evals=35,
        seed=999,
        provenance=Provenance.SYNTHETIC,
    )
    problem2 = ProblemDefinition(
        name="Determinism-2",
        twin_state=twin_state,
        active_scenarios=scenarios[:2],
        budget_evals=35,
        seed=999,
        provenance=Provenance.SYNTHETIC,
    )

    opt1 = QGreenHybridOptimizer(population_size=12)
    opt2 = QGreenHybridOptimizer(population_size=12)

    sol1 = opt1.optimize(problem1, evaluator, validator)
    sol2 = opt2.optimize(problem2, evaluator, validator)

    assert len(sol1) == len(sol2), f"Solution count mismatch: {len(sol1)} vs {len(sol2)}"
    for s1, s2 in zip(sol1, sol2):
        assert abs(s1.evaluation.objectives.total_cost_usd - s2.evaluation.objectives.total_cost_usd) < 1e-3
        assert abs(s1.evaluation.objectives.wtw_ghg_tonnes - s2.evaluation.objectives.wtw_ghg_tonnes) < 1e-3
