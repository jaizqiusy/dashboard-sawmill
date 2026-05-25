import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { Target, RefreshCw, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BsData {
  tanggal: string;
  mesin: string;
  input: number;
  utama: number;
  turunan: number;
  lokal: number;
  total: number;
  week: number;
  month: number;
}

export function BsAchievementUpdate() {
  const [data, setData] = useState<BsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('-');
  const [error, setError] = useState<string | null>(null);
  
  const [periodType, setPeriodType] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);

  const sheetUrl = "https://docs.google.com/spreadsheets/d/1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ/edit?gid=0#gid=0";

  const getCsvExportUrl = (url: string) => {
    try {
      const docIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!docIdMatch) return null;
      const id = docIdMatch[1];
      
      let gid = '0';
      if (url.includes('gid=')) {
        const urlObj = new URL(url);
        gid = urlObj.searchParams.get('gid') || '0';
      } else {
        const gidMatch = url.match(/gid=([0-9]+)/);
        if(gidMatch) gid = gidMatch[1];
      }

      return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    } catch (e) {
      return null;
    }
  };

  const processRawData = (csvData: any[]): BsData[] => {
    const cleanedData: BsData[] = [];
    
    // row 0 is headers
    if (!csvData || csvData.length < 2) return cleanedData;
    const headers = csvData[0].map((h: any) => (h || '').toString().trim().toLowerCase());
    
    const colTanggal = headers.indexOf('tanggal');
    const colMesin = headers.findIndex((h: string) => h.includes('mesin'));
    const colInput = headers.findIndex((h: string) => h === 'input');
    const colUtama = headers.findIndex((h: string) => h === 'utama');
    const colTurunan = headers.findIndex((h: string) => h === 'turunan');
    const colLokal = headers.findIndex((h: string) => h.includes('lokal'));
    const colTotal = headers.findIndex((h: string) => h === 'total');
    const colWeek = headers.findIndex((h: string) => h === 'week');
    const colMonth = headers.findIndex((h: string) => h === 'month');

    for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        if (!row || row.length === 0) continue;
        
        let mesinStr = colMesin !== -1 ? (row[colMesin] || '').toString().trim() : '';
        if (!mesinStr) continue;

        cleanedData.push({
            tanggal: colTanggal !== -1 ? (row[colTanggal]||'').toString().trim() : '',
            mesin: mesinStr,
            input: parseFloat(row[colInput] || '0') || 0,
            utama: parseFloat(row[colUtama] || '0') || 0,
            turunan: parseFloat(row[colTurunan] || '0') || 0,
            lokal: parseFloat(row[colLokal] || '0') || 0,
            total: parseFloat(row[colTotal] || '0') || 0,
            week: parseInt(row[colWeek] || '0') || 0,
            month: parseInt(row[colMonth] || '0') || 0
        });
    }

    return cleanedData;
  };

  const syncData = useCallback(() => {
    setLoading(true);
    setError(null);
    const csvUrl = getCsvExportUrl(sheetUrl);

    if (!csvUrl) {
      setError("URL Google Sheets tidak valid.");
      setLoading(false);
      return;
    }

    Papa.parse(csvUrl, {
      download: true,
      skipEmptyLines: true,
      complete: function(results) {
        try {
          const processed = processRawData(results.data);
          
          // Determine available periods based on data that actually has input
          const validData = processed.filter(d => d.input > 0 || d.total > 0);
          const months = [...new Set(validData.map(d => d.month).filter(m => m > 0))].sort((a, b) => b - a);
          const weeks = [...new Set(validData.map(d => d.week).filter(w => w > 0))].sort((a, b) => b - a);
          
          setData(processed);
          
          // Always set to latest available period to show updated/running data
          if (months.length > 0) setSelectedMonth(months[0]);
          if (weeks.length > 0) setSelectedWeek(weeks[0]);

          const now = new Date();
          setLastUpdate(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' }));
        } catch (err: any) {
          console.error(err);
          setError("Gagal memilah data. " + err.message);
        } finally {
          setLoading(false);
        }
      },
      error: function(err) {
        console.error("PapaParse error:", err);
        setError("Gagal mengunduh data realtime.");
        setLoading(false);
      }
    });
  }, [sheetUrl]);

  useEffect(() => {
    syncData();
  }, [syncData]);

  const periods = useMemo(() => {
      const validData = data.filter(d => d.input > 0 || d.total > 0);
      const months = [...new Set(validData.map(d => d.month).filter(m => m > 0))].sort((a, b) => b - a);
      const weeks = [...new Set(validData.map(d => d.week).filter(w => w > 0))].sort((a, b) => b - a);
      return { months, weeks };
  }, [data]);

  const statsBS = useMemo(() => {
    const periodValue = periodType === 'monthly' ? selectedMonth : selectedWeek;
    
    const bsData = data.filter(d => {
      if (!d.mesin || d.input <= 0) return false;
      const name = d.mesin.toUpperCase().replace(/\s+/g, ' ').trim();
      if (!name.match(/^BS\s*[1-8]$/)) return false;

      return (periodType === 'weekly' && d.week === periodValue) || 
             (periodType === 'monthly' && d.month === periodValue);
    });

    const byMachine: Record<string, any> = {};
    for (let i = 1; i <= 8; i++) {
        byMachine[`BS ${i}`] = {
            name: `BS ${i}`,
            input: 0,
            utama: 0,
            turunan: 0,
            lokal: 0,
            totalOutput: 0,
            count: 0
        };
    }

    let totalInput = 0;
    let totalUtama = 0;
    let totalTurunan = 0;
    let totalLokal = 0;
    let totalOutput = 0;

    bsData.forEach(d => {
        let normalizedName = d.mesin.toUpperCase().replace(/\s+/g, ' ').trim();
        // Fix names like "BS1" to "BS 1"
        if(normalizedName.match(/^BS[1-8]$/)) {
            normalizedName = normalizedName.replace('BS', 'BS ');
        }

        if (byMachine[normalizedName]) {
            byMachine[normalizedName].input += d.input;
            byMachine[normalizedName].utama += d.utama;
            byMachine[normalizedName].turunan += d.turunan;
            byMachine[normalizedName].lokal += d.lokal;
            byMachine[normalizedName].totalOutput += d.total;
            byMachine[normalizedName].count++;
        }
        
        totalInput += d.input;
        totalUtama += d.utama;
        totalTurunan += d.turunan;
        totalLokal += d.lokal;
        totalOutput += d.total;
    });

    const yieldUtama = totalInput > 0 ? (totalUtama / totalInput) * 100 : 0;
    const yieldTurunan = totalInput > 0 ? (totalTurunan / totalInput) * 100 : 0;
    const yieldTotal = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;
    const averageTotalOutput = bsData.length > 0 ? totalOutput / bsData.length : 0;

    const details = Object.values(byMachine).map(m => {
        const yieldU = m.input > 0 ? (m.utama / m.input) * 100 : 0;
        const yieldT = m.input > 0 ? (m.turunan / m.input) * 100 : 0;
        const yieldTot = m.input > 0 ? (m.totalOutput / m.input) * 100 : 0;
        const avg = m.count > 0 ? m.totalOutput / m.count : 0;
        return {
            ...m,
            yieldUtama: yieldU,
            yieldTurunan: yieldT,
            yieldTotal: yieldTot,
            averageOutput: avg
        };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return {
      summary: {
        input: totalInput,
        utama: totalUtama,
        yieldUtama: yieldUtama,
        turunan: totalTurunan,
        yieldTurunan: yieldTurunan,
        lokal: totalLokal,
        totalOutput: totalOutput,
        yieldTotal: yieldTotal,
        averageOutput: averageTotalOutput
      },
      details
    };
  }, [data, periodType, selectedMonth, selectedWeek]);

  return (
    <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-2xl p-5 border border-indigo-800 shadow-sm relative overflow-hidden mt-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] -mr-16 -mt-16 opacity-40 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-indigo-500/30 pb-4 relative z-10">
            <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                <Target className="w-5 h-5 text-indigo-400" />
                Pencapaian BS 1 - 8 (Realtime)
                </h2>
                <p className="text-[10px] text-indigo-300 uppercase tracking-widest mt-1">Data sinkronisasi langsung dari Google Sheets</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex gap-2">
                    <div className="flex bg-indigo-900/40 border border-indigo-500/20 rounded-lg p-1">
                        <button 
                            onClick={() => setPeriodType('monthly')}
                            className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'monthly' ? "bg-indigo-500 text-white shadow-sm" : "text-indigo-300 hover:text-indigo-100")}
                        >
                            Bulan
                        </button>
                        <button 
                            onClick={() => setPeriodType('weekly')}
                            className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'weekly' ? "bg-indigo-500 text-white shadow-sm" : "text-indigo-300 hover:text-indigo-100")}
                        >
                            Minggu
                        </button>
                    </div>
                    <select 
                        className="bg-indigo-900/40 border border-indigo-500/20 text-indigo-100 text-xs font-bold rounded-lg px-3 py-1 outline-none"
                        value={periodType === 'monthly' ? selectedMonth : selectedWeek}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (periodType === 'monthly') setSelectedMonth(val);
                            else setSelectedWeek(val);
                        }}
                    >
                        {periodType === 'monthly' ? periods.months.map((m, idx) => (
                        <option key={"m-" + m} value={m}>Bulan {m} {idx === 0 ? '(Berjalan)' : ''}</option>
                        )) : periods.weeks.map((w, idx) => (
                        <option key={"w-" + w} value={w}>Minggu {w} {idx === 0 ? '(Berjalan)' : ''}</option>
                        ))}
                    </select>
                </div>

                <button 
                    disabled={loading}
                    onClick={syncData} 
                    className="flex-shrink-0 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors"
                >
                    <RefreshCw className={cn("w-3 h-3", loading ? 'animate-spin' : '')} />
                    <span>{loading ? 'Menarik...' : 'Sync'}</span>
                </button>
            </div>
        </div>

        {error && (
            <div className="mb-4 text-xs font-medium text-rose-200 bg-rose-900/40 p-2 rounded border border-rose-500/30 relative z-10">
                {error}
            </div>
        )}

        {loading && data.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center relative z-10">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                <p className="text-sm font-medium text-indigo-200">Menarik data realtime...</p>
            </div>
        ) : (
            <div className="relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors flex flex-col justify-between">
                        <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-2">Input</p>
                        <p className="text-2xl font-black text-white">{statsBS.summary.input.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs text-indigo-200 font-bold">M³</span></p>
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/10 rounded-full blur-xl -mr-8 -mt-8" />
                        <div className="flex justify-between items-start mb-2 relative z-10">
                           <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">Utama</p>
                           <span className="text-[10px] font-black text-sky-300 bg-sky-900/40 px-1.5 py-0.5 rounded border border-sky-500/20">{statsBS.summary.yieldUtama.toFixed(1)}%</span>
                        </div>
                        <p className="text-2xl font-black text-sky-100 relative z-10">{statsBS.summary.utama.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs text-sky-200/50 font-bold">M³</span></p>
                    </div>
                
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full blur-xl -mr-8 -mt-8" />
                        <div className="flex justify-between items-start mb-2 relative z-10">
                           <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">Turunan</p>
                           <span className="text-[10px] font-black text-orange-300 bg-orange-900/40 px-1.5 py-0.5 rounded border border-orange-500/20">{statsBS.summary.yieldTurunan.toFixed(1)}%</span>
                        </div>
                        <p className="text-2xl font-black text-orange-100 relative z-10">{statsBS.summary.turunan.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs text-orange-200/50 font-bold">M³</span></p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors flex flex-col justify-between">
                        <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-2">Lokal</p>
                        <p className="text-2xl font-black text-amber-100">{statsBS.summary.lokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs text-amber-200/50 font-bold">M³</span></p>
                    </div>
                
                    <div className="bg-gradient-to-br from-emerald-900/60 to-emerald-800/40 rounded-xl p-4 border border-emerald-500/40 backdrop-blur-sm col-span-2 lg:col-span-1 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl -mr-10 -mt-10" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest">Total Output</p>
                                <span className="text-[10px] font-black text-emerald-100 bg-emerald-600/80 px-1.5 py-0.5 rounded shadow-sm">{statsBS.summary.yieldTotal.toFixed(1)}%</span>
                            </div>
                            <p className="text-3xl font-black text-white">{statsBS.summary.totalOutput.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-sm font-bold text-emerald-200/70">M³</span></p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-emerald-500/30 flex justify-between items-center relative z-10">
                           <p className="text-[9px] text-emerald-300/80 font-bold uppercase">Avg/Mesin</p>
                           <p className="text-[11px] font-black text-emerald-100">{statsBS.summary.averageOutput.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4 border-b border-indigo-500/30 pb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                        <Target className="w-4 h-4 text-indigo-400" />
                        Detail Per Mesin
                    </h2>
                    <span className="text-[9px] text-indigo-300 font-medium bg-indigo-900/50 px-2 py-1 rounded border border-indigo-500/20">
                        Update: {lastUpdate}
                    </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {statsBS.details.map((m: any, idx: number) => (
                    <div key={idx} className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors flex flex-col">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                            <h3 className="font-bold text-white text-sm">{m.name}</h3>
                            <span className="text-[10px] font-black bg-indigo-500/30 text-indigo-200 px-2 py-1 rounded border border-indigo-500/20">Rendemen: {m.yieldTotal.toFixed(1)}%</span>
                        </div>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-2 gap-y-3">
                            <div>
                                <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mb-0.5">Input</p>
                                <p className="text-xs font-bold text-white">{m.input.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mb-0.5 flex gap-1">Utama <span className="text-sky-300/70">({m.yieldUtama.toFixed(0)}%)</span></p>
                                <p className="text-xs font-bold text-sky-200">{m.utama.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mb-0.5 flex gap-1">Turunan <span className="text-orange-300/70">({m.yieldTurunan.toFixed(0)}%)</span></p>
                                <p className="text-xs font-bold text-orange-200">{m.turunan.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mb-0.5">Lokal</p>
                                <p className="text-xs font-bold text-amber-200">{m.lokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-0.5">Total Out</p>
                                <p className="text-xs font-bold text-emerald-300">{m.totalOutput.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mb-0.5">Avg Out</p>
                                <p className="text-xs font-bold text-indigo-200">{m.averageOutput.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</p>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </div>
        )}
    </div>
  );
}
