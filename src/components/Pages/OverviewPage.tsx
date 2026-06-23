import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Package, 
  Activity,
  Calendar
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function OverviewPage({ stats, todayStats, monthPerformance, monthlyLogData }) {
  const aggregatedLogsByMonth = React.useMemo(() => {
    if (!monthlyLogData || monthlyLogData.length === 0) return [];
    
    const grouped = monthlyLogData.reduce((acc, row) => {
      if (!acc[row.bulan]) {
        acc[row.bulan] = {
          bulan: row.bulan,
          input: 0,
          utama: 0,
          turunan: 0,
          lokal: 0,
          total: 0
        };
      }
      acc[row.bulan].input += row.input || 0;
      acc[row.bulan].utama += row.utama || 0;
      acc[row.bulan].turunan += row.turunan || 0;
      acc[row.bulan].lokal += row.totalLokal || 0;
      acc[row.bulan].total += row.total || 0;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a: any, b: any) => a.bulan - b.bulan);
  }, [monthlyLogData]);

  const currentMonthLogsByCategory = React.useMemo(() => {
    if (!monthlyLogData || monthlyLogData.length === 0) return [];
    
    // Find the latest available month in the data
    const availableMonths = [...new Set(monthlyLogData.map((d: any) => d.bulan))].filter((b: any) => !isNaN(b) && b > 0) as number[];
    const latestMonth = availableMonths.length > 0 ? Math.max(...availableMonths) : new Date().getMonth() + 1;
    
    const categories: Record<string, { kategori: string, input: number, utama: number, turunan: number, lokal: number, total: number, pilotLadder: number, utamaTanpaPilotLadder: number, monthName: number }> = {
      'Log Panjang': {
        kategori: 'Log Panjang',
        input: 0,
        utama: 0,
        turunan: 0,
        lokal: 0,
        total: 0,
        pilotLadder: 0,
        utamaTanpaPilotLadder: 0,
        monthName: latestMonth
      },
      'Log End': {
        kategori: 'Log End',
        input: 0,
        utama: 0,
        turunan: 0,
        lokal: 0,
        total: 0,
        pilotLadder: 0,
        utamaTanpaPilotLadder: 0,
        monthName: latestMonth
      }
    };
    
    monthlyLogData.forEach((row: any) => {
      if (row.bulan === latestMonth) {
        const supplierName = (row.supplier || '').toLowerCase();
        // Check for "(end)" or "(log end)"
        const isLogEnd = supplierName.includes('(end)') || supplierName.includes('(log end)');
        const cat = isLogEnd ? 'Log End' : 'Log Panjang';
        categories[cat].input += row.input || 0;
        categories[cat].utama += row.utama || 0;
        categories[cat].turunan += row.turunan || 0;
        categories[cat].lokal += row.totalLokal || 0; // Using totalLokal from row
        categories[cat].total += row.total || 0;
        categories[cat].pilotLadder += row.pilotLadder || 0;
        categories[cat].utamaTanpaPilotLadder += row.utamaTanpaPilotLadder || 0;
      }
    });

    const result = [categories['Log Panjang'], categories['Log End']].filter(c => c.input > 0);
    if (result.length === 0) {
       return [categories['Log Panjang'], categories['Log End']];
    }
    return result;
  }, [monthlyLogData]);

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <h3 className="text-lg font-black text-slate-900 tracking-wide uppercase">
              Performance {monthPerformance.monthName}
            </h3>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-wider rounded border border-indigo-100">
              {monthPerformance.days} Hari Operasi
            </span>
          </div>

          <div className="space-y-5">
            {/* Totals Section */}
            <div>
              <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3">Total Volume Produksi (m³)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest mb-1">Input</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">{monthPerformance.totals.input.toLocaleString('id-ID', { maximumFractionDigits: 3 })}</span>
                </div>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest mb-1">Utama</span>
                  <span className="text-xl sm:text-2xl font-black text-sky-600">{monthPerformance.totals.utama.toLocaleString('id-ID', { maximumFractionDigits: 3 })}</span>
                </div>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest mb-1">Turunan</span>
                  <span className="text-xl sm:text-2xl font-black text-orange-600">{monthPerformance.totals.turunan.toLocaleString('id-ID', { maximumFractionDigits: 3 })}</span>
                </div>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest mb-1">Lokal</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-600">{monthPerformance.totals.lokal.toLocaleString('id-ID', { maximumFractionDigits: 3 })}</span>
                </div>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest mb-1">Total Output</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600">{monthPerformance.totals.total.toLocaleString('id-ID', { maximumFractionDigits: 3 })}</span>
                </div>
              </div>
            </div>

            {/* Averages Section */}
            <div>
              <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3 mt-4">Rata-Rata Harian (m³)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest mb-1">Input</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">{monthPerformance.averages.input.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest mb-1">Utama</span>
                  <span className="text-xl sm:text-2xl font-black text-sky-600">{monthPerformance.averages.utama.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest mb-1">Turunan</span>
                  <span className="text-xl sm:text-2xl font-black text-orange-600">{monthPerformance.averages.turunan.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest mb-1">Lokal</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-600">{monthPerformance.averages.lokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center shadow-sm">
                  <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-widest mb-1">Output</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600">{monthPerformance.averages.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</span>
                </div>
              </div>
            </div>

            {/* Rendemen Section */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 shadow-inner relative overflow-hidden">
               <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 relative z-10">Tingkat Rendemen Bulanan</p>
               <div className="grid grid-cols-4 divide-x divide-white/10 relative z-10">
                 <div className="flex flex-col px-2 text-center">
                   <span className="text-xl font-black text-sky-400">{monthPerformance.totals.rendemenUtama.toFixed(1)}%</span>
                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider mt-1">Utama</span>
                 </div>
                 <div className="flex flex-col px-2 text-center">
                   {(() => {
                     const totalInputMonth = currentMonthLogsByCategory.reduce((sum, cat) => sum + cat.input, 0);
                     const totalUtamaMonth = currentMonthLogsByCategory.reduce((sum, cat) => sum + cat.utama, 0);
                     const totalPilotMonth = currentMonthLogsByCategory.reduce((sum, cat) => sum + cat.pilotLadder, 0);
                     const rendemenUtamaNonPilot = totalInputMonth > 0 ? ((totalUtamaMonth - totalPilotMonth) / totalInputMonth) * 100 : 0;
                     return <span className="text-xl font-black text-indigo-400">{rendemenUtamaNonPilot.toFixed(1)}%</span>;
                   })()}
                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider mt-1">Utama Non Pilot</span>
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

      {/* Monthly Log Database Section */}
      {currentMonthLogsByCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5 overflow-hidden mt-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-black text-slate-900 tracking-wide uppercase flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Data Log Bulan {currentMonthLogsByCategory[0]?.monthName || 'Ini'}
            </h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded border border-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Realtime
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b-[3px] border-slate-200 text-[11px] text-slate-800 font-black uppercase tracking-widest bg-slate-50">
                  <th className="py-4 px-4 sticky left-0 bg-slate-50">Kategori</th>
                  <th className="py-4 px-4 text-right">Input (m³)</th>
                  <th className="py-4 px-4 text-right">Utama (m³)</th>
                  <th className="py-4 px-4 text-center">Rendemen Utama (%)</th>
                  <th className="py-4 px-4 text-right">Pilot Ladder (m³)</th>
                  <th className="py-4 px-4 text-right">Utama Tanpa Pilot (m³)</th>
                  <th className="py-4 px-4 text-center">Rendemen Utama Non Pilot (%)</th>
                  <th className="py-4 px-4 text-right">Turunan (m³)</th>
                  <th className="py-4 px-4 text-center">Rendemen Turunan (%)</th>
                  <th className="py-4 px-4 text-right">Lokal (m³)</th>
                  <th className="py-4 px-4 text-right">Total Output (m³)</th>
                  <th className="py-4 px-4 text-center">Rendemen Total (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentMonthLogsByCategory.map((cat: any) => {
                  const yieldTotal = cat.input > 0 ? (cat.total / cat.input) * 100 : 0;
                  const yieldUtama = cat.input > 0 ? (cat.utama / cat.input) * 100 : 0;
                  const yieldTurunan = cat.input > 0 ? (cat.turunan / cat.input) * 100 : 0;
                  const yieldUtamaTanpaPilot = cat.input > 0 ? ((cat.utama - cat.pilotLadder) / cat.input) * 100 : 0;
                  return (
                    <tr key={cat.kategori} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-black text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50/50">{cat.kategori}</td>
                      <td className="py-4 px-4 text-right font-bold text-slate-700">{cat.input.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-right font-black text-sky-700">{cat.utama.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded text-xs font-black bg-sky-50 text-sky-700 border border-sky-100">
                          {yieldUtama.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-indigo-600">{cat.pilotLadder.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-right font-black text-indigo-700">{cat.utamaTanpaPilotLadder.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {yieldUtamaTanpaPilot.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-orange-700">{cat.turunan.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded text-xs font-black bg-orange-50 text-orange-700 border border-orange-100">
                          {yieldTurunan.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-amber-700">{cat.lokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-right font-black text-emerald-700">{cat.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {yieldTotal.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(() => {
                  const totalInput = currentMonthLogsByCategory.reduce((sum: number, cat: any) => sum + cat.input, 0);
                  const totalUtama = currentMonthLogsByCategory.reduce((sum: number, cat: any) => sum + cat.utama, 0);
                  const totalTurunan = currentMonthLogsByCategory.reduce((sum: number, cat: any) => sum + cat.turunan, 0);
                  const totalLokal = currentMonthLogsByCategory.reduce((sum: number, cat: any) => sum + cat.lokal, 0);
                  const totalAll = currentMonthLogsByCategory.reduce((sum: number, cat: any) => sum + cat.total, 0);
                  const totalPilotLadder = currentMonthLogsByCategory.reduce((sum: number, cat: any) => sum + cat.pilotLadder, 0);
                  const totalUtamaTanpaPilot = currentMonthLogsByCategory.reduce((sum: number, cat: any) => sum + cat.utamaTanpaPilotLadder, 0);
                  
                  const yieldTotalUtama = totalInput > 0 ? (totalUtama / totalInput) * 100 : 0;
                  const yieldTotalTurunan = totalInput > 0 ? (totalTurunan / totalInput) * 100 : 0;
                  const yieldTotalAll = totalInput > 0 ? (totalAll / totalInput) * 100 : 0;
                  const yieldTotalUtamaTanpaPilot = totalInput > 0 ? ((totalUtama - totalPilotLadder) / totalInput) * 100 : 0;
                  
                  return (
                    <tr className="bg-slate-100/50 font-black border-t-[3px] border-slate-200 shadow-sm">
                      <td className="py-5 px-4 text-slate-900 uppercase tracking-widest text-sm sticky left-0 bg-slate-100/50">TOTAL</td>
                      <td className="py-5 px-4 text-right text-slate-900 text-base">{totalInput.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-right text-sky-700 text-base">{totalUtama.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-md text-sm font-black bg-sky-100 text-sky-800 shadow-sm">
                          {yieldTotalUtama.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right text-indigo-700 text-base">{totalPilotLadder.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-right text-indigo-800 text-base">{totalUtamaTanpaPilot.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-md text-sm font-black bg-indigo-100 text-indigo-900 shadow-sm">
                          {yieldTotalUtamaTanpaPilot.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right text-orange-700 text-base">{totalTurunan.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-md text-sm font-black bg-orange-100 text-orange-800 shadow-sm">
                          {yieldTotalTurunan.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right text-amber-700 text-base">{totalLokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-right text-emerald-700 text-base">{totalAll.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-md text-sm font-black bg-emerald-100 text-emerald-800 shadow-sm">
                          {yieldTotalAll.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rekap Data Perbulan Section */}
      {aggregatedLogsByMonth.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5 overflow-hidden mt-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-black text-slate-900 tracking-wide uppercase flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Rekap Data Perbulan
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b-[3px] border-slate-200 text-[11px] text-slate-800 font-black uppercase tracking-widest bg-slate-50">
                  <th className="py-4 px-4 sticky left-0 bg-slate-50">Bulan</th>
                  <th className="py-4 px-4 text-right">Input (m³)</th>
                  <th className="py-4 px-4 text-right">Utama (m³)</th>
                  <th className="py-4 px-4 text-center">Rendemen Utama (%)</th>
                  <th className="py-4 px-4 text-right">Turunan (m³)</th>
                  <th className="py-4 px-4 text-center">Rendemen Turunan (%)</th>
                  <th className="py-4 px-4 text-right">Lokal (m³)</th>
                  <th className="py-4 px-4 text-center">Rendemen Lokal (%)</th>
                  <th className="py-4 px-4 text-right">Output Total (m³)</th>
                  <th className="py-4 px-4 text-center">Rendemen Total (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {aggregatedLogsByMonth.map((monthData: any) => {
                  const monthNames = ['-', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                  const monthName = monthNames[Math.min(12, Math.max(1, parseInt(monthData.bulan)))] || monthData.bulan;
                  const yieldUtama = monthData.input > 0 ? (monthData.utama / monthData.input) * 100 : 0;
                  const yieldTurunan = monthData.input > 0 ? (monthData.turunan / monthData.input) * 100 : 0;
                  const yieldLokal = monthData.input > 0 ? (monthData.lokal / monthData.input) * 100 : 0;
                  const yieldTotal = monthData.input > 0 ? (monthData.total / monthData.input) * 100 : 0;
                  
                  return (
                    <tr key={`month-${monthData.bulan}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-black text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50/50">{monthName}</td>
                      <td className="py-4 px-4 text-right font-bold text-slate-700">{monthData.input.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-right font-black text-sky-700">{monthData.utama.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded text-xs font-black bg-sky-50 text-sky-700 border border-sky-100">
                          {yieldUtama.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-orange-700">{monthData.turunan.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded text-xs font-black bg-orange-50 text-orange-700 border border-orange-100">
                          {yieldTurunan.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-amber-700">{monthData.lokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded text-xs font-black bg-amber-50 text-amber-700 border border-amber-100">
                          {yieldLokal.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-emerald-700">{monthData.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {yieldTotal.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(() => {
                  const numMonths = aggregatedLogsByMonth.length;
                  if (numMonths === 0) return null;
                  
                  const totalInput = aggregatedLogsByMonth.reduce((sum: number, m: any) => sum + m.input, 0);
                  const totalUtama = aggregatedLogsByMonth.reduce((sum: number, m: any) => sum + m.utama, 0);
                  const totalTurunan = aggregatedLogsByMonth.reduce((sum: number, m: any) => sum + m.turunan, 0);
                  const totalLokal = aggregatedLogsByMonth.reduce((sum: number, m: any) => sum + m.lokal, 0);
                  const totalAll = aggregatedLogsByMonth.reduce((sum: number, m: any) => sum + m.total, 0);
                  
                  const avgInput = totalInput / numMonths;
                  const avgUtama = totalUtama / numMonths;
                  const avgTurunan = totalTurunan / numMonths;
                  const avgLokal = totalLokal / numMonths;
                  const avgAll = totalAll / numMonths;
                  
                  // Rendemen dari total keseluruhan (Total output / Total input)
                  const avgYieldUtama = totalInput > 0 ? (totalUtama / totalInput) * 100 : 0;
                  const avgYieldTurunan = totalInput > 0 ? (totalTurunan / totalInput) * 100 : 0;
                  const avgYieldLokal = totalInput > 0 ? (totalLokal / totalInput) * 100 : 0;
                  const avgYieldAll = totalInput > 0 ? (totalAll / totalInput) * 100 : 0;
                  
                  return (
                    <tr className="bg-slate-100/50 font-black border-t-[3px] border-slate-200 shadow-sm">
                      <td className="py-5 px-4 text-slate-900 uppercase tracking-widest text-sm sticky left-0 bg-slate-100/50">AVERAGE</td>
                      <td className="py-5 px-4 text-right text-slate-900 text-base">{avgInput.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-right text-sky-700 text-base">{avgUtama.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-md text-sm font-black bg-sky-100 text-sky-800 shadow-sm">
                          {avgYieldUtama.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right text-orange-700 text-base">{avgTurunan.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-md text-sm font-black bg-orange-100 text-orange-800 shadow-sm">
                          {avgYieldTurunan.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right text-amber-700 text-base">{avgLokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-md text-sm font-black bg-amber-100 text-amber-800 shadow-sm">
                          {avgYieldLokal.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right text-emerald-700 text-base">{avgAll.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                      <td className="py-5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-md text-sm font-black bg-emerald-100 text-emerald-800 shadow-sm">
                          {avgYieldAll.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
