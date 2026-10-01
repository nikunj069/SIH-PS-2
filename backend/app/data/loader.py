"""Data loading utilities for deterministic sample pack and fuel catalog."""

import json
import os
from typing import Dict, List

from backend.app.schemas import (
    Vessel,
    Port,
    Route,
    FuelPathway,
    Scenario,
    DigitalTwinState,
    Provenance,
)

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


def get_data_dir() -> str:
    return os.path.join(_PROJECT_ROOT, "data")


def load_fuel_catalog() -> Dict[str, FuelPathway]:
    path = os.path.join(get_data_dir(), "fuel_catalog", "fuels.json")
    with open(path, "r", encoding="utf-8") as f:
        items = json.load(f)
    return {item["pathway_id"]: FuelPathway.model_validate(item) for item in items}


def load_vessels() -> Dict[str, Vessel]:
    path = os.path.join(get_data_dir(), "sample", "vessels.json")
    with open(path, "r", encoding="utf-8") as f:
        items = json.load(f)
    return {item["vessel_id"]: Vessel.model_validate(item) for item in items}


def load_ports() -> Dict[str, Port]:
    path = os.path.join(get_data_dir(), "sample", "ports.json")
    with open(path, "r", encoding="utf-8") as f:
        items = json.load(f)
    return {item["port_id"]: Port.model_validate(item) for item in items}


def load_routes() -> Dict[str, Route]:
    path = os.path.join(get_data_dir(), "sample", "routes.json")
    with open(path, "r", encoding="utf-8") as f:
        items = json.load(f)
    return {item["route_id"]: Route.model_validate(item) for item in items}


def load_scenarios() -> List[Scenario]:
    path = os.path.join(get_data_dir(), "scenarios", "scenarios.json")
    with open(path, "r", encoding="utf-8") as f:
        items = json.load(f)
    return [Scenario.model_validate(item) for item in items]


def get_default_twin_state() -> DigitalTwinState:
    return DigitalTwinState(
        vessels=load_vessels(),
        ports=load_ports(),
        routes=load_routes(),
        fuel_catalog=load_fuel_catalog(),
        current_time_epoch_h=0.0,
        provenance=Provenance.REPORTED,
    )
