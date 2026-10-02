import React from 'react';
import type { LucideIcon} from 'lucide-react';
import { ProvenanceBadge} from './ProvenanceBadge';
import type { Provenance} from '../types';

interface Props {
 title: string;
 value: string | number;
 unit?: string;
 subtitle?: string;
 icon?: LucideIcon;
 trend?: {
 value: string;
 isPositive?: boolean;
 label?: string;
};
 provenance: Provenance;
 isPlaceholder?: boolean;
 accentColor?: 'cyan' | 'emerald' | 'amber' | 'indigo' | 'rose';
}

export const KpiCard: React.FC<Props> = ({
 title,
 value,
 unit,
 subtitle,
 icon: Icon,
 trend,
 provenance,
 isPlaceholder = false,
 accentColor = 'cyan'
}) => {
 const borderAccents = {
 cyan: 'hover:border-cyan-500/40',
 emerald: 'hover:border-emerald-500/40',
 amber: 'hover:border-amber-500/40',
 indigo: 'hover:border-indigo-500/40',
 rose: 'hover:border-rose-500/40',
}[accentColor];

 const iconColors = {
 cyan: 'text-primary bg-cyan-950/40 border-cyan-800/40',
 emerald: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
 amber: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
 indigo: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40',
 rose: 'text-rose-400 bg-rose-950/40 border-rose-800/40',
}[accentColor];

 return (
 <div className={`glass-card rounded-xl p-4 transition-all duration-200 border border-border/80 ${borderAccents} relative overflow-hidden group`}>
 {/* Background glow flare on hover */}
 <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />

 <div className="flex items-start justify-between gap-2 mb-2">
 <div className="flex items-center gap-2">
 {Icon && (
 <div className={`p-2 rounded-lg border ${iconColors}`}>
 <Icon className="w-4 h-4" />
 </div>
 )}
 <span className="text-xs font-medium text-text-muted tabular-nums">
 {title}
 </span>
 </div>
 <ProvenanceBadge provenance={provenance} />
 </div>

 <div className="mt-2 flex items-baseline gap-1.5">
 <span className="text-2xl font-bold tabular-nums text-text-muted">
 {isPlaceholder ? '—' : value}
 </span>
 {unit && !isPlaceholder && (
 <span className="text-xs text-text-muted tabular-nums font-medium">{unit}</span>
 )}
 </div>

 <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-border/50">
 {trend ? (
 <div className="flex items-center gap-1 tabular-nums">
 <span className={trend.isPositive ? 'text-emerald-400' : 'text-primary'}>
 {trend.value}
 </span>
 {trend.label && <span className="text-text-muted text-[11px]">{trend.label}</span>}
 </div>
 ) : subtitle ? (
 <span className="text-text-muted text-[11px] font-sans truncate">{subtitle}</span>
 ) : (
 <span className="text-text-muted text-[10px] tabular-nums">LIVE DIGITAL TWIN</span>
 )}

 <div className="flex items-center gap-1 text-[10px] tabular-nums text-text-muted">
 <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
 <span>COMPUTED</span>
 </div>
 </div>
 </div>
 );
};
