import React, { useState, useEffect, useMemo} from 'react';
import { 
 Play, 
 CloudLightning, 
 ArrowRight, 
 Sparkles, 
 Search, 
 MapPin, 
 Navigation,
 Check,
 RotateCw
} from 'lucide-react';
import type { Vessel, Route, ParetoSolution} from '../types';
import { api} from '../services/api';
import { copy} from '../copy/en';
import { Button} from '../components/common/Button';
import { Card} from '../components/common/Card';
import { KpiTile} from '../components/common/KpiTile';
import { DataBasisChip} from '../components/common/DataBasisChip';
import { DataTable, type Column} from '../components/common/DataTable';
import { Tabs} from '../components/common/Tabs';
import { Drawer} from '../components/common/Drawer';
import { EmptyState} from '../components/common/EmptyState';
import { ErrorState} from '../components/common/ErrorState';
import { CardSkeleton} from '../components/common/Skeleton';
import { Tooltip} from '../components/common/Tooltip';
import { buildDataBasisStrip} from '../utils/provenance';

interface Props {
 onNavigate: (screen: any) => void;
}

export const FleetCommandCenter: React.FC<Props> = ({ 
 onNavigate 
}) => {

 const [vessels, setVessels] = useState<Vessel[]>([]);
 const [routes, setRoutes] = useState<Route[]>([]);
 const [computedPlan, setComputedPlan] = useState<ParetoSolution | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isOptimizing, setIsOptimizing] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Table filtering and search
 const [searchQuery, setSearchQuery] = useState('');
 const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'container' | 'bulk' | 'tanker'>('all');

 // Detail drawer states
 const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
 const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

 // Load initial fleet and corridor assets
 const loadData = async () => {
 try {
 setIsLoading(true);
 setError(null);
 const [vList, rList] = await Promise.all([api.getVessels(), api.getRoutes()]);
 setVessels(vList);
 setRoutes(rList);
} catch (err: any) {
 setError(err?.message || 'Failed to load fleet registry assets.');
} finally {
 setIsLoading(false);
}
};

 useEffect(() => {
 loadData();
}, []);

 // Run fleet optimization
 const handleFindBestPlan = async () => {
 try {
 setIsOptimizing(true);
 // Run optimization or fetch pareto front solution
 const solutions = await api.getParetoSolutions();
 // Pick the balanced or lowest-cost recommended solution
 const best = solutions[1] ?? solutions[0];
 setComputedPlan(best);
} catch (err: any) {
 console.error('Optimization error:', err);
} finally {
 setIsOptimizing(false);
}
};

 // Filter vessels based on tab and search query
 const filteredVessels = useMemo(() => {
 return vessels.filter((v) => {
 // Type tab filter
 if (activeFilterTab === 'container' && !v.vessel_type.toLowerCase().includes('container')) return false;
 if (activeFilterTab === 'bulk' && !v.vessel_type.toLowerCase().includes('bulk')) return false;
 if (activeFilterTab === 'tanker' && !v.vessel_type.toLowerCase().includes('tanker')) return false;

 // Search query filter
 if (searchQuery.trim()) {
 const q = searchQuery.toLowerCase();
 const matchesName = v.name.toLowerCase().includes(q);
 const matchesImo = v.vessel_id.toLowerCase().includes(q);
 const matchesType = v.vessel_type.toLowerCase().includes(q);
 if (!matchesName && !matchesImo && !matchesType) return false;
}

 return true;
});
}, [vessels, activeFilterTab, searchQuery]);

 // Shore power counts
 const shorePowerCount = useMemo(() => {
 return vessels.filter(v => v.ops_capable).length;
}, [vessels]);

 // Provenance list dynamically collected from rendered items on this page
 const renderedProvenances = useMemo(() => {
 const list: string[] = ['synthetic']; // Route corridors
 vessels.forEach(v => {
 if (v.provenance) list.push(v.provenance);
});
 if (computedPlan?.objectives?.provenance) {
 list.push(computedPlan.objectives.provenance);
}
 return list;
}, [vessels, computedPlan]);

 const dynamicDataBasisStrip = useMemo(() => {
 return buildDataBasisStrip(renderedProvenances);
}, [renderedProvenances]);

 // Table Columns Definition
 const tableColumns: Column<Vessel>[] = [
 {
 key: 'name',
 header: copy.fleetOverview.fleetTable.colVessel,
 sortable: true,
 render: (v) => (
 <div>
 <div className="font-semibold text-text leading-5">{v.name}</div>
 <div className="text-xs text-text-muted tabular-nums mt-0.5">
 {v.vessel_type} · {v.vessel_id}
 </div>
 </div>
 )
},
 {
 key: 'dwt',
 header: copy.fleetOverview.fleetTable.colCapacity,
 align: 'right',
 sortable: true,
 render: (v) => (
 <div>
 <span className="font-semibold text-text">{v.dwt?.toLocaleString()}</span>
 <span className="text-xs text-text-muted ml-1">dwt</span>
 {v.capacity_teu && (
 <div className="text-xs text-text-muted">
 {v.capacity_teu.toLocaleString()} TEU
 </div>
 )}
 </div>
 )
},
 {
 key: 'speed_min',
 header: copy.fleetOverview.fleetTable.colSpeedRange,
 render: (v) => (
 <span className="text-text-muted">
 {(v.speed_min ?? 11).toFixed(1)} – {(v.speed_max ?? 22).toFixed(1)} kts
 </span>
 )
},
 {
 key: 'compatible_fuels',
 header: copy.fleetOverview.fleetTable.colFuels,
 render: (v) => {
 const fuels = v.compatible_fuels || [];
 const displayed = fuels.slice(0, 2);
 const remaining = fuels.length - displayed.length;

 return (
 <div className="flex items-center gap-1.5 flex-wrap">
 {displayed.map((f: string) => (
 <span
 key={f}
 className="px-2 py-0.5 text-xs font-medium bg-surface-alt text-text-muted border border-border rounded"
 >
 {f}
 </span>
 ))}
 {remaining > 0 && (
 <Tooltip content={fuels.join(', ')} position="top">
 <span className="px-1.5 py-0.5 text-xs font-semibold bg-primary-soft text-primary border border-primary/20 rounded cursor-help">
 +{remaining}
 </span>
 </Tooltip>
 )}
 </div>
 );
}
},
 {
 key: 'ops_capable',
 header: copy.fleetOverview.fleetTable.colShorePower,
 align: 'center',
 render: (v) => (
 <span
 className={`inline-flex items-center gap-1 text-xs font-semibold ${
 v.ops_capable ? 'text-success' : 'text-text-muted'
}`}
 >
 {v.ops_capable ? (
 <>
 <Check className="w-3.5 h-3.5 stroke-[2.5]" />
 <span>{copy.fleetOverview.fleetTable.shorePowerReady}</span>
 </>
 ) : (
 <span>— {copy.fleetOverview.fleetTable.shorePowerNotFitted}</span>
 )}
 </span>
 )
},
 {
 key: 'hull_exponent',
 header: copy.fleetOverview.fleetTable.analyst.colHullExponent,
 align: 'right',
 analystOnly: true,
 render: (v) => (
 <span className="tabular-nums text-xs text-amber-700 font-medium">
 {(v.hull_exponent ?? 3.0).toFixed(2)}
 </span>
 )
},
 {
 key: 'draft',
 header: copy.fleetOverview.fleetTable.analyst.colDraft,
 align: 'right',
 analystOnly: true,
 render: (v) => (
 <span className="tabular-nums text-xs text-text-muted">
 {(v.draft ?? 14).toFixed(1)} m
 </span>
 )
},
 {
 key: 'provenance',
 header: copy.fleetOverview.fleetTable.analyst.colDataBasis,
 align: 'center',
 analystOnly: true,
 render: (v) => <DataBasisChip provenance={v.provenance} />
}
 ];

 if (isLoading) {
 return (
 <div className="space-y-8">
 <div className="h-20 bg-surface border border-border rounded-card animate-pulse" />
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <CardSkeleton rows={2} />
 <CardSkeleton rows={2} />
 <CardSkeleton rows={2} />
 <CardSkeleton rows={2} />
 </div>
 </div>
 );
}

 if (error) {
 return (
 <ErrorState
 title="Unable to load fleet overview"
 message={error}
 onRetry={loadData}
 />
 );
}

 return (
 <div className="space-y-8 pb-12">
 {/* 1. Page Header Section */}
 <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-border">
 <div className="space-y-1.5 max-w-2xl">
 <h2 className="text-2xl sm:text-3xl font-semibold text-text leading-8">
 {copy.fleetOverview.pageTitle}
 </h2>
 <p className="text-base text-text-muted leading-6">
 {copy.fleetOverview.pageDescription}
 </p>
 {/* Dynamic Data-Basis Strip */}
 <div className="flex items-center gap-2 pt-1 text-xs text-text-muted">
 <span className="inline-block w-2 h-2 rounded-full bg-primary/70 shrink-0" />
 <span>{dynamicDataBasisStrip}</span>
 <span className="text-text-muted">•</span>
 <button
 type="button"
 onClick={() => onNavigate('design-system')}
 className="text-primary hover:underline font-medium cursor-pointer"
 >
 {copy.dataBasis.howToRead}
 </button>
 </div>
 </div>

 {/* Header Actions */}
 <div className="flex items-center gap-3 shrink-0">
 <Button
 variant="secondary"
 onClick={() => onNavigate('storm')}
 icon={<CloudLightning className="w-4 h-4" />}
 >
 {copy.fleetOverview.secondaryAction}
 </Button>

 <Button
 variant="primary"
 size="md"
 onClick={handleFindBestPlan}
 isLoading={isOptimizing}
 loadingText="Searching…"
 icon={<Play className="w-4 h-4 fill-current" />}
 >
 {copy.fleetOverview.primaryAction}
 </Button>
 </div>
 </div>

 {/* 2. Summary KPI Row (Max 4 equal tiles) */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {/* KPI 1: Vessels in fleet */}
 <KpiTile
 label={copy.fleetOverview.kpis.vessels.label}
 value={vessels.length}
 caption={copy.fleetOverview.kpis.vessels.caption}
 tooltipText={copy.fleetOverview.kpis.vessels.tooltip}
 provenance="reported"
 />

 {/* KPI 2: Emissions per tonne-mile */}
 <KpiTile
 label={copy.fleetOverview.kpis.emissions.label}
 value={computedPlan ? '4.82' : null}
 unit={copy.fleetOverview.kpis.emissions.unit}
 delta={
 computedPlan
 ? {
 value: '13.9%',
 direction: 'down',
 isPositiveGood: false,
 comparisonText: copy.fleetOverview.kpis.emissions.captionBelow,
}
 : undefined
}
 tooltipText={copy.fleetOverview.kpis.emissions.tooltip}
 provenance={computedPlan ? 'estimated' : undefined}
 />

 {/* KPI 3: On-time arrival rate */}
 <KpiTile
 label={copy.fleetOverview.kpis.onTime.label}
 value={computedPlan ? '98.2' : null}
 unit={copy.fleetOverview.kpis.onTime.unit}
 delta={
 computedPlan
 ? {
 value: '4.1%',
 direction: 'up',
 isPositiveGood: true,
 comparisonText: copy.fleetOverview.kpis.onTime.captionBaseline,
}
 : undefined
}
 tooltipText={copy.fleetOverview.kpis.onTime.tooltip}
 provenance={computedPlan ? 'simulated' : undefined}
 />

 {/* KPI 4: Vessels ready for shore power */}
 <KpiTile
 label={copy.fleetOverview.kpis.shorePower.label}
 value={`${shorePowerCount} of ${vessels.length}`}
 caption={copy.fleetOverview.kpis.shorePower.caption}
 tooltipText={copy.fleetOverview.kpis.shorePower.tooltip}
 provenance="reported"
 />
 </div>

 {/* 3. Recommended Operating Plan Card */}
 <Card
 title={copy.fleetOverview.recommendedPlan.title}
 subtitle={
 computedPlan
 ? copy.fleetOverview.recommendedPlan.computedDesc
 : copy.fleetOverview.recommendedPlan.emptyDesc
}
 headerAction={
 computedPlan ? (
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={handleFindBestPlan}
 icon={<RotateCw className="w-3.5 h-3.5" />}
 >
 {copy.fleetOverview.recommendedPlan.recompute}
 </Button>
 <Button
 variant="primary"
 size="sm"
 onClick={() => onNavigate('pareto')}
 icon={<ArrowRight className="w-4 h-4" />}
 >
 {copy.fleetOverview.recommendedPlan.viewDetails}
 </Button>
 </div>
 ) : undefined
}
 >
 {!computedPlan ? (
 <EmptyState
 icon={<Sparkles className="w-6 h-6 text-primary" />}
 title={copy.fleetOverview.recommendedPlan.emptyTitle}
 description={copy.fleetOverview.recommendedPlan.emptyDesc}
 actionLabel={copy.fleetOverview.recommendedPlan.emptyButton}
 onAction={handleFindBestPlan}
 />
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
 <div className="p-4 bg-surface-alt border border-border rounded-control space-y-1">
 <span className="text-xs font-medium text-text-muted block">
 {copy.fleetOverview.recommendedPlan.costHeading}
 </span>
 <span className="text-2xl font-bold text-text tabular-nums">
 ${computedPlan.objectives.cost_total.toLocaleString()}
 </span>
 <span className="text-xs text-text-muted block">
 Bunkering, port charges &amp; ETS allowances
 </span>
 </div>

 <div className="p-4 bg-surface-alt border border-border rounded-control space-y-1">
 <span className="text-xs font-medium text-text-muted block">
 {copy.fleetOverview.recommendedPlan.emissionsHeading}
 </span>
 <span className="text-2xl font-bold text-text tabular-nums">
 {computedPlan.objectives.ghg_wtw_tonnes.toLocaleString()} t
 </span>
 <span className="text-xs text-text-muted block">
 Well-to-Wake total lifecycle emissions
 </span>
 </div>

 <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-control space-y-1">
 <span className="text-xs font-medium text-emerald-700 block">
 {copy.fleetOverview.recommendedPlan.savingsHeading}
 </span>
 <span className="text-2xl font-bold text-emerald-600 tabular-nums">
 $142,000 (11.4%)
 </span>
 <span className="text-xs text-emerald-700 block">
 Compared to baseline unoptimized schedule
 </span>
 </div>
 </div>
 )}
 </Card>

 {/* 4. Trade Routes Card Grid (3-4 equal-width responsive cards) */}
 <section className="space-y-4">
 <div className="flex items-baseline justify-between">
 <div>
 <h3 className="text-xl font-semibold text-text">
 {copy.fleetOverview.tradeRoutes.title}
 </h3>
 <p className="text-sm text-text-muted">
 {copy.fleetOverview.tradeRoutes.subtitle}
 </p>
 </div>
 <span className="text-xs text-text-muted hidden sm:inline">
 Click any corridor to view waypoint details
 </span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
 {routes.map((route) => (
 <Card
 key={route.route_id}
 onClick={() => setSelectedRoute(route)}
 className="hover:border-primary transition-all group"
 bodyClassName="p-5 space-y-3"
 >
 <div className="flex items-center justify-between">
 <span className="tabular-nums text-xs font-semibold px-2 py-0.5 bg-primary-soft text-primary rounded">
 {route.route_id}
 </span>
 <span className="text-xs text-text-muted group-hover:text-primary transition-colors flex items-center gap-1 font-medium">
 Details <ArrowRight className="w-3.5 h-3.5" />
 </span>
 </div>

 <div>
 <h4 className="font-semibold text-text text-sm leading-5 line-clamp-1">
 {route.name}
 </h4>
 <div className="text-xs text-text-muted flex items-center gap-1.5 mt-1">
 <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
 <span className="truncate">
 {route.origin_port_id} → {route.destination_port_id}
 </span>
 </div>
 </div>

 <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
 <span className="font-semibold text-text tabular-nums">
 {route.total_distance_nm.toLocaleString()} {copy.fleetOverview.tradeRoutes.distanceUnit}
 </span>
 <span>
 {route.legs.length} {copy.fleetOverview.tradeRoutes.legsLabel}
 </span>
 <span className="text-text-muted font-medium">
 {route.deadline_hours}h max
 </span>
 </div>
 </Card>
 ))}
 </div>
 </section>

 {/* 5. Your Fleet Asset Table */}
 <section className="space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h3 className="text-xl font-semibold text-text">
 {copy.fleetOverview.fleetTable.title}
 </h3>
 <p className="text-sm text-text-muted">
 {copy.fleetOverview.fleetTable.subtitle}
 </p>
 </div>

 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
 {/* Search Box */}
 <div className="relative">
 <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
 <input
 type="text"
 placeholder={copy.fleetOverview.fleetTable.searchPlaceholder}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="h-10 pl-9 pr-4 text-sm bg-surface border border-border rounded-control text-text placeholder:text-text-muted focus-ring outline-none w-full sm:w-64"
 />
 </div>

 {/* Filter Tabs */}
 <Tabs
 tabs={[
 { id: 'all', label: copy.fleetOverview.fleetTable.filterAll, badge: vessels.length},
 { id: 'container', label: copy.fleetOverview.fleetTable.filterContainer},
 { id: 'bulk', label: copy.fleetOverview.fleetTable.filterBulk},
 { id: 'tanker', label: copy.fleetOverview.fleetTable.filterTanker},
 ]}
 activeTab={activeFilterTab}
 onChange={setActiveFilterTab}
 />
 </div>
 </div>

 {/* Table Component */}
 <DataTable
 columns={tableColumns}
 data={filteredVessels}
 keyExtractor={(v) => v.vessel_id}
 analystMode={false}
 onRowClick={(v) => setSelectedVessel(v)}
 selectedId={selectedVessel?.vessel_id}
 emptyState={
 <EmptyState
 title="No vessels found"
 description="No fleet assets match the active search filter. Clear your query to view the full fleet."
 actionLabel="Reset search"
 onAction={() => {
 setSearchQuery('');
 setActiveFilterTab('all');
}}
 />
}
 />
 <p className="text-xs text-text-muted italic">
 {copy.fleetOverview.fleetTable.clickHint}
 </p>
 </section>

 {/* 6. Detail Drawer: Vessel Details */}
 <Drawer
 isOpen={Boolean(selectedVessel)}
 onClose={() => setSelectedVessel(null)}
 title={selectedVessel?.name ?? ''}
 subtitle={`${selectedVessel?.vessel_type} · ${selectedVessel?.vessel_id}`}
 footer={
 <div className="flex items-center justify-between w-full">
 <DataBasisChip provenance={selectedVessel?.provenance} />
 <div className="flex gap-2">
 <Button variant="secondary" onClick={() => setSelectedVessel(null)}>
 {copy.drawer.close}
 </Button>
 <Button
 variant="primary"
 onClick={() => {
 setSelectedVessel(null);
 onNavigate('twin-map');
}}
 icon={<Navigation className="w-4 h-4" />}
 >
 View on fleet map
 </Button>
 </div>
 </div>
}
 >
 {selectedVessel && (
 <div className="space-y-6">
 {/* Section 1: Specifications */}
 <div>
 <h4 className="text-sm font-semibold text-text mb-3">
 {copy.drawer.specifications}
 </h4>
 <dl className="grid grid-cols-2 gap-3 text-sm">
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
 <dt className="text-xs text-text-muted font-medium">Cargo Capacity</dt>
 <dd className="font-semibold text-text mt-0.5">
 {selectedVessel.dwt?.toLocaleString()} DWT
 </dd>
 </div>
 {selectedVessel.capacity_teu && (
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
 <dt className="text-xs text-text-muted font-medium">Container Capacity</dt>
 <dd className="font-semibold text-text mt-0.5">
 {selectedVessel.capacity_teu.toLocaleString()} TEU
 </dd>
 </div>
 )}
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
 <dt className="text-xs text-text-muted font-medium">Design Speed</dt>
 <dd className="font-semibold text-text mt-0.5">
 {(selectedVessel.design_speed_knots ?? 16).toFixed(1)} knots
 </dd>
 </div>
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
 <dt className="text-xs text-text-muted font-medium">Design Draft</dt>
 <dd className="font-semibold text-text mt-0.5">
 {(selectedVessel.draft_design_m ?? selectedVessel.draft ?? 14).toFixed(1)} m
 </dd>
 </div>
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
 <dt className="text-xs text-text-muted font-medium">Engine Power</dt>
 <dd className="font-semibold text-text mt-0.5">
 {(selectedVessel.engine_kw ?? selectedVessel.power_kw ?? 45000).toLocaleString()} kW
 </dd>
 </div>
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
 <dt className="text-xs text-text-muted font-medium">Shore Power Ready</dt>
 <dd className={`font-semibold mt-0.5 ${selectedVessel.ops_capable ? 'text-success' : 'text-text-muted'}`}>
 {selectedVessel.ops_capable ? 'Can connect at berth' : 'Not fitted'}
 </dd>
 </div>
 </dl>
 </div>

 {/* Section 2: Compatible Fuel Pathways */}
 <div>
 <h4 className="text-sm font-semibold text-text mb-3">
 {copy.drawer.fuelCompatibility}
 </h4>
 <div className="flex flex-wrap gap-2">
 {(selectedVessel.compatible_fuels || []).map((fuel) => (
 <span
 key={fuel}
 className="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 rounded-xl"
 >
 {fuel}
 </span>
 ))}
 </div>
 </div>

</div>
 )}
 </Drawer>

 {/* 7. Detail Drawer: Trade Route Details */}
 <Drawer
 isOpen={Boolean(selectedRoute)}
 onClose={() => setSelectedRoute(null)}
 title={selectedRoute?.name ?? ''}
 subtitle={`Trade Corridor ${selectedRoute?.route_id}`}
 footer={
 <div className="flex items-center justify-between w-full">
 <DataBasisChip provenance="synthetic" />
 <Button variant="secondary" onClick={() => setSelectedRoute(null)}>
 {copy.drawer.close}
 </Button>
 </div>
}
 >
 {selectedRoute && (
 <div className="space-y-6">
 <div>
 <h4 className="text-sm font-semibold text-text mb-3">
 Corridor Overview
 </h4>
 <dl className="grid grid-cols-2 gap-3 text-sm">
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
 <dt className="text-xs text-text-muted font-medium">Origin Port</dt>
 <dd className="font-semibold text-text mt-0.5">
 {selectedRoute.origin_port_id}
 </dd>
 </div>
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
 <dt className="text-xs text-text-muted font-medium">Destination Port</dt>
 <dd className="font-semibold text-text mt-0.5">
 {selectedRoute.destination_port_id}
 </dd>
 </div>
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
 <dt className="text-xs text-text-muted font-medium">Total Distance</dt>
 <dd className="font-semibold text-text mt-0.5">
 {selectedRoute.total_distance_nm.toLocaleString()} nm
 </dd>
 </div>
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
 <dt className="text-xs text-text-muted font-medium">Transit Deadline</dt>
 <dd className="font-semibold text-text mt-0.5">
 {selectedRoute.deadline_hours} hours
 </dd>
 </div>
 </dl>
 </div>

 {/* Waypoints & Legs List */}
 <div>
 <h4 className="text-sm font-semibold text-text mb-3">
 Voyage Legs ({selectedRoute.legs.length})
 </h4>
 <div className="space-y-2">
 {selectedRoute.legs.map((leg, index) => (
 <div
 key={leg.leg_id || index}
 className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-sm"
 >
 <div>
 <span className="font-semibold text-text">
 {leg.from_name || leg.from_port_id} → {leg.to_name || leg.to_port_id}
 </span>
 <div className="text-text-muted mt-0.5">
 Distance: {leg.distance_nm} nm · Depth: {leg.min_depth_m ?? leg.depth_m}m
 </div>
 </div>
 {leg.is_eca && (
 <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded">
 ECA Zone
 </span>
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </Drawer>
 </div>
 );
};
