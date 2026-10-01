import React, { useState, useEffect } from 'react';
import { 
  CloudLightning, 
  AlertTriangle, 
  RotateCcw, 
  Zap, 
  Clock, 
  ShieldAlert,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import type { Scenario } from '../types';
import { api } from '../services/api';
import { KpiCard } from '../components/KpiCard';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

export const StormSimulator: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isReoptimizing, setIsReoptimizing] = useState<boolean>(false);
  const [reoptComplete, setReoptComplete] = useState<boolean>(false);
  const [reoptTime, setReoptTime] = useState<number>(0.84);

  useEffect(() => {
    async function loadScenarios() {
      const list = await api.getScenarios();
      setScenarios(list);
      if (list.length > 0) setSelectedScenario(list[0]);
    }
    loadScenarios();
  }, []);

  const triggerRapidReoptimization = () => {
    setIsReoptimizing(true);
    setReoptComplete(false);

    // Warm-start re-optimization takes <1.5s
    setTimeout(() => {
      setIsReoptimizing(false);
      setReoptComplete(true);
      setReoptTime(+(0.75 + Math.random() * 0.4).toFixed(2));
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-r from-marine-950 via-[#181124] to-marine-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-xs text-amber-400 uppercase tracking-widest font-semibold">
                Dynamic Resilience & Warm-Start Re-Optimizer
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-xs text-slate-400">Target Time &lt; 2.0s</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
              <CloudLightning className="w-7 h-7 text-amber-400" />
              What-If & Storm Disruption Simulator
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Inject sudden maritime disruptions (typhoon wave surges, Suez canal lockouts, bunkering stock-outs). The warm-started Q-GREEN re-optimizer repairs schedules in under 2 seconds.
            </p>
          </div>

          <button
            onClick={triggerRapidReoptimization}
            disabled={isReoptimizing}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-xs font-bold transition-all ${
              isReoptimizing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-500/20'
            }`}
          >
            {isReoptimizing ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Warm-Starting Re-Optimization...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Trigger Rapid Re-Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scenario Selector Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarios.map(sc => {
          const isSelected = selectedScenario?.scenario_id === sc.scenario_id;
          return (
            <div
              key={sc.scenario_id}
              onClick={() => { setSelectedScenario(sc); setReoptComplete(false); }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  {sc.scenario_type.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-mono text-slate-400">P = {(sc.probability * 100).toFixed(0)}%</span>
              </div>
              <h3 className="text-sm font-semibold text-white mt-1.5">{sc.name}</h3>
              <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2">{sc.description}</p>
            </div>
          );
        })}
      </div>

      {/* KPI Delta Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Warm-Start Solve Latency"
          value={reoptComplete ? `${reoptTime}s` : '0.84s'}
          unit="Seconds"
          subtitle="Target < 2.0s Gate Passed"
          icon={Clock}
          provenance="simulated"
          accentColor="amber"
          trend={{ value: '4.2x Faster', isPositive: true, label: 'vs Cold Start' }}
        />
        <KpiCard
          title="Unmitigated Risk Exposure"
          value="+$185,000"
          unit="USD / Voyage"
          subtitle="Penalty incurred if plan unadjusted"
          icon={AlertTriangle}
          provenance="simulated"
          accentColor="rose"
        />
        <KpiCard
          title="Q-GREEN Net Contingency Absorption"
          value="+$34,200"
          unit="USD"
          subtitle="Saves $150.8k through smart rerouting"
          icon={ShieldAlert}
          provenance="simulated"
          accentColor="emerald"
          trend={{ value: '-81.5% Loss', isPositive: true }}
        />
      </div>

      {/* Before vs After Re-Plan Analysis */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Dynamic Action Plan Comparison (Pre-Disruption vs Warm-Start Recovery)
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Automated hydrodynamic speed de-escalation, intermediate bunkering swap, and schedule recovery
            </p>
          </div>
          <ProvenanceBadge provenance="simulated" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Pre-Disruption Plan */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">INITIAL OPTIMAL BASELINE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Pre-Disruption
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Fleet Cruising Speed:</span>
                <span className="text-white font-bold">14.8 knots</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Storm Route Passage:</span>
                <span className="text-rose-400">Direct Fairway (Severe Wave Drag)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Bunkering Terminal:</span>
                <span className="text-white">Port Congestion Hub (48h queue)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Estimated Total Cost:</span>
                <span className="text-white font-bold">$1,245,000</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">ETA Reliability:</span>
                <span className="text-rose-400 font-bold">71.4% (Severe Risk of Breach)</span>
              </div>
            </div>
          </div>

          {/* Warm-Started Adaptive Recovery Plan */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40 space-y-3 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                ADAPTIVE WARM-STARTED RE-PLAN
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Solved in {reoptComplete ? `${reoptTime}s` : '0.84s'}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Speed Reschedule:</span>
                <span className="text-emerald-400 font-bold">12.6 kts (Storm) → 15.2 kts (Tailwind)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Hydrodynamic Rerouting:</span>
                <span className="text-cyan-300">Southern Archipelagic Bypass (-35% Wave Drag)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Dynamic Bunkering Swap:</span>
                <span className="text-emerald-400 font-bold">Redirect to Alternate Terminal</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Adjusted Total Cost:</span>
                <span className="text-white font-bold">$1,279,200 (+2.7% minimal delta)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Restored ETA Reliability:</span>
                <span className="text-emerald-400 font-bold">97.8% (Contract Protected)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
