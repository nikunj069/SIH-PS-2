export type Provenance = 'measured' | 'reported' | 'estimated' | 'simulated' | 'synthetic';

export interface FuelPathway {
  pathway_id: string;
  name: string;
  category: string;
  feedstock: string;
  energy_density_mj_kg: number;
  price_per_tonne_usd: number;
  price_per_t: number;
  wtt_gco2e_mj: number;
  ttw_co2: number;
  ttw_co2_g_mj: number;
  ttw_ch4_slip: number;
  ttw_ch4_slip_g_mj: number;
  ttw_n2o: number;
  ttw_n2o_g_mj: number;
  wtw_gco2e_mj: number;
  tank_volume_penalty: number;
  source_ref: string;
  provenance: Provenance;
}

export interface Vessel {
  vessel_id: string;
  name: string;
  vessel_type: string;
  vessel_class: string;
  dwt: number;
  capacity_teu?: number | null;
  design_speed_knots: number;
  min_speed_knots: number;
  max_speed_knots: number;
  draft_design_m: number;
  engine_kw: number;
  power_kw: number;
  sfoc_base_g_kwh: number;
  sfoc_base: number;
  speed_exponent_n: number;
  hull_exponent: number;
  fuel_compat: string[];
  compatible_fuels: string[];
  tank_capacities_tonnes: Record<string, number>;
  tank_capacity_t: number;
  ops_compatible: boolean;
  ops_capable: boolean;
  speed_min: number;
  speed_max: number;
  draft: number;
  provenance: Provenance;
}

export interface Port {
  port_id: string;
  name: string;
  unlocode: string;
  lat: number;
  lon: number;
  max_draft_m: number;
  ops_available: boolean;
  ops_slots: number;
  ops_price_per_kwh: number;
  ops_cost_per_mwh: number;
  ops_clean_grid_factor: number;
  ops_grid_ci_gco2_kwh: number;
  bunker_stock_tonnes: Record<string, number>;
  bunker_stocks: Record<string, number>;
  provenance: Provenance;
}

export interface Leg {
  leg_id: string;
  from_port_id: string;
  to_port_id: string;
  from_name: string;
  to_name: string;
  distance_nm: number;
  depth_m: number;
  min_depth_m: number;
  in_eca: boolean;
  is_eca: boolean;
  baseline_eta_h?: number;
  weather_severity: number;
  weather_summary?: {
    significant_wave_height_m: number;
    wind_speed_knots: number;
    relative_wind_angle_deg: number;
    current_speed_knots: number;
  };
}

export interface Route {
  route_id: string;
  name: string;
  origin_port_id: string;
  destination_port_id: string;
  dest_port_id: string;
  total_distance_nm: number;
  demand_tonnes: number;
  cargo_demand_dwt: number;
  deadline_hours: number;
  legs: Leg[];
  provenance: Provenance;
}

export interface Scenario {
  scenario_id: string;
  name: string;
  scenario_type: string;
  description: string;
  probability: number;
  weather_multiplier: number;
  fuel_price_multiplier?: number;
  carbon_price_eur_t?: number;
  port_delay_hours?: Record<string, number>;
  provenance: Provenance;
}

export interface ObjectiveVector {
  cost_total: number;
  ghg_wtw_tonnes: number;
  fuel_total_tonnes: number;
  risk_cvar_cost: number;
  eta_reliability: number;
  provenance: Provenance;
}

export interface Breakdown {
  fuel_cost: number;
  bunker_purchase_cost: number;
  port_fees: number;
  ops_electricity_cost: number;
  ets_carbon_cost: number;
  delay_penalty_cost: number;
  ghg_wtw_propulsion_tonnes: number;
  ghg_port_aux_tonnes: number;
  ghg_by_pathway_tonnes: Record<string, number>;
  fuel_by_pathway_tonnes: Record<string, number>;
}

export interface ConstraintReport {
  is_feasible: boolean;
  violations: string[];
  capacity_met: boolean;
  draft_ok: boolean;
  tank_ok: boolean;
  compatibility_ok: boolean;
  bunker_ok: boolean;
  ops_ok: boolean;
  schedule_ok: boolean;
  eca_ok: boolean;
}

export interface Plan {
  plan_id: string;
  vessel_assignments: Record<string, string>;
  speeds: Record<string, number[]>;
  fuel_pathways: Record<string, string[]>;
  bunkering: Record<string, Record<string, number>>;
  ops_decisions: Record<string, Record<string, boolean>>;
  provenance: Provenance;
}

export interface ParetoSolution {
  solution_id: string;
  plan: Plan;
  objectives: ObjectiveVector;
  breakdown: Breakdown;
  constraint_report: ConstraintReport;
  rank: number;
  crowding_distance: number;
}

export interface TelemetryPoint {
  generation: number;
  evaluations: number;
  hypervolume: number;
  feasible_rate: number;
  best_cost: number;
  best_ghg: number;
  diversity_entropy?: number;
}

export interface ExplainabilityData {
  plan_id: string;
  summary: string;
  cost_breakdown: { component: string; amount: number; percentage: number }[];
  emissions_breakdown: { pathway: string; tonnes: number; percentage: number }[];
  key_drivers: string[];
  counterfactual_analysis: {
    question: string;
    explanation: string;
    metrics_delta?: { cost: string; ghg: string };
  }[];
}
