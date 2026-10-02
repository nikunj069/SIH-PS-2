import React, { useState, useEffect} from 'react';
import { Flame, Info} from 'lucide-react';
import type { FuelPathway} from '../types';
import { api} from '../services/api';
import { ProvenanceBadge} from '../components/ProvenanceBadge';
import { KpiCard} from '../components/KpiCard';

export const FuelIntelligence: React.FC = () => {
 const [fuels, setFuels] = useState<FuelPathway[]>([]);
 const [selectedPathway, setSelectedPathway] = useState<FuelPathway | null>(null);
 const [sortBy, setSortBy] = useState<'ci' | 'price' | 'density'>('ci');

 useEffect(() => {
 async function loadFuels() {
 const data = await api.getFuels();
 setFuels(data);
 if (data.length > 0) setSelectedPathway(data[0]);
}
 loadFuels();
}, []);

 const sortedFuels = [...fuels].sort((a, b) => {
 if (sortBy === 'ci') return a.wtw_gco2e_mj - b.wtw_gco2e_mj;
 if (sortBy === 'price') return a.price_per_t - b.price_per_t;
 return b.energy_density_mj_kg - a.energy_density_mj_kg;
});

 return (
 <div className="space-y-6">
 {/* Top Banner */}
 <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 bg-gradient-to-r from-marine-950 via-[#0b142d] to-marine-950">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />
 <span className="tabular-nums text-xs text-emerald-400 font-semibold">
 IMO Resolution MEPC.391(81) Compliant
 </span>
 <span className="text-text-muted">|</span>
 <span className="tabular-nums text-xs text-text-muted">
 10 Verified Lifecycle Pathways
 </span>
 </div>
 <h1 className="text-2xl sm:text-3xl font-extrabold text-text font-sans">
 Fuel Reality Engine & LCA Intelligence
 </h1>
 <p className="text-sm text-text-muted mt-1 max-w-3xl">
 Strict Well-to-Wake (WtT upstream + TtW combustion + CH4 methane slip + N2O) carbon intensity accounting. No superficial &quot;green fuel&quot; labeling: each pathway is evaluated by verified lifecycle greenhouse gas emissions.
 </p>
 </div>

 <div className="flex items-center gap-2 bg-surface-alt/80 p-1.5 rounded-xl border border-border">
 <span className="text-xs tabular-nums text-text-muted ml-2">Sort by:</span>
 {(['ci', 'price', 'density'] as const).map(mode => (
 <button
 key={mode}
 onClick={() => setSortBy(mode)}
 className={`px-3 py-1 rounded-lg text-xs tabular-nums transition-all ${
 sortBy === mode
 ? 'bg-cyan-500/20 text-primary border border-cyan-500/40'
 : 'text-text-muted hover:text-slate-200'
}`}
 >
 {mode === 'ci' ? 'Carbon Intensity' : mode === 'price' ? 'Price' : 'Energy'}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* KPI Summary Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <KpiCard
 title="Fossil Reference Benchmark (MGO)"
 value="91.1"
 unit="gCO₂e / MJ"
 subtitle="Baseline standard for IMO & EU-ETS"
 provenance="reported"
 accentColor="amber"
 />
 <KpiCard
 title="Lowest Carbon Pathway (Green NH3)"
 value="9.8"
 unit="gCO₂e / MJ"
 subtitle="-89.2% lifecycle carbon abatement"
 provenance="reported"
 accentColor="emerald"
 trend={{ value: '-89.2%', isPositive: true}}
 />
 <KpiCard
 title="Green Premium Spread"
 value="$1,450 vs $680"
 unit="USD / t"
 subtitle="E-Methanol vs Fossil Dual-Fuel LNG"
 provenance="reported"
 accentColor="cyan"
 />
 </div>

 {/* Main Comparison Grid & Detailed Inspector */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Pathway List with Bar Charts */}
 <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-border space-y-3">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <h2 className="text-base font-bold text-text flex items-center gap-2">
 <Flame className="w-4 h-4 text-primary" />
 Verified Marine Fuel Pathways (WtW Lifecycle)
 </h2>
 <span className="text-xs tabular-nums text-text-muted">100-yr IMO GWP Horizon</span>
 </div>

 <div className="space-y-3 pt-2">
 {sortedFuels.map(f => {
 const isSelected = selectedPathway?.pathway_id === f.pathway_id;
 const wtw = f.wtw_gco2e_mj;
 const maxWtw = 95.0;
 const pct = Math.min(100, Math.max(5, (wtw / maxWtw) * 100));

 // Colors based on carbon intensity
 const barColor = wtw < 25 ? 'bg-emerald-400' : wtw < 60 ? 'bg-cyan-400' : wtw < 85 ? 'bg-amber-400' : 'bg-rose-500';

 return (
 <div
 key={f.pathway_id}
 onClick={() => setSelectedPathway(f)}
 className={`p-3 rounded-xl border transition-all cursor-pointer ${
 isSelected
 ? 'bg-slate-800/80 border-cyan-500 shadow-md shadow-cyan-500/10'
 : 'bg-surface-alt/50 border-border/80 hover:border-border'
}`}
 >
 <div className="flex items-center justify-between mb-1.5">
 <div className="flex items-center gap-2">
 <span className="tabular-nums text-xs font-bold text-text">{f.name}</span>
 <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-slate-800 text-text-muted">
 {f.feedstock}
 </span>
 </div>
 <div className="flex items-center gap-3">
 <span className="tabular-nums text-xs font-bold text-primary">
 ${f.price_per_t}/t
 </span>
 <span className="tabular-nums text-xs font-extrabold text-text">
 {f.wtw_gco2e_mj.toFixed(1)} <span className="text-[10px] text-text-muted font-normal">g/MJ</span>
 </span>
 </div>
 </div>

 {/* Visual Carbon Intensity Bar */}
 <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden relative">
 <div
 className={`h-full rounded-full ${barColor} transition-all duration-500`}
 style={{ width: `${pct}%`}}
 />
 </div>

 <div className="flex items-center justify-between mt-2 text-[10px] tabular-nums text-text-muted">
 <span>LHV: {f.energy_density_mj_kg} MJ/kg</span>
 <span>Tank Volume Penalty: {f.tank_volume_penalty.toFixed(2)}x</span>
 <ProvenanceBadge provenance={f.provenance} />
 </div>
 </div>
 );
})}
 </div>
 </div>

 {/* Selected Pathway Deep-Dive Card */}
 {selectedPathway && (
 <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-[10px] tabular-nums px-2 py-0.5 rounded bg-cyan-950 text-primary border border-cyan-800">
 PATHWAY LCA BREAKDOWN
 </span>
 <ProvenanceBadge provenance={selectedPathway.provenance} />
 </div>

 <div>
 <h2 className="text-xl font-bold text-text">{selectedPathway.name}</h2>
 <p className="text-xs tabular-nums text-primary">{selectedPathway.pathway_id}</p>
 </div>

 <div className="p-3.5 rounded-xl bg-surface-alt/80 border border-border space-y-2 text-xs tabular-nums">
 <div className="flex justify-between py-1 border-b border-border">
 <span className="text-text-muted">Feedstock Origin:</span>
 <span className="text-text capitalize">{selectedPathway.feedstock.replace('_', ' ')}</span>
 </div>
 <div className="flex justify-between py-1 border-b border-border">
 <span className="text-text-muted">Benchmark Price:</span>
 <span className="text-emerald-400 font-bold">${selectedPathway.price_per_t} / tonne</span>
 </div>
 <div className="flex justify-between py-1 border-b border-border">
 <span className="text-text-muted">Energy Density (LHV):</span>
 <span className="text-text">{selectedPathway.energy_density_mj_kg} MJ/kg</span>
 </div>
 <div className="flex justify-between py-1 border-b border-border">
 <span className="text-text-muted">Storage Vol. Penalty:</span>
 <span className="text-amber-400 font-bold">{selectedPathway.tank_volume_penalty}x vs MDO</span>
 </div>
 </div>

 {/* Well-to-Wake Emission Components */}
 <div className="space-y-2">
 <span className="text-xs tabular-nums font-semibold text-text-muted block">
 Lifecycle Emissions Arithmetic:
 </span>

 <div className="p-3 rounded-lg bg-slate-950 border border-border space-y-2 text-xs tabular-nums">
 <div className="flex justify-between items-center text-text-muted">
 <span>Well-to-Tank (Upstream WtT):</span>
 <span className="text-primary font-bold">{selectedPathway.wtt_gco2e_mj.toFixed(1)} g/MJ</span>
 </div>
 <div className="flex justify-between items-center text-text-muted">
 <span>Direct Tank-to-Wake CO₂:</span>
 <span className="text-text">{selectedPathway.ttw_co2} g/gFuel</span>
 </div>
 <div className="flex justify-between items-center text-text-muted">
 <span>Methane Slip (GWP 28):</span>
 <span className="text-amber-300">{selectedPathway.ttw_ch4_slip} gCH₄/g</span>
 </div>
 <div className="flex justify-between items-center text-text-muted">
 <span>Nitrous Oxide N₂O (GWP 265):</span>
 <span className="text-text-muted">{selectedPathway.ttw_n2o} gN₂O/g</span>
 </div>
 <div className="pt-2 border-t border-border flex justify-between items-center font-bold text-text text-sm">
 <span>Net WtW Intensity:</span>
 <span className="text-emerald-400">{selectedPathway.wtw_gco2e_mj.toFixed(1)} gCO₂e/MJ</span>
 </div>
 </div>
 </div>

 {/* Official Source Reference Citation */}
 <div className="p-3 rounded-lg bg-surface-alt/60 border border-border text-[11px] tabular-nums text-text-muted">
 <div className="flex items-center gap-1.5 text-text-muted mb-1">
 <Info className="w-3.5 h-3.5 text-primary" />
 <span className="font-semibold">Statutory Reference</span>
 </div>
 <p className="text-text-muted">{selectedPathway.source_ref}</p>
 </div>
 </div>
 )}
 </div>
 </div>
 );
};
