import React, { useMemo } from 'react';
import { FileText, Server } from 'lucide-react';
import { LogDikerjakanData } from '../../types';

interface LogPageProps {
  logDikerjakanData: LogDikerjakanData[];
}

export function LogPage({ logDikerjakanData }: LogPageProps) {
  // Menghitung rekap per mesin
  const recapPerMesin = useMemo(() => {
    const recap: Record<string, { 
      count: number; 
      totalVolume: number;
      panjangCounts: Record<string, number>;
      potonganCounts: Record<string, number>;
    }> = {};
    
    if (logDikerjakanData) {
      logDikerjakanData.forEach(log => {
        const mesin = log.mesin || "Tidak Diketahui";
        if (!recap[mesin]) {
          recap[mesin] = { 
            count: 0, 
            totalVolume: 0,
            panjangCounts: {},
            potonganCounts: {}
          };
        }
        recap[mesin].count += 1;
        recap[mesin].totalVolume += (log.volume || 0);

        const panjangStr = (log.panjang || "-").toString();
        recap[mesin].panjangCounts[panjangStr] = (recap[mesin].panjangCounts[panjangStr] || 0) + 1;

        const potonganStr = log.potongan || "-";
        recap[mesin].potonganCounts[potonganStr] = (recap[mesin].potonganCounts[potonganStr] || 0) + 1;
      });
    }
    
    return Object.entries(recap).map(([mesin, data]) => ({
      mesin,
      count: data.count,
      totalVolume: data.totalVolume,
      panjangCounts: Object.entries(data.panjangCounts).sort((a, b) => b[1] - a[1]),
      potonganCounts: Object.entries(data.potonganCounts).sort((a, b) => a[0].localeCompare(b[0]))
    })).sort((a, b) => b.totalVolume - a.totalVolume);
  }, [logDikerjakanData]);

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

      {/* Recap per Mesin */}
      {recapPerMesin.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recapPerMesin.map((recap, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700 uppercase truncate">{recap.mesin}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg whitespace-nowrap">
                    {recap.count} Btg
                  </span>
                </div>
                <div className="mt-1">
                  <p className="text-2xl font-black text-emerald-600 tracking-tight">
                    {recap.totalVolume.toFixed(2).replace('.', ',')}
                    <span className="text-xs font-medium text-slate-400 ml-1">m³</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">Total Volume</p>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Panjang</p>
                  <div className="flex flex-wrap gap-1">
                    {recap.panjangCounts.map(([p, c]) => (
                      <span key={p} className="text-[10px] font-medium bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-100">
                        {p}: <span className="font-bold">{c}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Potongan</p>
                  <div className="flex flex-wrap gap-1">
                    {recap.potonganCounts.map(([pot, c]) => (
                      <span key={pot} className="text-[10px] font-medium bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-100">
                        {pot}: <span className="font-bold">{c}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
