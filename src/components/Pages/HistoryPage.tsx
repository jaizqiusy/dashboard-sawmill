import React from 'react';
import { History, Search, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { getPerformanceByTimeframe } from '../../services/dataService';
import { cn } from '../../lib/utils';

export function HistoryPage({ data }) {
  const bsData = data.filter(d => d.mesin && d.input > 0 && d.mesin.toLowerCase().trim().startsWith('bs'));

  const daily = getPerformanceByTimeframe(bsData, 'daily');
  const weekly = getPerformanceByTimeframe(bsData, 'weekly');
  const monthly = getPerformanceByTimeframe(bsData, 'monthly');

  const getExtremes = (perf) => {
    if (!perf || perf.length === 0) return null;
    let highest = perf[0];
    let lowest = perf[0];
    for (const p of perf) {
      if (p.yield > highest.yield) highest = p;
      if (p.yield < lowest.yield) lowest = p;
    }
    return { highest, lowest };
  };

  const extremes = [
    { title: 'Harian', data: getExtremes(daily), color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Mingguan', data: getExtremes(weekly), color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
    { title: 'Bulanan', data: getExtremes(monthly), color: 'text-emerald-300', bg: 'bg-emerald-600/10 border-emerald-600/20' },
  ];

  return (
    <div className="p-5 space-y-6">
      <div className="bg-[#022c22]/60 backdrop-blur-md rounded-2xl p-5 border border-white/5 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-emerald-50 flex items-center gap-2 tracking-tight">
            <History className="w-5 h-5 text-teal-400" />
            History & Reports
          </h2>
          <p className="text-[11px] text-emerald-200/50 mt-1 uppercase tracking-widest font-medium">Rekor & Laporan Operasional</p>
        </div>
        <button className="w-10 h-10 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center border border-teal-500/30">
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {extremes.map((section, idx) => (
          <div key={idx} className="bg-[#064e3b]/80 backdrop-blur-sm rounded-2xl border border-white/5 shadow-lg overflow-hidden">
            <div className={`px-4 py-3 border-b flex items-center gap-2 ${section.bg}`}>
              <History className={`w-4 h-4 ${section.color}`} />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rekor {section.title}</h3>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Highest */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-500/20 p-1 rounded">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest block">Tertinggi</span>
                      <span className="text-xs text-emerald-50 font-medium">{section.data?.highest?.label || '-'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {section.data?.highest ? (section.data.highest.yield * 100).toFixed(1) + '%' : '-'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                  <div>
                    <span className="text-[9px] text-emerald-200/50 uppercase tracking-widest">Input: </span>
                    <span className="text-xs text-emerald-100 font-mono">{section.data?.highest?.input?.toFixed(1) || '-'} m³</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-200/50 uppercase tracking-widest">Output: </span>
                    <span className="text-xs text-emerald-400 font-mono font-medium">{section.data?.highest?.utama?.toFixed(1) || '-'} m³</span>
                  </div>
                </div>
              </div>

              {/* Lowest */}
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-rose-500/20 p-1 rounded">
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-400/80 font-bold uppercase tracking-widest block">Terendah</span>
                      <span className="text-xs text-emerald-50 font-medium">{section.data?.lowest?.label || '-'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-rose-400">
                      {section.data?.lowest ? (section.data.lowest.yield * 100).toFixed(1) + '%' : '-'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                  <div>
                    <span className="text-[9px] text-emerald-200/50 uppercase tracking-widest">Input: </span>
                    <span className="text-xs text-emerald-100 font-mono">{section.data?.lowest?.input?.toFixed(1) || '-'} m³</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-200/50 uppercase tracking-widest">Output: </span>
                    <span className="text-xs text-rose-400 font-mono font-medium">{section.data?.lowest?.utama?.toFixed(1) || '-'} m³</span>
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
