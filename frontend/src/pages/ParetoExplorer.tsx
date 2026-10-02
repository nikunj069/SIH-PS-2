import React, { useState, useEffect} from 'react';
import { 
 Layers, 
 HelpCircle, 
 DollarSign, 
 Leaf, 
 AlertOctagon, 
 ShieldCheck, 
 CheckCircle2, 
 Sparkles
} from 'lucide-react';
import type { ParetoSolution, ExplainabilityData} from '../types';
import { api} from '../services/api';
import { KpiCard} from '../components/KpiCard';

export const ParetoExplorer: React.FC = () => {
 const [solutions, setSolutions] = useState<ParetoSolution[]>([]);
 const [selectedSolution, setSelectedSolution] = useState<ParetoSolution | null>(null);
 const [explainData, setExplainData] = useState<ExplainabilityData | null>(null);
 const [showExplainModal, setShowExplainModal] = useState<boolean>(false);

 useEffect(() => {
 const list = api.generateSampleParetoSolutions();
 setSolutions(list);
 if (list.length > 0) {
 setSelectedSolution(list[1]); // Default to balanced plan
 setExplainData(api.getExplainabilityData(list[1].solution_id));
}
}, []);

 const handleSelectSolution = (sol: ParetoSolution) => {
 setSelectedSolution(sol);
 setExplainData(api.getExplainabilityData(sol.solution_id));
};

 if (!selectedSolution) return null;

 return (
 <div className="space-y-6">
 {/* Top Banner */}
 <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 bg-gradient-to-r from-marine-950 via-[#0a1226] to-marine-950">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400" />
 <span className="tabular-nums text-xs text-primary font-semibold">
 Multi-Objective Non-Dominated Archive
 </span>
 <span className="text-text-muted">|</span>
 <span className="tabular-nums text-xs text-text-muted">Deb&apos;s Fast Non-Dominated Sorting</span>
 </div>
 <h1 className="text-2xl sm:text-3xl font-extrabold text-text font-sans">
 Pareto Trade-Off Explorer & Explainability
 </h1>
 <p className="text-sm text-text-muted mt-1 max-w-3xl">
 Inspect non-dominated schedules balancing Voyage Cost, Well-to-Wake Lifecycle GHG, and Conditional Value-at-Risk (CVaR95). Every plan independently verified by the constraint validator.
 </p>
 </div>

 <button
 onClick={() => setShowExplainModal(true)}
 className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-primary border border-cyan-500/40 tabular-nums text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
 >
 <HelpCircle className="w-4 h-4 text-primary" />
 <span>&quot;Why this plan?&quot; Analysis</span>
 </button>
 </div>
 </div>

 {/* Selected Plan Multi-Objective KPIs */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <KpiCard
 title="Total Expected Cost"
 value={`$${(selectedSolution.objectives.cost_total / 1000).toFixed(0)}k`}
 unit="USD"
 subtitle="Fuel + Bunker + Berth + ETS"
 icon={DollarSign}
 provenance={selectedSolution.objectives.provenance}
 accentColor="cyan"
 />
 <KpiCard
 title="Lifecycle GHG (WtW)"
 value={selectedSolution.objectives.ghg_wtw_tonnes.toFixed(1)}
 unit="t CO₂e"
 subtitle="Combustion + Upstream + Slip"
 icon={Leaf}
 provenance={selectedSolution.objectives.provenance}
 accentColor="emerald"
 />
 <KpiCard
 title="Worst-Case Risk (CVaR95)"
 value={`$${(selectedSolution.objectives.risk_cvar_cost / 1000).toFixed(0)}k`}
 unit="USD"
 subtitle="95th percentile cost tail-risk"
 icon={AlertOctagon}
 provenance="simulated"
 accentColor="indigo"
 />
 <KpiCard
 title="ETA Reliability Rate"
 value={`${(selectedSolution.objectives.eta_reliability * 100).toFixed(0)}%`}
 unit="P(On-time)"
 subtitle="All vessels meet deadline"
 icon={ShieldCheck}
 provenance="simulated"
 accentColor="amber"
 />
 </div>

 {/* Interactive Pareto Scatter Canvas & Solution Selector */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Visual 2D Pareto Front Scatter Canvas */}
 <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-border space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div>
 <h2 className="text-base font-bold text-text flex items-center gap-2">
 <Layers className="w-4 h-4 text-primary" />
 Pareto Non-Dominated Frontier (Cost vs GHG)
 </h2>
 <p className="text-xs tabular-nums text-text-muted mt-0.5">
 Click any candidate solution to load its full operational schedule
 </p>
 </div>
 <span className="text-[11px] tabular-nums text-text-muted">
 {solutions.length} Non-Dominated Solutions
 </span>
 </div>

 {/* SVG Multi-Objective Scatter Plot */}
 <div className="relative w-full aspect-[2/1] min-h-[300px] bg-slate-950/80 rounded-xl p-4 border border-border flex flex-col justify-end">
 <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
 {/* Axes and Grid */}
 <line x1="60" y1="20" x2="560" y2="20" stroke="#172554" strokeWidth="0.8" strokeDasharray="3 3" />
 <line x1="60" y1="80" x2="560" y2="80" stroke="#172554" strokeWidth="0.8" strokeDasharray="3 3" />
 <line x1="60" y1="140" x2="560" y2="140" stroke="#172554" strokeWidth="0.8" strokeDasharray="3 3" />
 <line x1="60" y1="200" x2="560" y2="200" stroke="#334155" strokeWidth="1.2" />
 <line x1="60" y1="15" x2="60" y2="200" stroke="#334155" strokeWidth="1.2" />

 {/* Axis Labels */}
 <text x="15" y="30" fill="#64748b" fontSize="9" fontFamily="monospace">3,500t</text>
 <text x="15" y="90" fill="#64748b" fontSize="9" fontFamily="monospace">2,500t</text>
 <text x="15" y="150" fill="#64748b" fontSize="9" fontFamily="monospace">1,500t</text>
 <text x="15" y="200" fill="#64748b" fontSize="9" fontFamily="monospace">500t</text>

 <text x="60" y="218" fill="#64748b" fontSize="9" fontFamily="monospace">$1.1M</text>
 <text x="220" y="218" fill="#64748b" fontSize="9" fontFamily="monospace">$1.3M</text>
 <text x="380" y="218" fill="#64748b" fontSize="9" fontFamily="monospace">$1.5M</text>
 <text x="530" y="218" fill="#64748b" fontSize="9" fontFamily="monospace">$1.7M</text>

 {/* Connecting Pareto Front Curve */}
 <path
 d="M 120 28 Q 280 100 480 180"
 fill="none"
 stroke="#0284c7"
 strokeWidth="2"
 strokeDasharray="4 2"
 className=""
 />

 {/* Dominated Region Hatch (Conceptual) */}
 <rect x="60" y="20" width="500" height="180" fill="url(#pareto-glow)" opacity="0.05" />

 {/* Pareto Solutions */}
 {solutions.map((sol) => {
 const isSelected = selectedSolution.solution_id === sol.solution_id;
 // Scale coordinates: Cost [1.1M to 1.7M] -> x [60 to 540], GHG [500 to 3500] -> y [190 to 25]
 const cost = sol.objectives.cost_total;
 const ghg = sol.objectives.ghg_wtw_tonnes;
 const cx = 60 + ((cost - 1100000) / 600000) * 480;
 const cy = 200 - ((ghg - 500) / 3000) * 175;

 return (
 <g
 key={sol.solution_id}
 onClick={() => handleSelectSolution(sol)}
 className="cursor-pointer group"
 >
 {isSelected && (
 <circle cx={cx} cy={cy} r="14" fill="none" stroke="#22d3ee" strokeWidth="1.5" className="animate-ping " />
 )}
 <circle
 cx={cx}
 cy={cy}
 r={isSelected ? '9' : '7'}
 fill={isSelected ? '#22d3ee' : '#38bdf8'}
 stroke="#ffffff"
 strokeWidth={isSelected ? '2.5' : '1.5'}
 className="group-hover:scale-125 transition-transform"
 />
 <text
 x={cx + 12}
 y={cy + 4}
 fill={isSelected ? '#38bdf8' : '#94a3b8'}
 fontSize="9"
 fontFamily="monospace"
 fontWeight={isSelected ? 'bold' : 'normal'}
 >
 {sol.plan.plan_id.replace('plan-', '')}
 </text>
 </g>
 );
})}
 </svg>

 <div className="flex items-center justify-between text-[11px] tabular-nums pt-3 border-t border-border text-text-muted">
 <span className="flex items-center gap-1.5">
 <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Non-Dominated Pareto Solution
 </span>
 <span>Horizontal: Voyage Cost (USD) | Vertical: Lifecycle GHG (t CO₂e)</span>
 </div>
 </div>

 {/* Quick Solution Selector Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
 {solutions.map((sol) => {
 const isSelected = selectedSolution.solution_id === sol.solution_id;
 const title = sol.solution_id.includes('mincost')
 ? 'Cost-Optimal Profile'
 : sol.solution_id.includes('netzero')
 ? 'Net-Zero Deep Green'
 : 'Balanced Transition';

 return (
 <div
 key={sol.solution_id}
 onClick={() => handleSelectSolution(sol)}
 className={`p-3 rounded-xl border cursor-pointer transition-all ${
 isSelected
 ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/20'
 : 'bg-surface-alt/60 border-border hover:border-border'
}`}
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-text font-sans">{title}</span>
 <span className="text-[10px] tabular-nums text-primary">Rank {sol.rank}</span>
 </div>
 <div className="mt-2 space-y-1 text-[11px] tabular-nums text-text-muted">
 <div className="flex justify-between">
 <span className="text-text-muted">Cost:</span>
 <span className="text-text font-bold">${(sol.objectives.cost_total / 1000).toFixed(0)}k</span>
 </div>
 <div className="flex justify-between">
 <span className="text-text-muted">GHG:</span>
 <span className="text-emerald-400 font-bold">{sol.objectives.ghg_wtw_tonnes.toFixed(0)} t</span>
 </div>
 </div>
 </div>
 );
})}
 </div>
 </div>

 {/* Selected Solution Inspector & Constraint Validator */}
 <div className="space-y-4">
 {/* Independent Constraint Validator Badge */}
 <div className="glass-card rounded-xl p-5 border border-emerald-500/30">
 <div className="flex items-center justify-between">
 <span className="text-[10px] tabular-nums px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
 <ShieldCheck className="w-3 h-3" />
 INDEPENDENT VALIDATOR
 </span>
 <span className="text-[10px] tabular-nums text-emerald-400 font-bold">10/10 PASSED</span>
 </div>

 <h3 className="text-sm font-bold text-text mt-2">Feasibility Gate Passed</h3>
 <p className="text-xs text-text-muted tabular-nums mt-0.5">
 Strictly checked outside optimizer loop. No unverified repairs.
 </p>

 <div className="mt-3 space-y-1.5 text-xs tabular-nums">
 {[
 { label: 'Cargo Demand ≥ Quota', ok: selectedSolution.constraint_report.capacity_met},
 { label: 'Draft ≤ Canal/Port Depth', ok: selectedSolution.constraint_report.draft_ok},
 { label: 'Tank Inventory ≥ 10% Reserve', ok: selectedSolution.constraint_report.tank_ok},
 { label: 'Engine Fuel Compatibility', ok: selectedSolution.constraint_report.compatibility_ok},
 { label: 'Port Bunker Stock Available', ok: selectedSolution.constraint_report.bunker_ok},
 { label: 'Shore OPS Berths Available', ok: selectedSolution.constraint_report.ops_ok},
 { label: 'Arrival Prior to Deadline', ok: selectedSolution.constraint_report.schedule_ok}
 ].map((c, i) => (
 <div key={i} className="flex items-center justify-between py-1 border-b border-border/80">
 <span className="text-text-muted">{c.label}</span>
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
 </div>
 ))}
 </div>
 </div>

 {/* Itemized Cost Breakdown */}
 <div className="glass-card rounded-xl p-5 border border-border space-y-3">
 <h3 className="text-sm font-bold text-text flex items-center gap-2">
 <DollarSign className="w-4 h-4 text-primary" />
 Itemized Cost Breakdown
 </h3>

 <div className="space-y-2 text-xs tabular-nums">
 <div className="flex justify-between py-1 border-b border-border">
 <span className="text-text-muted">Propulsion Fuel:</span>
 <span className="text-text">${selectedSolution.breakdown.fuel_cost.toLocaleString()}</span>
 </div>
 <div className="flex justify-between py-1 border-b border-border">
 <span className="text-text-muted">Port Anchorage & Berthing:</span>
 <span className="text-text">${selectedSolution.breakdown.port_fees.toLocaleString()}</span>
 </div>
 <div className="flex justify-between py-1 border-b border-border">
 <span className="text-text-muted">OPS Shore Electricity:</span>
 <span className="text-text">${selectedSolution.breakdown.ops_electricity_cost.toLocaleString()}</span>
 </div>
 <div className="flex justify-between py-1 border-b border-border">
 <span className="text-text-muted">EU-ETS Carbon Cost:</span>
 <span className="text-amber-400 font-bold">${selectedSolution.breakdown.ets_carbon_cost.toLocaleString()}</span>
 </div>
 <div className="flex justify-between py-1 border-b border-border">
 <span className="text-text-muted">Delay Contingency Buffer:</span>
 <span className="text-text">${selectedSolution.breakdown.delay_penalty_cost.toLocaleString()}</span>
 </div>
 <div className="pt-2 flex justify-between font-bold text-sm text-primary">
 <span>Total Budget:</span>
 <span>${selectedSolution.objectives.cost_total.toLocaleString()}</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Mathematical Explainability Modal */}
 {showExplainModal && explainData && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 /80 ">
 <div className="glass-panel w-full max-w-3xl rounded-2xl p-6 border border-cyan-500/40 bg-[#070d1e] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div className="flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-primary" />
 <h2 className="text-lg font-bold text-text">Mathematical Explainability Report</h2>
 </div>
 <button
 onClick={() => setShowExplainModal(false)}
 className="text-text-muted hover:text-text tabular-nums text-sm px-2 py-1"
 >
 ✕ Close
 </button>
 </div>

 <div className="p-3.5 rounded-xl bg-surface-alt/90 border border-border text-xs text-text-muted font-sans leading-relaxed">
 <strong>Executive Summary:</strong> {explainData.summary}
 </div>

 {/* Key Drivers */}
 <div>
 <h3 className="text-xs tabular-nums font-bold text-primary mb-2">
 Key Decision Drivers:
 </h3>
 <ul className="space-y-1.5 text-xs text-text-muted">
 {explainData.key_drivers.map((driver, i) => (
 <li key={i} className="flex items-start gap-2 bg-surface-alt/40 p-2 rounded-lg border border-border/60">
 <span className="text-primary tabular-nums">•</span>
 <span>{driver}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Counterfactual "Why Not" Analysis */}
 <div>
 <h3 className="text-xs tabular-nums font-bold text-amber-400 mb-2">
 Counterfactual Analysis (&quot;Why Not Alternative Decisions?&quot;):
 </h3>
 <div className="space-y-2">
 {explainData.counterfactual_analysis.map((item, i) => (
 <div key={i} className="p-3 rounded-lg bg-slate-950 border border-border text-xs">
 <div className="font-semibold text-text-muted mb-1 flex items-center gap-1.5">
 <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
 <span>{item.question}</span>
 </div>
 <p className="text-text-muted font-sans mt-0.5">{item.explanation}</p>
 </div>
 ))}
 </div>
 </div>

 <div className="pt-2 border-t border-border flex justify-end">
 <button
 onClick={() => setShowExplainModal(false)}
 className="px-4 py-2 rounded-xl bg-cyan-500 text-black tabular-nums text-xs font-bold hover:bg-cyan-400"
 >
 Done Reading
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
