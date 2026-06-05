import React, { useState } from 'react';
import { Trophy, Crown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAvailablePeriods, getMachineRankings } from '../../services/dataService';
import { BsAchievementUpdate } from './BsAchievementUpdate';

export function RankingPage({ data }: any) {
  const [periodType, setPeriodType] = useState('monthly');
  const periods = getAvailablePeriods(data);
  const [periodValue, setPeriodValue] = useState(periods.months[0] || 0);

  const rankings = getMachineRankings(data, periodType as any, periodValue);
  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3, 8); // top 8

  const PodiumItem = ({ rankItem, rank }: { rankItem: any, rank: number }) => {
      const isFirst = rank === 1;
      const isSecond = rank === 2;
      const isThird = rank === 3;
      
      const borderColor = isFirst ? 'border-amber-400' : isSecond ? 'border-cyan-400' : 'border-fuchsia-500';
      const badgeColor = isFirst ? 'bg-amber-400 text-amber-950' : isSecond ? 'bg-cyan-400 text-cyan-950' : 'bg-fuchsia-500 text-white';
      const glow = isFirst ? 'shadow-[0_0_30px_rgba(251,191,36,0.3)]' : 
                   isSecond ? 'shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 
                              'shadow-[0_0_20px_rgba(217,70,239,0.2)]';
      
      const yieldColor = isFirst ? 'text-amber-400' : isSecond ? 'text-cyan-400' : 'text-fuchsia-400';
      const size = isFirst ? 'w-24 h-24' : 'w-20 h-20';
      
      return (
          <div className={cn("flex flex-col items-center relative z-10", isFirst ? "-mt-4" : "mt-8")}>
              {isFirst && <Crown className="w-10 h-10 text-amber-400 absolute -top-8 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" fill="currentColor" />}
              <div className="relative">
                  <div className={cn("rounded-full border-2 flex items-center justify-center bg-slate-800 text-slate-300 font-bold overflow-hidden p-1", borderColor, glow, size)}>
                      <div className="w-full h-full rounded-full bg-slate-900 border border-slate-700/50 flex items-center justify-center overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${rankItem.mesin}`} alt={rankItem.mesin} className="w-4/5 h-4/5 opacity-80" />
                      </div>
                  </div>
                  <div className={cn("absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ring-4 ring-[#0f172a]", badgeColor)}>
                      {rank}
                  </div>
              </div>
              <div className="mt-5 text-center">
                  <p className="text-white font-bold text-sm tracking-wide">{rankItem.mesin}</p>
                  <p className={cn("font-black text-xl mt-1 tracking-tight", yieldColor)}>{(rankItem.yield * 100).toFixed(1)}%</p>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">{rankItem.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³</p>
              </div>
          </div>
      )
  };

  return (
    <div className="p-5 space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl -mr-16 -mt-16" />
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight relative z-10">
          <Trophy className="w-5 h-5 text-amber-500" />
          Filter Leaderboard
        </h2>
        
        <div className="flex gap-2 mt-4 relative z-10">
          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
             <button 
                onClick={() => { setPeriodType('weekly'); setPeriodValue(periods.weeks[0] || 0); }}
                className={cn("px-4 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'weekly' ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-slate-100")}
             >
                Mingguan
             </button>
             <button 
                onClick={() => { setPeriodType('monthly'); setPeriodValue(periods.months[0] || 0); }}
                className={cn("px-4 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'monthly' ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-slate-100")}
             >
                Bulanan
             </button>
          </div>
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-1.5 outline-none"
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

      <div className="bg-[#0f172a] rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden ring-1 ring-slate-800">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-sky-900/20 to-transparent pointer-events-none" />
        
        {rankings.length > 0 ? (
          <>
            <div className="flex justify-center items-end gap-6 sm:gap-10 mb-12 pt-6">
                {top3[1] && <PodiumItem rankItem={top3[1]} rank={2} />}
                {top3[0] && <PodiumItem rankItem={top3[0]} rank={1} />}
                {top3[2] && <PodiumItem rankItem={top3[2]} rank={3} />}
            </div>

            <div className="space-y-4 max-w-2xl mx-auto relative z-10">
                {rest.map((rankItem, i) => {
                    const rank = i + 4;
                    return (
                        <div key={rank} className="bg-[#1e293b] rounded-[1.25rem] p-4 flex items-center gap-4 sm:gap-6 border border-slate-800/50 hover:bg-[#253247] transition-colors relative overflow-hidden group">
                            <div className="w-6 sm:w-8 flex justify-center flex-shrink-0">
                              <span className="text-slate-500 font-bold text-xl sm:text-2xl group-hover:text-slate-400 transition-colors">{rank}</span>
                            </div>
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 ring-2 ring-slate-700 p-0.5">
                                <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${rankItem.mesin}`} alt={rankItem.mesin} className="w-4/5 h-4/5 opacity-80" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-base sm:text-lg tracking-tight truncate">{rankItem.mesin}</p>
                                <p className="text-sky-400 text-xs sm:text-sm font-medium mt-0.5 truncate">Mesin Sawmill</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-white font-black text-lg sm:text-xl tracking-tight">{(rankItem.yield * 100).toFixed(1)}%</p>
                                <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">{rankItem.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³</p>
                            </div>
                        </div>
                    );
                })}
            </div>
          </>
        ) : (
          <div className="text-center text-slate-400 py-20 text-sm relative z-10">
             Belum ada data produksi yang memadai untuk periode ini.
          </div>
        )}
      </div>

      <BsAchievementUpdate />
    </div>
  );
}
