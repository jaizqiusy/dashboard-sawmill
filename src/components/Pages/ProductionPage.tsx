import React from 'react';
import { 
  Factory, 
  TrendingUp,
  Clock,
  Settings,
  AlertOctagon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { normalizeMachineName } from '../../services/dataService';

export function ProductionPage({ todayStats }) {
  const machines = ['BS 1', 'BS 2', 'BS 3', 'BS 4', 'BS 5', 'BS 6', 'BS 7', 'BS 8'];

  return (
    <div className="p-5 space-y-6">
      <div className="bg-[#022c22]/60 backdrop-blur-md rounded-2xl p-5 border border-white/5 shadow-lg">
        <h2 className="text-lg font-bold text-emerald-50 flex items-center gap-2 tracking-tight">
          <Factory className="w-5 h-5 text-emerald-400" />
          Live Production
        </h2>
        <p className="text-[11px] text-emerald-200/50 mt-1 uppercase tracking-widest font-medium">Monitoring armada hari ini</p>
      </div>

      <div className="space-y-4">
        {machines.map((mName, i) => {
          const stat = todayStats?.stats?.find(s => normalizeMachineName(s.mesin) === mName);
          const isDown = stat?.downtime && stat.downtime.length > 0;
          const hasData = !!stat;

          return (
            <div key={i} className="bg-[#064e3b]/80 backdrop-blur-sm rounded-2xl border border-white/5 shadow-lg overflow-hidden group">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border",
                    isDown ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : 
                    hasData ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                    "bg-emerald-900/50 text-emerald-200/30 border-emerald-800/50"
                  )}>
                    {mName.replace('BS ', 'BS')}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{mName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isDown ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider">Downtime</span>
                        </>
                      ) : hasData ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Running</span>
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                          <span className="text-[9px] text-emerald-600/70 font-bold uppercase tracking-wider">Off / No Data</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {hasData && (
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-200/50 font-medium uppercase tracking-wider block mb-0.5">Yield</span>
                    <span className={cn(
                      "text-sm font-bold font-mono px-2 py-0.5 rounded",
                      stat.yield >= 0.30 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    )}>
                      {(stat.yield * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {hasData && (
                <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <span className="text-[9px] text-emerald-200/50 uppercase tracking-widest block mb-1">Input Log</span>
                    <span className="text-emerald-50 font-mono text-sm">{stat.input.toFixed(1)} <span className="text-[10px] text-emerald-200/50">m³</span></span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-emerald-400 uppercase tracking-widest block mb-1 font-semibold">Output Utama</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">{stat.utama.toFixed(1)} <span className="text-[10px] text-emerald-400/50">m³</span></span>
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-200/50 uppercase tracking-widest block mb-1">Total Output</span>
                    <span className="text-teal-400 font-mono text-sm font-semibold">{stat.total.toFixed(1)} <span className="text-[10px] text-teal-500/70">m³</span></span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-emerald-200/50 uppercase tracking-widest block mb-1">Turunan/Lokal</span>
                    <span className="text-emerald-100 font-mono text-xs">{(stat.turunan + stat.lokal).toFixed(1)} <span className="text-[10px] text-emerald-200/50">m³</span></span>
                  </div>
                  
                  {isDown && (
                    <div className="col-span-2 mt-2 pt-3 border-t border-rose-500/10">
                      <div className="flex items-start gap-2">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1.5">
                          {stat.downtime.map((dt, idx) => (
                            <span key={idx} className="bg-rose-500/10 text-rose-300 text-[10px] font-medium px-2 py-0.5 rounded border border-rose-500/20">
                              {dt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
