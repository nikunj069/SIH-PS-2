import React from 'react';
import { 
 Compass, 
 Map, 
 Flame, 
 Activity, 
 Layers, 
 CloudLightning, 
 History, 
 Play, 
 Square,
 Cpu
} from 'lucide-react';

export type ScreenId = 'command' | 'twin-map' | 'fuels' | 'telemetry' | 'pareto' | 'storm' | 'replay';

interface Props {
 activeScreen: ScreenId;
 onSelectScreen: (screen: ScreenId) => void;
 isBackendLive: boolean;
 demoActive: boolean;
 demoStep: number;
 demoTotalSteps: number;
 onToggleDemo: () => void;
}

const navItems: { id: ScreenId; label: string; icon: React.FC<{ className?: string}>}[] = [
 { id: 'command', label: 'Fleet Command', icon: Compass},
 { id: 'twin-map', label: 'Twin Map', icon: Map},
 { id: 'fuels', label: 'Fuel Intelligence', icon: Flame},
 { id: 'telemetry', label: 'Optimizer Telemetry', icon: Activity},
 { id: 'pareto', label: 'Pareto Explorer', icon: Layers},
 { id: 'storm', label: 'Storm & What-If', icon: CloudLightning},
 { id: 'replay', label: 'Voyage Replay', icon: History},
];

export const Navbar: React.FC<Props> = ({
 activeScreen,
 onSelectScreen,
 isBackendLive,
 demoActive,
 demoStep,
 demoTotalSteps,
 onToggleDemo
}) => {
 return (
 <header className="sticky top-0 z-50 glass-panel border-b border-cyan-500/20 bg-[#060a17]/85 ">
 <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 {/* Brand Logo & Tag */}
 <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectScreen('command')}>
 <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600/30 to-emerald-600/20 border border-cyan-500/40 shadow-lg shadow-cyan-500/20">
 <Compass className="w-5 h-5 text-primary animate-spin-slow" />
 <div className="absolute inset-0 rounded-xl border border-cyan-400/20 animate-pulse-subtle" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="tabular-nums text-base font-extrabold bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
 Q-GREEN FLEET
 </span>
 <span className="text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-primary border border-cyan-500/30">
 v2.0
 </span>
 </div>
 <p className="text-[10px] tabular-nums text-text-muted hidden sm:block">
 Adaptive Maritime Digital Twin & Classical Quantum-Inspired Optimizer
 </p>
 </div>
 </div>

 {/* Navigation Tabs */}
 <nav className="hidden xl:flex items-center gap-1 bg-surface-alt/60 p-1 rounded-xl border border-border">
 {navItems.map((item) => {
 const Icon = item.icon;
 const isActive = activeScreen === item.id;
 return (
 <button
 key={item.id}
 onClick={() => onSelectScreen(item.id)}
 className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium tabular-nums transition-all duration-150 ${
 isActive
 ? 'bg-cyan-500/20 text-primary border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
 : 'text-text-muted hover:text-text-muted hover:bg-surface-alt/60'
}`}
 >
 <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
 <span>{item.label}</span>
 </button>
 );
})}
 </nav>

 {/* Right Action Bar */}
 <div className="flex items-center gap-3">
 {/* Judge Demo Button */}
 <button
 onClick={onToggleDemo}
 className={`flex items-center gap-2 px-3 py-1.5 rounded-lg tabular-nums text-xs font-semibold border transition-all duration-200 ${
 demoActive
 ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/20 animate-pulse'
 : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-md shadow-emerald-500/20'
}`}
 >
 {demoActive ? (
 <>
 <Square className="w-3.5 h-3.5 fill-current" />
 <span>Stop Demo ({demoStep}/{demoTotalSteps})</span>
 </>
 ) : (
 <>
 <Play className="w-3.5 h-3.5 fill-current" />
 <span>Judge Demo Flow (90s)</span>
 </>
 )}
 </button>

 {/* Backend Connectivity Status */}
 <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-alt/80 border border-border text-[11px] tabular-nums">
 <span
 className={`w-2 h-2 rounded-full ${
 isBackendLive ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-cyan-400 shadow-sm shadow-cyan-400'
}`}
 />
 <span className="text-text-muted">
 {isBackendLive ? 'FastAPI Connected' : 'Offline Mode (Sample Pack)'}
 </span>
 </div>

 {/* Reproducibility Seed Badge */}
 <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-border text-[11px] tabular-nums text-text-muted" title="Fixed RNG Seed for Deterministic Multi-Objective Reproducibility">
 <Cpu className="w-3 h-3 text-primary" />
 <span>Seed: <strong className="text-text-muted">42</strong></span>
 </div>
 </div>
 </div>
 </div>

 {/* Mobile/Tablet Secondary Nav Bar */}
 <div className="xl:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-border/80 gap-1 bg-[#060a17]/90">
 {navItems.map((item) => {
 const Icon = item.icon;
 const isActive = activeScreen === item.id;
 return (
 <button
 key={item.id}
 onClick={() => onSelectScreen(item.id)}
 className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium tabular-nums whitespace-nowrap ${
 isActive
 ? 'bg-cyan-500/20 text-primary border border-cyan-500/40'
 : 'text-text-muted hover:bg-surface-alt/60'
}`}
 >
 <Icon className="w-3.5 h-3.5" />
 <span>{item.label}</span>
 </button>
 );
})}
 </div>
 </header>
 );
};
