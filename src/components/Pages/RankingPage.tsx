import React, { useState } from 'react';
import { Trophy, Medal, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAvailablePeriods, getMachineRankings } from '../../services/dataService';

export function RankingPage({ data }) {
  const [periodType, setPeriodType] = useState('monthly');
  const periods = getAvailablePeriods(data);
  const [periodValue, setPeriodValue] = useState(periods.months[0] || 0);

  const rankings = getMachineRankings(data, periodType as any, periodValue);

  return (
    <div className="p-5 space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl -mr-16 -mt-16" />
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight relative z-10">
          <Trophy className="w-5 h-5 text-amber-500" />
          Leaderboard
        </h2>
        <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold relative z-10">Ranking Performa Mesin</p>

        <div className="flex gap-2 mt-4 relative z-10">
          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
             <button 
                onClick={() => { setPeriodType('monthly'); setPeriodValue(periods.months[0] || 0); }}
                className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'monthly' ? "bg-amber-100 text-amber-600" : "text-slate-500")}
             >
                Bulan
             </button>
             <button 
                onClick={() => { setPeriodType('weekly'); setPeriodValue(periods.weeks[0] || 0); }}
                className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'weekly' ? "bg-amber-100 text-amber-600" : "text-slate-500")}
             >
                Minggu
             </button>
          </div>
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1 outline-none"
            value={periodValue}
            onChange={(e) => setPeriodValue(parseInt(e.target.value))}
          >
            {periodType === 'monthly' ? periods.months.map(m => (
              <option key={m} value={m}>Bulan {m}</option>
            )) : periods.weeks.map(w => (
              <option key={w} value={w}>Minggu {w}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {rankings.length > 0 && (
          <div className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-sm grid grid-cols-12 gap-2 items-center text-[11px] sm:text-[12px] font-black text-slate-800 uppercase tracking-wider">
            <div className="col-span-2 text-center">No</div>
            <div className="col-span-3">Mesin</div>
            <div className="col-span-4 text-center">Output</div>
            <div className="col-span-3 text-right">Rendemen</div>
          </div>
        )}

        {rankings.map((rank, i) => {
          const isTop3 = i < 3;
          const bgColors = ['bg-amber-50 border-amber-200', 'bg-slate-50 border-slate-200', 'bg-orange-50 border-orange-200'];
          const textColors = ['text-amber-600', 'text-slate-700', 'text-orange-600'];

          return (
            <div key={i} className={cn(
              "rounded-xl p-3 border shadow-sm grid grid-cols-12 gap-2 items-center transition-all",
              isTop3 ? bgColors[i] : "bg-white border-slate-100"
            )}>
              <div className="col-span-2 flex justify-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm",
                  isTop3 ? textColors[i] + ' bg-white' : "text-slate-500 bg-slate-50 border border-slate-200"
                )}>
                  {i + 1}
                </div>
              </div>
              <div className="col-span-3 flex items-center">
                <h3 className="text-slate-900 font-bold text-sm tracking-tight truncate">{rank.mesin}</h3>
              </div>
              <div className="col-span-4 text-center">
                <span className="text-[11px] text-slate-700 font-bold whitespace-nowrap">{rank.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³</span>
              </div>
              <div className="col-span-3 text-right">
                <span className={cn(
                  "text-[13px] font-black font-mono tracking-tighter whitespace-nowrap",
                  isTop3 ? textColors[i] : "text-emerald-500"
                )}>
                  {(rank.yield * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}

        {rankings.length === 0 && (
          <div className="text-center text-slate-500 py-10 text-sm">
            Tidak ada data untuk periode ini.
          </div>
        )}
      </div>
    </div>
  );
}
