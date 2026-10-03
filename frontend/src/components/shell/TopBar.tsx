import React from 'react';
import { Menu } from 'lucide-react';

export interface TopBarProps {
  pageTitle: string;
  selectedScenario: string;
  onSelectScenario: (scenario: string) => void;
  isBackendLive?: boolean;
  onToggleMobileMenu: () => void;
  pageHint?: string;
}

const SCENARIO_EMOJI: Record<string, string> = {
  baseline:   '📋',
  storm:      '🌀',
  fuel_shock: '⚠️',
};

export const TopBar: React.FC<TopBarProps> = ({
  pageTitle,
  selectedScenario,
  onSelectScenario,
  isBackendLive = true,
  onToggleMobileMenu,
  pageHint,
}) => {
  const scenarios = [
    { id: 'baseline',   label: 'Baseline (Normal operations)' },
    { id: 'storm',      label: 'Monsoon storm disruption' },
    { id: 'fuel_shock', label: 'Fuel price shock (+20%)' },
  ];

  return (
    <header className="h-14 bg-white/90 backdrop-blur-2xl border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl lg:hidden cursor-pointer transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base font-bold text-[#0f172a] leading-none truncate">
            {pageTitle}
          </h1>
          {pageHint && (
            <p className="text-xs text-slate-400 truncate hidden sm:block mt-0.5 leading-none">{pageHint}</p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Scenario Selector */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-slate-300 transition-colors">
          <span className="text-slate-400 font-medium shrink-0 hidden md:block">Scenario:</span>
          <span>{SCENARIO_EMOJI[selectedScenario] ?? '📋'}</span>
          <select
            id="scenario-select"
            value={selectedScenario}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-transparent text-[#0f172a] font-semibold focus:outline-none cursor-pointer appearance-none max-w-[160px]"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Live status */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
            isBackendLive
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
          title={isBackendLive ? 'AI backend running on localhost:8000' : 'Offline demo mode'}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${isBackendLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span className="hidden sm:inline">{isBackendLive ? 'AI Live' : 'Demo'}</span>
        </div>

        {/* India badge */}
        <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 border border-orange-100 text-xs font-semibold text-orange-700">
          🇮🇳 <span className="hidden xl:inline">India Fleet</span>
        </div>
      </div>
    </header>
  );
};
