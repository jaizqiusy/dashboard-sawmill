import React from 'react';
import { FileText } from 'lucide-react';
import { LogDikerjakanData } from '../../types';

interface LogPageProps {
  logDikerjakanData: LogDikerjakanData[];
}

export function LogPage({ logDikerjakanData }: LogPageProps) {
  return (
    <div className="p-5 space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
          <FileText className="w-5 h-5 text-emerald-500" />
          Log Dikerjakan Hari Ini
        </h2>
        <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
          Data log dari sheets Log_dikerjakan
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Mesin</th>
                <th className="px-4 py-3 border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Nomer Log</th>
                <th className="px-4 py-3 border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Panjang</th>
                <th className="px-4 py-3 border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Diameter</th>
                <th className="px-4 py-3 border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Volume</th>
                <th className="px-4 py-3 border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Potongan</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {logDikerjakanData && logDikerjakanData.length > 0 ? (
                logDikerjakanData.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 border border-slate-200 font-bold text-slate-800 whitespace-nowrap">
                      {log.mesin}
                    </td>
                    <td className="px-4 py-2.5 border border-slate-200 font-medium text-slate-600 whitespace-nowrap">
                      {log.nomer_log}
                    </td>
                    <td className="px-4 py-2.5 border border-slate-200 font-medium text-slate-600 whitespace-nowrap">
                      {log.panjang}
                    </td>
                    <td className="px-4 py-2.5 border border-slate-200 font-medium text-slate-600 whitespace-nowrap">
                      {log.diameter}
                    </td>
                    <td className="px-4 py-2.5 border border-slate-200 font-black text-emerald-600 whitespace-nowrap">
                      {log.volume.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-4 py-2.5 border border-slate-200 font-black text-indigo-600 whitespace-nowrap">
                      {log.potongan}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium text-sm">
                    Belum ada data log yang dikerjakan hari ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
