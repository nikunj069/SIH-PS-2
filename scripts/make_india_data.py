"""Deterministic generator for Q-GREEN INDIA sample pack.

Generates:
  - data/sample/india_demo/vessels.json
  - data/sample/india_demo/ports.json
  - data/sample/india_demo/routes.json
  - data/sample/india_demo/scenarios.json
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, List


def get_india_ports() -> List[Dict[str, Any]]:
    return [
        {
            "port_id": "INMUN",
            "name": "Mundra Port",
            "unlocode": "INMUN",
            "lat": 22.73,
            "lon": 69.70,
            "max_draft_m": 17.5,
            "ops_available": False,
            "ops_price_per_kwh": 0.15,
            "ops_clean_grid_factor": 710.0, # India average roughly
            "bunker_stock_tonnes": {
                "hfo": 25000.0,
                "mgo": 10000.0,
                "lng_fossil": 5000.0
            },
            "bunker_price_spread": {"hfo": 1.0, "mgo": 1.02},
            "congestion_delay_mean_h": 6.0,
            "congestion_delay_std_h": 2.5,
            "coastal_traffic": 15000000.0,
            "overseas_traffic": 135000000.0,
            "green_hydrogen_status": "planned",
            "green_methanol_status": "none",
            "green_ammonia_status": "none",
            "electrification_status": "in_progress",
            "rail_connectivity": True,
            "road_connectivity": True,
            "iwt_connectivity": False,
            "provenance": "reported",
        },
        {
            "port_id": "INNSA",
            "name": "Jawaharlal Nehru Port (JNPA)",
            "unlocode": "INNSA",
            "lat": 18.95,
            "lon": 72.95,
            "max_draft_m": 15.0,
            "ops_available": True, # Harit Sagar planning
            "ops_price_per_kwh": 0.16,
            "ops_clean_grid_factor": 680.0,
            "bunker_stock_tonnes": {
                "hfo": 30000.0,
                "mgo": 15000.0,
                "methanol_grey": 2000.0
            },
            "bunker_price_spread": {"hfo": 0.98, "mgo": 0.99},
            "congestion_delay_mean_h": 8.5,
            "congestion_delay_std_h": 4.0,
            "coastal_traffic": 5000000.0,
            "overseas_traffic": 60000000.0,
            "green_hydrogen_status": "planned",
            "green_methanol_status": "pilot",
            "green_ammonia_status": "none",
            "electrification_status": "advanced",
            "rail_connectivity": True,
            "road_connectivity": True,
            "iwt_connectivity": False,
            "provenance": "reported",
        },
        {
            "port_id": "INCOK",
            "name": "Cochin Port",
            "unlocode": "INCOK",
            "lat": 9.96,
            "lon": 76.26,
            "max_draft_m": 14.5,
            "ops_available": True, # Shore power exists for cruise/some commercial
            "ops_price_per_kwh": 0.14,
            "ops_clean_grid_factor": 650.0,
            "bunker_stock_tonnes": {
                "hfo": 12000.0,
                "mgo": 8000.0,
                "lng_fossil": 2000.0,
                "methanol_bio": 500.0 # Harit Sagar target
            },
            "bunker_price_spread": {"hfo": 1.05, "mgo": 1.03},
            "congestion_delay_mean_h": 4.0,
            "congestion_delay_std_h": 1.5,
            "coastal_traffic": 12000000.0,
            "overseas_traffic": 20000000.0,
            "green_hydrogen_status": "pilot",
            "green_methanol_status": "planned",
            "green_ammonia_status": "planned",
            "electrification_status": "advanced",
            "rail_connectivity": True,
            "road_connectivity": True,
            "iwt_connectivity": True, # NW-3
            "provenance": "reported",
        },
        {
            "port_id": "INMAA",
            "name": "Chennai Port",
            "unlocode": "INMAA",
            "lat": 13.08,
            "lon": 80.30,
            "max_draft_m": 16.5,
            "ops_available": False,
            "ops_price_per_kwh": 0.17,
            "ops_clean_grid_factor": 720.0,
            "bunker_stock_tonnes": {
                "hfo": 18000.0,
                "mgo": 12000.0
            },
            "bunker_price_spread": {"hfo": 1.02, "mgo": 1.01},
            "congestion_delay_mean_h": 7.0,
            "congestion_delay_std_h": 3.0,
            "coastal_traffic": 8000000.0,
            "overseas_traffic": 40000000.0,
            "green_hydrogen_status": "none",
            "green_methanol_status": "none",
            "green_ammonia_status": "none",
            "electrification_status": "planned",
            "rail_connectivity": True,
            "road_connectivity": True,
            "iwt_connectivity": False,
            "provenance": "reported",
        },
        {
            "port_id": "INHAL",
            "name": "Haldia Dock Complex",
            "unlocode": "INHAL",
            "lat": 22.03,
            "lon": 88.06,
            "max_draft_m": 8.5, # Major constraint - riverine port
            "ops_available": False,
            "ops_price_per_kwh": 0.16,
            "ops_clean_grid_factor": 780.0, # Eastern grid
            "bunker_stock_tonnes": {
                "hfo": 8000.0,
                "mgo": 6000.0
            },
            "bunker_price_spread": {"hfo": 1.08, "mgo": 1.05},
            "congestion_delay_mean_h": 12.0,
            "congestion_delay_std_h": 5.0,
            "coastal_traffic": 18000000.0,
            "overseas_traffic": 25000000.0,
            "green_hydrogen_status": "none",
            "green_methanol_status": "none",
            "green_ammonia_status": "none",
            "electrification_status": "early",
            "rail_connectivity": True,
            "road_connectivity": True,
            "iwt_connectivity": True, # NW-1 (Ganga-Bhagirathi-Hooghly)
            "provenance": "reported",
        },
        {
            "port_id": "INTUT",
            "name": "V.O. Chidambaranar Port (Tuticorin)",
            "unlocode": "INTUT",
            "lat": 8.75,
            "lon": 78.17,
            "max_draft_m": 14.2,
            "ops_available": True,
            "ops_price_per_kwh": 0.14,
            "ops_clean_grid_factor": 620.0, # Renewables mix
            "bunker_stock_tonnes": {
                "hfo": 10000.0,
                "mgo": 5000.0,
                "ammonia_green": 1000.0 # Green ammonia hub aspiration
            },
            "bunker_price_spread": {"hfo": 1.04, "mgo": 1.02},
            "congestion_delay_mean_h": 5.0,
            "congestion_delay_std_h": 2.0,
            "coastal_traffic": 10000000.0,
            "overseas_traffic": 28000000.0,
            "green_hydrogen_status": "planned",
            "green_methanol_status": "planned",
            "green_ammonia_status": "pilot",
            "electrification_status": "advanced",
            "rail_connectivity": True,
            "road_connectivity": True,
            "iwt_connectivity": False,
            "provenance": "reported",
        },
        {
            "port_id": "AEJEA",
            "name": "Jebel Ali Port (Dubai)",
            "unlocode": "AEJEA",
            "lat": 25.01,
            "lon": 55.06,
            "max_draft_m": 17.0,
            "ops_available": False,
            "ops_price_per_kwh": 0.20,
            "ops_clean_grid_factor": 450.0,
            "bunker_stock_tonnes": {
                "hfo": 45000.0,
                "mgo": 22000.0,
                "lng_fossil": 10000.0,
            },
            "bunker_price_spread": {"hfo": 0.95, "mgo": 0.96},
            "congestion_delay_mean_h": 3.0,
            "congestion_delay_std_h": 1.2,
            "coastal_traffic": 0.0,
            "overseas_traffic": 0.0,
            "green_hydrogen_status": "planned",
            "green_methanol_status": "none",
            "green_ammonia_status": "none",
            "electrification_status": "planned",
            "rail_connectivity": False,
            "road_connectivity": True,
            "iwt_connectivity": False,
            "provenance": "reported",
        },
        {
            "port_id": "SGSIN",
            "name": "Port of Singapore",
            "unlocode": "SGSIN",
            "lat": 1.28,
            "lon": 103.85,
            "max_draft_m": 20.0,
            "ops_available": True,
            "ops_price_per_kwh": 0.24,
            "ops_clean_grid_factor": 340.0,
            "bunker_stock_tonnes": {
                "hfo": 80000.0,
                "mgo": 40000.0,
                "lng_fossil": 22000.0,
                "lng_bio": 4000.0,
                "methanol_grey": 16000.0,
                "methanol_bio": 4500.0,
                "methanol_e": 2000.0,
                "ammonia_green": 1000.0,
            },
            "bunker_price_spread": {"hfo": 0.97, "mgo": 0.98, "lng_fossil": 0.96},
            "congestion_delay_mean_h": 5.0,
            "congestion_delay_std_h": 2.5,
            "coastal_traffic": 0.0,
            "overseas_traffic": 0.0,
            "green_hydrogen_status": "planned",
            "green_methanol_status": "operational",
            "green_ammonia_status": "pilot",
            "electrification_status": "advanced",
            "rail_connectivity": False,
            "road_connectivity": True,
            "iwt_connectivity": False,
            "provenance": "reported",
        },
    ]


def get_india_vessels() -> List[Dict[str, Any]]:
    return [
        {
            "vessel_id": "IND_COASTAL_01",
            "name": "Sagar Feeder",
            "vessel_type": "Container",
            "dwt": 18000.0,
            "capacity_teu": 1200,
            "design_speed_knots": 14.5,
            "min_speed_knots": 9.0,
            "max_speed_knots": 16.5,
            "draft_design_m": 8.0, # Fits Haldia
            "engine_kw": 9500.0,
            "sfoc_base_g_kwh": 180.0,
            "speed_exponent_n": 2.95,
            "admiralty_coefficient": 450.0,
            "fuel_compat": ["hfo", "mgo"],
            "tank_capacities_tonnes": {"hfo": 800.0, "mgo": 250.0},
            "ops_compatible": True, # Harit Sagar modernization
            "ops_power_kw": 600.0,
            "hull_factor": 1.05,
            "provenance": "synthetic",
        },
        {
            "vessel_id": "IND_COASTAL_02",
            "name": "Bharat Bulk",
            "vessel_type": "Bulk Carrier",
            "dwt": 45000.0,
            "capacity_teu": None,
            "design_speed_knots": 13.0,
            "min_speed_knots": 8.0,
            "max_speed_knots": 14.5,
            "draft_design_m": 11.2,
            "engine_kw": 7500.0,
            "sfoc_base_g_kwh": 175.0,
            "speed_exponent_n": 2.85,
            "admiralty_coefficient": 510.0,
            "fuel_compat": ["mgo", "methanol_bio"],
            "tank_capacities_tonnes": {"mgo": 600.0, "methanol_bio": 1200.0},
            "ops_compatible": False,
            "ops_power_kw": 400.0,
            "hull_factor": 1.02,
            "provenance": "synthetic",
        },
        {
            "vessel_id": "IND_EXIM_01",
            "name": "Oceanic Gateway",
            "vessel_type": "Container",
            "dwt": 95000.0,
            "capacity_teu": 8500,
            "design_speed_knots": 18.0,
            "min_speed_knots": 10.5,
            "max_speed_knots": 21.0,
            "draft_design_m": 14.0,
            "engine_kw": 38000.0,
            "sfoc_base_g_kwh": 170.0,
            "speed_exponent_n": 3.10,
            "admiralty_coefficient": 530.0,
            "fuel_compat": ["hfo", "mgo", "lng_fossil", "lng_bio"],
            "tank_capacities_tonnes": {"hfo": 2800.0, "mgo": 600.0, "lng_fossil": 3200.0, "lng_bio": 3200.0},
            "ops_compatible": True,
            "ops_power_kw": 1500.0,
            "hull_factor": 1.0,
            "provenance": "synthetic",
        },
        {
            "vessel_id": "IND_EXIM_02",
            "name": "Kandla Pioneer",
            "vessel_type": "Tanker",
            "dwt": 115000.0,
            "capacity_teu": None,
            "design_speed_knots": 14.2,
            "min_speed_knots": 8.5,
            "max_speed_knots": 15.5,
            "draft_design_m": 15.0,
            "engine_kw": 14500.0,
            "sfoc_base_g_kwh": 172.0,
            "speed_exponent_n": 2.88,
            "admiralty_coefficient": 560.0,
            "fuel_compat": ["hfo", "mgo", "ammonia_green"],
            "tank_capacities_tonnes": {"hfo": 3000.0, "mgo": 500.0, "ammonia_green": 4500.0},
            "ops_compatible": False,
            "ops_power_kw": 750.0,
            "hull_factor": 1.04,
            "provenance": "synthetic",
        }
    ]


def get_india_routes() -> List[Dict[str, Any]]:
    return [
        {
            "route_id": "RTE_IND_COASTAL_WEST_EAST",
            "name": "Coastal Peninsular Loop (Mundra to Haldia)",
            "origin_port_id": "INMUN",
            "destination_port_id": "INHAL",
            "total_distance_nm": 2150.0,
            "demand_tonnes": 12000.0,
            "deadline_hours": 200.0,
            "legs": [
                {
                    "leg_id": "LEG_INMUN_INCOK",
                    "from_port_id": "INMUN",
                    "to_port_id": "INCOK",
                    "distance_nm": 850.0,
                    "depth_m": 25.0,
                    "in_eca": False,
                    "baseline_eta_h": 65.0,
                    "weather_summary": {
                        "significant_wave_height_m": 1.8, # Arabian sea average
                        "wind_speed_knots": 15.0,
                        "relative_wind_angle_deg": 45.0,
                        "current_speed_knots": 0.5,
                    },
                    "provenance": "synthetic",
                },
                {
                    "leg_id": "LEG_INCOK_INTUT",
                    "from_port_id": "INCOK",
                    "to_port_id": "INTUT",
                    "distance_nm": 220.0,
                    "depth_m": 20.0,
                    "in_eca": False,
                    "baseline_eta_h": 16.0,
                    "weather_summary": {
                        "significant_wave_height_m": 1.4,
                        "wind_speed_knots": 12.0,
                        "relative_wind_angle_deg": 30.0,
                        "current_speed_knots": 0.3,
                    },
                    "provenance": "synthetic",
                },
                {
                    "leg_id": "LEG_INTUT_INHAL",
                    "from_port_id": "INTUT",
                    "to_port_id": "INHAL",
                    "distance_nm": 1080.0,
                    "depth_m": 8.5, # Bay of Bengal + Hooghly approach
                    "in_eca": False,
                    "baseline_eta_h": 85.0,
                    "weather_summary": {
                        "significant_wave_height_m": 2.1, # BoB higher wave
                        "wind_speed_knots": 18.0,
                        "relative_wind_angle_deg": 60.0,
                        "current_speed_knots": 0.6,
                    },
                    "provenance": "synthetic",
                }
            ],
            "provenance": "synthetic",
        },
        {
            "route_id": "RTE_IND_EXIM_JNPA_SGSIN",
            "name": "India-Far East Corridor (JNPA to Singapore)",
            "origin_port_id": "INNSA",
            "destination_port_id": "SGSIN",
            "total_distance_nm": 2400.0,
            "demand_tonnes": 50000.0,
            "deadline_hours": 165.0,
            "legs": [
                {
                    "leg_id": "LEG_INNSA_SGSIN",
                    "from_port_id": "INNSA",
                    "to_port_id": "SGSIN",
                    "distance_nm": 2400.0,
                    "depth_m": 35.0,
                    "in_eca": False,
                    "baseline_eta_h": 135.0,
                    "weather_summary": {
                        "significant_wave_height_m": 2.0,
                        "wind_speed_knots": 16.0,
                        "relative_wind_angle_deg": 40.0,
                        "current_speed_knots": 0.4,
                    },
                    "provenance": "synthetic",
                }
            ],
            "provenance": "synthetic",
        },
        {
            "route_id": "RTE_IND_EXIM_MUN_JEB",
            "name": "India-Middle East Gulf (Mundra to Jebel Ali)",
            "origin_port_id": "INMUN",
            "destination_port_id": "AEJEA",
            "total_distance_nm": 950.0,
            "demand_tonnes": 80000.0, # Large tanker/bulk
            "deadline_hours": 85.0,
            "legs": [
                {
                    "leg_id": "LEG_INMUN_AEJEA",
                    "from_port_id": "INMUN",
                    "to_port_id": "AEJEA",
                    "distance_nm": 950.0,
                    "depth_m": 45.0,
                    "in_eca": False,
                    "baseline_eta_h": 70.0,
                    "weather_summary": {
                        "significant_wave_height_m": 1.5,
                        "wind_speed_knots": 11.0,
                        "relative_wind_angle_deg": 25.0,
                        "current_speed_knots": 0.2,
                    },
                    "provenance": "synthetic",
                }
            ],
            "provenance": "synthetic",
        }
    ]


def main():
    base_path = Path(os.path.dirname(os.path.dirname(__file__)))
    india_demo_dir = base_path / "data" / "sample" / "india_demo"
    india_demo_dir.mkdir(parents=True, exist_ok=True)

    # 1. Ports
    ports = get_india_ports()
    with open(india_demo_dir / "ports.json", "w", encoding="utf-8") as f:
        json.dump(ports, f, indent=2)

    # 2. Vessels
    vessels = get_india_vessels()
    with open(india_demo_dir / "vessels.json", "w", encoding="utf-8") as f:
        json.dump(vessels, f, indent=2)

    # 3. Routes
    routes = get_india_routes()
    with open(india_demo_dir / "routes.json", "w", encoding="utf-8") as f:
        json.dump(routes, f, indent=2)

    print(f"SUCCESS: Generated Q-GREEN INDIA deterministic sample pack in: {india_demo_dir}")


if __name__ == "__main__":
    main()
