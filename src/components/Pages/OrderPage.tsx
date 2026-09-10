import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, ZoomOut, ZoomIn, Package, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { fetchOrderUrgentDataFromSheet } from '../../services/dataService';
import { OrderUrgentData } from '../../types';

export function OrderPage() {
  const [activeTab, setActiveTab] = useState('TERKINI');
  const [zoom, setZoom] = useState(93);
  const [data, setData] = useState<OrderUrgentData[]>([]);
  const [dateH1, setDateH1] = useState('H-1');
  const [dateHariIni, setDateHariIni] = useState('Hari Ini');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    const result = await fetchOrderUrgentDataFromSheet();
    setData(result.data);
    setDateH1(result.dateH1);
    setDateHariIni(result.dateHariIni);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = data.filter(item => {
    if (search && !item.ukuran.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'TERKINI') {
      return (item.h1 !== null && item.h1 > 0) || (item.hariIni !== null && item.hariIni > 0);
    }
    if (activeTab === 'KURANG' && item.status !== 'kurang') return false;
    if (activeTab === 'SELESAI' && item.status !== 'selesai') return false;
    return true;
  });

  const countTerkini = data.filter(item => (item.h1 !== null && item.h1 > 0) || (item.hariIni !== null && item.hariIni > 0)).length;
  const countKurang = data.filter(d => d.status === 'kurang').length;
  const countSelesai = data.filter(d => d.status === 'selesai').length;
  const countSemua = data.length;

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      <div className="px-3 sm:px-5 mt-4 space-y-4">
        {/* Controls Row */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-black text-indigo-900 tracking-wide uppercase">SKALA TAMPILAN / ZOOM</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1 hover:bg-slate-200 rounded text-slate-600"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-xs font-bold text-slate-800 w-10 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1 hover:bg-slate-200 rounded text-slate-600"><ZoomIn className="w-4 h-4" /></button>
            </div>
            <button onClick={loadData} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <div className="relative min-w-[140px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari Ukuran..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-800 outline-none focus:border-indigo-500" 
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('TERKINI')}
              className={cn("px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-colors border", 
                activeTab === 'TERKINI' ? "bg-[#312e81] text-white border-[#312e81]" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")}
            >
              TERKINI ({countTerkini})
            </button>
            <button 
              onClick={() => setActiveTab('KURANG')}
              className={cn("px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-colors border", 
                activeTab === 'KURANG' ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-rose-600 border-slate-200 hover:bg-slate-50")}
            >
              KURANG ({countKurang})
            </button>
            <button 
              onClick={() => setActiveTab('SELESAI')}
              className={cn("px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-colors border", 
                activeTab === 'SELESAI' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-emerald-600 border-slate-200 hover:bg-slate-50")}
            >
              SELESAI ({countSelesai})
            </button>
            <button 
              onClick={() => setActiveTab('SEMUA')}
              className={cn("px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-colors border", 
                activeTab === 'SEMUA' ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50")}
            >
              SEMUA ({countSemua})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-x-auto">
          <div style={{ zoom: `${zoom}%` }}>
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-[#f0f4ff]">
                <tr>
                  <th className="py-4 px-4 font-black text-indigo-900 text-xs border-r border-indigo-100/50 w-28">UKURAN</th>
                  <th className="py-4 px-4 font-black text-indigo-900 text-xs border-r border-indigo-100/50 text-center">PANJANG</th>
                  <th className="py-4 px-4 font-black text-indigo-900 text-xs border-r border-indigo-100/50 text-center">JO</th>
                  <th className="py-4 px-4 font-black text-indigo-900 text-xs border-r border-indigo-100/50 text-center">TARGET</th>
                  <th className="py-3 px-4 font-black text-indigo-900 text-xs border-r border-indigo-100/50 text-center">
                    <div className="leading-tight">
                      H-1<br/><span className="text-[9px] font-bold text-indigo-500/70">{dateH1}</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 font-black text-indigo-900 text-xs border-r border-indigo-100/50 text-center">
                    <div className="leading-tight">
                      HARI INI<br/><span className="text-[9px] font-bold text-indigo-500/70">{dateHariIni}</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 font-black text-indigo-900 text-xs border-r border-indigo-100/50 text-center">REALISASI</th>
                  <th className="py-4 px-4 font-black text-indigo-900 text-xs text-center">KEKURANGAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50/50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                      Memuat Data Order Urgent...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                   <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                      Tidak ada data yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const unit = row.jo.toUpperCase().startsWith('FJ-') || row.jo.toUpperCase().includes('FJ-') ? 'M³' : 'BTG';
                    return (
                    <tr key={idx} className={cn("hover:bg-indigo-50/30 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-[#f8faff]")}>
                      <td className="py-3 px-4 border-r border-indigo-50">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", row.status === 'selesai' ? "bg-emerald-400" : "bg-rose-400")} />
                          <span className="font-black text-slate-800 text-sm">{row.ukuran}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 border-r border-indigo-50 text-center">
                        <span className="font-bold text-slate-600">{row.panjang}</span>
                      </td>
                      <td className="py-3 px-4 border-r border-indigo-50 text-center">
                        <span className="inline-block bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-1 rounded">
                          {row.jo}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-r border-indigo-50 text-center">
                        <span className="font-black text-[#1d4ed8] text-base">{row.target} <span className="text-[9px] text-[#93c5fd]">{unit}</span></span>
                      </td>
                      <td className="py-3 px-4 border-r border-indigo-50 text-center">
                        <span className="font-black text-teal-600 text-base">{(row.h1 !== null && !isNaN(row.h1)) ? row.h1 : <span className="text-slate-300">-</span>}</span>
                      </td>
                      <td className="py-3 px-4 border-r border-indigo-50 text-center">
                        <span className="font-black text-emerald-600 text-base">{(row.hariIni !== null && !isNaN(row.hariIni)) ? row.hariIni : <span className="text-indigo-200">-</span>}</span>
                      </td>
                      <td className="py-3 px-4 border-r border-indigo-50 text-center">
                        <span className="font-black text-[#059669] text-base">{row.realisasi} <span className="text-[9px] text-[#6ee7b7]">{unit}</span></span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-rose-600 text-base">{row.kekurangan} <span className="text-[9px] text-rose-300">{unit}</span></span>
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
