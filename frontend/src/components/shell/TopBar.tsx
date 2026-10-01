import React from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import { ViewModeSwitch, type ViewMode } from '../common/ViewModeSwitch';
import { Tooltip } from '../common/Tooltip';
import { copy } from '../../copy/en';

export interface TopBarProps {
  pageTitle: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedScenario: string;
  onSelectScenario: (scenario: string) => void;
  isBackendLive?: boolean;
  onToggleMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  pageTitle,
  viewMode,
  onViewModeChange,
  selectedScenario,
  onSelectScenario,
  isBackendLive = true,
  onToggleMobileMenu,
}) => {
  const scenarios = [
    { id: 'baseline', label: 'Baseline scenario' },
    { id: 'storm', label: 'Storm perturbation' },
    { id: 'fuel_shock', label: 'Fuel price shock (+20%)' },
  ];

  return (
    <header className="h-16 bg-surface border-b border-border sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
      {/* Left side: Hamburger toggle + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-control lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-xl font-semibold text-slate-900 leading-7 truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right side: Scenario dropdown + Status Dot + View Mode Switch */}
      <div className="flex items-center gap-3 lg:gap-4 shrink-0">
        {/* Scenario Selector */}
        <div className="relative hidden sm:block">
          <label htmlFor="scenario-select" className="sr-only">
            Operational scenario
          </label>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-border rounded-control text-xs font-medium text-slate-700 hover:border-slate-400 transition-colors">
            <span className="text-slate-400">Scenario:</span>
            <select
              id="scenario-select"
              value={selectedScenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer pr-4 appearance-none"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none -ml-3" />
          </div>
        </div>

        {/* System Online Status Dot with Tooltip */}
        <Tooltip
          content={
            <div className="space-y-1">
              <p className="font-semibold text-white">{copy.brand.systemOnline}</p>
              <p className="text-slate-300">{copy.brand.systemDetails}</p>
              {viewMode === 'analyst' && (
                <p className="text-[11px] text-primary-soft border-t border-slate-700 pt-1 mt-1 font-mono">
                  Engine: FastAPI Localhost (Port 8000) · Seed: 42
                </p>
              )}
            </div>
          }
          position="bottom"
        >
          <div
            tabIndex={0}
            className="flex items-center gap-2 px-2.5 py-1 bg-success-soft/70 border border-success/30 rounded-full cursor-help outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`${copy.brand.systemOnline}: ${copy.brand.systemDetails}`}
          >
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold text-successText hidden md:inline">
              {copy.brand.systemOnline}
            </span>
          </div>
        </Tooltip>

        {/* Analyst mode badges (Only visible in Analyst mode) */}
        {viewMode === 'analyst' && (
          <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-control border border-border">
            <span>Seed: 42</span>
            <span>•</span>
            <span className={isBackendLive ? 'text-success' : 'text-slate-500'}>
              {isBackendLive ? 'Live API' : 'Cached sample'}
            </span>
          </div>
        )}

        {/* View Mode Switch (Client vs Analyst) */}
        <ViewModeSwitch mode={viewMode} onChange={onViewModeChange} />
      </div>
    </header>
  );
};
