import React, { useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { getAvailablePeriods, normalizeMachineName } from '../../services/dataService';
import { cn } from '../../lib/utils';

export function DowntimePage({ data }) {
  const [periodType, setPeriodType] = useState('all');
  const periods = React.useMemo(() => getAvailablePeriods(data), [data]);
  const [periodValue, setPeriodValue] = useState('all' as string | number);

  // Filter Data
  const grouped = React.useMemo(() => {
    let filtered = data.filter(d => d.downtime && d.downtime.replace(/,/g, '').trim().length > 0 && d.downtime.toLowerCase().trim() !== 'libur');
    if (periodType === 'daily') {
      filtered = filtered.filter(d => d.tanggal === periodValue);
    } else if (periodType === 'weekly') {
      filtered = filtered.filter(d => d.week === Number(periodValue));
    } else if (periodType === 'monthly') {
      filtered = filtered.filter(d => d.month === Number(periodValue));
    }
    // If periodType is 'all', do not filter further

    const map = {} as Record<string, any[]>;
    filtered.forEach(d => {
      const normalizedMesin = normalizeMachineName(d.mesin);
      if (!map[normalizedMesin]) map[normalizedMesin] = [];
      map[normalizedMesin].push(d);
    });
    return map;
  }, [data, periodType, periodValue]);

  const machines = ['BS 1', 'BS 2', 'BS 3', 'BS 4', 'BS 5', 'BS 6', 'BS 7', 'BS 8', 'Pony A', 'Pony B', 'Breakdown'];

  return (
    <div className="p-5 space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-16 -mt-16" />
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight relative z-10">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          Downtime Alert
        </h2>
        <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold relative z-10">Monitoring kerusakan & perbaikan mesin</p>

        <div className="flex gap-2 mt-4 relative z-10 overflow-x-auto no-scrollbar pb-1">
          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1 shrink-0">
             <button onClick={() => { setPeriodType('all'); setPeriodValue('all'); }} className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'all' ? "bg-rose-100 text-rose-600" : "text-slate-500")}>Semua</button>
             <button onClick={() => { setPeriodType('daily'); setPeriodValue(periods.dates[0]); }} className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'daily' ? "bg-rose-100 text-rose-600" : "text-slate-500")}>Hari</button>
             <button onClick={() => { setPeriodType('weekly'); setPeriodValue(periods.weeks[0]); }} className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'weekly' ? "bg-rose-100 text-rose-600" : "text-slate-500")}>Minggu</button>
             <button onClick={() => { setPeriodType('monthly'); setPeriodValue(periods.months[0]); }} className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'monthly' ? "bg-rose-100 text-rose-600" : "text-slate-500")}>Bulan</button>
          </div>
          {periodType !== 'all' && (
            <select 
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1 outline-none shrink-0"
              value={periodValue}
              onChange={(e) => setPeriodValue(periodType === 'daily' ? e.target.value : parseInt(e.target.value))}
            >
              {periodType === 'daily' && periods.dates.map(d => <option key={d} value={d}>{d}</option>)}
              {periodType === 'weekly' && periods.weeks.map(w => <option key={w} value={w}>Minggu {w}</option>)}
              {periodType === 'monthly' && periods.months.map(m => <option key={m} value={m}>Bulan {m}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {machines.map(mName => {
          const rows = grouped[mName] || [];
          
          if (rows.length === 0) {
            return (
              <div key={mName} className="bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex items-center justify-between p-4 opacity-70">
                <h3 className="text-slate-600 font-bold ml-1">{mName}</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded border border-slate-200">
                  0 Events
                </span>
              </div>
            );
          }

          return (
            <div key={mName} className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
              <div className="p-4 flex items-center justify-between border-b border-rose-50 bg-rose-50/50">
                <h3 className="text-slate-800 font-bold ml-2">{mName}</h3>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-wider rounded border border-rose-200">
                  {rows.length} Events
                </span>
              </div>
              <div className="p-3 space-y-2">
                {rows.map((row, idx) => {
                  const parts = row.downtime.split(/[;,]/).filter(p => p.trim().length > 0);
                  let rawTotalMins = 0;
                  const matches = row.downtime.match(/=(\d+)mnt/g);
                  if (matches) {
                    rawTotalMins = matches.reduce((acc, match) => acc + (parseInt(match.match(/\d+/)?.[0] || '0')), 0);
                  }
                  
                  return (
                    <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{row.tanggal}</span>
                        {rawTotalMins > 0 && <span className="text-[10px] text-rose-600 font-mono font-black bg-rose-100 px-1.5 py-0.5 rounded">{rawTotalMins} mnt</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {parts.map((p, i) => (
                          <span key={i} className="text-xs text-slate-600 font-medium flex items-start gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                            <span className="leading-tight">{p.replace('=', ': ').trim()}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
