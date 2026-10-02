import React, { useState, useEffect } from 'react';
import { Navigation, Layers, BarChart3, CheckCircle } from 'lucide-react';
import type { Port, Route, Vessel } from '../types';
import { api } from '../services/api';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip as LeafletTooltip, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create custom icons for ports and vessels to avoid default Leaflet markers
const createPortIcon = (isSelected: boolean, isOps: boolean) => {
  return L.divIcon({
    className: 'custom-port-icon',
    html: `<div style="
      width: ${isSelected ? '14px' : '10px'}; 
      height: ${isSelected ? '14px' : '10px'}; 
      background-color: ${isOps ? '#10b981' : '#0ea5e9'}; 
      border: 2px solid white; 
      border-radius: 50%;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
      ${isSelected ? 'animation: pulse 2s infinite;' : ''}
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const createVesselIcon = (isSelected: boolean, heading: number) => {
  return L.divIcon({
    className: 'custom-vessel-icon',
    html: `<div style="
      transform: rotate(${heading}deg);
      width: 0; 
      height: 0; 
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 12px solid ${isSelected ? '#0B63CE' : '#38bdf8'};
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

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

  // Mock vessel positions along the routes
  const simulatedPositions = [
    { vessel_id: 'V-CONT-001', name: 'Pacific Horizon', lat: 8.5, lon: 78.0, heading: 285, speed: 14.2, status: 'Underway' },
    { vessel_id: 'V-CONT-002', name: 'Emerald Titan', lat: 28.5, lon: -150.0, heading: 80, speed: 15.1, status: 'Underway' },
    { vessel_id: 'V-BULK-001', name: 'Nordic Pioneer', lat: 42.0, lon: -35.0, heading: 260, speed: 12.0, status: 'Underway' },
    { vessel_id: 'V-TANK-001', name: 'Solar Voyager', lat: 18.0, lon: 115.0, heading: 35, speed: 13.5, status: 'Underway' },
    { vessel_id: 'V-CONT-003', name: 'Baltic Osprey', lat: 51.95, lon: 4.14, heading: 0, speed: 0.0, status: 'Cold-Ironing' },
    { vessel_id: 'V-CONT-004', name: 'Malacca Express', lat: 1.29, lon: 103.85, heading: 0, speed: 0.0, status: 'Bunkering' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface shadow-sm p-4 rounded-xl border border-border">
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
              className={`px-2.5 py-1 rounded text-xs tabular-nums capitalize transition-all cursor-pointer ${
                activeLayer === layer
                  ? 'bg-primary-soft text-primary font-semibold border border-primary/20'
                  : 'text-text-muted hover:text-text hover:bg-surface'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 rounded-2xl p-4 border border-border bg-surface shadow-sm relative overflow-hidden z-0">
          
          {/* Leaflet Map */}
          <div className="relative w-full aspect-[16/9] min-h-[460px] bg-surface-alt rounded-xl overflow-hidden border border-border/80">
            <MapContainer 
              center={[20, 0]} 
              zoom={2.5} 
              style={{ height: '100%', width: '100%', background: '#F8FAFC' }}
              minZoom={2}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />

              {/* ECA Zones (North Sea / Baltic & US Coasts) */}
              {(activeLayer === 'all' || activeLayer === 'eca') && (
                <>
                  <Circle 
                    center={[55.0, 10.0]} 
                    radius={1200000} 
                    pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.1, weight: 1, dashArray: '5, 5' }} 
                  >
                    <LeafletTooltip>ECA (SOx/NOx) North Sea/Baltic</LeafletTooltip>
                  </Circle>
                  <Circle 
                    center={[35.0, -75.0]} 
                    radius={1500000} 
                    pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.1, weight: 1, dashArray: '5, 5' }} 
                  >
                    <LeafletTooltip>North American ECA</LeafletTooltip>
                  </Circle>
                </>
              )}

              {/* Shipping Corridors & Waypoints */}
              {routes.map(r => {
                const origin = ports.find(p => p.port_id === r.origin_port_id);
                const dest = ports.find(p => p.port_id === r.dest_port_id);
                if (!origin || !dest) return null;

                const isSelected = selectedRoute?.route_id === r.route_id;
                
                // For a curved effect in a real map, you'd use Leaflet.curve or Geodesic lines. 
                // We'll draw a straight polyline here for the digital twin routes.
                const positions: [number, number][] = [
                  [origin.lat, origin.lon],
                  [dest.lat, dest.lon]
                ];

                return (
                  <Polyline 
                    key={r.route_id} 
                    positions={positions}
                    pathOptions={{ 
                      color: isSelected ? '#0B63CE' : '#94A3B8', 
                      weight: isSelected ? 3 : 1.5,
                      dashArray: isSelected ? undefined : '5, 5'
                    }}
                    eventHandlers={{
                      click: () => setSelectedRoute(r)
                    }}
                  >
                    <LeafletTooltip>{r.name}</LeafletTooltip>
                  </Polyline>
                );
              })}

              {/* Port Hub Nodes */}
              {ports.map(port => {
                const isSelected = selectedPort?.port_id === port.port_id;
                return (
                  <Marker 
                    key={port.port_id}
                    position={[port.lat, port.lon]}
                    icon={createPortIcon(isSelected, port.ops_available)}
                    eventHandlers={{
                      click: () => { setSelectedPort(port); setSelectedVessel(null); }
                    }}
                  >
                    <LeafletTooltip permanent={isSelected} direction="right" offset={[10, 0]}>
                      <span className="font-semibold">{port.port_id}</span>
                    </LeafletTooltip>
                  </Marker>
                );
              })}

              {/* Simulated Moving Vessels */}
              {simulatedPositions.map(v => {
                const isSelected = selectedVessel?.vessel_id === v.vessel_id;
                return (
                  <Marker 
                    key={v.vessel_id}
                    position={[v.lat, v.lon]}
                    icon={createVesselIcon(isSelected, v.heading)}
                    eventHandlers={{
                      click: () => {
                        const fullVessel = vessels.find(x => x.vessel_id === v.vessel_id);
                        if (fullVessel) setSelectedVessel(fullVessel);
                        setSelectedPort(null);
                      }
                    }}
                  >
                    <LeafletTooltip>
                      <strong>{v.name}</strong><br/>
                      {v.speed} kts · {v.status}
                    </LeafletTooltip>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Map Legend Floating Tag */}
          <div className="absolute bottom-6 left-6 bg-surface/90 backdrop-blur-sm p-3 rounded-lg border border-border text-[11px] tabular-nums space-y-2 shadow-sm z-[1000]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
              <span className="text-text font-medium">Port with Cold-Ironing (OPS)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500 border-2 border-white shadow-sm" />
              <span className="text-text font-medium">Standard Bunkering Port</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border border-amber-500 border-dashed rounded-full bg-amber-500/10" />
              <span className="text-text font-medium">IMO Emission Control Area (ECA)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-primary drop-shadow-sm" />
              <span className="text-text font-medium">Active Vessel Tracking</span>
            </div>
          </div>
        </div>

        {/* Sidebar Inspection Drawer */}
        <div className="space-y-4">
          {selectedPort && (
            <div className="rounded-xl p-5 border border-border bg-surface shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tabular-nums px-2 py-0.5 rounded bg-primary-soft text-primary border border-primary/20">
                  PORT HUB INSPECTOR
                </span>
                <ProvenanceBadge provenance={selectedPort.provenance} />
              </div>

              <h2 className="text-lg font-bold text-text mt-3">{selectedPort.name}</h2>
              <p className="text-xs tabular-nums text-text-muted">{selectedPort.port_id} · [{selectedPort.lat.toFixed(2)}°, {selectedPort.lon.toFixed(2)}°]</p>

              <div className="mt-5 space-y-3 text-xs tabular-nums">
                <div className="flex justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Max Draft Capacity:</span>
                  <span className="text-text font-bold">{selectedPort.max_draft_m} m</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Shore Power (OPS):</span>
                  <span className={selectedPort.ops_available ? 'text-emerald-600 font-bold' : 'text-text-muted'}>
                    {selectedPort.ops_available ? `${selectedPort.ops_slots} High-Voltage Berths` : 'Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">OPS Tariff:</span>
                  <span className="text-text">${selectedPort.ops_cost_per_mwh}/MWh</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Grid Carbon Intensity:</span>
                  <span className="text-text">{selectedPort.ops_grid_ci_gco2_kwh} gCO₂/kWh</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <span className="text-[11px] tabular-nums text-text-muted font-semibold block mb-3 uppercase tracking-wider">
                  Bunkering Fuel Reserves
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] tabular-nums">
                  {Object.entries(selectedPort.bunker_stocks ?? {}).map(([fuel, stock]) => (
                    <div key={fuel} className="p-2.5 rounded-lg bg-surface-alt border border-border">
                      <div className="text-text-muted truncate capitalize">{fuel.replace('_', ' ')}</div>
                      <div className="text-text font-bold mt-1">{typeof stock === 'number' ? stock.toLocaleString() : String(stock)} t</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedVessel && (
            <div className="rounded-xl p-5 border border-border bg-surface shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tabular-nums px-2 py-0.5 rounded bg-primary-soft text-primary border border-primary/20">
                  LIVE VESSEL NODE
                </span>
                <ProvenanceBadge provenance={selectedVessel.provenance} />
              </div>

              <h2 className="text-lg font-bold text-text mt-3">{selectedVessel.name}</h2>
              <p className="text-xs tabular-nums text-text-muted">{selectedVessel.vessel_id} · {selectedVessel.vessel_class}</p>

              <div className="mt-5 space-y-3 text-xs tabular-nums">
                <div className="flex justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Deadweight (DWT):</span>
                  <span className="text-text">{selectedVessel.dwt ? selectedVessel.dwt.toLocaleString() : '—'} t</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Speed Limits:</span>
                  <span className="text-primary font-bold">{selectedVessel.speed_min ?? 11} - {selectedVessel.speed_max ?? 21} kts</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Hull Exponent (n):</span>
                  <span className="text-text">{(selectedVessel.hull_exponent ?? 3.0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Tank Capacity:</span>
                  <span className="text-text">{selectedVessel.tank_capacity_t ? selectedVessel.tank_capacity_t.toLocaleString() : '—'} t</span>
                </div>
              </div>
            </div>
          )}

          {selectedRoute && (
            <div className="rounded-xl p-5 border border-border bg-surface shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tabular-nums px-2 py-0.5 rounded bg-primary-soft text-primary border border-primary/20">
                  ROUTE WAYPOINT PROFILE
                </span>
                <ProvenanceBadge provenance={selectedRoute.provenance} />
              </div>

              <h2 className="text-base font-bold text-text mt-3">{selectedRoute.name}</h2>
              <p className="text-xs tabular-nums text-text-muted">{selectedRoute.route_id} · <span className="text-primary font-semibold">{selectedRoute.total_distance_nm.toLocaleString()} nm</span></p>

              <div className="mt-5 space-y-2">
                <div className="text-[11px] tabular-nums text-text-muted font-semibold uppercase tracking-wider mb-3">Leg Depth & Weather Profile</div>
                {selectedRoute.legs.map((leg, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface-alt border border-border text-[11px] tabular-nums flex items-center justify-between">
                    <div>
                      <div className="text-text font-medium">{leg.from_name} → {leg.to_name}</div>
                      <div className="text-text-muted text-[10px] mt-1">Min depth: {leg.min_depth_m}m · Dist: {leg.distance_nm}nm</div>
                    </div>
                    {leg.is_eca && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
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
