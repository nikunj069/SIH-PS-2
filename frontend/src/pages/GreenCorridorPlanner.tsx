import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { ArrowUpCircle, Zap, Droplet } from 'lucide-react';

export const GreenCorridorPlanner: React.FC = () => {
    const [upgrades, setUpgrades] = useState<any[]>([]);
    const [corridor, setCorridor] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/corridor/plan');
                if (!res.ok) throw new Error('Failed to fetch green corridor plan');
                const data = await res.json();
                setCorridor(data.corridor_name);
                setUpgrades(data.recommended_upgrades);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    if (loading) return <div>Analyzing infrastructure pathways...</div>;
    if (error) return <div>Error loading recommendations: {error}</div>;

    const getIcon = (type: string) => {
        if (type === 'shore_power') return <Zap className="w-5 h-5 text-amber-500" />;
        return <Droplet className="w-5 h-5 text-emerald-500" />;
    };

    const getLabel = (type: string) => {
        if (type === 'shore_power') return 'Cold-Ironing (Shore Power) Install';
        return 'Green Methanol Bunkering Terminal';
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold text-text">Port Transition Readiness</h2>
                <p className="text-sm text-text-muted">Strategic ROI recommendations for upgrading ports along the {corridor}.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {upgrades.map((upgrade, i) => (
                    <Card key={`${upgrade.port_id}-${upgrade.upgrade_type}`} className="p-5 flex gap-4">
                        <div className="flex flex-col items-center justify-center p-3 bg-surface-alt rounded-lg h-16 w-16">
                            {getIcon(upgrade.upgrade_type)}
                            <span className="text-xs font-bold mt-1 text-text-muted">#{i + 1}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div>
                                <h3 className="font-semibold text-lg text-text leading-tight">{upgrade.port_name} ({upgrade.port_id})</h3>
                                <p className="text-sm text-text-muted">{getLabel(upgrade.upgrade_type)}</p>
                            </div>
                            
                            <div className="flex gap-4 pt-2 border-t border-border">
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block">Estimated Capex</span>
                                    <span className="font-semibold text-text">${(upgrade.estimated_capex_usd / 1000000).toFixed(1)}M</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block">Annual GHG Avoided</span>
                                    <span className="font-semibold text-success flex items-center gap-1">
                                        <ArrowUpCircle className="w-3 h-3" />
                                        {upgrade.annual_ghg_reduction_tonnes.toLocaleString()} t
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
