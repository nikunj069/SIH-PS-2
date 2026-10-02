import React, { useState, useEffect} from 'react';
import { Navigation, Layers} from 'lucide-react';
import type { Port, Route, Vessel} from '../types';
import { api} from '../services/api';
import { ProvenanceBadge} from '../components/ProvenanceBadge';

export const DigitalTwinMap: React.FC = () => {
 const [ports, setPorts] = useState<Port[]>([]);
 const [routes, setRoutes] = useState<Route[]>([]);
 const [vessels, setVessels] = useState<Vessel[]>([]);
 const [selectedPort, setSelectedPort] = useState<Port | null>(null);
 const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
 const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
 const [activeLayer, setActiveLayer] = useState<'all' | 'eca' | 'weather' | 'bunker'>('all');

 useEffect(() => {
 async function loadData() {
 const [p, r, v] = await Promise.all([api.getPorts(), api.getRoutes(), api.getVessels()]);
 setPorts(p);
 setRoutes(r);
 setVessels(v);
 if (p.length > 0) setSelectedPort(p[0]);
}
 loadData();
}, []);

 // Map coordinates projection: lon [-180, 180] -> [40, 960], lat [80, -60] -> [40, 520]
 const project = (lat: number, lon: number): [number, number] => {
 const x = ((lon + 180) / 360) * 920 + 40;
 const y = ((85 - lat) / 145) * 480 + 30;
 return [Math.max(20, Math.min(980, x)), Math.max(20, Math.min(520, y))];
};

 // Mock vessel positions along the routes
 const simulatedPositions = [
 { vessel_id: 'V-CONT-001', name: 'Pacific Horizon', lat: 8.5, lon: 78.0, heading: 285, speed: 14.2, status: 'Underway'},
 { vessel_id: 'V-CONT-002', name: 'Emerald Titan', lat: 28.5, lon: -150.0, heading: 80, speed: 15.1, status: 'Underway'},
 { vessel_id: 'V-BULK-001', name: 'Nordic Pioneer', lat: 42.0, lon: -35.0, heading: 260, speed: 12.0, status: 'Underway'},
 { vessel_id: 'V-TANK-001', name: 'Solar Voyager', lat: 18.0, lon: 115.0, heading: 35, speed: 13.5, status: 'Underway'},
 { vessel_id: 'V-CONT-003', name: 'Baltic Osprey', lat: 51.95, lon: 4.14, heading: 0, speed: 0.0, status: 'Cold-Ironing'},
 { vessel_id: 'V-CONT-004', name: 'Malacca Express', lat: 1.29, lon: 103.85, heading: 0, speed: 0.0, status: 'Bunkering'},
 ];

 return (
 <div className="space-y-6">
 {/* Top Controls Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-border">
 <div>
 <h1 className="text-xl font-bold text-text flex items-center gap-2">
 <Navigation className="w-5 h-5 text-primary" />
 Global Maritime Digital Twin Map
 </h1>
 <p className="text-xs text-text-muted tabular-nums mt-0.5">
 Georeferenced fairways, ECA buffer zones, and cold-ironing berths
 </p>
 </div>

 {/* Map Layer Switcher */}
 <div className="flex items-center gap-1.5 bg-surface-alt/80 p-1 rounded-lg border border-border">
 <Layers className="w-3.5 h-3.5 text-text-muted ml-2" />
 <span className="text-[11px] tabular-nums text-text-muted mr-1">Layer:</span>
 {(['all', 'eca', 'weather', 'bunker'] as const).map(layer => (
 <button
 key={layer}
 onClick={() => setActiveLayer(layer)}
 className={`px-2.5 py-1 rounded text-xs tabular-nums capitalize transition-all ${
 activeLayer === layer
 ? 'bg-cyan-500/20 text-primary border border-cyan-500/40'
 : 'text-text-muted hover:text-slate-200'
}`}
 >
 {layer}
 </button>
 ))}
 </div>
 </div>

 {/* Main Map Canvas Area */}
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 <div className="lg:col-span-3 glass-panel rounded-2xl p-4 border border-cyan-500/20 relative overflow-hidden bg-[#040817] shadow-2xl">
 {/* Subtle Radar Background Grid */}
 <div className="absolute inset-0 nav-grid-bg opacity-30 pointer-events-none" />

 {/* SVG Maritime Map */}
 <div className="relative w-full aspect-[16/9] min-h-[460px] bg-[#030611] rounded-xl overflow-hidden border border-border/80 flex items-center justify-center">
 <svg
 viewBox="0 0 1000 550"
 className="w-full h-full select-none"
 style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.05))'}}
 >
 {/* Simplified World Coastline Shapes */}
 <g fill="#0b1429" stroke="#172748" strokeWidth="0.8">
 {/* North America */}
 <path d="M 120 80 Q 200 60 260 90 Q 300 130 250 200 Q 220 240 180 230 Q 140 180 110 140 Z" />
 {/* South America */}
 <path d="M 230 250 Q 290 280 280 370 Q 250 440 220 450 Q 200 370 210 290 Z" />
 {/* Eurasia & Africa */}
 <path d="M 430 80 Q 560 60 760 90 Q 860 140 820 240 Q 720 280 620 220 Q 530 240 450 160 Z" />
 <path d="M 460 180 Q 550 190 560 290 Q 520 380 480 390 Q 430 300 450 200 Z" />
 {/* Australia */}
 <path d="M 750 330 Q 830 320 860 380 Q 810 430 740 400 Z" />
 </g>

 {/* Equator & Tropic Reference Graticules */}
 <line x1="20" y1="275" x2="980" y2="275" stroke="#16223f" strokeDasharray="3 3" strokeWidth="0.7" />
 <line x1="20" y1="180" x2="980" y2="180" stroke="#101930" strokeDasharray="2 4" strokeWidth="0.5" />
 <line x1="20" y1="370" x2="980" y2="370" stroke="#101930" strokeDasharray="2 4" strokeWidth="0.5" />

 {/* ECA Zones (North Sea / Baltic & US Coasts) */}
 {(activeLayer === 'all' || activeLayer === 'eca') && (
 <g>
 {/* North Sea / Baltic ECA */}
 <ellipse cx="485" cy="115" rx="35" ry="22" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
 <text x="490" y="105" fill="#f59e0b" fontSize="8" fontFamily="monospace">ECA (SOx/NOx)</text>
 
 {/* North American ECA */}
 <ellipse cx="170" cy="180" rx="35" ry="45" fill="rgba(245, 158, 11, 0.08)" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
 </g>
 )}

 {/* Shipping Corridors & Waypoints */}
 {routes.map(r => {
 const origin = ports.find(p => p.port_id === r.origin_port_id);
 const dest = ports.find(p => p.port_id === r.dest_port_id);
 if (!origin || !dest) return null;

 const [x1, y1] = project(origin.lat, origin.lon);
 const [x2, y2] = project(dest.lat, dest.lon);
 const isSelected = selectedRoute?.route_id === r.route_id;

 // Create curved path through waypoints
 const midX = (x1 + x2) / 2;
 const midY = (y1 + y2) / 2 - (r.route_id.includes('EUR') ? 35 : -20);

 return (
 <g key={r.route_id} onClick={() => setSelectedRoute(r)} className="cursor-pointer group">
 <path
 d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
 fill="none"
 stroke={isSelected ? '#22d3ee' : '#0e7490'}
 strokeWidth={isSelected ? '2.5' : '1.5'}
 strokeDasharray={isSelected ? 'none' : '4 3'}
 className="transition-all duration-300 group-hover:stroke-cyan-300"
 />
 </g>
 );
})}

 {/* Port Hub Nodes */}
 {ports.map(port => {
 const [cx, cy] = project(port.lat, port.lon);
 const isSelected = selectedPort?.port_id === port.port_id;

 return (
 <g
 key={port.port_id}
 onClick={() => { setSelectedPort(port); setSelectedVessel(null);}}
 className="cursor-pointer group"
 >
 {/* Pulsing ring around port */}
 {isSelected && (
 <circle cx={cx} cy={cy} r="10" fill="none" stroke="#22d3ee" strokeWidth="1" className="animate-ping opacity-60" />
 )}
 <circle
 cx={cx}
 cy={cy}
 r={isSelected ? '5.5' : '4'}
 fill={port.ops_available ? '#10b981' : '#06b6d4'}
 stroke="#ffffff"
 strokeWidth="1.2"
 className="group-hover:scale-125 transition-transform"
 />
 <text
 x={cx + 6}
 y={cy + 3}
 fill={isSelected ? '#22d3ee' : '#cbd5e1'}
 fontSize="9"
 fontFamily="monospace"
 fontWeight={isSelected ? 'bold' : 'normal'}
 >
 {port.port_id}
 </text>
 </g>
 );
})}

 {/* Simulated Moving Vessels */}
 {simulatedPositions.map(v => {
 const [vx, vy] = project(v.lat, v.lon);
 const isSelected = selectedVessel?.vessel_id === v.vessel_id;

 return (
 <g
 key={v.vessel_id}
 onClick={() => {
 const fullVessel = vessels.find(x => x.vessel_id === v.vessel_id);
 if (fullVessel) setSelectedVessel(fullVessel);
 setSelectedPort(null);
}}
 className="cursor-pointer group"
 >
 {/* Vessel radar ping */}
 <circle cx={vx} cy={vy} r={isSelected ? "12" : "8"} fill="none" stroke={isSelected ? "#22d3ee" : "#38bdf8"} strokeWidth={isSelected ? "1.5" : "0.8"} className="animate-pulse" />
 <polygon
 points={`${vx},${vy - 6} ${vx - 4},${vy + 5} ${vx + 4},${vy + 5}`}
 fill={isSelected ? "#22d3ee" : "#38bdf8"}
 stroke="#040814"
 strokeWidth="1"
 transform={`rotate(${v.heading}, ${vx}, ${vy})`}
 className="group-hover:scale-125 transition-transform"
 />
 </g>
 );
})}
 </svg>

 {/* Map Legend Floating Tag */}
 <div className="absolute bottom-3 left-3 glass-panel p-2.5 rounded-lg border border-border text-[10px] tabular-nums space-y-1.5 bg-[#060a17]/90">
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
 <span className="text-text-muted">Port with Cold-Ironing (OPS)</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
 <span className="text-text-muted">Standard Bunkering Port</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 border border-amber-400 border-dashed rounded-full" />
 <span className="text-text-muted">IMO Emission Control Area (ECA)</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-sky-400" />
 <span className="text-text-muted">Active Vessel Tracking</span>
 </div>
 </div>
 </div>
 </div>

 {/* Sidebar Inspection Drawer */}
 <div className="space-y-4">
 {selectedPort && (
 <div className="glass-card rounded-xl p-5 border border-cyan-500/30">
 <div className="flex items-center justify-between">
 <span className="text-[10px] tabular-nums px-2 py-0.5 rounded bg-cyan-950 text-primary border border-cyan-800">
 PORT HUB INSPECTOR
 </span>
 <ProvenanceBadge provenance={selectedPort.provenance} />
 </div>

 <h2 className="text-lg font-bold text-text mt-2">{selectedPort.name}</h2>
 <p className="text-xs tabular-nums text-primary">{selectedPort.port_id} · [{selectedPort.lat.toFixed(2)}°, {selectedPort.lon.toFixed(2)}°]</p>

 <div className="mt-4 space-y-2.5 text-xs tabular-nums">
 <div className="flex justify-between py-1.5 border-b border-border">
 <span className="text-text-muted">Max Draft Capacity:</span>
 <span className="text-text font-bold">{selectedPort.max_draft_m} m</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border">
 <span className="text-text-muted">Shore Power (OPS):</span>
 <span className={selectedPort.ops_available ? 'text-emerald-400 font-bold' : 'text-text-muted'}>
 {selectedPort.ops_available ? `${selectedPort.ops_slots} High-Voltage Berths` : 'Unavailable'}
 </span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border">
 <span className="text-text-muted">OPS Tariff:</span>
 <span className="text-text">${selectedPort.ops_cost_per_mwh}/MWh</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border">
 <span className="text-text-muted">Grid Carbon Intensity:</span>
 <span className="text-text">{selectedPort.ops_grid_ci_gco2_kwh} gCO₂/kWh</span>
 </div>
 </div>

 <div className="mt-4 pt-3 border-t border-border">
 <span className="text-[11px] tabular-nums text-text-muted font-semibold block mb-2">
 Bunkering Fuel Reserves (Tonnes):
 </span>
 <div className="grid grid-cols-2 gap-2 text-[11px] tabular-nums">
 {Object.entries(selectedPort.bunker_stocks ?? {}).map(([fuel, stock]) => (
 <div key={fuel} className="p-2 rounded bg-surface-alt/80 border border-border">
 <div className="text-text-muted truncate">{fuel}</div>
 <div className="text-primary font-bold mt-0.5">{typeof stock === 'number' ? stock.toLocaleString() : String(stock)} t</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {selectedVessel && (
 <div className="glass-card rounded-xl p-5 border border-cyan-500/30">
 <div className="flex items-center justify-between">
 <span className="text-[10px] tabular-nums px-2 py-0.5 rounded bg-cyan-950 text-primary border border-cyan-800">
 LIVE VESSEL NODE
 </span>
 <ProvenanceBadge provenance={selectedVessel.provenance} />
 </div>

 <h2 className="text-lg font-bold text-text mt-2">{selectedVessel.name}</h2>
 <p className="text-xs tabular-nums text-text-muted">{selectedVessel.vessel_id} · {selectedVessel.vessel_class}</p>

 <div className="mt-4 space-y-2 text-xs tabular-nums">
 <div className="flex justify-between py-1.5 border-b border-border">
 <span className="text-text-muted">Deadweight (DWT):</span>
 <span className="text-text">{selectedVessel.dwt ? selectedVessel.dwt.toLocaleString() : '—'} t</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border">
 <span className="text-text-muted">Speed Limits:</span>
 <span className="text-primary">{selectedVessel.speed_min ?? 11} - {selectedVessel.speed_max ?? 21} kts</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border">
 <span className="text-text-muted">Hull Exponent (n):</span>
 <span className="text-amber-400">{(selectedVessel.hull_exponent ?? 3.0).toFixed(2)}</span>
 </div>
 <div className="flex justify-between py-1.5 border-b border-border">
 <span className="text-text-muted">Tank Capacity:</span>
 <span className="text-text">{selectedVessel.tank_capacity_t ? selectedVessel.tank_capacity_t.toLocaleString() : '—'} t</span>
 </div>
 </div>
 </div>
 )}

 {selectedRoute && (
 <div className="glass-card rounded-xl p-5 border border-cyan-500/30">
 <div className="flex items-center justify-between">
 <span className="text-[10px] tabular-nums px-2 py-0.5 rounded bg-cyan-950 text-primary border border-cyan-800">
 ROUTE WAYPOINT PROFILE
 </span>
 <ProvenanceBadge provenance={selectedRoute.provenance} />
 </div>

 <h2 className="text-base font-bold text-text mt-2">{selectedRoute.name}</h2>
 <p className="text-xs tabular-nums text-primary">{selectedRoute.route_id} · {selectedRoute.total_distance_nm.toLocaleString()} nm</p>

 <div className="mt-3 space-y-2">
 <div className="text-[11px] tabular-nums text-text-muted font-semibold">Leg Depth & Weather Profile:</div>
 {selectedRoute.legs.map((leg, i) => (
 <div key={i} className="p-2 rounded bg-surface-alt/60 border border-border text-[11px] tabular-nums flex items-center justify-between">
 <div>
 <div className="text-slate-200">{leg.from_name} → {leg.to_name}</div>
 <div className="text-text-muted text-[10px]">Min depth: {leg.min_depth_m}m · Dist: {leg.distance_nm}nm</div>
 </div>
 {leg.is_eca && (
 <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
 ECA
 </span>
 )}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};
