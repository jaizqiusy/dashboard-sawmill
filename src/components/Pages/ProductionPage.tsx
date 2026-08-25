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

      <div className="bg-[#f5f7ff] rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
            <thead className="bg-[#eef2ff]">
              <tr>
                <th className="px-4 py-3 border border-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-xs whitespace-nowrap text-left">Mesin</th>
                <th className="px-4 py-3 border border-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Input</th>
                <th className="px-4 py-3 border border-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Utama</th>
                <th className="px-4 py-3 border border-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Rend Utama</th>
                <th className="px-4 py-3 border border-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Turunan</th>
                <th className="px-4 py-3 border border-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Rend Turunan</th>
                <th className="px-4 py-3 border border-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Lokal</th>
                <th className="px-4 py-3 border border-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Rend Lokal</th>
                <th className="px-4 py-3 border border-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Total</th>
                <th className="px-4 py-3 border border-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Rend Total</th>
                <th className="px-4 py-3 border border-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Downtime</th>
              </tr>
            </thead>
            <tbody className="bg-[#f8faff]">
              {machines.map((mName, i) => {
                const stat = todayStats?.stats?.find(s => normalizeMachineName(s.mesin) === mName);
                const isDown = stat?.downtime && stat.downtime.length > 0;
                
                return (
                  <tr key={i} className="hover:bg-[#f0f4ff] transition-colors">
                    <td className="px-4 py-3 border border-indigo-100 font-black text-slate-800 whitespace-nowrap text-left">
                      <span>{mName === 'Breakdown' ? 'BD' : mName.replace('BS ', 'BS').replace('Pony ', 'PONI ')}</span>
                    </td>
                    <td className="px-4 py-3 border border-indigo-100 font-black text-blue-600 whitespace-nowrap text-base">
                      {stat ? stat.input.toFixed(2).replace('.', ',') : '-'}
                    </td>
                    <td className="px-4 py-3 border border-indigo-100 font-black text-emerald-600 whitespace-nowrap text-base">
                      {stat ? stat.utama.toFixed(2).replace('.', ',') : '-'}
                    </td>
                    <td className="px-4 py-3 border border-indigo-100 font-black text-indigo-800 whitespace-nowrap text-base bg-indigo-50/30">
                      {stat && stat.input > 0 ? ((stat.utama / stat.input) * 100).toFixed(2).replace('.', ',') + '%' : '-'}
                    </td>
                    <td className="px-4 py-3 border border-indigo-100 font-black text-emerald-600 whitespace-nowrap text-base">
                      {stat ? stat.turunan.toFixed(2).replace('.', ',') : '-'}
                    </td>
                    <td className="px-4 py-3 border border-indigo-100 font-black text-indigo-800 whitespace-nowrap text-base bg-indigo-50/30">
                      {stat && stat.input > 0 ? ((stat.turunan / stat.input) * 100).toFixed(2).replace('.', ',') + '%' : '-'}
                    </td>
                    <td className="px-4 py-3 border border-indigo-100 font-black text-emerald-600 whitespace-nowrap text-base">
                      {stat ? stat.lokal.toFixed(2).replace('.', ',') : '-'}
                    </td>
                    <td className="px-4 py-3 border border-indigo-100 font-black text-indigo-800 whitespace-nowrap text-base bg-indigo-50/30">
                      {stat && stat.input > 0 ? ((stat.lokal / stat.input) * 100).toFixed(2).replace('.', ',') + '%' : '-'}
                    </td>
                    <td className="px-4 py-3 border border-indigo-100 font-black text-emerald-600 whitespace-nowrap text-base">
                      {stat ? stat.total.toFixed(2).replace('.', ',') : '-'}
                    </td>
                    <td className="px-4 py-3 border border-indigo-100 font-black text-indigo-800 whitespace-nowrap text-base bg-indigo-50/30">
                      {stat && stat.input > 0 ? ((stat.total / stat.input) * 100).toFixed(2).replace('.', ',') + '%' : '-'}
                    </td>
                    <td className="px-4 py-3 border border-indigo-100 font-black text-slate-800 whitespace-nowrap text-left">
                      {isDown && stat && (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {stat.downtime.map((dt, idx) => (
                            <span key={idx} className="bg-rose-100 text-rose-700 text-[9px] px-1.5 py-0.5 rounded leading-none uppercase tracking-wider">
                              {dt}
                            </span>
                          ))}
                        </div>
                      )}
                      {!isDown && '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}