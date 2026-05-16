import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Package, 
  CheckCircle,
  Activity
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export function OverviewPage({ stats, todayStats, trendData }) {
  const kpiCards = [
    { title: 'Total Produksi', value: stats.totalAllOutput.toLocaleString('id-ID'), unit: 'm³', icon: Package, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { title: 'Efisiensi', value: (stats.avgYield * 100).toFixed(1), unit: '%', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { title: 'Downtime', value: stats.totalDowntimeMinutes.toLocaleString('id-ID'), unit: 'mnt', icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { title: 'Input Log', value: stats.totalInput.toLocaleString('id-ID'), unit: 'm³', icon: BarChart3, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  ];

  const activeMachinesCount = todayStats?.stats?.length || 0;

  return (
    <div className="p-5 space-y-6">
      {/* Live Status Banner */}
      <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 shadow-lg flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-medium tracking-widest uppercase">Live Status</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="text-emerald-400 font-bold text-sm tracking-wide">OPERATING NORMAL</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 uppercase font-medium">Active Machines</span>
          <span className="text-xl font-bold text-white leading-none mt-1">{activeMachinesCount} <span className="text-xs text-slate-400 font-normal">/ 8</span></span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4">
        {kpiCards.map((card, i) => (
          <div key={i} className={`bg-[#1e293b]/40 backdrop-blur-sm rounded-2xl p-4 border ${card.border} shadow-lg relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-4 -mt-4 blur-xl transition-transform group-hover:scale-150" />
            <div className="flex items-start justify-between mb-3 relative z-10">
              <div className={`p-2 rounded-xl ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{card.title}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-100 tracking-tight">{card.value}</span>
                <span className="text-xs font-semibold text-slate-500">{card.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gauge Charts - Efficiency & Rendemen */}
      <div className="bg-[#1e293b]/40 backdrop-blur-md rounded-2xl p-5 border border-white/5 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            Rendemen Performance
          </h3>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-[120px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: stats.avgYield * 100 }, { value: Math.max(0, 100 - (stats.avgYield * 100)) }]}
                    cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={45} outerRadius={60} stroke="none" paddingAngle={2}
                  >
                    <Cell fill="#38bdf8" />
                    <Cell fill="#334155" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                <span className="text-xl font-bold text-white">{(stats.avgYield * 100).toFixed(1)}%</span>
                <span className="text-[9px] text-sky-400 font-bold uppercase tracking-widest mt-0.5">Utama</span>
                <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">TGT 30%</span>
              </div>
            </div>
          </div>
          <div className="w-px bg-white/5 shrink-0" />
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-[120px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: stats.totalInput > 0 ? (stats.totalAllOutput / stats.totalInput) * 100 : 0 }, { value: Math.max(0, 100 - (stats.totalInput > 0 ? (stats.totalAllOutput / stats.totalInput) * 100 : 0)) }]}
                    cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={45} outerRadius={60} stroke="none" paddingAngle={2}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#334155" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                <span className="text-xl font-bold text-white">{stats.totalInput > 0 ? ((stats.totalAllOutput / stats.totalInput) * 100).toFixed(1) : '0'}%</span>
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Total</span>
                <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">TGT 65%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Trend Area Chart */}
      <div className="bg-[#1e293b]/40 backdrop-blur-md rounded-2xl px-5 pt-5 pb-3 border border-white/5 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase">
            Tren Produksi Harian
          </h3>
          <div className="px-2.5 py-1 rounded bg-[#0f172a] text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
            Last 7 Days
          </div>
        </div>
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="w" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
              <Tooltip 
                cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Area type="monotone" dataKey="v2" stroke="#818cf8" strokeWidth={2} fill="url(#colorProd)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
