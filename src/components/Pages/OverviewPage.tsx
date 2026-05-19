import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Package, 
  Activity
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function OverviewPage({ stats, todayStats, monthPerformance }) {
  const kpiCards = [
    { title: 'Input Log', value: stats.totalInput.toLocaleString('id-ID'), unit: 'm³', icon: BarChart3, color: 'text-sky-900', bg: 'bg-sky-300/50', cardBg: 'bg-sky-200', border: 'border-sky-300' },
    { title: 'Total Produksi', value: stats.totalAllOutput.toLocaleString('id-ID'), unit: 'm³', icon: Package, color: 'text-orange-900', bg: 'bg-orange-300/50', cardBg: 'bg-orange-200', border: 'border-orange-300' },
    { title: 'Rendemen Utama', value: (stats.avgYield * 100).toFixed(1), unit: '%', icon: TrendingUp, color: 'text-emerald-900', bg: 'bg-emerald-300/50', cardBg: 'bg-emerald-200', border: 'border-emerald-300' },
    { title: 'Downtime', value: stats.totalDowntimeMinutes.toLocaleString('id-ID'), unit: 'mnt', icon: Clock, color: 'text-rose-900', bg: 'bg-rose-300/50', cardBg: 'bg-rose-200', border: 'border-rose-300' },
  ];

  const activeMachinesCount = todayStats?.stats?.length || 0;

  return (
    <div className="p-5 space-y-6">
      {/* Live Status Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">Live Status</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="text-emerald-500 font-bold text-sm tracking-wide">OPERATING NORMAL</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Active Machines</span>
          <span className="text-xl font-bold text-slate-800 leading-none mt-1">{activeMachinesCount} <span className="text-xs text-slate-400 font-normal">/ 8</span></span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4">
        {kpiCards.map((card, i) => (
          <div key={i} className={`${card.cardBg} rounded-2xl p-4 border ${card.border} shadow-sm relative overflow-hidden group`}>
            <div className="relative z-10 flex flex-col h-full">
              <div className={`self-start p-2.5 rounded-2xl ${card.bg} mb-4`}>
                <card.icon className={`w-5 h-5 ${card.color}`} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1.5 opacity-90">{card.title}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[26px] leading-[1.1] font-black text-slate-900 tracking-tighter">{card.value}</span>
                <span className="text-xs font-bold text-slate-700">{card.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gauge Charts - Efficiency & Rendemen */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-500" />
            Rendemen Performance
          </h3>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-[150px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: stats.avgYield * 100 }, { value: Math.max(0, 100 - (stats.avgYield * 100)) }]}
                    cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} stroke="none" paddingAngle={2}
                  >
                    <Cell fill="#38bdf8" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">{(stats.avgYield * 100).toFixed(1)}%</span>
                <span className="text-[11px] text-sky-500 font-black uppercase tracking-widest mt-1">Utama</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">TGT 30%</span>
              </div>
            </div>
          </div>
          <div className="w-px bg-slate-100 shrink-0" />
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full h-[150px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: stats.totalInput > 0 ? (stats.totalAllOutput / stats.totalInput) * 100 : 0 }, { value: Math.max(0, 100 - (stats.totalInput > 0 ? (stats.totalAllOutput / stats.totalInput) * 100 : 0)) }]}
                    cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} stroke="none" paddingAngle={2}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">{stats.totalInput > 0 ? ((stats.totalAllOutput / stats.totalInput) * 100).toFixed(1) : '0'}%</span>
                <span className="text-[11px] text-emerald-500 font-black uppercase tracking-widest mt-1">Total</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">TGT 65%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Bulan Ini */}
      {monthPerformance && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Performance {monthPerformance.monthName}
            </h3>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded border border-indigo-100">
              {monthPerformance.days} Hari Operasi
            </span>
          </div>

          <div className="space-y-5">
            {/* Totals Section */}
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Total Volume Produksi (m³)</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Input</span>
                  <span className="text-xl font-black text-slate-800">{monthPerformance.totals.input.toLocaleString('id-ID', { maximumFractionDigits: 3 })}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Output</span>
                  <span className="text-xl font-black text-emerald-600">{monthPerformance.totals.total.toLocaleString('id-ID', { maximumFractionDigits: 3 })}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Utama</span>
                  <span className="text-lg font-black text-sky-600">{monthPerformance.totals.utama.toLocaleString('id-ID', { maximumFractionDigits: 3 })}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Turunan</span>
                  <span className="text-lg font-black text-orange-600">{monthPerformance.totals.turunan.toLocaleString('id-ID', { maximumFractionDigits: 3 })}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lokal</span>
                  <span className="text-lg font-black text-amber-600">{monthPerformance.totals.lokal.toLocaleString('id-ID', { maximumFractionDigits: 3 })}</span>
                </div>
              </div>
            </div>

            {/* Averages Section */}
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Rata-Rata Harian (m³)</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Input</span>
                  <span className="text-lg font-black text-slate-800">{monthPerformance.averages.input.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Utama</span>
                  <span className="text-lg font-black text-sky-600">{monthPerformance.averages.utama.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Output</span>
                  <span className="text-lg font-black text-emerald-600">{monthPerformance.averages.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Turunan</span>
                  <span className="text-lg font-black text-orange-600">{monthPerformance.averages.turunan.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lokal</span>
                  <span className="text-lg font-black text-amber-600">{monthPerformance.averages.lokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</span>
                </div>
              </div>
            </div>

            {/* Rendemen Section */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 shadow-inner relative overflow-hidden">
               <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 relative z-10">Tingkat Rendemen Bulanan</p>
               <div className="grid grid-cols-3 divide-x divide-white/10 relative z-10">
                 <div className="flex flex-col px-2 text-center">
                   <span className="text-xl font-black text-sky-400">{monthPerformance.totals.rendemenUtama.toFixed(1)}%</span>
                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider mt-1">Utama</span>
                 </div>
                 <div className="flex flex-col px-2 text-center">
                   <span className="text-xl font-black text-orange-400">{monthPerformance.totals.rendemenTurunan.toFixed(1)}%</span>
                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider mt-1">Turunan</span>
                 </div>
                 <div className="flex flex-col px-2 text-center">
                   <span className="text-xl font-black text-emerald-400">{monthPerformance.totals.rendemenTotal.toFixed(1)}%</span>
                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider mt-1">Total Output</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
