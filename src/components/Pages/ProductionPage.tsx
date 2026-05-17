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
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
          <Factory className="w-5 h-5 text-indigo-500" />
          Live Production
        </h2>
        <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Monitoring mesin hari ini</p>
      </div>

      <div className="space-y-4">
        {machines.map((mName, i) => {
          const stat = todayStats?.stats?.find(s => normalizeMachineName(s.mesin) === mName);
          const isDown = stat?.downtime && stat.downtime.length > 0;
          const hasData = !!stat;

          return (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border",
                    isDown ? "bg-rose-50 text-rose-500 border-rose-200" : 
                    hasData ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                    "bg-slate-100 text-slate-400 border-slate-200"
                  )}>
                    {mName.replace('BS ', 'BS')}
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold text-sm">{mName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isDown ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider">Downtime</span>
                        </>
                      ) : hasData ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Running</span>
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Off / No Data</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {hasData && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Yield</span>
                    <span className={cn(
                      "text-sm font-bold font-mono px-2 py-0.5 rounded",
                      stat.yield >= 0.30 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {(stat.yield * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {hasData && (
                <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1 font-bold">Input Log</span>
                    <span className="text-slate-700 font-mono text-sm font-bold">{stat.input.toFixed(1)} <span className="text-[10px] text-slate-400">m³</span></span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-emerald-600 uppercase tracking-widest block mb-1 font-black">Output Utama</span>
                    <span className="text-emerald-500 font-mono font-bold text-sm tracking-tight">{stat.utama.toFixed(1)} <span className="text-[10px] text-emerald-400">m³</span></span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1 font-bold">Total Output</span>
                    <span className="text-sky-500 font-mono text-sm font-bold">{stat.total.toFixed(1)} <span className="text-[10px] text-sky-400">m³</span></span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1 font-bold">Turunan/Lokal</span>
                    <span className="text-slate-600 font-mono text-xs font-bold">{(stat.turunan + stat.lokal).toFixed(1)} <span className="text-[10px] text-slate-400">m³</span></span>
                  </div>
                  
                  {isDown && (
                    <div className="col-span-2 mt-2 pt-3 border-t border-rose-100">
                      <div className="flex items-start gap-2">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1.5">
                          {stat.downtime.map((dt, idx) => (
                            <span key={idx} className="bg-rose-50 text-rose-600 text-[10px] font-medium px-2 py-0.5 rounded border border-rose-200">
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
