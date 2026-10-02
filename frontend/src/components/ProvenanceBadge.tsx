import React from 'react';
import type { Provenance} from '../types';

interface Props {
 provenance: Provenance;
 showTooltip?: boolean;
 className?: string;
 size?: 'sm' | 'md';
}

const config: Record<Provenance, { label: string; bg: string; text: string; border: string; desc: string}> = {
 measured: {
 label: 'MEASURED',
 bg: 'bg-emerald-950/60',
 text: 'text-emerald-400',
 border: 'border-emerald-500/30',
 desc: 'Direct telemetry from vessel flowmeters, AIS transponders, or calibrated onboard sensors.'
},
 reported: {
 label: 'REPORTED',
 bg: 'bg-cyan-950/60',
 text: 'text-primary',
 border: 'border-cyan-500/30',
 desc: 'Statutory emissions data verified via THETIS-MRV, IMO DCS, or official port terminal logs.'
},
 estimated: {
 label: 'ESTIMATED',
 bg: 'bg-indigo-950/60',
 text: 'text-indigo-400',
 border: 'border-indigo-500/30',
 desc: 'Conformal quantile inference from physics-informed surrogate & CatBoost/HistGradient residual.'
},
 simulated: {
 label: 'SIMULATED',
 bg: 'bg-amber-950/60',
 text: 'text-amber-400',
 border: 'border-amber-500/30',
 desc: 'Derived from multi-scenario stochastic Monte Carlo simulation (CVaR95 & weather perturbations).'
},
 synthetic: {
 label: 'SYNTHETIC',
 bg: 'bg-rose-950/60',
 text: 'text-rose-400',
 border: 'border-rose-500/30',
 desc: 'Generated realistic operational baseline for offline verification and benchmarking.'
}
};

export const ProvenanceBadge: React.FC<Props> = ({ provenance, className = '', size = 'sm'}) => {
 const item = config[provenance] || config.synthetic;
 const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

 return (
 <span
 title={item.desc}
 className={`inline-flex items-center gap-1 tabular-nums font-semibold rounded-md border ${item.bg} ${item.text} ${item.border} ${sizeClasses} ${className}`}
 >
 <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-subtle" />
 {item.label}
 </span>
 );
};
