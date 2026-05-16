import React from 'react';
import { cn } from '../lib/utils';
import { MachineRanking } from '../services/dataService';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RankingTableProps {
  data: MachineRanking[];
  periodLabel: string;
}

export function RankingTable({ data, periodLabel }: RankingTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Ranking Output Mesin</h3>
            <p className="text-sm text-slate-500 font-medium">Monitoring performa mesin Band Saw ({periodLabel})</p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <span className="px-3 py-1 bg-rose-500/10 text-rose-600 text-xs font-semibold rounded-md border border-rose-500/20">{'< '}30% Rendah</span>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-xs font-semibold rounded-md border border-amber-500/20">30–34% Baik</span>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-semibold rounded-md border border-emerald-500/20">≥ 35% Sangat Baik</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {/* Desktop Table */}
        <table className="hidden md:table w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-200">
              <th className="p-4 text-sm font-bold text-slate-500 uppercase w-16 text-center">#</th>
              <th className="p-4 text-sm font-bold text-slate-500 uppercase">Mesin</th>
              <th className="p-4 text-sm font-bold text-slate-500 uppercase text-center w-36">
                Rendemen<br/>Utama
              </th>
              <th className="p-4 text-sm font-bold text-slate-500 uppercase text-center w-24">Input</th>
              <th className="p-4 text-sm font-bold text-emerald-500 uppercase text-center bg-emerald-50/50 w-24">Utama</th>
              <th className="p-4 text-sm font-bold text-blue-500 uppercase text-center bg-blue-50/50 w-24">Turunan</th>
              <th className="p-4 text-sm font-bold text-orange-500 uppercase text-center bg-orange-50/50 w-24">Lokal</th>
              <th className="p-4 text-sm font-bold text-slate-900 uppercase text-center w-24">Output</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => {
              const yieldPct = row.yield * 100;
              let yieldColor = "text-emerald-600";
              let yieldBarColor = "bg-emerald-500";
              let yieldBadgeBg = "bg-emerald-50/50 border-emerald-200/50";
              
              if (yieldPct < 30) {
                yieldColor = "text-rose-600";
                yieldBarColor = "bg-rose-500";
                yieldBadgeBg = "bg-rose-50/50 border-rose-200/50";
              } else if (yieldPct < 35) {
                yieldColor = "text-amber-600";
                yieldBarColor = "bg-amber-500";
                yieldBadgeBg = "bg-amber-50/50 border-amber-200/50";
              }

              let rankBadgeColor = "bg-slate-100 text-slate-500";
              if (i === 0) rankBadgeColor = "bg-[#f39c12] text-black";
              else if (i === 1) rankBadgeColor = "bg-[#bdc3c7] text-black";
              else if (i === 2) rankBadgeColor = "bg-[#d35400] text-white";

              return (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-center">
                    <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm", rankBadgeColor)}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900 text-lg tracking-tight">{row.mesin}</td>
                  <td className="p-4">
                    <div className="flex flex-col items-center gap-2">
                       <span className={cn("text-base font-bold px-3 py-1 rounded border", yieldColor, yieldBadgeBg)}>
                        {yieldPct.toFixed(1)}%
                      </span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", yieldBarColor)} style={{ width: `${Math.min(100, yieldPct)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-base font-mono text-slate-600 font-medium">{row.input.toFixed(1)}</span>
                      <span className="text-xs text-slate-400 font-mono mt-0.5">m³</span>
                    </div>
                  </td>
                  <td className="p-4 text-center bg-emerald-50/50">
                    <div className="flex flex-col items-center">
                      <span className="text-base font-mono text-emerald-600 font-medium">{row.utama.toFixed(1)}</span>
                      <span className="text-xs text-emerald-500 font-mono mt-0.5">m³</span>
                    </div>
                  </td>
                  <td className="p-4 text-center bg-blue-50/50">
                    <div className="flex flex-col items-center">
                       <span className="text-base font-mono text-blue-600 font-medium">{row.turunan.toFixed(1)}</span>
                       <span className="text-xs text-blue-500 font-mono mt-0.5">m³</span>
                    </div>
                  </td>
                  <td className="p-4 text-center bg-orange-50/50">
                    <div className="flex flex-col items-center">
                      <span className="text-base font-mono text-orange-600 font-medium">{row.lokal.toFixed(1)}</span>
                      <span className="text-xs text-orange-500 font-mono mt-0.5">m³</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-base font-mono text-slate-900 font-bold">{row.total.toFixed(1)}</span>
                      <span className="text-xs text-slate-500 font-mono mt-0.5">m³</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {data.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                  Tidak ada data untuk periode ini
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {data.map((row, i) => {
            const yieldPct = row.yield * 100;
            let yieldColor = "text-emerald-600";
            let yieldBarColor = "bg-emerald-500";
            let yieldBadgeBg = "bg-emerald-50/50 border-emerald-200/50";
            
            if (yieldPct < 30) {
              yieldColor = "text-rose-600";
              yieldBarColor = "bg-rose-500";
              yieldBadgeBg = "bg-rose-50/50 border-rose-200/50";
            } else if (yieldPct < 35) {
              yieldColor = "text-amber-600";
              yieldBarColor = "bg-amber-500";
              yieldBadgeBg = "bg-amber-50/50 border-amber-200/50";
            }

            let rankBadgeColor = "bg-slate-100 text-slate-500";
            if (i === 0) rankBadgeColor = "bg-[#f39c12] text-black";
            else if (i === 1) rankBadgeColor = "bg-[#bdc3c7] text-black";
            else if (i === 2) rankBadgeColor = "bg-[#d35400] text-white";

            return (
              <div key={i} className="flex flex-col p-4 bg-white space-y-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm", rankBadgeColor)}>
                      {i + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-lg tracking-tight">{row.mesin}</h4>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className={cn("text-sm font-bold px-2 py-0.5 rounded border", yieldColor, yieldBadgeBg)}>
                      {yieldPct.toFixed(1)}%
                    </span>
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", yieldBarColor)} style={{ width: `${Math.min(100, yieldPct)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm border-t border-slate-100 pt-3">
                   <div className="flex flex-col p-2 bg-slate-50/50 rounded-lg">
                      <span className="text-xs text-slate-500 uppercase font-bold mb-1">Input</span>
                      <div className="font-mono text-slate-600 font-medium">
                        {row.input.toFixed(1)} <span className="text-[10px] text-slate-400">m³</span>
                      </div>
                   </div>
                   <div className="flex flex-col p-2 bg-emerald-50/50 rounded-lg">
                      <span className="text-xs text-emerald-500 uppercase font-bold mb-1">Utama</span>
                      <div className="font-mono text-emerald-600 font-medium">
                        {row.utama.toFixed(1)} <span className="text-[10px] text-emerald-500">m³</span>
                      </div>
                   </div>
                   <div className="flex flex-col p-2 bg-blue-50/50 rounded-lg">
                      <span className="text-xs text-blue-500 uppercase font-bold mb-1">Turunan</span>
                      <div className="font-mono text-blue-600 font-medium">
                        {row.turunan.toFixed(1)} <span className="text-[10px] text-blue-500">m³</span>
                      </div>
                   </div>
                   <div className="flex flex-col p-2 bg-orange-50/50 rounded-lg">
                      <span className="text-xs text-orange-500 uppercase font-bold mb-1">Lokal</span>
                      <div className="font-mono text-orange-600 font-medium">
                        {row.lokal.toFixed(1)} <span className="text-[10px] text-orange-500">m³</span>
                      </div>
                   </div>
                </div>
                <div className="flex justify-between items-center bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <span className="text-xs text-slate-600 uppercase font-bold">Total Output</span>
                  <div className="font-mono text-slate-900 font-bold text-base">
                    {row.total.toFixed(1)} <span className="text-xs text-slate-500">m³</span>
                  </div>
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-medium flex-1">
              Tidak ada data untuk periode ini
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
