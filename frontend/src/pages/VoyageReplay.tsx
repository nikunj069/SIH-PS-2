import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Ship, 
  Fuel, 
  Leaf, 
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { KpiCard } from '../components/KpiCard';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

export const VoyageReplay: React.FC = () => {
  const [replayData, setReplayData] = useState<any>(null);
  const [activeStep, setActiveStep] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    const data = api.getVoyageReplayData('VOY-ASIA-EUR-2026-001');
    setReplayData(data);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying && replayData) {
      interval = setInterval(() => {
        setActiveStep(prev => {
          if (prev >= replayData.waypoints.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isPlaying, replayData]);

  if (!replayData) return null;

  const currentWp = replayData.waypoints[activeStep];
  const totalSteps = replayData.waypoints.length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 bg-gradient-to-r from-marine-950 via-[#0a1428] to-marine-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-semibold">
                Counterfactual Voyage Replay Engine
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-xs text-slate-400">
                AIS Baseline vs Physics+ML Optimal Profile
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Voyage Replay & Efficiency Audit
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Comparative analysis of historic actual voyage execution vs Q-GREEN counterfactual speed schedule, weather routing, and cold-ironing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause Replay' : 'Play Timeline'}</span>
            </button>
            <button
              onClick={() => { setActiveStep(0); setIsPlaying(false); }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
              title="Reset Timeline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Savings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Bunker Fuel Abatement"
          value={`-${replayData.summary.fuel_savings_tonnes}`}
          unit="Tonnes Fuel"
          subtitle={`${replayData.summary.fuel_savings_pct}% Net Reduction`}
          icon={Fuel}
          provenance="estimated"
          accentColor="emerald"
          trend={{ value: `-${replayData.summary.fuel_savings_pct}%`, isPositive: true }}
        />
        <KpiCard
          title="Lifecycle GHG Avoided"
          value={`-${replayData.summary.ghg_abated_tonnes}`}
          unit="t CO₂e"
          subtitle={`${replayData.summary.ghg_abatement_pct}% WtW GHG Reduction`}
          icon={Leaf}
          provenance="estimated"
          accentColor="cyan"
          trend={{ value: `-${replayData.summary.ghg_abatement_pct}%`, isPositive: true }}
        />
        <KpiCard
          title="Total Net Voyage Savings"
          value={`$${(replayData.summary.cost_savings_usd / 1000).toFixed(0)}k`}
          unit="USD"
          subtitle="Fuel + Carbon ETS Allowance Savings"
          icon={DollarSign}
          provenance="estimated"
          accentColor="amber"
          trend={{ value: 'Net Profit Boost', isPositive: true }}
        />
      </div>

      {/* Main Interactive Replay Dashboard */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white">{replayData.vessel_name}</span>
              <span className="text-slate-600">|</span>
              <span className="text-xs font-mono text-cyan-400">{replayData.route_name}</span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Waypoint {activeStep + 1} of {totalSteps}: <strong className="text-white">{currentWp.name}</strong>
            </p>
          </div>
          <ProvenanceBadge provenance="estimated" />
        </div>

        {/* Timeline Scrubber */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Singapore Departure (0h)</span>
            <span className="text-cyan-400 font-bold">Step {activeStep + 1} / {totalSteps}</span>
            <span>Rotterdam Berth (618h)</span>
          </div>

          <div className="relative w-full">
            <input
              type="range"
              min={0}
              max={totalSteps - 1}
              value={activeStep}
              onChange={(e) => setActiveStep(+e.target.value)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Waypoint Markers */}
          <div className="grid grid-cols-9 gap-1 text-center pt-1">
            {replayData.waypoints.map((wp: any, i: number) => (
              <div
                key={i}
                onClick={() => setActiveStep(i)}
                className={`cursor-pointer text-[10px] font-mono truncate p-1 rounded transition-colors ${
                  activeStep === i
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {wp.name.split(' ')[0]}
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Gauges at Current Waypoint */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Speed Schedule Comparison */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-cyan-400" />
                Vessel Cruising Speed at Waypoint
              </span>
              <span className="text-[10px] font-mono text-slate-400">Knots (SOG)</span>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Historic Actual:</span>
                  <span className="text-white font-bold">{currentWp.actual_speed} knots</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full"
                    style={{ width: `${(currentWp.actual_speed / 20) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-cyan-400 font-bold">Model Optimal:</span>
                  <span className="text-cyan-300 font-bold">{currentWp.opt_speed} knots</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full shadow-sm shadow-cyan-400"
                    style={{ width: `${(currentWp.opt_speed / 20) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] font-sans text-slate-400 pt-1">
              {currentWp.actual_speed > currentWp.opt_speed
                ? `Actual speed was ${(currentWp.actual_speed - currentWp.opt_speed).toFixed(1)} knots faster, driving fuel burn into the non-linear high SFOC range.`
                : currentWp.actual_speed === 0
                ? 'Vessel berthed: Shore-side OPS eliminates quayside diesel auxiliary burn completely.'
                : 'Optimal speed matches convoy canal restrictions.'}
            </p>
          </div>

          {/* Fuel Flow Comparison */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-emerald-400" />
                Instantaneous Fuel Consumption Rate
              </span>
              <span className="text-[10px] font-mono text-slate-400">Tonnes / Day</span>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Historic Actual:</span>
                  <span className="text-white font-bold">{currentWp.actual_fuel} t/day</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-rose-500/80 rounded-full"
                    style={{ width: `${(currentWp.actual_fuel / 60) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-emerald-400 font-bold">Model Optimal:</span>
                  <span className="text-emerald-300 font-bold">{currentWp.opt_fuel} t/day</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full shadow-sm shadow-emerald-400"
                    style={{ width: `${(currentWp.opt_fuel / 60) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs font-mono">
              <span className="text-slate-400">Cumulative GHG Diff:</span>
              <span className="text-emerald-400 font-bold">
                -{(currentWp.cum_actual_co2 - currentWp.cum_opt_co2)} t CO₂e Avoided
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
