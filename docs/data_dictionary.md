# Q-GREEN FLEET v2: Data Dictionary & Field Specifications

## 1. Provenance Classifications

Every record, state variable, and API response payload includes an explicit `provenance` metadata attribute with one of the following five enumerations:

| Provenance | Definition | Typical Fields |
|---|---|---|
| `measured` | Directly acquired from physical sensors or calibrated telemetry | AIS position, SOG, water depth |
| `reported` | Legally mandated or administrative declarations | THETIS-MRV annual emissions, port logs |
| `estimated` | Physics calculations, conformal quantiles, or ML model inferences | Fuel mass flow rate ($p_{10}, p_{50}, p_{90}$), added wave resistance |
| `simulated` | Synthetic scenarios or digital twin execution traces | Storm perturbations, Monte Carlo ETA distributions |
| `synthetic` | Generated sample instances for development, testing, and offline demo | Fleet asset catalogs, default port inventories |

---

## 2. Entity Schemas

### 2.1 Fuel Pathway (`data/fuel_catalog/fuels.json`)
Compliant with IMO Resolution MEPC.391(81) Guidelines on Life Cycle GHG Intensity of Marine Fuels.

| Field | Type | Units | Description |
|---|---|---|---|
| `pathway_id` | `string` | — | Unique identifier (e.g. `methanol_green`, `lng_bio`, `mgo`) |
| `name` | `string` | — | Human-readable fuel name |
| `fuel_type` | `string` | — | Broad family: `HFO`, `MGO`, `LNG`, `Methanol`, `Ammonia`, `Hydrogen` |
| `feedstock` | `string` | — | Primary feedstock origin (e.g., `e-fuel`, `biomass`, `fossil_natural_gas`) |
| `energy_density_mj_kg` | `float` | MJ/kg | Lower Heating Value (LHV) |
| `price_per_t` | `float` | USD/metric tonne | Current spot/contract market price benchmark |
| `wtt_gco2e_mj` | `float` | gCO₂e/MJ | Well-to-Tank (upstream extraction, processing, bunkering) intensity |
| `ttw_co2` | `float` | gCO₂/gFuel | Direct combustion carbon dioxide factor |
| `ttw_ch4_slip` | `float` | gCH₄/gFuel | Unburnt methane fugitive slip factor |
| `ttw_n2o` | `float` | gN₂O/gFuel | Combustion nitrous oxide factor |
| `wtw_gco2e_mj` | `float` | gCO₂e/MJ | Well-to-Wake total lifecycle carbon intensity (at 100-year GWP) |
| `tank_volume_penalty` | `float` | ratio ($\ge 1.0$) | Cryogenic or low-energy density tank storage volume multiplier relative to MDO |
| `source_ref` | `string` | — | Citation of official IMO, EU, or NIST data source |
| `provenance` | `enum` | — | Data source classification |

---

### 2.2 Vessel (`data/sample/vessels.json`)

| Field | Type | Units | Description |
|---|---|---|---|
| `vessel_id` | `string` | — | Unique vessel IMO/vessel identifier |
| `name` | `string` | — | Commercial vessel name |
| `vessel_type` | `string` | — | `Container`, `Bulk Carrier`, `Tanker` |
| `vessel_class` | `string` | — | Operational category (e.g., `Feeder`, `Panamax`, `Capesize`, `VLCC`) |
| `dwt` | `float` | metric tonnes | Deadweight tonnage |
| `design_speed` | `float` | knots | Naval design cruising speed |
| `speed_min` | `float` | knots | Minimum maneuvering sea speed |
| `speed_max` | `float` | knots | Maximum continuous rating sea speed |
| `draft` | `float` | meters | Maximum operational laden draft |
| `length_m` | `float` | meters | Length Overall (LOA) |
| `beam_m` | `float` | meters | Molded breadth |
| `power_kw` | `float` | kW | Main engine Maximum Continuous Rating (MCR) |
| `sfoc_base` | `float` | g/kWh | Baseline Specific Fuel Oil Consumption at optimal load fraction |
| `hull_exponent` | `float` | — | Calibrated speed-power relationship exponent ($n_s \approx 2.8 - 3.4$) |
| `tank_capacity_t` | `float` | metric tonnes | Onboard primary and secondary bunker capacity |
| `compatible_fuels` | `list[str]`| — | List of compatible `pathway_id`s supported by engine/tank configuration |
| `ops_capable` | `boolean` | — | True if vessel has cold-ironing shore power transformer and switchboard |
| `provenance` | `enum` | — | Data classification |

---

### 2.3 Port (`data/sample/ports.json`)

| Field | Type | Units | Description |
|---|---|---|---|
| `port_id` | `string` | — | UN/LOCODE identifier (e.g., `SGSIN`, `NLRTM`, `USLAX`) |
| `name` | `string` | — | Port name |
| `lat` / `lon` | `float` | degrees | Geographic coordinates |
| `max_draft_m` | `float` | meters | Maximum navigational channel and quayside draft |
| `ops_available` | `boolean` | — | Shore power cold-ironing availability |
| `ops_slots` | `int` | slots | Number of simultaneous high-voltage shore connection berths |
| `ops_cost_per_mwh`| `float` | USD/MWh | Port electricity tariff |
| `ops_grid_ci_gco2_kwh`| `float`| gCO₂/kWh | Local electrical grid average carbon intensity |
| `bunker_stocks` | `dict[str, float]`| tonnes | Current fuel stock by fuel pathway id |
| `provenance` | `enum` | — | Data classification |

---

### 2.4 Route & Leg (`data/sample/routes.json`)

| Field | Type | Units | Description |
|---|---|---|---|
| `route_id` | `string` | — | Strategic corridor identifier (e.g., `ASIA-EUR-01`) |
| `name` | `string` | — | Corridor description |
| `origin_port_id` / `dest_port_id` | `string` | — | Origin and destination UN/LOCODEs |
| `total_distance_nm` | `float` | nautical miles | Total fairway distance |
| `cargo_demand_dwt` | `float` | metric tonnes | Minimum scheduled cargo transport demand |
| `deadline_hours` | `float` | hours | Contractual maximum arrival deadline |
| `legs` | `list[Leg]`| — | Ordered navigational waypoints and corridors |
| `leg.min_depth_m` | `float` | meters | Shallowest bathymetric sill depth along the leg |
| `leg.is_eca` | `boolean` | — | True if leg traverses an IMO Emission Control Area (SOx/NOx limits) |
| `leg.weather_severity` | `float` | 0.0 – 1.0 | Normalized wave/wind resistance amplification coefficient |

---

### 2.5 Multi-Objective Vector (`ObjectiveVector`)

| Field | Units | Description |
|---|---|---|
| `cost_total` | USD | Total expected cost (Fuel + Bunkering + Port Fees + Cold-Ironing + ETS + Delay Penalties) |
| `ghg_wtw_tonnes`| metric tonnes CO₂e | Total Well-to-Wake lifecycle GHG emissions |
| `fuel_total_tonnes`| metric tonnes | Aggregate fuel mass consumed across all active vessels |
| `risk_cvar_cost` | USD | Conditional Value-at-Risk (95th percentile worst-case cost) |
| `eta_reliability` | 0.0 – 1.0 (ratio) | Fraction of scenarios where all assigned vessels arrive before deadline |
| `provenance` | `enum` | Always `simulated` or `estimated` |
