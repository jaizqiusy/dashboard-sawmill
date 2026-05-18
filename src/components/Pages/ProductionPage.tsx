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
  const machines = ['BS 1', 'BS 2', 'BS 3', 'BS 4', 'BS 5', 'BS 6', 'BS 7', 'BS 8', 'Pony A', 'Pony B', 'Breakdown'];

  const MACHINE_THEMES = [
    'border-indigo-400',
    'border-emerald-400',
    'border-blue-400',
    'border-amber-400',
    'border-fuchsia-400',
    'border-cyan-400',
    'border-rose-400',
    'border-teal-400'
  ];

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
          const borderColor = MACHINE_THEMES[i % MACHINE_THEMES.length];

          return (
            <div key={i} className={cn(
              "bg-white rounded-2xl shadow-sm overflow-hidden group transition-all",
              hasData ? `border-[3px] ${borderColor}` : "border-2 border-slate-200 opacity-60"
            )}>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border shadow-sm transition-all",
                    isDown ? "bg-rose-50 text-rose-600 border-rose-200" : 
                    hasData ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                    "bg-slate-100 text-slate-400 border-slate-200"
                  )}>
                    {mName === 'Breakdown' ? 'BD' : mName.replace('BS ', 'BS').replace('Pony ', 'P')}
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-black text-base leading-none mb-1">{mName}</h3>
                    <div className="flex items-center gap-1.5">
                      {isDown ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[9px] text-rose-600 font-black uppercase tracking-widest">Downtime</span>
                        </>
                      ) : hasData ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Kondisi: Jalan</span>
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Off / No Data</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {hasData && (
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Utama</span>
                    <span className={cn(
                      "text-base font-black font-mono px-2 py-0.5 rounded-lg leading-tight",
                      stat.yield >= 0.30 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {(stat.yield * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {hasData && (
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1 font-black">Input Log</span>
                      <span className="text-slate-800 font-mono text-lg font-black leading-none block">
                        {stat.input.toFixed(1)} <span className="text-[10px] text-slate-400 font-bold">m³</span>
                      </span>
                    </div>
                    
                    <div className="bg-emerald-50 p-3 rounded-xl shadow-sm border border-emerald-200">
                      <span className="text-[9px] text-emerald-600 uppercase tracking-widest block mb-1 font-black">Output Utama</span>
                      <span className="text-emerald-700 font-mono text-xl font-black leading-none block tracking-tighter">
                        {stat.utama.toFixed(1)} <span className="text-[10px] text-emerald-500 font-bold">m³</span>
                      </span>
                    </div>

                    <div className="bg-sky-50 p-3 rounded-xl shadow-sm border border-sky-200">
                      <span className="text-[9px] text-sky-600 uppercase tracking-widest block mb-1 font-black">Total Output</span>
                      <span className="text-sky-700 font-mono text-xl font-black leading-none block tracking-tighter">
                        {stat.total.toFixed(1)} <span className="text-[10px] text-sky-500 font-bold">m³</span>
                      </span>
                    </div>

                    <div className="bg-amber-50 p-3 rounded-xl shadow-sm border border-amber-200">
                      <span className="text-[9px] text-amber-600 uppercase tracking-widest block mb-1 font-black">Turunan</span>
                      <span className="text-amber-700 font-mono text-lg font-black leading-none block">
                        {stat.turunan.toFixed(1)} <span className="text-[10px] text-amber-500 font-bold">m³</span>
                      </span>
                    </div>

                    <div className="bg-indigo-50 p-3 rounded-xl shadow-sm border border-indigo-200">
                      <span className="text-[9px] text-indigo-600 uppercase tracking-widest block mb-1 font-black">Lokal</span>
                      <span className="text-indigo-700 font-mono text-lg font-black leading-none block">
                        {stat.lokal.toFixed(1)} <span className="text-[10px] text-indigo-500 font-bold">m³</span>
                      </span>
                    </div>
                  </div>
                  
                  {isDown && (
                    <div className="mt-3 pt-3 border-t-2 border-rose-100 border-dashed">
                      <div className="flex items-start gap-2.5">
                        <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-2">
                          {stat.downtime.map((dt, idx) => (
                            <span key={idx} className="bg-rose-50 text-rose-700 text-[13px] sm:text-sm font-black px-3.5 py-1.5 rounded-lg border border-rose-100 shadow-sm uppercase tracking-tight">
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
