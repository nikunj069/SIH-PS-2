import React, { useState} from 'react';
import { Button} from '../components/common/Button';
import { KpiTile} from '../components/common/KpiTile';
import { DataBasisChip} from '../components/common/DataBasisChip';
import { Tabs} from '../components/common/Tabs';
import { ViewModeSwitch, type ViewMode} from '../components/common/ViewModeSwitch';
import { EmptyState} from '../components/common/EmptyState';
import { ErrorState} from '../components/common/ErrorState';
import { Skeleton, CardSkeleton} from '../components/common/Skeleton';
import { Drawer} from '../components/common/Drawer';
import { DataTable, type Column} from '../components/common/DataTable';
import { Play, Sparkles, AlertTriangle, Layers} from 'lucide-react';

interface SampleRow extends Record<string, unknown> {
 id: string;
 vessel: string;
 imo: string;
 type: string;
 capacity: number;
 shorePower: boolean;
 provenance: string;
}

const sampleData: SampleRow[] = [
 { id: '1', vessel: 'Atlantic Pioneer', imo: 'IMO9811001', type: 'Container', capacity: 20000, shorePower: true, provenance: 'reported'},
 { id: '2', vessel: 'Pacific Voyager', imo: 'IMO9811002', type: 'Container', capacity: 14000, shorePower: false, provenance: 'sample data'},
 { id: '3', vessel: 'Nordic Bulk', imo: 'IMO9811003', type: 'Bulk carrier', capacity: 82000, shorePower: true, provenance: 'estimated'},
];

export const DesignSystemShowcase: React.FC = () => {
 const [viewMode, setViewMode] = useState<ViewMode>('client');
 const [activeTab, setActiveTab] = useState<'all' | 'container' | 'bulk'>('all');
 const [isDrawerOpen, setIsDrawerOpen] = useState(false);
 const [selectedRow, setSelectedRow] = useState<SampleRow | null>(null);

 const columns: Column<SampleRow>[] = [
 {
 key: 'vessel',
 header: 'Vessel',
 sortable: true,
 render: (row) => (
 <div>
 <div className="font-semibold text-text">{row.vessel}</div>
 <div className="text-xs text-text-muted tabular-nums">{row.imo}</div>
 </div>
 )
},
 { key: 'type', header: 'Type', sortable: true},
 {
 key: 'capacity',
 header: 'Capacity (DWT/TEU)',
 align: 'right',
 sortable: true,
 render: (row) => <span>{row.capacity.toLocaleString()}</span>
},
 {
 key: 'shorePower',
 header: 'Shore power',
 align: 'center',
 render: (row) => (
 <span className={row.shorePower ? 'text-success font-medium' : 'text-text-muted'}>
 {row.shorePower ? '✓ Ready' : '— Not fitted'}
 </span>
 )
},
 {
 key: 'provenance',
 header: 'Data basis',
 analystOnly: true,
 render: (row) => <DataBasisChip provenance={row.provenance} />
}
 ];

 return (
 <div className="min-h-screen bg-canvas p-8 max-w-7xl mx-auto space-y-12">
 {/* Header */}
 <div className="border-b border-border pb-6 flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-semibold text-text ">
 Design System & Component Showcase
 </h1>
 <p className="mt-1 text-base text-text-muted">
 Interactive catalog validating WCAG AA contrast (≥4.5:1), hit targets (≥40px), and client-ready ergonomics.
 </p>
 </div>
 <ViewModeSwitch mode={viewMode} onChange={setViewMode} />
 </div>

 {/* Buttons */}
 <section className="space-y-4">
 <h2 className="text-xl font-semibold text-text">Buttons & Actions</h2>
 <div className="p-6 bg-surface border border-border rounded-card space-y-6">
 <div className="flex flex-wrap items-center gap-4">
 <Button variant="primary" icon={<Play className="w-4 h-4" />}>
 Primary Action (40px)
 </Button>
 <Button variant="primary" size="lg" icon={<Sparkles className="w-5 h-5" />}>
 Hero Action (48px)
 </Button>
 <Button variant="secondary">
 Secondary Button (2px Border)
 </Button>
 <Button variant="ghost">
 Ghost / Link
 </Button>
 <Button variant="danger" icon={<AlertTriangle className="w-4 h-4" />}>
 Danger Action
 </Button>
 </div>

 <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border">
 <Button variant="primary" isLoading loadingText="Searching…">
 Loading State
 </Button>
 <Button variant="primary" disabled disabledReason="Requires completed simulation">
 Disabled Primary
 </Button>
 <Button variant="secondary" disabled disabledReason="Unavailable offline">
 Disabled Secondary
 </Button>
 </div>
 </div>
 </section>

 {/* KPI Tiles */}
 <section className="space-y-4">
 <h2 className="text-xl font-semibold text-text">KPI Summary Tiles</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <KpiTile
 label="Vessels in fleet"
 value="12"
 provenance="reported"
 tooltipText="Total active vessels in the fleet registry."
 />
 <KpiTile
 label="Emissions per tonne-mile"
 value="4.82"
 unit="gCO₂e / dwt-nm"
 delta={{
 value: "13.9%",
 direction: "down",
 isPositiveGood: false,
 comparisonText: "below baseline scenario"
}}
 provenance="estimated"
 tooltipText="Lifecycle GHG emissions per cargo distance."
 />
 <KpiTile
 label="On-time arrival rate"
 value="98.2"
 unit="%"
 delta={{
 value: "4.1%",
 direction: "up",
 isPositiveGood: true,
 comparisonText: "above baseline scenario"
}}
 provenance="simulated"
 tooltipText="Percentage of voyage legs meeting scheduled delivery windows."
 />
 <KpiTile
 label="Vessels ready for shore power"
 value={null}
 provenance="synthetic"
 tooltipText="Vessels capable of connecting to electrical shore power."
 />
 </div>
 </section>

 {/* Data Basis Chips */}
 <section className="space-y-4">
 <h2 className="text-xl font-semibold text-text">Data-Basis Chips (Quiet Provenance)</h2>
 <div className="p-6 bg-surface border border-border rounded-card flex flex-wrap gap-4">
 <DataBasisChip provenance="measured" />
 <DataBasisChip provenance="reported" />
 <DataBasisChip provenance="estimated" />
 <DataBasisChip provenance="simulated" />
 <DataBasisChip provenance="synthetic" />
 </div>
 </section>

 {/* Tabs & Controls */}
 <section className="space-y-4">
 <h2 className="text-xl font-semibold text-text">Tabs & Selectors</h2>
 <div className="p-6 bg-surface border border-border rounded-card space-y-6">
 <div>
 <span className="block text-sm font-medium text-text-muted mb-2">Pill Variant</span>
 <Tabs
 tabs={[
 { id: 'all', label: 'All vessels', badge: 12},
 { id: 'container', label: 'Container', badge: 4},
 { id: 'bulk', label: 'Bulk carrier', badge: 5},
 ]}
 activeTab={activeTab}
 onChange={setActiveTab}
 />
 </div>

 <div>
 <span className="block text-sm font-medium text-text-muted mb-2">Underline Variant</span>
 <Tabs
 variant="underline"
 tabs={[
 { id: 'all', label: 'All routes'},
 { id: 'container', label: 'Active corridors'},
 { id: 'bulk', label: 'Archived schedules'},
 ]}
 activeTab={activeTab}
 onChange={setActiveTab}
 />
 </div>
 </div>
 </section>

 {/* Table & Drawer */}
 <section className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-semibold text-text">Table & Detail Drawer</h2>
 <span className="text-xs text-text-muted">Click a row to trigger 480px drawer</span>
 </div>
 <DataTable
 columns={columns}
 data={sampleData}
 keyExtractor={(row) => row.id}
 analystMode={viewMode === 'analyst'}
 onRowClick={(row) => {
 setSelectedRow(row);
 setIsDrawerOpen(true);
}}
 selectedId={selectedRow?.id}
 />
 </section>

 {/* Empty & Error States */}
 <section className="space-y-4">
 <h2 className="text-xl font-semibold text-text">Empty & Error States</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <EmptyState
 icon={<Layers className="w-6 h-6" />}
 title="No recommended plan yet"
 description="Run 'Find the best plan' to compute optimal vessel schedules and bunker fuel allocations."
 actionLabel="Find the best plan"
 onAction={() => alert('Launching optimization...')}
 />
 <ErrorState
 title="Unable to load voyage telemetry"
 message="Local simulation server returned an unexpected status code. Please check server connectivity."
 onRetry={() => alert('Retrying connection...')}
 />
 </div>
 </section>

 {/* Skeletons */}
 <section className="space-y-4">
 <h2 className="text-xl font-semibold text-text">Loading Skeletons</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <CardSkeleton rows={3} />
 <CardSkeleton rows={3} />
 <div className="p-6 bg-surface border border-border rounded-card space-y-3">
 <Skeleton className="h-6 w-3/4" />
 <Skeleton className="h-4 w-full" />
 <Skeleton className="h-4 w-5/6" />
 <Skeleton className="h-10 w-32 rounded-control" />
 </div>
 </div>
 </section>

 {/* Detail Drawer */}
 <Drawer
 isOpen={isDrawerOpen}
 onClose={() => setIsDrawerOpen(false)}
 title={selectedRow?.vessel ?? 'Vessel Details'}
 subtitle={selectedRow?.imo}
 footer={
 <div className="flex justify-end gap-3">
 <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
 Close
 </Button>
 <Button variant="primary" onClick={() => alert('Navigating to vessel map...')}>
 View on Fleet Map
 </Button>
 </div>
}
 >
 <div className="space-y-6">
 <div>
 <h4 className="text-sm font-semibold text-text mb-2">Vessel Overview</h4>
 <dl className="grid grid-cols-2 gap-3 text-sm">
 <div className="p-3 bg-surface-alt rounded">
 <dt className="text-xs text-text-muted">Vessel Type</dt>
 <dd className="font-medium text-text">{selectedRow?.type}</dd>
 </div>
 <div className="p-3 bg-surface-alt rounded">
 <dt className="text-xs text-text-muted">Capacity</dt>
 <dd className="font-medium text-text">{selectedRow?.capacity} DWT</dd>
 </div>
 <div className="p-3 bg-surface-alt rounded">
 <dt className="text-xs text-text-muted">Shore Power</dt>
 <dd className="font-medium text-text">
 {selectedRow?.shorePower ? 'Can connect at berth' : 'Not fitted'}
 </dd>
 </div>
 <div className="p-3 bg-surface-alt rounded">
 <dt className="text-xs text-text-muted">Data Basis</dt>
 <dd className="font-medium text-text">
 <DataBasisChip provenance={selectedRow?.provenance} />
 </dd>
 </div>
 </dl>
 </div>
 </div>
 </Drawer>
 </div>
 );
};
