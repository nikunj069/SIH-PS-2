import React, { useState, useEffect } from 'react';
import { 
  Ship, 
  Leaf, 
  Anchor, 
  Zap, 
  ArrowUpRight, 
  Clock, 
  ChevronRight
} from 'lucide-react';
import type { Vessel, Route } from '../types';
import { api } from '../services/api';
import { KpiCard } from '../components/KpiCard';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

interface Props {
  onNavigate: (screen: any) => void;
}

export const FleetCommandCenter: React.FC<Props> = ({ onNavigate }) => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [vList, rList] = await Promise.all([api.getVessels(), api.getRoutes()]);
      setVessels(vList);
      setRoutes(rList);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredVessels = filterType === 'all' 
    ? vessels 
    : vessels.filter(v => v.vessel_type.toLowerCase().includes(filterType.toLowerCase()));

  const totalDwt = vessels.reduce((acc, v) => acc + v.dwt, 0);
  const opsCapableCount = vessels.filter(v => v.ops_capable).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm text-slate-400">Loading Fleet Telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Status Alert */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-cyan-500/20 bg-gradient-to-r from-marine-950 via-[#0a1228] to-marine-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs text-emerald-400 uppercase tracking-widest font-semibold">
                Autonomous Digital Twin Active
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-xs text-slate-400">
                Joint Fleet / Speed / Fuel / OPS Optimization Loop
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Maritime Fleet Command Center
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time synchronization of 12 commercial vessels across 4 global corridors. Physics-informed surrogate fuel models and classical quantum-inspired Pareto scheduling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('telemetry')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all"
            >
              <span>Optimize Fleet (Q-GREEN)</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('storm')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-medium transition-all"
            >
              <span>Simulate Storm Disruption</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Managed Fleet"
          value={vessels.length}
          unit="Vessels"
          subtitle={`${(totalDwt / 1000).toFixed(0)}k DWT Capacity`}
          icon={Ship}
          provenance="synthetic"
          accentColor="cyan"
          trend={{ value: '100%', isPositive: true, label: 'Operational' }}
        />
        <KpiCard
          title="Avg Fleet Carbon Intensity"
          value="4.82"
          unit="gCO₂e / dwt-nm"
          subtitle="FuelEU Maritime Target: 5.60"
          icon={Leaf}
          provenance="estimated"
          accentColor="emerald"
          trend={{ value: '-13.9%', isPositive: true, label: 'Below Cap' }}
        />
        <KpiCard
          title="ETA Schedule Reliability"
          value="98.2"
          unit="%"
          subtitle="Monte Carlo Across 6 Scenarios"
          icon={Clock}
          provenance="simulated"
          accentColor="indigo"
          trend={{ value: '+4.1%', isPositive: true, label: 'vs Baseline' }}
        />
        <KpiCard
          title="Shore Power (OPS) Ratio"
          value={`${opsCapableCount}/${vessels.length}`}
          unit="Capable"
          subtitle="Cold-Ironing Zero-Port Emission"
          icon={Zap}
          provenance="reported"
          accentColor="amber"
          trend={{ value: '75%', isPositive: true, label: 'Berth Ready' }}
        />
      </div>

      {/* Active Corridors Strip */}
      <div className="glass-card rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Active Strategic Trade Corridors</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">4 Global Fairways Synchronized</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {routes.map((route) => (
            <div
              key={route.route_id}
              onClick={() => onNavigate('twin-map')}
              className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  {route.route_id}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h3 className="text-xs font-medium text-slate-200 mt-1 line-clamp-1">{route.name}</h3>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{route.total_distance_nm.toLocaleString()} nm</span>
                <span className="text-emerald-400">{route.legs.length} Legs</span>
                <span>{route.deadline_hours}h max</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Asset Registry Table */}
      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Ship className="w-4 h-4 text-cyan-400" />
              Heterogeneous Fleet Asset Registry
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Calibrated physics exponents (n = 2.8 - 3.4) & multi-fuel compatibility matrices
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Filter:</span>
            {['all', 'Container', 'Bulk Carrier', 'Tanker'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono capitalize transition-all ${
                  filterType === type
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
                <th className="py-3 px-4 font-semibold">VESSEL ID</th>
                <th className="py-3 px-4 font-semibold">NAME & CLASS</th>
                <th className="py-3 px-4 font-semibold">DWT</th>
                <th className="py-3 px-4 font-semibold">SPEED RANGE</th>
                <th className="py-3 px-4 font-semibold">DRAFT</th>
                <th className="py-3 px-4 font-semibold">HULL EXP (n)</th>
                <th className="py-3 px-4 font-semibold">COMPATIBLE FUELS</th>
                <th className="py-3 px-4 font-semibold">OPS SHORE</th>
                <th className="py-3 px-4 font-semibold">PROVENANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredVessels.map((v) => (
                <tr key={v.vessel_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-cyan-400">{v.vessel_id}</td>
                  <td className="py-3 px-4">
                    <div className="font-sans font-medium text-slate-100">{v.name}</div>
                    <div className="text-[10px] text-slate-500">{v.vessel_class} · {v.vessel_type}</div>
                  </td>
                  <td className="py-3 px-4">{v.dwt.toLocaleString()} t</td>
                  <td className="py-3 px-4 text-slate-200">
                    {v.speed_min} - {v.speed_max} kts
                  </td>
                  <td className="py-3 px-4">{v.draft} m</td>
                  <td className="py-3 px-4">
                    <span className="text-amber-400">{v.hull_exponent.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {v.compatible_fuels.map(f => (
                        <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {v.ops_capable ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <Zap className="w-3 h-3 fill-emerald-400" /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[11px]">No</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <ProvenanceBadge provenance={v.provenance} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
