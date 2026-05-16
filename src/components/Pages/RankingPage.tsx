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
      <div className="bg-[#022c22]/60 backdrop-blur-md rounded-2xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <h2 className="text-lg font-bold text-emerald-50 flex items-center gap-2 tracking-tight relative z-10">
          <Trophy className="w-5 h-5 text-amber-400" />
          Leaderboard
        </h2>
        <p className="text-[11px] text-emerald-200/50 mt-1 uppercase tracking-widest font-medium relative z-10">Ranking Performa Mesin</p>

        <div className="flex gap-2 mt-4 relative z-10">
          <div className="flex bg-[#064e3b]/50 border border-white/10 rounded-lg p-1">
             <button 
                onClick={() => { setPeriodType('monthly'); setPeriodValue(periods.months[0] || 0); }}
                className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'monthly' ? "bg-amber-500/20 text-amber-400" : "text-emerald-200/50")}
             >
                Bulan
             </button>
             <button 
                onClick={() => { setPeriodType('weekly'); setPeriodValue(periods.weeks[0] || 0); }}
                className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'weekly' ? "bg-amber-500/20 text-amber-400" : "text-emerald-200/50")}
             >
                Minggu
             </button>
          </div>
          <select 
            className="bg-[#064e3b]/50 border border-white/10 text-emerald-100 text-xs font-medium rounded-lg px-3 py-1 outline-none"
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
        {rankings.map((rank, i) => {
          const isTop3 = i < 3;
          const bgColors = ['bg-amber-500/10 border-amber-500/30', 'bg-slate-300/10 border-slate-300/30', 'bg-amber-700/10 border-amber-700/30'];
          const textColors = ['text-amber-400', 'text-slate-300', 'text-amber-600'];

          return (
            <div key={i} className={cn(
              "backdrop-blur-sm rounded-2xl p-4 border shadow-lg flex items-center justify-between",
              isTop3 ? bgColors[i] : "bg-[#064e3b]/80 border-white/5"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm",
                  isTop3 ? textColors[i] + ' bg-black/20' : "text-emerald-500 bg-black/20"
                )}>
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-white font-bold">{rank.mesin}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-emerald-200/50 uppercase tracking-wider font-medium">Vol: {rank.utama.toFixed(1)} m³</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-emerald-200/50 uppercase tracking-widest block mb-0.5">Efficiency</span>
                <span className={cn(
                  "text-lg font-bold font-mono tracking-tighter",
                  isTop3 ? textColors[i] : "text-emerald-400"
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
