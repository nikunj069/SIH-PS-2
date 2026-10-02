import React, { useState, useEffect} from 'react';
import { Play, Pause, RotateCcw, Ship, Fuel, Leaf, DollarSign} from 'lucide-react';
import { api} from '../services/api';
import { PageHeader} from '../components/common/PageHeader';
import { KpiTile} from '../components/common/KpiTile';
import { Card} from '../components/common/Card';
import { Stepper, type StepperNode} from '../components/common/Stepper';
import { BarCompare} from '../components/common/BarCompare';
import { IconButton} from '../components/common/IconButton';

export const VoyageReplay: React.FC = () => {
 const [replayData, setReplayData] = useState<any>(null);
 const [activeStep, setActiveStep] = useState<number>(3);
 const [isPlaying, setIsPlaying] = useState<boolean>(false);

 useEffect(() => {
 const data = api.getVoyageReplayData('VOY-ASIA-EUR-2026-001');
 setReplayData(data);
}, []);

 useEffect(() => {
 let interval: any = null;
 if (isPlaying && replayData) {
 interval = setInterval(() => {
 setActiveStep(prev => {
 if (prev >= replayData.waypoints.length - 1) {
 setIsPlaying(false);
 return prev;
}
 return prev + 1;
});
}, 1400);
}
 return () => clearInterval(interval);
}, [isPlaying, replayData]);

 if (!replayData) return null;

 const currentWp = replayData.waypoints[activeStep];
 const totalSteps = replayData.waypoints.length;

 const stepperNodes: StepperNode[] = replayData.waypoints.map((wp: any, index: number) => ({
 id: index,
 label: wp.name,
}));

 return (
 <div className="space-y-6 max-w-7xl mx-auto">
 <PageHeader
 title="Voyage review"
 subtitle="Compare what a vessel actually did with what the model suggests it could have done on the same voyage."
 dataBasisLabel="estimated"
 primaryAction={{
 label: isPlaying ? 'Pause timeline' : 'Play timeline',
 icon: isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />,
 onClick: () => setIsPlaying(!isPlaying),
}}
 secondaryAction={{
 label: 'Reset',
 icon: <RotateCcw className="w-4 h-4" />,
 onClick: () => { setActiveStep(0); setIsPlaying(false);},
}}
 >
 {/* Vessel and voyage selector (placeholder for UI standard) */}
 <div className="flex items-center gap-3 mr-4">
 <select 
 className="h-10 pl-3 pr-8 rounded-[8px] border border-[#D9E0EA] bg-white text-sm font-medium text-[#0F172A] outline-none focus:border-[#0B63CE] focus:ring-1 focus:ring-[#0B63CE] appearance-none"
 defaultValue="vessel-1"
 >
 <option value="vessel-1">{replayData.vessel_name}</option>
 </select>
 <select 
 className="h-10 pl-3 pr-8 rounded-[8px] border border-[#D9E0EA] bg-white text-sm font-medium text-[#0F172A] outline-none focus:border-[#0B63CE] focus:ring-1 focus:ring-[#0B63CE] appearance-none max-w-[200px] truncate"
 defaultValue="route-1"
 >
 <option value="route-1">{replayData.route_name}</option>
 </select>
 </div>
 </PageHeader>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <KpiTile
 label="Fuel saved"
 value={replayData.summary.fuel_savings_tonnes}
 unit="t"
 delta={{
 value: `${replayData.summary.fuel_savings_pct}% less fuel than actual`,
 direction: 'up',
 isPositiveGood: true,
 comparisonText: ''
}}
 provenance="estimated"
 />
 <KpiTile
 label="Greenhouse gas avoided"
 value={replayData.summary.ghg_abated_tonnes}
 unit="t CO₂e"
 delta={{
 value: `${replayData.summary.ghg_abatement_pct}% WtW GHG reduction`,
 direction: 'up',
 isPositiveGood: true,
 comparisonText: ''
}}
 provenance="estimated"
 />
 <KpiTile
 label="Net cost difference"
 value={(replayData.summary.cost_savings_usd / 1000).toFixed(0)}
 unit="$k"
 delta={{
 value: 'Fuel + ETS allowance savings',
 direction: 'up',
 isPositiveGood: true,
 comparisonText: ''
}}
 provenance="estimated"
 />
 </div>

 <Card>
 <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="font-bold text-[#0F172A]">{replayData.vessel_name}</span>
 <span className="text-[#475569]">·</span>
 <span className="text-[#475569]">14,000 TEU</span>
 <span className="text-[#475569]">·</span>
 <span className="text-[#475569]">{replayData.route_name.replace(' - ', ' → ')}</span>
 </div>
 <div className="text-sm font-semibold text-[#0F172A]">
 Waypoint {activeStep + 1} of {totalSteps} · {currentWp.name}
 </div>
 </div>
 </div>

 <div className="relative mb-6">
 <div className="flex justify-between text-sm font-medium text-[#475569] mb-4">
 <span>Departure, 0 h</span>
 <span>Arrival, 618 h</span>
 </div>
 <Stepper
 nodes={stepperNodes}
 activeStepIndex={activeStep}
 onStepClick={setActiveStep}
 />
 </div>
 </Card>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <Card title="Cruising speed at this waypoint">
 <BarCompare
 label1="What happened"
 value1={currentWp.actual_speed}
 value1Display={`${currentWp.actual_speed} knots`}
 color1="#64748B" // slate
 label2="What the model suggests"
 value2={currentWp.opt_speed}
 value2Display={`${currentWp.opt_speed} knots`}
 color2="#0B63CE" // brand blue
 maxValue={25}
 insightText={
 currentWp.actual_speed > currentWp.opt_speed
 ? `The ship sailed ${(currentWp.actual_speed - currentWp.opt_speed).toFixed(1)} knots faster than suggested, which burns disproportionately more fuel.`
 : currentWp.actual_speed === 0
 ? 'Vessel berthed: Shore-side power connects cleanly.'
 : 'Speed aligned with optimal suggestion.'
}
 />
 </Card>

 <Card title="Fuel use per day">
 <BarCompare
 label1="What happened"
 value1={currentWp.actual_fuel}
 value1Display={`${currentWp.actual_fuel} t/day`}
 color1="#B42318" // red
 label2="What the model suggests"
 value2={currentWp.opt_fuel}
 value2Display={`${currentWp.opt_fuel} t/day`}
 color2="#0F7B5F" // teal
 maxValue={100}
 insightText={
 <span className="flex items-center gap-2">
 Greenhouse gas difference: 
 <span className="inline-flex items-center gap-1 bg-[#E3F5EE] text-[#0F7B5F] px-2 py-0.5 rounded-full font-medium text-xs">
 ↓ {Math.max(0, currentWp.cum_actual_co2 - currentWp.cum_opt_co2).toFixed(0)} t CO₂e
 </span>
 </span> as any
}
 />
 </Card>
 </div>
 
 <div className="text-center">
 <button className="text-sm font-medium text-[#0B63CE] underline hover:text-[#0A55B0]">
 How to read this
 </button>
 </div>
 </div>
 );
};
