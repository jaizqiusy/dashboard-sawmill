import React from 'react';
import { History, Search, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { getPerformanceByTimeframe } from '../../services/dataService';
import { cn } from '../../lib/utils';

export function HistoryPage({ data, monthlyLogData }) {
  const bsData = React.useMemo(() => data.filter(d => d.mesin && d.input > 0 && d.mesin.toLowerCase().trim().startsWith('bs')), [data]);

  const daily = React.useMemo(() => getPerformanceByTimeframe(bsData, 'daily'), [bsData]);
  const weekly = React.useMemo(() => getPerformanceByTimeframe(bsData, 'weekly'), [bsData]);
  const monthly = React.useMemo(() => {
    if (monthlyLogData && monthlyLogData.length > 0) {
      const groups: Record<string, { input: number; utama: number }> = {};
      monthlyLogData.forEach((row: any) => {
        const mInput = row.input || 0;
        const mUtama = row.utama || 0;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const key = monthNames[row.bulan - 1] || `Month ${row.bulan}`;
        if (!groups[key]) groups[key] = { input: 0, utama: 0 };
        groups[key].input += mInput;
        groups[key].utama += mUtama;
      });
      return Object.entries(groups).map(([label, stats]) => ({
        label,
        input: Math.round(stats.input * 100) / 100,
        utama: Math.round(stats.utama * 100) / 100,
        yield: stats.input > 0 ? (stats.utama / stats.input) : 0
      }));
    }
    return getPerformanceByTimeframe(bsData, 'monthly');
  }, [bsData, monthlyLogData]);

  const quarterly = React.useMemo(() => {
    if (monthlyLogData && monthlyLogData.length > 0) {
      const groups: Record<string, { input: number; utama: number }> = {};
      monthlyLogData.forEach((row: any) => {
        const mInput = row.input || 0;
        const mUtama = row.utama || 0;
        const q = Math.ceil(row.bulan / 3);
        const key = `Q${q}`;
        if (!groups[key]) groups[key] = { input: 0, utama: 0 };
        groups[key].input += mInput;
        groups[key].utama += mUtama;
      });
      return Object.entries(groups).map(([label, stats]) => ({
        label,
        input: Math.round(stats.input * 100) / 100,
        utama: Math.round(stats.utama * 100) / 100,
        yield: stats.input > 0 ? (stats.utama / stats.input) : 0
      }));
    }
    return getPerformanceByTimeframe(bsData, 'quarterly');
  }, [bsData, monthlyLogData]);

  const getExtremes = React.useCallback((perf) => {
    if (!perf || perf.length === 0) return null;
    let highest = perf[0];
    let lowest = perf[0];
    for (const p of perf) {
      if (p.yield > highest.yield) highest = p;
      if (p.yield < lowest.yield) lowest = p;
    }
    return { highest, lowest };
  }, []);

  const extremes = React.useMemo(() => [
    { title: 'Harian', data: getExtremes(daily), color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
    { title: 'Mingguan', data: getExtremes(weekly), color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { title: 'Bulanan', data: getExtremes(monthly), color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { title: 'Kuartal', data: getExtremes(quarterly), color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20' },
  ], [daily, weekly, monthly, quarterly, getExtremes]);

  return (
    <div className="p-5 space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
            <History className="w-5 h-5 text-indigo-500" />
            History & Reports
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Rekor & Laporan Operasional</p>
        </div>
        <button className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100">
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {extremes.map((section, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`px-4 py-3 border-b border-slate-100 flex items-center gap-2 ${section.bg}`}>
              <History className={`w-4 h-4 ${section.color}`} />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Rekor {section.title}</h3>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Highest */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-100 p-1.5 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest block">Tertinggi</span>
                      <span className="text-xs text-slate-700 font-bold">{section.data?.highest?.label || '-'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-emerald-600">
                      {section.data?.highest ? (section.data.highest.yield * 100).toFixed(1) + '%' : '-'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-emerald-100/50 mt-2">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Input: </span>
                    <span className="text-xs text-slate-700 font-mono font-bold">{section.data?.highest?.input?.toFixed(1) || '-'} m³</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Output: </span>
                    <span className="text-xs text-emerald-600 font-mono font-bold">{section.data?.highest?.utama?.toFixed(1) || '-'} m³</span>
                  </div>
                </div>
              </div>

              {/* Lowest */}
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-rose-100 p-1.5 rounded-lg">
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 font-black uppercase tracking-widest block">Terendah</span>
                      <span className="text-xs text-slate-700 font-bold">{section.data?.lowest?.label || '-'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-rose-600">
                      {section.data?.lowest ? (section.data.lowest.yield * 100).toFixed(1) + '%' : '-'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-rose-100/50 mt-2">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Input: </span>
                    <span className="text-xs text-slate-700 font-mono font-bold">{section.data?.lowest?.input?.toFixed(1) || '-'} m³</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Output: </span>
                    <span className="text-xs text-rose-600 font-mono font-bold">{section.data?.lowest?.utama?.toFixed(1) || '-'} m³</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
