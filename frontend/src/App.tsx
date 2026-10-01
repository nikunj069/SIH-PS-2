import { useState, useEffect, useRef } from 'react';
import { Navbar, type ScreenId } from './components/Navbar';
import { FleetCommandCenter } from './pages/FleetCommandCenter';
import { DigitalTwinMap } from './pages/DigitalTwinMap';
import { FuelIntelligence } from './pages/FuelIntelligence';
import { OptimizerTelemetry } from './pages/OptimizerTelemetry';
import { ParetoExplorer } from './pages/ParetoExplorer';
import { StormSimulator } from './pages/StormSimulator';
import { VoyageReplay } from './pages/VoyageReplay';
import { api } from './services/api';
import { Sparkles } from 'lucide-react';

export function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('command');
  const [isBackendLive, setIsBackendLive] = useState<boolean>(false);
  const [demoActive, setDemoActive] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(1);
  const [demoBannerText, setDemoBannerText] = useState<string>('');

  const demoIntervalRef = useRef<any>(null);

  const demoSequence: { screen: ScreenId; duration: number; caption: string }[] = [
    {
      screen: 'command',
      duration: 12000,
      caption: 'Step 1/7: Fleet Command Center — Synchronizing 12 commercial vessels across 4 global corridors with physics-informed digital twin.'
    },
    {
      screen: 'twin-map',
      duration: 12000,
      caption: 'Step 2/7: Digital Twin Map — Georeferenced fairways, IMO Emission Control Areas (ECAs), and port hubs with Onshore Power Supply (OPS).'
    },
    {
      screen: 'fuels',
      duration: 12000,
      caption: 'Step 3/7: Fuel Reality Engine — IMO MEPC.391(81) Well-to-Wake (WtT + TtW + CH4 slip + N2O) lifecycle greenhouse gas accounting.'
    },
    {
      screen: 'telemetry',
      duration: 14000,
      caption: 'Step 4/7: Optimizer Telemetry — Q-GREEN Hybrid (QIGA discrete + QPSO continuous + NSGA-II archive) with evaluation budget parity.'
    },
    {
      screen: 'pareto',
      duration: 14000,
      caption: 'Step 5/7: Pareto Front Explorer — Multi-objective trade-off (Cost vs GHG vs Risk CVaR95) with independent constraint validation and explainability.'
    },
    {
      screen: 'storm',
      duration: 14000,
      caption: 'Step 6/7: Storm & What-If Simulator — Sudden weather perturbation triggers warm-start rapid re-planning in under 1.5 seconds.'
    },
    {
      screen: 'replay',
      duration: 14000,
      caption: 'Step 7/7: Voyage Replay — Historic AIS track vs model counterfactual profile proving 18.6% fuel savings and 23.9% GHG abatement.'
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
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
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
      setDemoBannerText('Judge Demo Completed! Explore any screen at your own pace.');
      setTimeout(() => setDemoBannerText(''), 6000);
      return;
    }

    const current = demoSequence[index];
    setActiveScreen(current.screen);
    setDemoStep(index + 1);
    setDemoBannerText(current.caption);

    demoIntervalRef.current = setTimeout(() => {
      runDemoStep(index + 1);
    }, current.duration);
  };

  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#040814] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeScreen={activeScreen}
        onSelectScreen={(screen) => {
          if (demoActive) handleToggleDemo();
          setActiveScreen(screen);
        }}
        isBackendLive={isBackendLive}
        demoActive={demoActive}
        demoStep={demoStep}
        demoTotalSteps={demoSequence.length}
        onToggleDemo={handleToggleDemo}
      />

      {/* Demo Walkthrough Floating Ribbon */}
      {demoActive && (
        <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white text-xs font-mono py-2 px-4 shadow-lg sticky top-16 z-40 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <Sparkles className="w-4 h-4 animate-spin-slow shrink-0" />
            <span className="font-semibold">{demoBannerText}</span>
          </div>
          <button
            onClick={handleToggleDemo}
            className="text-white hover:text-slate-200 text-xs font-bold underline shrink-0 ml-4"
          >
            Exit Demo
          </button>
        </div>
      )}

      {/* Main Screen Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeScreen === 'command' && <FleetCommandCenter onNavigate={setActiveScreen} />}
        {activeScreen === 'twin-map' && <DigitalTwinMap />}
        {activeScreen === 'fuels' && <FuelIntelligence />}
        {activeScreen === 'telemetry' && <OptimizerTelemetry onNavigateToPareto={() => setActiveScreen('pareto')} />}
        {activeScreen === 'pareto' && <ParetoExplorer />}
        {activeScreen === 'storm' && <StormSimulator />}
        {activeScreen === 'replay' && <VoyageReplay />}
      </main>

      {/* Bottom Footer */}
      <footer className="glass-panel border-t border-slate-800/80 mt-12 py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">
              Q-GREEN FLEET v2 · Classical Quantum-Inspired Maritime Fleet &amp; Route Decarbonization
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Honesty Rule: No Quantum Advantage Claims</span>
            <span>•</span>
            <span>IMO Resolution MEPC.391(81)</span>
            <span>•</span>
            <span>Seed: 42 Deterministic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
