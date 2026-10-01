import type { 
  FuelPathway, 
  Vessel, 
  Port, 
  Route, 
  Scenario, 
  ParetoSolution, 
  ExplainabilityData 
} from '../types';

import fuelsData from '../data/fuels.json';
import vesselsData from '../data/vessels.json';
import portsData from '../data/ports.json';
import routesData from '../data/routes.json';
import scenariosData from '../data/scenarios.json';
import benchmarkData from '../data/benchmark_summary.json';

const API_BASE_URL = 'http://127.0.0.1:8000';

const normalizeVessel = (v: any): Vessel => {
  const hull_exponent = v.speed_exponent_n ?? v.hull_exponent ?? 3.0;
  const speed_min = v.min_speed_knots ?? v.speed_min ?? 11.0;
  const speed_max = v.max_speed_knots ?? v.speed_max ?? 21.0;
  const draft = v.draft_design_m ?? v.draft ?? 14.0;
  const compatible_fuels = v.fuel_compat ?? v.compatible_fuels ?? ['hfo', 'mgo'];
  const ops_capable = v.ops_compatible ?? v.ops_capable ?? false;
  const power_kw = v.engine_kw ?? v.power_kw ?? 45000;
  const design_speed = v.design_speed_knots ?? v.design_speed ?? 16.0;
  const sfoc_base = v.sfoc_base_g_kwh ?? v.sfoc_base ?? 170.0;
  const tank_capacities_tonnes = v.tank_capacities_tonnes ?? {};
  const tank_capacity_t = v.tank_capacity_t ?? (Object.values(tank_capacities_tonnes).length > 0 ? Math.max(...Object.values(tank_capacities_tonnes).map(Number)) : 3000);

  return {
    ...v,
    vessel_class: v.vessel_class ?? (v.capacity_teu ? `${v.capacity_teu.toLocaleString()} TEU` : `${(v.dwt / 1000).toFixed(0)}k DWT`),
    design_speed_knots: design_speed,
    design_speed,
    min_speed_knots: speed_min,
    speed_min,
    max_speed_knots: speed_max,
    speed_max,
    draft_design_m: draft,
    draft,
    engine_kw: power_kw,
    power_kw,
    sfoc_base_g_kwh: sfoc_base,
    sfoc_base,
    speed_exponent_n: hull_exponent,
    hull_exponent,
    fuel_compat: compatible_fuels,
    compatible_fuels,
    tank_capacities_tonnes,
    tank_capacity_t,
    ops_compatible: ops_capable,
    ops_capable,
    provenance: v.provenance ?? 'reported'
  };
};

const normalizePort = (p: any): Port => {
  const bunker_stocks = p.bunker_stock_tonnes ?? p.bunker_stocks ?? {
    hfo: 30000,
    mgo: 15000,
    lng_fossil: 10000,
    methanol_bio: 5000
  };
  return {
    ...p,
    unlocode: p.unlocode ?? p.port_id,
    ops_available: !!p.ops_available,
    ops_slots: p.ops_slots ?? (p.ops_available ? 4 : 0),
    ops_price_per_kwh: p.ops_price_per_kwh ?? 0.22,
    ops_cost_per_mwh: p.ops_cost_per_mwh ?? Math.round((p.ops_price_per_kwh || 0.22) * 1000),
    ops_grid_ci_gco2_kwh: p.ops_grid_ci_gco2_kwh ?? p.ops_clean_grid_factor ?? 220,
    bunker_stock_tonnes: bunker_stocks,
    bunker_stocks,
    provenance: p.provenance ?? 'reported'
  };
};

const normalizeRoute = (r: any): Route => {
  const dest_port_id = r.destination_port_id ?? r.dest_port_id ?? '';
  const cargo_demand_dwt = r.demand_tonnes ?? r.cargo_demand_dwt ?? 50000;
  const legs = (r.legs || []).map((leg: any, idx: number) => ({
    ...leg,
    leg_id: leg.leg_id ?? `LEG_${idx}`,
    from_port_id: leg.from_port_id ?? leg.from_name ?? '',
    to_port_id: leg.to_port_id ?? leg.to_name ?? '',
    from_name: leg.from_port_id ?? leg.from_name ?? `Waypoint ${idx}`,
    to_name: leg.to_port_id ?? leg.to_name ?? `Waypoint ${idx + 1}`,
    depth_m: leg.depth_m ?? leg.min_depth_m ?? 35.0,
    min_depth_m: leg.depth_m ?? leg.min_depth_m ?? 35.0,
    in_eca: leg.in_eca ?? leg.is_eca ?? false,
    is_eca: leg.in_eca ?? leg.is_eca ?? false,
    weather_severity: leg.weather_severity ?? (leg.weather_summary?.significant_wave_height_m ? leg.weather_summary.significant_wave_height_m / 4.0 : 0.4)
  }));

  return {
    ...r,
    destination_port_id: dest_port_id,
    dest_port_id,
    demand_tonnes: cargo_demand_dwt,
    cargo_demand_dwt,
    legs,
    provenance: r.provenance ?? 'reported'
  };
};

const normalizeFuel = (f: any): FuelPathway => {
  const price = f.price_per_tonne_usd ?? f.price_per_t ?? 680.0;
  return {
    ...f,
    price_per_tonne_usd: price,
    price_per_t: price,
    category: f.category ?? f.feedstock ?? 'fossil',
    feedstock: f.category ?? f.feedstock ?? 'fossil',
    ttw_co2: f.ttw_co2 ?? f.ttw_co2_g_mj ?? 0.0,
    ttw_co2_g_mj: f.ttw_co2_g_mj ?? f.ttw_co2 ?? 0.0,
    ttw_ch4_slip: f.ttw_ch4_slip ?? f.ttw_ch4_slip_g_mj ?? 0.0,
    ttw_ch4_slip_g_mj: f.ttw_ch4_slip_g_mj ?? f.ttw_ch4_slip ?? 0.0,
    ttw_n2o: f.ttw_n2o ?? f.ttw_n2o_g_mj ?? 0.0,
    ttw_n2o_g_mj: f.ttw_n2o_g_mj ?? f.ttw_n2o ?? 0.0,
    tank_volume_penalty: f.tank_volume_penalty ?? 1.0,
    wtw_gco2e_mj: f.wtw_gco2e_mj ?? 90.0,
    provenance: f.provenance ?? 'reported'
  };
};

class ApiService {
  private backendLive = false;

  constructor() {
    this.checkBackendHealth();
  }

  async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const res = await fetch(`${API_BASE_URL}/fuels`, { signal: controller.signal });
      clearTimeout(timeoutId);
      this.backendLive = res.ok;
      return res.ok;
    } catch {
      this.backendLive = false;
      return false;
    }
  }

  isLive(): boolean {
    return this.backendLive;
  }

  async getFuels(): Promise<FuelPathway[]> {
    if (this.backendLive) {
      try {
        const res = await fetch(`${API_BASE_URL}/fuels`);
        if (res.ok) {
          const data = await res.json();
          return (data as any[]).map(normalizeFuel);
        }
      } catch (e) {
        console.warn('Backend fuels fetch failed, using cached catalog', e);
      }
    }
    return (fuelsData as any[]).map(normalizeFuel);
  }

  async getVessels(): Promise<Vessel[]> {
    if (this.backendLive) {
      try {
        const res = await fetch(`${API_BASE_URL}/vessels`);
        if (res.ok) {
          const data = await res.json();
          return (data as any[]).map(normalizeVessel);
        }
      } catch (e) {
        console.warn('Backend vessels fetch failed, using cached vessels', e);
      }
    }
    return (vesselsData as any[]).map(normalizeVessel);
  }

  async getPorts(): Promise<Port[]> {
    if (this.backendLive) {
      try {
        const res = await fetch(`${API_BASE_URL}/ports`);
        if (res.ok) {
          const data = await res.json();
          return (data as any[]).map(normalizePort);
        }
      } catch (e) {
        console.warn('Backend ports fetch failed, using cached ports', e);
      }
    }
    return (portsData as any[]).map(normalizePort);
  }

  async getRoutes(): Promise<Route[]> {
    if (this.backendLive) {
      try {
        const res = await fetch(`${API_BASE_URL}/routes`);
        if (res.ok) {
          const data = await res.json();
          return (data as any[]).map(normalizeRoute);
        }
      } catch (e) {
        console.warn('Backend routes fetch failed, using cached routes', e);
      }
    }
    return (routesData as any[]).map(normalizeRoute);
  }

  async getScenarios(): Promise<Scenario[]> {
    return (scenariosData as any[]).map(sc => ({
      ...sc,
      description: `Operational perturbation: ${sc.scenario_type} with weather coefficient ${sc.weather_multiplier}x.`,
      probability: 0.25,
      provenance: sc.provenance ?? 'simulated'
    }));
  }

  getBenchmarkSummary() {
    return benchmarkData;
  }

  generateSampleParetoSolutions(): ParetoSolution[] {
    return [
      {
        solution_id: 'sol-qgreen-01-mincost',
        rank: 1,
        crowding_distance: 0.95,
        objectives: {
          cost_total: 1245000,
          ghg_wtw_tonnes: 3420.5,
          fuel_total_tonnes: 1080.2,
          risk_cvar_cost: 1395000,
          eta_reliability: 0.96,
          provenance: 'simulated'
        },
        breakdown: {
          fuel_cost: 648000,
          bunker_purchase_cost: 215000,
          port_fees: 180000,
          ops_electricity_cost: 14000,
          ets_carbon_cost: 128000,
          delay_penalty_cost: 60000,
          ghg_wtw_propulsion_tonnes: 3380.5,
          ghg_port_aux_tonnes: 40.0,
          ghg_by_pathway_tonnes: {
            'mgo': 1850.2,
            'lng_fossil': 1530.3,
            'grid_electricity': 40.0
          },
          fuel_by_pathway_tonnes: {
            'mgo': 580.0,
            'lng_fossil': 500.2
          }
        },
        constraint_report: {
          is_feasible: true,
          violations: [],
          capacity_met: true,
          draft_ok: true,
          tank_ok: true,
          compatibility_ok: true,
          bunker_ok: true,
          ops_ok: true,
          schedule_ok: true,
          eca_ok: true
        },
        plan: {
          plan_id: 'plan-cost-optimal',
          vessel_assignments: {
            'IMO9811001': 'RTE_ASIA_EUR_01',
            'IMO9811002': 'RTE_TRANSPAC_01',
            'IMO9811005': 'RTE_TRANSATL_01'
          },
          speeds: {
            'IMO9811001': [14.2, 14.0, 14.5, 13.8],
            'IMO9811002': [15.0, 14.8, 15.2],
            'IMO9811005': [12.0, 11.8]
          },
          fuel_pathways: {
            'IMO9811001': ['mgo', 'lng_fossil', 'lng_fossil', 'mgo'],
            'IMO9811002': ['lng_fossil', 'lng_fossil', 'mgo'],
            'IMO9811005': ['mgo', 'mgo']
          },
          bunkering: {
            'IMO9811001': { 'SGSIN': 450.0, 'NLRTM': 300.0 },
            'IMO9811002': { 'CNSHA': 400.0, 'USLAX': 250.0 },
            'IMO9811005': { 'USNYC': 200.0 }
          },
          ops_decisions: {
            'IMO9811001': { 'SGSIN': true, 'NLRTM': true },
            'IMO9811002': { 'CNSHA': true, 'USLAX': true },
            'IMO9811005': { 'USNYC': true }
          },
          provenance: 'simulated'
        }
      },
      {
        solution_id: 'sol-qgreen-02-balanced',
        rank: 1,
        crowding_distance: 0.88,
        objectives: {
          cost_total: 1380000,
          ghg_wtw_tonnes: 2150.0,
          fuel_total_tonnes: 995.0,
          risk_cvar_cost: 1490000,
          eta_reliability: 0.98,
          provenance: 'simulated'
        },
        breakdown: {
          fuel_cost: 840000,
          bunker_purchase_cost: 210000,
          port_fees: 180000,
          ops_electricity_cost: 18000,
          ets_carbon_cost: 72000,
          delay_penalty_cost: 60000,
          ghg_wtw_propulsion_tonnes: 2125.0,
          ghg_port_aux_tonnes: 25.0,
          ghg_by_pathway_tonnes: {
            'methanol_bio': 1200.0,
            'lng_bio': 925.0,
            'grid_electricity': 25.0
          },
          fuel_by_pathway_tonnes: {
            'methanol_bio': 520.0,
            'lng_bio': 475.0
          }
        },
        constraint_report: {
          is_feasible: true,
          violations: [],
          capacity_met: true,
          draft_ok: true,
          tank_ok: true,
          compatibility_ok: true,
          bunker_ok: true,
          ops_ok: true,
          schedule_ok: true,
          eca_ok: true
        },
        plan: {
          plan_id: 'plan-balanced-optimal',
          vessel_assignments: {
            'IMO9811001': 'RTE_ASIA_EUR_01',
            'IMO9811002': 'RTE_TRANSPAC_01',
            'IMO9811005': 'RTE_TRANSATL_01'
          },
          speeds: {
            'IMO9811001': [13.8, 13.5, 13.8, 13.2],
            'IMO9811002': [14.2, 14.0, 14.5],
            'IMO9811005': [11.5, 11.2]
          },
          fuel_pathways: {
            'IMO9811001': ['methanol_bio', 'methanol_bio', 'lng_bio', 'methanol_bio'],
            'IMO9811002': ['lng_bio', 'lng_bio', 'methanol_bio'],
            'IMO9811005': ['methanol_bio', 'methanol_bio']
          },
          bunkering: {
            'IMO9811001': { 'SGSIN': 400.0, 'NLRTM': 280.0 },
            'IMO9811002': { 'CNSHA': 380.0, 'USLAX': 220.0 },
            'IMO9811005': { 'USNYC': 180.0 }
          },
          ops_decisions: {
            'IMO9811001': { 'SGSIN': true, 'NLRTM': true },
            'IMO9811002': { 'CNSHA': true, 'USLAX': true },
            'IMO9811005': { 'USNYC': true }
          },
          provenance: 'simulated'
        }
      },
      {
        solution_id: 'sol-qgreen-03-netzero',
        rank: 1,
        crowding_distance: 0.92,
        objectives: {
          cost_total: 1620000,
          ghg_wtw_tonnes: 850.4,
          fuel_total_tonnes: 920.0,
          risk_cvar_cost: 1710000,
          eta_reliability: 0.99,
          provenance: 'simulated'
        },
        breakdown: {
          fuel_cost: 1180000,
          bunker_purchase_cost: 210000,
          port_fees: 180000,
          ops_electricity_cost: 22000,
          ets_carbon_cost: 18000,
          delay_penalty_cost: 10000,
          ghg_wtw_propulsion_tonnes: 835.4,
          ghg_port_aux_tonnes: 15.0,
          ghg_by_pathway_tonnes: {
            'ammonia_green': 450.0,
            'methanol_e': 385.4,
            'grid_electricity': 15.0
          },
          fuel_by_pathway_tonnes: {
            'ammonia_green': 500.0,
            'methanol_e': 420.0
          }
        },
        constraint_report: {
          is_feasible: true,
          violations: [],
          capacity_met: true,
          draft_ok: true,
          tank_ok: true,
          compatibility_ok: true,
          bunker_ok: true,
          ops_ok: true,
          schedule_ok: true,
          eca_ok: true
        },
        plan: {
          plan_id: 'plan-decarbonized-optimal',
          vessel_assignments: {
            'IMO9811001': 'RTE_ASIA_EUR_01',
            'IMO9811002': 'RTE_TRANSPAC_01',
            'IMO9811005': 'RTE_TRANSATL_01'
          },
          speeds: {
            'IMO9811001': [13.2, 13.0, 13.4, 12.8],
            'IMO9811002': [13.8, 13.5, 14.0],
            'IMO9811005': [11.0, 10.8]
          },
          fuel_pathways: {
            'IMO9811001': ['ammonia_green', 'ammonia_green', 'methanol_e', 'methanol_e'],
            'IMO9811002': ['ammonia_green', 'ammonia_green', 'methanol_e'],
            'IMO9811005': ['ammonia_green', 'methanol_e']
          },
          bunkering: {
            'IMO9811001': { 'SGSIN': 380.0, 'NLRTM': 250.0 },
            'IMO9811002': { 'CNSHA': 350.0, 'USLAX': 200.0 },
            'IMO9811005': { 'USNYC': 160.0 }
          },
          ops_decisions: {
            'IMO9811001': { 'SGSIN': true, 'NLRTM': true },
            'IMO9811002': { 'CNSHA': true, 'USLAX': true },
            'IMO9811005': { 'USNYC': true }
          },
          provenance: 'simulated'
        }
      }
    ];
  }

  getExplainabilityData(solutionId: string): ExplainabilityData {
    const isNetZero = solutionId.includes('netzero');
    const isCost = solutionId.includes('cost');

    if (isNetZero) {
      return {
        plan_id: solutionId,
        summary: 'Deep-Decarbonization Fleet Strategy prioritizing green ammonia and e-methanol with universal cold-ironing.',
        cost_breakdown: [
          { component: 'Alternative E-Fuels (NH3 & MeOH)', amount: 1180000, percentage: 72.8 },
          { component: 'Bunkering Procurement', amount: 210000, percentage: 13.0 },
          { component: 'Port Tariff & Fairway Dues', amount: 180000, percentage: 11.1 },
          { component: 'Berth OPS Electricity', amount: 22000, percentage: 1.4 },
          { component: 'EU-ETS Carbon Cost', amount: 18000, percentage: 1.1 },
          { component: 'Delay Risk Buffer', amount: 10000, percentage: 0.6 }
        ],
        emissions_breakdown: [
          { pathway: 'Green Ammonia (e-NH3)', tonnes: 450.0, percentage: 52.9 },
          { pathway: 'E-Methanol (Power-to-X)', tonnes: 385.4, percentage: 45.3 },
          { pathway: 'Shore Power Grid Residual', tonnes: 15.0, percentage: 1.8 }
        ],
        key_drivers: [
          'High green fuel blending slashes Well-to-Wake CO2e by 75.1% vs fossil baseline.',
          'Cruising speed reduced to 13.2 knots inside ECA zones, reducing hydrodynamic propulsion power by 18.4%.',
          'Berth cold-ironing at Singapore, Rotterdam, and LA eliminates 98 tonnes of portside PM2.5 and NOx.',
          'EU-ETS carbon allowance expenditure drops from $128k to under $18k due to verified low-carbon feedstock credits.'
        ],
        counterfactual_analysis: [
          {
            question: 'Why not deploy IMO9811009 on the Transatlantic route?',
            explanation: 'Vessel draft of 15.5m exceeds New York channel depth limit (14.2m) by 1.3m, violating safety clearance constraints.'
          },
          {
            question: 'Why not run at maximum continuous rating (22.5 knots)?',
            explanation: 'Cubic power curve ($P \\propto v^{3.15}$) increases bunker consumption by 48.7%, triggering tank fuel depletion before reaching Singapore bunkering hub.'
          }
        ]
      };
    } else if (isCost) {
      return {
        plan_id: solutionId,
        summary: 'Cost-Minimized Operational Profile utilizing dual-fuel LNG with strategic intermediate bunkering at discount hubs.',
        cost_breakdown: [
          { component: 'Bunker Fuel (LNG + MGO)', amount: 648000, percentage: 52.0 },
          { component: 'Port Handling & Anchorage', amount: 180000, percentage: 14.5 },
          { component: 'Bunker Contracting', amount: 215000, percentage: 17.3 },
          { component: 'EU-ETS Carbon Allowances', amount: 128000, percentage: 10.3 },
          { component: 'Delay Penalties', amount: 60000, percentage: 4.8 },
          { component: 'OPS Shore Power', amount: 14000, percentage: 1.1 }
        ],
        emissions_breakdown: [
          { pathway: 'Marine Gas Oil (MGO)', tonnes: 1850.2, percentage: 54.1 },
          { pathway: 'Fossil LNG (with Methane Slip)', tonnes: 1530.3, percentage: 44.7 },
          { pathway: 'Quayside Auxiliary Electricity', tonnes: 40.0, percentage: 1.2 }
        ],
        key_drivers: [
          'Dual-fuel LNG delivers the lowest total voyage cost ($1.245M) due to fossil gas price advantage ($680/t vs $1450/t green e-fuels).',
          'Vessels transit open ocean at optimal SFOC engine load (76% MCR, 14.2 knots).',
          'Higher EU-ETS liabilities ($128,000) incurred as fossil emissions exceed FuelEU baseline targets.'
        ],
        counterfactual_analysis: [
          {
            question: 'Why not bunker 100% of fuel in Rotterdam instead of Singapore?',
            explanation: 'Singapore LNG spot benchmark is $680/t vs Rotterdam $740/t; split bunkering saves $27,000 in fuel procurement.'
          },
          {
            question: 'Why wasn\'t HFO selected?',
            explanation: 'HFO is prohibited inside designated North Sea & Baltic ECA waters without exhaust gas scrubbers, which assigned vessels lack.'
          }
        ]
      };
    } else {
      return {
        plan_id: solutionId,
        summary: 'Pareto-Optimal Balanced Transition Strategy combining Bio-Methanol and Bio-LNG with robust weather routing.',
        cost_breakdown: [
          { component: 'Bio-Fuels (Bio-MeOH + Bio-LNG)', amount: 840000, percentage: 60.9 },
          { component: 'Bunkering Procurement', amount: 210000, percentage: 15.2 },
          { component: 'Port Charges', amount: 180000, percentage: 13.0 },
          { component: 'EU-ETS Allowances', amount: 72000, percentage: 5.2 },
          { component: 'Delay Buffer', amount: 60000, percentage: 4.3 },
          { component: 'OPS Power', amount: 18000, percentage: 1.3 }
        ],
        emissions_breakdown: [
          { pathway: 'Bio-Methanol (Waste Feedstock)', tonnes: 1200.0, percentage: 55.8 },
          { pathway: 'Bio-LNG (Anaerobic Digestion)', tonnes: 925.0, percentage: 43.0 },
          { pathway: 'Port Berth Grid', tonnes: 25.0, percentage: 1.2 }
        ],
        key_drivers: [
          'Achieves 37.1% GHG reduction at a modest 10.8% cost increment over pure fossil operations.',
          'Full FuelEU Maritime compliance through 2035 pooling surplus without penalty.',
          'Resilient 0.98 ETA reliability maintained across all 6 weather perturbation scenarios.'
        ],
        counterfactual_analysis: [
          {
            question: 'Why not switch IMO9811002 to 100% Ammonia?',
            explanation: 'IMO9811002 lacks cryogenic ammonia tank insulation and toxic slip absorption systems.'
          },
          {
            question: 'Can speed be dropped to 10 knots?',
            explanation: 'Dropping to 10 knots breaches the 620-hour arrival deadline by 44 hours, triggering $180,000 in contractual late cargo liquidated damages.'
          }
        ]
      };
    }
  }

  getVoyageReplayData(voyageId: string) {
    const waypoints = [
      { step: 0, lat: 1.29, lon: 103.85, name: 'Singapore Departure', actual_speed: 15.2, opt_speed: 14.0, actual_fuel: 48.5, opt_fuel: 39.2, cum_actual_co2: 0, cum_opt_co2: 0 },
      { step: 1, lat: 5.95, lon: 95.20, name: 'Malacca Strait Transit', actual_speed: 16.0, opt_speed: 13.8, actual_fuel: 54.2, opt_fuel: 38.0, cum_actual_co2: 150, cum_opt_co2: 118 },
      { step: 2, lat: 8.50, lon: 77.00, name: 'Indian Ocean Fairway', actual_speed: 15.8, opt_speed: 14.2, actual_fuel: 52.8, opt_fuel: 41.5, cum_actual_co2: 480, cum_opt_co2: 385 },
      { step: 3, lat: 11.80, lon: 51.50, name: 'Gulf of Aden Corridor', actual_speed: 16.5, opt_speed: 14.5, actual_fuel: 58.0, opt_fuel: 43.0, cum_actual_co2: 950, cum_opt_co2: 760 },
      { step: 4, lat: 27.80, lon: 34.30, name: 'Red Sea Transit', actual_speed: 14.8, opt_speed: 13.5, actual_fuel: 46.0, opt_fuel: 37.0, cum_actual_co2: 1420, cum_opt_co2: 1120 },
      { step: 5, lat: 31.20, lon: 32.30, name: 'Suez Canal Convoy', actual_speed: 8.5, opt_speed: 8.5, actual_fuel: 18.0, opt_fuel: 18.0, cum_actual_co2: 1610, cum_opt_co2: 1280 },
      { step: 6, lat: 36.20, lon: -5.30, name: 'Strait of Gibraltar (ECA Ingress)', actual_speed: 15.5, opt_speed: 13.2, actual_fuel: 51.0, opt_fuel: 36.5, cum_actual_co2: 2350, cum_opt_co2: 1840 },
      { step: 7, lat: 48.50, lon: -5.00, name: 'English Channel', actual_speed: 15.0, opt_speed: 13.0, actual_fuel: 49.0, opt_fuel: 35.0, cum_actual_co2: 2780, cum_opt_co2: 2150 },
      { step: 8, lat: 51.95, lon: 4.14, name: 'Rotterdam Berth (Cold-Ironing)', actual_speed: 0.0, opt_speed: 0.0, actual_fuel: 5.5, opt_fuel: 0.0, cum_actual_co2: 3120, cum_opt_co2: 2340 }
    ];

    return {
      voyage_id: voyageId,
      vessel_id: 'IMO9811001',
      vessel_name: 'Atlantic Pioneer (20,000 TEU)',
      route_name: 'Asia-Europe Mega Loop (CNSHA -> NLRTM)',
      provenance: 'simulated' as const,
      summary: {
        distance_nm: 10500,
        actual_transit_hours: 582,
        opt_transit_hours: 618,
        actual_fuel_tonnes: 1012.5,
        opt_fuel_tonnes: 824.0,
        fuel_savings_tonnes: 188.5,
        fuel_savings_pct: 18.6,
        actual_ghg_wtw_tonnes: 3180.0,
        opt_ghg_wtw_tonnes: 2420.0,
        ghg_abated_tonnes: 760.0,
        ghg_abatement_pct: 23.9,
        cost_savings_usd: 142000
      },
      waypoints
    };
  }
}

export const api = new ApiService();
