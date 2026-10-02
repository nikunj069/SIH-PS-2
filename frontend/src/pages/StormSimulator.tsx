import React, { useState, useEffect} from 'react';
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
import type { Scenario} from '../types';
import { api} from '../services/api';
import { KpiCard} from '../components/KpiCard';
import { ProvenanceBadge} from '../components/ProvenanceBadge';

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
 <span className="tabular-nums text-xs text-amber-400 font-semibold">
 Dynamic Resilience & Warm-Start Re-Optimizer
 </span>
 <span className="text-text-muted">|</span>
 <span className="tabular-nums text-xs text-text-muted">Target Time &lt; 2.0s</span>
 </div>
 <h1 className="text-2xl sm:text-3xl font-extrabold text-text font-sans flex items-center gap-2">
 <CloudLightning className="w-7 h-7 text-amber-400" />
 What-If & Storm Disruption Simulator
 </h1>
 <p className="text-sm text-text-muted mt-1 max-w-3xl">
 Inject sudden maritime disruptions (typhoon wave surges, Suez canal lockouts, bunkering stock-outs). The warm-started Q-GREEN re-optimizer repairs schedules in under 2 seconds.
 </p>
 </div>

 <button
 onClick={triggerRapidReoptimization}
 disabled={isReoptimizing}
 className={`flex items-center gap-2 px-5 py-3 rounded-xl tabular-nums text-xs font-bold transition-all ${
 isReoptimizing
 ? 'bg-surface-alt text-text-muted cursor-not-allowed'
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
 onClick={() => { setSelectedScenario(sc); setReoptComplete(false);}}
 className={`p-4 rounded-xl border cursor-pointer transition-all ${
 isSelected
 ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-500/10'
 : 'bg-surface-alt/60 border-border hover:border-border'
}`}
 >
 <div className="flex items-center justify-between">
 <span className="text-xs tabular-nums font-bold text-amber-400 ">
 {sc.scenario_type.replace('_', ' ')}
 </span>
 <span className="text-[10px] tabular-nums text-text-muted">P = {(sc.probability * 100).toFixed(0)}%</span>
 </div>
 <h3 className="text-sm font-semibold text-text mt-1.5">{sc.name}</h3>
 <p className="text-[11px] text-text-muted font-sans mt-1 line-clamp-2">{sc.description}</p>
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
 trend={{ value: '4.2x Faster', isPositive: true, label: 'vs Cold Start'}}
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
 trend={{ value: '-81.5% Loss', isPositive: true}}
 />
 </div>

 {/* Before vs After Re-Plan Analysis */}
 <div className="glass-panel rounded-2xl p-6 border border-border space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div>
 <h2 className="text-base font-bold text-text flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-amber-400" />
 Dynamic Action Plan Comparison (Pre-Disruption vs Warm-Start Recovery)
 </h2>
 <p className="text-xs tabular-nums text-text-muted mt-0.5">
 Automated hydrodynamic speed de-escalation, intermediate bunkering swap, and schedule recovery
 </p>
 </div>
 <ProvenanceBadge provenance="simulated" />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
 {/* Pre-Disruption Plan */}
 <div className="p-4 rounded-xl bg-surface-alt/60 border border-border space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs tabular-nums font-bold text-text-muted">INITIAL OPTIMAL BASELINE</span>
 <span className="text-[10px] tabular-nums px-2 py-0.5 rounded bg-surface-alt text-text-muted">
 Pre-Disruption
 </span>
 </div>

 <div className="space-y-2 text-xs tabular-nums">
 <div className="flex justify-between py-1.5 border-b border-border/80">
 <span className="text-text-muted">Fleet Cruising Speed:</span>
 <span className="text-text font-bold">14.8 knots</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border/80">
 <span className="text-text-muted">Storm Route Passage:</span>
 <span className="text-rose-400">Direct Fairway (Severe Wave Drag)</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border/80">
 <span className="text-text-muted">Bunkering Terminal:</span>
 <span className="text-text">Port Congestion Hub (48h queue)</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border/80">
 <span className="text-text-muted">Estimated Total Cost:</span>
 <span className="text-text font-bold">$1,245,000</span>
 </div>
 <div className="flex justify-between py-1.5">
 <span className="text-text-muted">ETA Reliability:</span>
 <span className="text-rose-400 font-bold">71.4% (Severe Risk of Breach)</span>
 </div>
 </div>
 </div>

 {/* Warm-Started Adaptive Recovery Plan */}
 <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40 space-y-3 shadow-lg shadow-cyan-500/5">
 <div className="flex items-center justify-between">
 <span className="text-xs tabular-nums font-bold text-primary flex items-center gap-1.5">
 <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
 ADAPTIVE WARM-STARTED RE-PLAN
 </span>
 <span className="text-[10px] tabular-nums px-2 py-0.5 rounded bg-cyan-950 text-primary border border-cyan-800">
 Solved in {reoptComplete ? `${reoptTime}s` : '0.84s'}
 </span>
 </div>

 <div className="space-y-2 text-xs tabular-nums">
 <div className="flex justify-between py-1.5 border-b border-border/80">
 <span className="text-text-muted">Speed Reschedule:</span>
 <span className="text-emerald-400 font-bold">12.6 kts (Storm) → 15.2 kts (Tailwind)</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border/80">
 <span className="text-text-muted">Hydrodynamic Rerouting:</span>
 <span className="text-primary">Southern Archipelagic Bypass (-35% Wave Drag)</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border/80">
 <span className="text-text-muted">Dynamic Bunkering Swap:</span>
 <span className="text-emerald-400 font-bold">Redirect to Alternate Terminal</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border/80">
 <span className="text-text-muted">Adjusted Total Cost:</span>
 <span className="text-text font-bold">$1,279,200 (+2.7% minimal delta)</span>
 </div>
 <div className="flex justify-between py-1.5">
 <span className="text-text-muted">Restored ETA Reliability:</span>
 <span className="text-emerald-400 font-bold">97.8% (Contract Protected)</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
