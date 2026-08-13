import React, { useMemo } from 'react';
import { Calendar, ClipboardList, Target, TrendingUp, Activity, Box, BarChart2 } from 'lucide-react';
import { ProductionData } from '../../types';
import { WosSawmillUpdate } from './WosSawmillUpdate';
import { OrderUrgentUpdate } from './OrderUrgentUpdate';
import { PlaningBulanan } from './PlaningBulanan';

interface PlanPageProps {
  todayStats: any;
  data: ProductionData[];
}

export function PlanPage({ todayStats, data }: PlanPageProps) {
  // Hitung performa hari ini untuk ditampilkan di progres
  const curStats = useMemo(() => {
    let input = 0, utama = 0, total = 0;
    if (todayStats && todayStats.stats && todayStats.stats.length > 0) {
       todayStats.stats.forEach((s: any) => {
         if (s.mesin && s.mesin.toLowerCase() === 'breakdown') {
           input += (s.input || 0);
           utama += (s.utama || 0);
           total += (s.total || 0);
         }
       });
    }
    const rendemenUtama = input > 0 ? (utama / input) * 100 : 0;
    const rendemenTotal = input > 0 ? (total / input) * 100 : 0;
    return { input, utama, total, rendemenUtama, rendemenTotal };
  }, [todayStats]);

  // Target dari requirements
  const targets = {
    input: 110,
    utama: 34,
    total: 72,
    rendemenUtama: 30,
    rendemenTotal: 65
  };

  const calculatePct = (val: number, tgt: number) => {
    return Math.min(100, (val / tgt) * 100).toFixed(1);
  };

  return (
    <div className="p-5 space-y-6 pb-24">
      {/* Header Plan */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Calendar className="w-20 h-20" />
        </div>
        <div className="relative z-10">
          <div className="bg-white/20 w-fit p-2 rounded-xl backdrop-blur-md mb-4 font-bold text-[10px] uppercase tracking-[0.2em]">
            Production Planning
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">Perencanaan (PLAN)</h2>
          <p className="text-sm text-violet-100 leading-relaxed font-medium">Pantau target harian dan jadwal produksi sawmill Anda.</p>
        </div>
      </div>

      {/* Plan Sections */}
      <div className="space-y-4">
        {/* Progress Card - Input & Volume Target */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Target className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-bold text-slate-800">Target Shift Ini</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Input Log Target */}
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><Box className="w-3.5 h-3.5 text-sky-500" /> Input Log</span>
                <span className="text-sm font-black text-slate-800">{calculatePct(curStats.input, targets.input)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${calculatePct(curStats.input, targets.input)}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Target: {targets.input} m³ <span className="mx-1">|</span> Terlaksana: {curStats.input.toFixed(1)} m³</p>
            </div>

            {/* Output Total Target */}
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-emerald-500" /> Output Total</span>
                <span className="text-sm font-black text-slate-800">{calculatePct(curStats.total, targets.total)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${calculatePct(curStats.total, targets.total)}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Target: {targets.total} m³ <span className="mx-1">|</span> Terlaksana: {curStats.total.toFixed(1)} m³</p>
            </div>

            {/* Output Utama Target */}
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-orange-500" /> Output Utama</span>
                <span className="text-sm font-black text-slate-800">{calculatePct(curStats.utama, targets.utama)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${calculatePct(curStats.utama, targets.utama)}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Target: {targets.utama} m³ <span className="mx-1">|</span> Terlaksana: {curStats.utama.toFixed(1)} m³</p>
            </div>
          </div>
        </div>

        {/* Planing Bulanan */}
        <PlaningBulanan />

        <WosSawmillUpdate />
        <OrderUrgentUpdate />

      </div>
    </div>
  );
}
