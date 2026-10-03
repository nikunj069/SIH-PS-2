import React, { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Leaf,
  Cpu,
  GitCompare,
  CloudLightning,
  History,
  PlayCircle,
  HelpCircle,
  X,
  ChevronRight,
  Anchor,
  Zap,
  TrendingDown
} from 'lucide-react';
import { copy } from '../../copy/en';

export type ScreenId =
  | 'command'
  | 'twin-map'
  | 'fuels'
  | 'telemetry'
  | 'pareto'
  | 'storm'
  | 'replay'
  | 'corridor'
  | 'abatement'
  | 'design-system';

export interface SidebarProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  onStartDemo: () => void;
  isDemoActive?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ReactNode;
  hint: string;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  onStartDemo,
  isDemoActive = false,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const [hoveredId, setHoveredId] = useState<ScreenId | null>(null);

  const navItems: NavItem[] = [
    {
      id: 'command',
      label: copy.nav.overview,
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      hint: copy.navHints.overview,
    },
    {
      id: 'twin-map',
      label: copy.nav.fleetMap,
      icon: <MapPin className="w-4 h-4 shrink-0" />,
      hint: copy.navHints.fleetMap,
    },
    {
      id: 'fuels',
      label: copy.nav.fuelOptions,
      icon: <Leaf className="w-4 h-4 shrink-0" />,
      hint: copy.navHints.fuelOptions,
    },
    {
      id: 'telemetry',
      label: copy.nav.optimizationProgress,
      icon: <Cpu className="w-4 h-4 shrink-0" />,
      hint: copy.navHints.optimizationProgress,
      badge: 'AI',
    },
    {
      id: 'pareto',
      label: copy.nav.comparePlans,
      icon: <GitCompare className="w-4 h-4 shrink-0" />,
      hint: copy.navHints.comparePlans,
    },
    {
      id: 'corridor',
      label: 'Port Transition Planner',
      icon: <Zap className="w-4 h-4 shrink-0" />,
      hint: 'Which Indian ports should install shore-power and green fuel terminals first — ranked by ROI.',
    },
    {
      id: 'abatement',
      label: 'Carbon Abatement Curve',
      icon: <TrendingDown className="w-4 h-4 shrink-0" />,
      hint: 'Cost per tonne of CO₂ for each green upgrade — helps prioritize capital spending.',
    },
    {
      id: 'storm',
      label: copy.nav.whatIfScenarios,
      icon: <CloudLightning className="w-4 h-4 shrink-0" />,
      hint: copy.navHints.whatIfScenarios,
    },
    {
      id: 'replay',
      label: copy.nav.voyageReview,
      icon: <History className="w-4 h-4 shrink-0" />,
      hint: copy.navHints.voyageReview,
    },
  ];

  const handleNavClick = (id: ScreenId) => {
    onSelectScreen(id);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 flex flex-col
          bg-white/95 backdrop-blur-2xl
          border-r border-slate-200/80
          shadow-[4px_0_24px_rgba(15,23,42,0.06)]
          transition-transform duration-300 ease-in-out
          w-64 lg:translate-x-0
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
              <Anchor className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <span className="font-black text-[#0f172a] text-sm leading-none block tracking-tight">Q-GREEN FLEET</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">India Maritime Decarbonization</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-600 lg:hidden rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav label */}
        <div className="px-4 pt-4 pb-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation</span>
        </div>

        {/* Nav items */}
        <nav className="px-2 flex-1 overflow-y-auto space-y-0.5 pb-2" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            const isHovered = hoveredId === item.id;
            return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    w-full h-10 px-3 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-all duration-150 cursor-pointer outline-none
                    ${isActive
                      ? 'bg-amber-50 text-amber-700 font-semibold border border-amber-200/80'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
                    }
                  `}
                >
                  {/* Active bar */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-amber-500 rounded-r" />
                  )}
                  <span className={isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>

                {/* Tooltip */}
                {isHovered && !isActive && (
                  <div className="absolute left-full top-0 ml-3 z-50 w-56 p-3 rounded-xl bg-[#0f172a] text-white text-xs shadow-2xl pointer-events-none border border-white/10">
                    <p className="font-bold text-white mb-1">{item.label}</p>
                    <p className="text-slate-300 leading-relaxed">{item.hint}</p>
                    <div className="absolute left-0 top-4 -translate-x-1 w-2 h-2 bg-[#0f172a] rotate-45 border-l border-b border-white/10" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 space-y-1.5 shrink-0">
          {/* Guided Tour */}
          <button
            type="button"
            onClick={onStartDemo}
            className={`
              w-full h-10 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer
              ${isDemoActive
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                : 'bg-gradient-to-r from-amber-400/10 to-orange-400/10 text-amber-700 hover:from-amber-400/20 hover:to-orange-400/20 border border-amber-200/60'
              }
            `}
          >
            <PlayCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{copy.nav.guidedDemo}</span>
          </button>

          {/* Help */}
          <button
            type="button"
            onClick={() => alert('Q-GREEN FLEET — India Maritime Decarbonization System.\n\nAll figures are computed from the Q-GREEN AI optimizer using Indian port data, vessel hydrodynamics, and IMO CII regulations.\n\nDesigned for SIH 2026.')}
            className="w-full h-8 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{copy.nav.help}</span>
          </button>

          <div className="text-center pt-1">
            <span className="text-[10px] text-slate-300 font-medium">🇮🇳 Made for Indian Maritime</span>
          </div>
        </div>
      </aside>
    </>
  );
};
