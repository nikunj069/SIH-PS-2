"""Unit tests for Q-GREEN FLEET frozen schemas and protocols (Phase 0 Gate)."""

import json
import pytest
from pydantic import ValidationError

from backend.app.schemas import (
    Provenance,
    Vessel,
    Port,
    Route,
    Leg,
    FuelPathway,
    Scenario,
    ScenarioType,
    Plan,
    ObjectiveVector,
    Breakdown,
    ConstraintReport,
    EvaluationResult,
    ParetoSolution,
    RunTelemetry,
    FuelPredictionInput,
    Quantiles,
)


def test_provenance_enum_values():
    """Verify all expected provenance categories exist and reject unknown values."""
    assert Provenance.MEASURED == "measured"
    assert Provenance.REPORTED == "reported"
    assert Provenance.ESTIMATED == "estimated"
    assert Provenance.SIMULATED == "simulated"
    assert Provenance.SYNTHETIC == "synthetic"

    with pytest.raises(ValidationError):
        Vessel(
            vessel_id="V01",
            name="Test",
            vessel_type="Container",
            dwt=10000.0,
            design_speed_knots=15.0,
            min_speed_knots=10.0,
            max_speed_knots=20.0,
            draft_design_m=10.0,
            engine_kw=10000.0,
            sfoc_base_g_kwh=170.0,
            fuel_compat=["hfo"],
            tank_capacities_tonnes={"hfo": 1000.0},
            provenance="INVALID_PROVENANCE",  # Must fail
        )


def test_fuel_pathway_wtw_calculation():
    """Test Well-to-Wake calculation matches MEPC.391(81) LCA guidelines."""
    # Methanol grey: high upstream WtT (31.0) + TtW CO2 (68.9) = 99.9 gCO2e/MJ
    fuel = FuelPathway(
        pathway_id="methanol_grey",
        name="Grey Methanol",
        category="fossil",
        energy_density_mj_kg=19.9,
        price_per_tonne_usd=430.0,
        wtt_gco2e_mj=31.0,
        ttw_co2_g_mj=68.9,
        ttw_ch4_slip_g_mj=0.0,
        ttw_n2o_g_mj=0.0,
        wtw_gco2e_mj=99.9,
        tank_volume_penalty=2.1,
        bunker_availability_score=0.45,
        compat_engine_types=["Dual-Fuel Methanol"],
        source_ref="IMO MEPC.391(81)",
        provenance=Provenance.REPORTED,
    )
    assert fuel.wtw_gco2e_mj == 99.9

    # LNG with methane slip: CH4 slip = 0.55 g/MJ * GWP 28 = 15.4 gCO2e/MJ
    lng = FuelPathway(
        pathway_id="lng_fossil",
        name="LNG Fossil",
        category="fossil",
        energy_density_mj_kg=49.1,
        price_per_tonne_usd=750.0,
        wtt_gco2e_mj=18.5,
        ttw_co2_g_mj=56.1,
        ttw_ch4_slip_g_mj=0.55,
        ttw_n2o_g_mj=0.001,
        gwp_ch4=28.0,
        gwp_n2o=265.0,
        wtw_gco2e_mj=90.3,
        tank_volume_penalty=1.4,
        bunker_availability_score=0.65,
        compat_engine_types=["Dual-Fuel LNG"],
        source_ref="IMO MEPC.391(81)",
        provenance=Provenance.REPORTED,
    )
    # Expected: 18.5 + 56.1 + 0.55*28 (15.4) + 0.001*265 (0.265) = ~90.27
    assert 90.0 <= lng.wtw_gco2e_mj <= 90.5


def test_vessel_schema_and_serialization():
    """Verify Vessel model serialization and deserialization."""
    vessel_data = {
        "vessel_id": "IMO9811001",
        "name": "Atlantic Pioneer",
        "vessel_type": "Container",
        "dwt": 195000.0,
        "capacity_teu": 20000,
        "design_speed_knots": 19.5,
        "min_speed_knots": 11.0,
        "max_speed_knots": 22.5,
        "draft_design_m": 16.0,
        "engine_kw": 58000.0,
        "sfoc_base_g_kwh": 168.0,
        "speed_exponent_n": 3.15,
        "admiralty_coefficient": 580.0,
        "fuel_compat": ["hfo", "mgo", "methanol_e"],
        "tank_capacities_tonnes": {"hfo": 5000.0, "mgo": 1200.0, "methanol_e": 6500.0},
        "ops_compatible": True,
        "ops_power_kw": 2200.0,
        "hull_factor": 1.02,
        "provenance": "reported",
    }
    vessel = Vessel.model_validate(vessel_data)
    assert vessel.vessel_id == "IMO9811001"
    assert vessel.ops_compatible is True

    # Round trip test
    dumped = json.loads(vessel.model_dump_json())
    reconstructed = Vessel.model_validate(dumped)
    assert reconstructed == vessel


def test_plan_and_evaluation_round_trip():
    """Verify Plan and EvaluationResult round-trip JSON serialization."""
    plan = Plan(
        plan_id="PLAN_TEST_001",
        assignment={"IMO9811001": "RTE_ASIA_EUR_01"},
        speed={"IMO9811001_LEG_01": 18.0, "IMO9811001_LEG_02": 17.5},
        fuel={"IMO9811001_LEG_01": "methanol_e", "IMO9811001_LEG_02": "mgo"},
        bunker={"IMO9811001_SGSIN": {"methanol_e": 1200.0}},
        ops={"IMO9811001_NLRTM": True},
        provenance=Provenance.SIMULATED,
    )

    eval_result = EvaluationResult(
        objectives=ObjectiveVector(
            total_cost_usd=1452000.0,
            wtw_ghg_tonnes=2300.5,
            fuel_consumed_tonnes=820.0,
            cvar95_cost_usd=1680000.0,
            eta_risk_prob=0.03,
            total_time_hours=512.0,
            provenance=Provenance.SIMULATED,
        ),
        constraints=ConstraintReport(
            is_feasible=True,
            violations=[],
            draft_ok=True,
            tank_ok=True,
            compat_ok=True,
            cargo_ok=True,
            ops_ok=True,
            eca_ok=True,
            speed_bounds_ok=True,
            bunker_availability_ok=True,
            penalty_score=0.0,
            provenance=Provenance.SIMULATED,
        ),
        breakdown=Breakdown(
            fuel_costs_usd={"methanol_e": 1150000.0, "mgo": 302000.0},
            ops_costs_usd=4500.0,
            carbon_tax_cost_usd=42000.0,
            delay_penalties_usd=0.0,
            ghg_by_pathway_tonnes={"methanol_e": 180.0, "mgo": 2120.5},
            leg_breakdowns=[],
            provenance=Provenance.SIMULATED,
        ),
        plan_id=plan.plan_id,
        provenance=Provenance.SIMULATED,
    )

    solution = ParetoSolution(
        solution_id="SOL_001",
        plan=plan,
        evaluation=eval_result,
        rank=1,
        crowding_distance=0.45,
        provenance=Provenance.SIMULATED,
    )

    dumped = json.loads(solution.model_dump_json())
    restored = ParetoSolution.model_validate(dumped)
    assert restored.solution_id == "SOL_001"
    assert restored.plan.assignment["IMO9811001"] == "RTE_ASIA_EUR_01"
    assert restored.evaluation.constraints.is_feasible is True
    assert restored.evaluation.objectives.eta_risk_prob == 0.03


def test_telemetry_schema():
    """Verify RunTelemetry schema properties."""
    telemetry = RunTelemetry(
        run_id="RUN_001",
        algorithm="Q-GREEN-Hybrid",
        generation=15,
        evaluations_used=750,
        budget_evals=2000,
        hypervolume=0.884,
        feasible_rate=0.96,
        best_cost_usd=1320000.0,
        best_ghg_tonnes=1950.0,
        seed=42,
        elapsed_time_s=12.4,
        converged=False,
        q_state_summary={"entropy": 0.42, "attractor_distance": 0.18},
        provenance=Provenance.SIMULATED,
    )
    assert telemetry.feasible_rate == 0.96
    assert telemetry.budget_evals == 2000
    assert telemetry.q_state_summary["entropy"] == 0.42
