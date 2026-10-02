import React from 'react';
import {
 LayoutDashboard,
 MapPin,
 Fuel,
 LineChart,
 GitCompare,
 CloudLightning,
 History,
 PlayCircle,
 HelpCircle,
 Component,
 X
} from 'lucide-react';
import { copy} from '../../copy/en';

export type ScreenId =
 | 'command'
 | 'twin-map'
 | 'fuels'
 | 'telemetry'
 | 'pareto'
 | 'storm'
 | 'replay'
 | 'design-system';

export interface SidebarProps {
 activeScreen: ScreenId;
 onSelectScreen: (screen: ScreenId) => void;
 onStartDemo: () => void;
 isDemoActive?: boolean;
 isOpenMobile?: boolean;
 onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
 activeScreen,
 onSelectScreen,
 onStartDemo,
 isDemoActive = false,
 isOpenMobile = false,
 onCloseMobile,
}) => {
 const navItems: { id: ScreenId; label: string; icon: React.ReactNode}[] = [
 { id: 'command', label: copy.nav.overview, icon: <LayoutDashboard className="w-5 h-5 shrink-0" />},
 { id: 'twin-map', label: copy.nav.fleetMap, icon: <MapPin className="w-5 h-5 shrink-0" />},
 { id: 'fuels', label: copy.nav.fuelOptions, icon: <Fuel className="w-5 h-5 shrink-0" />},
 { id: 'telemetry', label: copy.nav.optimizationProgress, icon: <LineChart className="w-5 h-5 shrink-0" />},
 { id: 'pareto', label: copy.nav.comparePlans, icon: <GitCompare className="w-5 h-5 shrink-0" />},
 { id: 'storm', label: copy.nav.whatIfScenarios, icon: <CloudLightning className="w-5 h-5 shrink-0" />},
 { id: 'replay', label: copy.nav.voyageReview, icon: <History className="w-5 h-5 shrink-0" />},
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
 className="fixed inset-0 z-40 bg-surface-alt/30 lg:hidden"
 onClick={onCloseMobile}
 aria-hidden="true"
 />
 )}

 {/* Sidebar Container */}
 <aside
 className={`
 fixed top-0 bottom-0 left-0 z-40 bg-surface border-r border-border flex flex-col justify-between
 transition-transform duration-200 ease-in-out
 w-64 lg:translate-x-0
 ${isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
 `}
 >
 {/* Brand / Logo Header */}
 <div>
 <div className="h-16 px-6 border-b border-border flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-control bg-primary flex items-center justify-center text-text shadow-sm font-bold text-lg">
 ⚓
 </div>
 <div className="min-w-0">
 <span className="font-semibold text-text text-base leading-5 block ">
 {copy.brand.name}
 </span>
 <span className="text-[11px] text-text-muted block truncate">
 Fleet Decarbonization
 </span>
 </div>
 </div>

 {/* Mobile close button */}
 <button
 type="button"
 onClick={onCloseMobile}
 className="p-1.5 text-text-muted hover:text-text-muted lg:hidden rounded-control"
 aria-label="Close menu"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Primary Navigation List */}
 <nav className="p-3 space-y-1" aria-label="Main Navigation">
 {navItems.map((item) => {
 const isActive = activeScreen === item.id;
 return (
 <button
 key={item.id}
 type="button"
 onClick={() => handleNavClick(item.id)}
 aria-current={isActive ? 'page' : undefined}
 className={`
 w-full h-11 px-3.5 rounded-control text-sm font-medium flex items-center gap-3 transition-colors relative cursor-pointer outline-none
 ${
 isActive
 ? 'bg-primary-soft text-primary font-semibold'
 : 'text-text-muted hover:bg-surface-alt hover:text-text'
}
 focus-visible:ring-2 focus-visible:ring-primary
 `}
 >
 {/* Left 4px active indicator bar */}
 {isActive && (
 <div className="absolute left-0 top-1 bottom-1 w-1 bg-primary rounded-r" />
 )}
 {item.icon}
 <span className="truncate">{item.label}</span>
 </button>
 );
})}
 </nav>
 </div>

 {/* Footer Area: Demo Flow + Design System + Help */}
 <div className="p-3 border-t border-border space-y-2">
 {/* Guided Demo Button */}
 <button
 type="button"
 onClick={onStartDemo}
 className={`
 w-full h-10 px-3.5 rounded-control text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer outline-none
 ${
 isDemoActive
 ? 'bg-primary text-text shadow-sm ring-2 ring-primary/30'
 : 'bg-primary-soft text-primary hover:bg-blue-100'
}
 focus-visible:ring-2 focus-visible:ring-primary
 `}
 >
 <PlayCircle className="w-4 h-4 shrink-0" />
 <span className="truncate">{copy.nav.guidedDemo}</span>
 </button>

 {/* Component Showcase Link */}
 <button
 type="button"
 onClick={() => handleNavClick('design-system')}
 className={`
 w-full h-9 px-3 rounded-control text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer outline-none
 ${
 activeScreen === 'design-system'
 ? 'bg-surface-alt text-text font-semibold'
 : 'text-text-muted hover:text-text-muted hover:bg-surface-alt/60'
}
 focus-visible:ring-2 focus-visible:ring-primary
 `}
 >
 <Component className="w-4 h-4 shrink-0 " />
 <span className="truncate">Design system catalog</span>
 </button>

 {/* Help link */}
 <button
 type="button"
 onClick={() => alert('Q-GREEN FLEET User Guide: All figures are calculated from calibrated ship hydrodynamic engines and FuelEU Maritime regulations.')}
 className="w-full h-9 px-3 rounded-control text-xs font-medium text-text-muted hover:text-text-muted hover:bg-surface-alt/60 flex items-center gap-2.5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
 >
 <HelpCircle className="w-4 h-4 shrink-0 " />
 <span className="truncate">{copy.nav.help}</span>
 </button>
 </div>
 </aside>
 </>
 );
};
