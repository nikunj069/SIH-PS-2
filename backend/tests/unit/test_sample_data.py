"""Verify that generated sample data strictly validates against frozen schemas."""

import json
import os
from backend.app.schemas import Vessel, Port, Route, FuelPathway, Scenario


def test_fuels_catalog_validates():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    fuel_file = os.path.join(root, "data", "fuel_catalog", "fuels.json")
    assert os.path.exists(fuel_file), "fuels.json does not exist"

    with open(fuel_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data) >= 10, f"Expected >= 10 fuel pathways, found {len(data)}"
    for item in data:
        fuel = FuelPathway.model_validate(item)
        assert fuel.pathway_id
        assert fuel.energy_density_mj_kg > 0
        assert fuel.wtw_gco2e_mj > 0


def test_vessels_sample_validates():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    vessel_file = os.path.join(root, "data", "sample", "vessels.json")
    assert os.path.exists(vessel_file), "vessels.json does not exist"

    with open(vessel_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data) >= 10, f"Expected 10-30 vessels, found {len(data)}"
    for item in data:
        vessel = Vessel.model_validate(item)
        assert vessel.min_speed_knots < vessel.design_speed_knots < vessel.max_speed_knots
        assert vessel.dwt > 0
        assert vessel.draft_design_m > 0
        assert len(vessel.fuel_compat) >= 1


def test_ports_sample_validates():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    port_file = os.path.join(root, "data", "sample", "ports.json")
    assert os.path.exists(port_file), "ports.json does not exist"

    with open(port_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data) >= 5, f"Expected 5-15 ports, found {len(data)}"
    for item in data:
        port = Port.model_validate(item)
        assert -90.0 <= port.lat <= 90.0
        assert -180.0 <= port.lon <= 180.0
        assert port.max_draft_m > 0


def test_routes_sample_validates():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    route_file = os.path.join(root, "data", "sample", "routes.json")
    assert os.path.exists(route_file), "routes.json does not exist"

    with open(route_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data) >= 2, f"Expected 2-5 routes, found {len(data)}"
    for item in data:
        route = Route.model_validate(item)
        assert route.total_distance_nm > 0
        assert len(route.legs) >= 1
        for leg in route.legs:
            assert leg.distance_nm > 0
            assert leg.depth_m > 0


def test_scenarios_validates():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    scenarios_file = os.path.join(root, "data", "scenarios", "scenarios.json")
    assert os.path.exists(scenarios_file), "scenarios.json does not exist"

    with open(scenarios_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data) >= 5
    for item in data:
        scenario = Scenario.model_validate(item)
        assert scenario.weather_multiplier > 0
        assert 0.0 <= scenario.probability <= 1.0
