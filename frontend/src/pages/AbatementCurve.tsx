import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, ReferenceLine, LabelList
} from 'recharts';
import { TrendingDown, Zap, Leaf, Ship, Wrench, Info } from 'lucide-react';

// ── Static fallback data (same values the API returns) ────────────────────────
const STATIC_DATA = [
  { id: 'speed', name: '10% Speed Reduction', category: 'operational', cost_per_tonne_usd: -25, total_abatement_potential_tonnes: 1200 },
  { id: 'hull',  name: 'Hull Cleaning',        category: 'maintenance', cost_per_tonne_usd: -10, total_abatement_potential_tonnes: 850  },
  { id: 'ops',   name: 'Shore Power (JNPA)',   category: 'infrastructure', cost_per_tonne_usd: 45,  total_abatement_potential_tonnes: 2100 },
  { id: 'bio',   name: '30% Bio-methanol',     category: 'fuel',       cost_per_tonne_usd: 120, total_abatement_potential_tonnes: 4500 },
  { id: 'nh3',   name: 'Green Ammonia Fleet',  category: 'fleet_renewal', cost_per_tonne_usd: 280, total_abatement_potential_tonnes: 15000},
];

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  operational:   { icon: <Zap className="w-3.5 h-3.5" />,    color: '#10b981', bg: 'bg-emerald-500', label: 'Operational'    },
  maintenance:   { icon: <Wrench className="w-3.5 h-3.5" />, color: '#0ea5e9', bg: 'bg-sky-500',     label: 'Maintenance'    },
  infrastructure:{ icon: <Ship className="w-3.5 h-3.5" />,   color: '#f59e0b', bg: 'bg-amber-500',   label: 'Infrastructure' },
  fuel:          { icon: <Leaf className="w-3.5 h-3.5" />,   color: '#8b5cf6', bg: 'bg-violet-500',  label: 'Green Fuel'     },
  fleet_renewal: { icon: <TrendingDown className="w-3.5 h-3.5"/>, color: '#ef4444', bg: 'bg-rose-500', label: 'Fleet Renewal' },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const meta = CATEGORY_META[d.category] ?? CATEGORY_META['operational'];
  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[200px]">
      <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 text-white`}
        style={{ backgroundColor: meta.color + '33', color: meta.color, border: `1px solid ${meta.color}44` }}>
        {meta.icon} {meta.label}
      </div>
      <p className="text-white font-bold text-sm mb-1">{d.name}</p>
      <div className="flex items-center justify-between gap-6 text-xs">
        <div>
          <p className="text-slate-400">Cost / tonne CO₂</p>
          <p className={`font-bold text-base ${d.cost < 0 ? 'text-emerald-400' : 'text-white'}`}>
            {d.cost < 0 ? `Saves $${Math.abs(d.cost)}` : `$${d.cost}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-400">Abatement potential</p>
          <p className="font-bold text-base text-sky-400">{d.potential.toLocaleString()} t CO₂e</p>
        </div>
      </div>
    </div>
  );
};

const CustomBar = (props: any) => {
  const { x, y, width, height, fill, isNegative } = props;
  const radius = 6;
  if (!height || height === 0) return null;
  return (
    <g>
      <rect
        x={x} y={y} width={width} height={Math.abs(height)}
        rx={radius} ry={radius}
        fill={fill}
        fillOpacity={0.9}
      />
      {/* Sheen */}
      <rect
        x={x + 2} y={y + 2} width={Math.max(0, width - 4)} height={Math.min(8, Math.abs(height) / 3)}
        rx={4} ry={4}
        fill="white"
        fillOpacity={0.15}
      />
    </g>
  );
};

export const AbatementCurve: React.FC = () => {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:8000/api/abatement/curve');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setInterventions(data.interventions ?? STATIC_DATA);
      } catch {
        setInterventions(STATIC_DATA);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartData = interventions.map(inv => ({
    ...inv,
    cost: inv.cost_per_tonne_usd,
    potential: inv.total_abatement_potential_tonnes,
    fill: CATEGORY_META[inv.category]?.color ?? '#10b981',
  }));

  const totalPotential = interventions.reduce((s, i) => s + i.total_abatement_potential_tonnes, 0);
  const cheapestSaving = interventions.filter(i => i.cost_per_tonne_usd < 0);
  const netSavings = cheapestSaving.reduce((s, i) => s + Math.abs(i.cost_per_tonne_usd) * i.total_abatement_potential_tonnes, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Loading abatement curve…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-emerald-500" />
            Carbon Abatement Cost Curve
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Ranked from cheapest to costliest — shows <strong>cost per tonne of CO₂ avoided</strong> vs <strong>total reduction potential</strong>.
            Green bars = actions that <em>save</em> money. Red/purple = future green investments.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 shrink-0">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>Wider bar = more CO₂ reduction possible from that action</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-emerald-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Reduction Potential</p>
          <p className="text-3xl font-black text-[#0f172a] tabular-nums">{totalPotential.toLocaleString()}</p>
          <p className="text-sm text-slate-500 mt-0.5">tonnes CO₂e / year</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-emerald-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Revenue-Positive Actions</p>
          <p className="text-3xl font-black text-emerald-600 tabular-nums">{cheapestSaving.length}</p>
          <p className="text-sm text-slate-500 mt-0.5">actions that pay for themselves</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-emerald-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Immediate Cost Savings</p>
          <p className="text-3xl font-black text-emerald-600 tabular-nums">${(netSavings / 1000).toFixed(0)}K</p>
          <p className="text-sm text-slate-500 mt-0.5">from no-cost / low-cost actions</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-panel rounded-2xl p-6 border border-white/40 shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-[#0f172a]">Marginal Abatement Cost — Ranked (cheapest → costliest)</h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">Bar height = cost per tonne CO₂e &nbsp;·&nbsp; Bar width = total abatement potential (tonnes)</p>

        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 10, bottom: 60 }}
            barCategoryGap="12%"
          >
            <defs>
              {chartData.map(d => (
                <linearGradient key={d.id} id={`grad-${d.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={d.fill} stopOpacity={1} />
                  <stop offset="100%" stopColor={d.fill} stopOpacity={0.6} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="4 4" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              angle={-18}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${v}/t`}
              width={70}
            />
            <ReTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15,23,42,0.04)', radius: 8 }} />
            <ReferenceLine y={0} stroke="rgba(15,23,42,0.2)" strokeWidth={1.5} strokeDasharray="6 3"
              label={{ value: 'Break-even', position: 'insideRight', fontSize: 10, fill: '#94a3b8' }}
            />
            <Bar
              dataKey="cost"
              radius={[8, 8, 0, 0]}
              cursor="pointer"
              onClick={(d) => setSelected(d)}
            >
              {chartData.map(d => (
                <Cell key={d.id} fill={`url(#grad-${d.id})`}
                  stroke={selected?.id === d.id ? '#0f172a' : 'transparent'}
                  strokeWidth={2}
                />
              ))}
              <LabelList
                dataKey="cost"
                position="top"
                formatter={(v: number) => v < 0 ? `Saves $${Math.abs(v)}/t` : `$${v}/t`}
                style={{ fontSize: 10, fontWeight: 700, fill: '#0f172a' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-black/6">
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className={`w-3 h-3 rounded-full ${meta.bg}`} />
              {meta.label}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Cards */}
      <div>
        <h3 className="font-bold text-[#0f172a] mb-3 text-sm">All Interventions — Click a bar above to highlight</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {interventions.map(inv => {
            const meta = CATEGORY_META[inv.category] ?? CATEGORY_META['operational'];
            const isSel = selected?.id === inv.id;
            return (
              <button
                key={inv.id}
                onClick={() => setSelected(inv)}
                className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSel
                    ? 'bg-[#0f172a] border-transparent shadow-2xl scale-[1.02]'
                    : 'glass-panel border-white/40 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: meta.color + (isSel ? '33' : '18'),
                      color: isSel ? meta.color : meta.color,
                      border: `1px solid ${meta.color}33`
                    }}
                  >
                    {meta.icon}
                    {meta.label}
                  </div>
                  <div className={`text-lg font-black tabular-nums ${
                    inv.cost_per_tonne_usd < 0
                      ? (isSel ? 'text-emerald-400' : 'text-emerald-600')
                      : (isSel ? 'text-white' : 'text-[#0f172a]')
                  }`}>
                    {inv.cost_per_tonne_usd < 0 ? `−$${Math.abs(inv.cost_per_tonne_usd)}` : `$${inv.cost_per_tonne_usd}`}
                    <span className={`text-xs font-medium ml-1 ${isSel ? 'text-slate-400' : 'text-slate-400'}`}>/t CO₂</span>
                  </div>
                </div>

                <p className={`font-semibold text-sm mb-1 ${isSel ? 'text-white' : 'text-[#0f172a]'}`}>
                  {inv.name}
                </p>

                {/* Potential bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={isSel ? 'text-slate-400' : 'text-slate-400'}>Abatement potential</span>
                    <span className={`font-bold ${isSel ? 'text-sky-400' : 'text-sky-600'}`}>
                      {inv.total_abatement_potential_tonnes.toLocaleString()} t CO₂e
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full ${isSel ? 'bg-white/10' : 'bg-slate-100'}`}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${(inv.total_abatement_potential_tonnes / Math.max(...interventions.map(x => x.total_abatement_potential_tonnes))) * 100}%`,
                        backgroundColor: meta.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
