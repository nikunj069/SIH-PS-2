import { Component, useState, useEffect, useRef, type ReactNode} from 'react';
import { Sidebar, type ScreenId} from './components/shell/Sidebar';
import { TopBar} from './components/shell/TopBar';
import type { ViewMode} from './components/common/ViewModeSwitch';
import { FleetCommandCenter} from './pages/FleetCommandCenter';
import { DigitalTwinMap} from './pages/DigitalTwinMap';
import { FuelIntelligence} from './pages/FuelIntelligence';
import { OptimizerTelemetry} from './pages/OptimizerTelemetry';
import { ParetoExplorer} from './pages/ParetoExplorer';
import { StormSimulator} from './pages/StormSimulator';
import { VoyageReplay} from './pages/VoyageReplay';
import { DesignSystemShowcase} from './pages/DesignSystemShowcase';
import { api} from './services/api';
import { copy} from './copy/en';
import { PlayCircle} from 'lucide-react';

interface ErrorBoundaryProps {
 children: ReactNode;
}
interface ErrorBoundaryState {
 hasError: boolean;
 error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
 constructor(props: ErrorBoundaryProps) {
 super(props);
 this.state = { hasError: false};
}

 static getDerivedStateFromError(error: Error): ErrorBoundaryState {
 return { hasError: true, error};
}

 componentDidCatch(error: Error, errorInfo: any) {
 console.error("ErrorBoundary caught an error:", error, errorInfo);
}

 render() {
 if (this.state.hasError) {
 return (
 <div className="bg-surface border border-danger/40 p-8 rounded-card text-center my-8 max-w-xl mx-auto shadow-card">
 <h2 className="text-xl font-bold text-text mb-2">Display Synchronization Notice</h2>
 <p className="text-sm text-text-muted mb-4">{this.state.error?.message}</p>
 <button
 onClick={() => { this.setState({ hasError: false}); window.location.reload();}}
 className="px-4 py-2 bg-primary text-text text-sm font-semibold rounded-control cursor-pointer hover:bg-primary-hover focus-ring"
 >
 Refresh View
 </button>
 </div>
 );
}
 return this.props.children;
}
}

export function App() {
 const [activeScreen, setActiveScreen] = useState<ScreenId>('command');
 const [viewMode, setViewMode] = useState<ViewMode>('client');
 const [selectedScenario, setSelectedScenario] = useState<string>('baseline');
 const [isBackendLive, setIsBackendLive] = useState<boolean>(true);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

 // Guided Demo Flow State
 const [demoActive, setDemoActive] = useState<boolean>(false);
 const [demoBannerText, setDemoBannerText] = useState<string>('');
 const demoIntervalRef = useRef<any>(null);

 const demoSequence: { screen: ScreenId; duration: number; caption: string}[] = [
 {
 screen: 'command',
 duration: 12000,
 caption: 'Step 1/7: Fleet overview — Monitor 12 vessels across 4 global corridors and review recommended operating plans.'
},
 {
 screen: 'twin-map',
 duration: 12000,
 caption: 'Step 2/7: Fleet map — Georeferenced commercial routes, emissions control zones, and shore electricity ports.'
},
 {
 screen: 'fuels',
 duration: 12000,
 caption: 'Step 3/7: Fuel options — Compare fuel prices, availability, and Well-to-Wake lifecycle carbon intensity.'
},
 {
 screen: 'telemetry',
 duration: 14000,
 caption: 'Step 4/7: Optimization progress — Watch multi-objective scheduling search across speed, route, and bunkering options.'
},
 {
 screen: 'pareto',
 duration: 14000,
 caption: 'Step 5/7: Compare plans — Inspect operating trade-offs between voyage cost, emissions abatement, and schedule risk.'
},
 {
 screen: 'storm',
 duration: 14000,
 caption: 'Step 6/7: What-if scenarios — Test weather disruptions and evaluate rapid automated schedule recovery.'
},
 {
 screen: 'replay',
 duration: 14000,
 caption: 'Step 7/7: Voyage review — Review completed voyage logs against optimized counterfactual profiles.'
}
 ];

 useEffect(() => {
 // Check backend health periodically
 api.checkBackendHealth().then(status => setIsBackendLive(status));
 const interval = setInterval(() => {
 api.checkBackendHealth().then(status => setIsBackendLive(status));
}, 10000);
 return () => clearInterval(interval);
}, []);

 const handleToggleDemo = () => {
 if (demoActive) {
 if (demoIntervalRef.current) clearTimeout(demoIntervalRef.current);
 setDemoActive(false);
 setDemoBannerText('');
} else {
 setDemoActive(true);
 runDemoStep(0);
}
};

 const runDemoStep = (index: number) => {
 if (index >= demoSequence.length) {
 setDemoActive(false);
 setDemoBannerText('Guided demo complete! Explore any screen at your own pace.');
 setTimeout(() => setDemoBannerText(''), 6000);
 return;
}

 const current = demoSequence[index];
 setActiveScreen(current.screen);
 setDemoBannerText(current.caption);

 demoIntervalRef.current = setTimeout(() => {
 runDemoStep(index + 1);
}, current.duration);
};

 useEffect(() => {
 return () => {
 if (demoIntervalRef.current) clearTimeout(demoIntervalRef.current);
};
}, []);

 // Compute Page Title for TopBar
 const getPageTitle = (screen: ScreenId): string => {
 switch (screen) {
 case 'command': return copy.fleetOverview.pageTitle;
 case 'twin-map': return copy.fleetMap.pageTitle;
 case 'fuels': return copy.fuelOptions.pageTitle;
 case 'telemetry': return copy.optimizationProgress.pageTitle;
 case 'pareto': return copy.comparePlans.pageTitle;
 case 'storm': return copy.whatIfScenarios.pageTitle;
 case 'replay': return copy.voyageReview.pageTitle;
 case 'design-system': return 'Design system catalog';
 default: return copy.brand.name;
}
};

 return (
 <div className="min-h-screen bg-canvas text-text flex font-sans antialiased">
 {/* Fixed Left Sidebar (256px) */}
 <Sidebar
 activeScreen={activeScreen}
 onSelectScreen={(screen) => {
 if (demoActive) handleToggleDemo();
 setActiveScreen(screen);
}}
 onStartDemo={handleToggleDemo}
 isDemoActive={demoActive}
 isOpenMobile={isMobileMenuOpen}
 onCloseMobile={() => setIsMobileMenuOpen(false)}
 />

 {/* Main Content Area (offset by 256px on lg screens) */}
 <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
 {/* TopBar (64px, Sticky) */}
 <TopBar
 pageTitle={getPageTitle(activeScreen)}
 viewMode={viewMode}
 onViewModeChange={setViewMode}
 selectedScenario={selectedScenario}
 onSelectScenario={setSelectedScenario}
 isBackendLive={isBackendLive}
 onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
 />

 {/* Guided Demo Ribbon */}
 {demoActive && (
 <div className="bg-primary text-text text-xs py-2.5 px-6 shadow-sm sticky top-16 z-20 flex items-center justify-between border-b border-primary-press">
 <div className="flex items-center gap-2 max-w-5xl">
 <PlayCircle className="w-4 h-4 animate-pulse shrink-0" />
 <span className="font-medium">{demoBannerText}</span>
 </div>
 <button
 onClick={handleToggleDemo}
 className="text-text hover:text-text-muted text-xs font-semibold underline shrink-0 ml-4 cursor-pointer"
 >
 Exit demo
 </button>
 </div>
 )}

 {/* Page Container (Max-width 1440px, centered, 32px gutters) */}
 <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 lg:p-8">
 <ErrorBoundary key={activeScreen}>
 {activeScreen === 'command' && (
 <FleetCommandCenter
 viewMode={viewMode}
 onNavigate={setActiveScreen}
 />
 )}
 {activeScreen === 'twin-map' && <DigitalTwinMap />}
 {activeScreen === 'fuels' && <FuelIntelligence />}
 {activeScreen === 'telemetry' && (
 <OptimizerTelemetry onNavigateToPareto={() => setActiveScreen('pareto')} />
 )}
 {activeScreen === 'pareto' && <ParetoExplorer />}
 {activeScreen === 'storm' && <StormSimulator />}
 {activeScreen === 'replay' && <VoyageReplay />}
 {activeScreen === 'design-system' && <DesignSystemShowcase />}
 </ErrorBoundary>
 </main>
 </div>
 </div>
 );
}

export default App;
