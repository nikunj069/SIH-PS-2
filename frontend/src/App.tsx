import { Component, useState, useEffect, useRef, type ReactNode } from 'react';
import { Sidebar, type ScreenId } from './components/shell/Sidebar';
import { TopBar } from './components/shell/TopBar';
import { FleetCommandCenter } from './pages/FleetCommandCenter';
import { DigitalTwinMap } from './pages/DigitalTwinMap';
import { FuelIntelligence } from './pages/FuelIntelligence';
import { OptimizerTelemetry } from './pages/OptimizerTelemetry';
import { ParetoExplorer } from './pages/ParetoExplorer';
import { StormSimulator } from './pages/StormSimulator';
import { VoyageReplay } from './pages/VoyageReplay';
import { GreenCorridorPlanner } from './pages/GreenCorridorPlanner';
import { AbatementCurve } from './pages/AbatementCurve';
import { DesignSystemShowcase } from './pages/DesignSystemShowcase';
import { api } from './services/api';
import { copy } from './copy/en';
import { PlayCircle } from 'lucide-react';

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
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white/80 backdrop-blur-xl border border-red-200 p-8 rounded-2xl text-center my-8 max-w-xl mx-auto shadow-xl">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-500 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('command');
  const [selectedScenario, setSelectedScenario] = useState<string>('baseline');
  const [isBackendLive, setIsBackendLive] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Guided Tour State
  const [demoActive, setDemoActive] = useState<boolean>(false);
  const [demoBannerText, setDemoBannerText] = useState<string>('');
  const demoIntervalRef = useRef<any>(null);

  const demoSequence: { screen: ScreenId; duration: number; caption: string }[] = [
    {
      screen: 'command',
      duration: 12000,
      caption: '📊 Step 1/7 — Fleet Command Center: See all your Indian vessels and click "Run AI Optimizer" to generate the best fleet plan.'
    },
    {
      screen: 'twin-map',
      duration: 12000,
      caption: '🗺️ Step 2/7 — India Port Map: See Indian sea routes, ports (JNPT, Mundra, Chennai), and emission control zones on the map.'
    },
    {
      screen: 'fuels',
      duration: 12000,
      caption: '⛽ Step 3/7 — Green Fuel Advisor: Compare HFO, Bio-LNG, Green Methanol and Ammonia — prices and lifecycle carbon side-by-side.'
    },
    {
      screen: 'telemetry',
      duration: 14000,
      caption: '🤖 Step 4/7 — AI Optimizer: Watch the AI test thousands of speed + fuel + route combinations to find the lowest-cost, lowest-emission plan.'
    },
    {
      screen: 'pareto',
      duration: 14000,
      caption: '📈 Step 5/7 — Plan Comparison: Every dot is a viable plan. Pick the right balance of cost savings vs emissions reduction.'
    },
    {
      screen: 'storm',
      duration: 14000,
      caption: '🌀 Step 6/7 — Monsoon Resilience: Simulate a Bay of Bengal cyclone — watch the AI recover the schedule in under 2 seconds.'
    },
    {
      screen: 'replay',
      duration: 14000,
      caption: '⏪ Step 7/7 — Voyage Analysis: Compare a real voyage vs what the AI would have recommended. See the savings missed.'
    }
  ];

  useEffect(() => {
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
      setDemoBannerText('✅ Tour complete! Explore any screen on your own now.');
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

  // Page title + hint for each screen
  const getPageMeta = (screen: ScreenId): { title: string; hint: string } => {
    switch (screen) {
      case 'command': return {
        title: copy.fleetOverview.pageTitle,
        hint: copy.navHints.overview
      };
      case 'twin-map': return {
        title: copy.fleetMap.pageTitle,
        hint: copy.navHints.fleetMap
      };
      case 'fuels': return {
        title: copy.fuelOptions.pageTitle,
        hint: copy.navHints.fuelOptions
      };
      case 'telemetry': return {
        title: copy.optimizationProgress.pageTitle,
        hint: copy.navHints.optimizationProgress
      };
      case 'pareto': return {
        title: copy.comparePlans.pageTitle,
        hint: copy.navHints.comparePlans
      };
      case 'storm': return {
        title: copy.whatIfScenarios.pageTitle,
        hint: copy.navHints.whatIfScenarios
      };
      case 'replay': return {
        title: copy.voyageReview.pageTitle,
        hint: copy.navHints.voyageReview
      };
      case 'corridor': return {
        title: 'Port Transition Planner',
        hint: 'Which Indian ports should upgrade to shore-power and green fuel terminals first? Ranked by emissions saved per rupee spent.'
      };
      case 'abatement': return {
        title: 'Carbon Abatement Curve',
        hint: 'See the cost per tonne of CO₂ for each green technology — helps prioritize capital investment decisions.'
      };
      case 'design-system': return {
        title: 'Design system catalog',
        hint: 'Internal component reference.'
      };
      default: return { title: copy.brand.name, hint: '' };
    }
  };

  const pageMeta = getPageMeta(activeScreen);

  return (
    <div className="min-h-screen text-[#0F172A] flex font-sans antialiased">
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* TopBar */}
        <TopBar
          pageTitle={pageMeta.title}
          pageHint={pageMeta.hint}
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
          isBackendLive={isBackendLive}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Guided Tour Ribbon */}
        {(demoActive || demoBannerText) && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs py-2.5 px-6 sticky top-16 z-20 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2 max-w-5xl">
              <PlayCircle className="w-4 h-4 animate-pulse shrink-0" />
              <span className="font-medium">{demoBannerText}</span>
            </div>
            <button
              onClick={handleToggleDemo}
              className="text-white/80 hover:text-white text-xs font-semibold underline shrink-0 ml-4 cursor-pointer"
            >
              Exit tour
            </button>
          </div>
        )}

        {/* Page Container */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 lg:p-6 xl:p-8">
          <ErrorBoundary key={activeScreen}>
            {activeScreen === 'command' && (
              <FleetCommandCenter
                onNavigate={setActiveScreen}
              />
            )}
            {activeScreen === 'twin-map' && <DigitalTwinMap />}
            {activeScreen === 'fuels' && <FuelIntelligence />}
            {activeScreen === 'telemetry' && (
              <OptimizerTelemetry onNavigateToPareto={() => setActiveScreen('pareto')} />
            )}
            {activeScreen === 'pareto' && <ParetoExplorer />}
            {activeScreen === 'corridor' && <GreenCorridorPlanner />}
            {activeScreen === 'abatement' && <AbatementCurve />}
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
