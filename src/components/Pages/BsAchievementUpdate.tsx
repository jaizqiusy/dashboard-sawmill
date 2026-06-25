import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { Target, RefreshCw, Calendar, ChevronDown, Loader2, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toJpeg } from 'html-to-image';

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
  pilotLadder: number;
  utamaNonPilotLadder: number;
}

export function BsAchievementUpdate() {
  const [data, setData] = useState<BsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('-');
  const [error, setError] = useState<string | null>(null);
  
  const [periodType, setPeriodType] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadJpg = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toJpeg(cardRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
          width: '1150px', // Perfect width to display full columns clearly
          transform: 'none',
        },
        filter: (node: any) => {
          if (node.classList && node.classList.contains('no-export')) {
            return false;
          }
          return true;
        }
      });
      const link = document.createElement('a');
      link.download = `Pencapaian_BS_1-8_${periodType}_${periodType === 'monthly' ? selectedMonth : selectedWeek}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating JPG image:", err);
    } finally {
      setIsDownloading(false);
    }
  };

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
    const colPilotLadder = headers.findIndex((h: string) => h === 'pilot ladder');
    const colUtamaNonPilot = headers.findIndex((h: string) => h === 'utama non pilot ladder');

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
            month: parseInt(row[colMonth] || '0') || 0,
            pilotLadder: colPilotLadder !== -1 ? parseFloat(row[colPilotLadder] || '0') || 0 : 0,
            utamaNonPilotLadder: colUtamaNonPilot !== -1 ? parseFloat(row[colUtamaNonPilot] || '0') || 0 : 0
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
      const months = [...new Set(validData.map(d => d.month).filter(m => m > 0))].sort((a: any, b: any) => b - a);
      const weeks = [...new Set(validData.map(d => d.week).filter(w => w > 0))].sort((a: any, b: any) => b - a);
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
            pilotLadder: 0,
            utamaNonPilotLadder: 0,
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
            byMachine[normalizedName].pilotLadder += d.pilotLadder || 0;
            byMachine[normalizedName].utamaNonPilotLadder += d.utamaNonPilotLadder || 0;
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
        const yieldUNonPilot = m.input > 0 ? (m.utamaNonPilotLadder / m.input) * 100 : 0;
        const yieldT = m.input > 0 ? (m.turunan / m.input) * 100 : 0;
        const yieldTot = m.input > 0 ? (m.totalOutput / m.input) * 100 : 0;
        const avg = m.count > 0 ? m.totalOutput / m.count : 0;
        return {
            ...m,
            yieldUtama: yieldU,
            yieldUtamaNonPilot: yieldUNonPilot,
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
    <div ref={cardRef} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden mt-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-slate-100 pb-4 relative z-10">
            <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                <Target className="w-5 h-5 text-indigo-500" />
                Pencapaian BS 1 - 8 (Realtime)
                </h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Data sinkronisasi langsung dari Google Sheets</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex gap-2">
                    <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-1">
                        <button 
                            onClick={() => setPeriodType('monthly')}
                            className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'monthly' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            Bulan
                        </button>
                        <button 
                            onClick={() => setPeriodType('weekly')}
                            className={cn("px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'weekly' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            Minggu
                        </button>
                    </div>
                    <select 
                        className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1 outline-none"
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
                    className="flex-shrink-0 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors border border-indigo-100"
                >
                    <RefreshCw className={cn("w-3 h-3", loading ? 'animate-spin' : '')} />
                    <span>{loading ? 'Menarik...' : 'Sync'}</span>
                </button>

                <button
                    onClick={downloadJpg}
                    disabled={isDownloading}
                    className="no-export flex-shrink-0 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors border border-emerald-100 cursor-pointer disabled:opacity-50"
                    title="Download JPG"
                >
                    {isDownloading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Download className="w-3 h-3" />
                    )}
                    <span>JPG</span>
                </button>
            </div>
        </div>

        {error && (
            <div className="mb-4 text-xs font-medium text-rose-600 bg-rose-50 p-2 rounded border border-rose-200 relative z-10">
                {error}
            </div>
        )}

        {loading && data.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center relative z-10">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-500">Menarik data realtime...</p>
            </div>
        ) : (
            <div className="relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:bg-slate-100/50 transition-colors flex flex-col justify-between">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Input</p>
                        <p className="text-2xl font-black text-slate-800">{statsBS.summary.input.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs text-slate-400 font-bold">M³</span></p>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:bg-slate-100/50 transition-colors flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-sky-50 rounded-full blur-xl -mr-8 -mt-8" />
                        <div className="flex justify-between items-start mb-2 relative z-10">
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Utama</p>
                           <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">{statsBS.summary.yieldUtama.toFixed(1)}%</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800 relative z-10">{statsBS.summary.utama.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs text-slate-400 font-bold">M³</span></p>
                    </div>
                
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:bg-slate-100/50 transition-colors flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-full blur-xl -mr-8 -mt-8" />
                        <div className="flex justify-between items-start mb-2 relative z-10">
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Turunan</p>
                           <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">{statsBS.summary.yieldTurunan.toFixed(1)}%</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800 relative z-10">{statsBS.summary.turunan.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs text-slate-400 font-bold">M³</span></p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:bg-slate-100/50 transition-colors flex flex-col justify-between">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Lokal</p>
                        <p className="text-2xl font-black text-slate-800">{statsBS.summary.lokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs text-slate-400 font-bold">M³</span></p>
                    </div>
                
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 col-span-2 lg:col-span-1 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full blur-xl -mr-10 -mt-10" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Total Output</p>
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shadow-sm">{statsBS.summary.yieldTotal.toFixed(1)}%</span>
                            </div>
                            <p className="text-3xl font-black text-emerald-950">{statsBS.summary.totalOutput.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-sm font-bold text-emerald-600/70">M³</span></p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-emerald-200/50 flex justify-between items-center relative z-10">
                           <p className="text-[9px] text-emerald-600/80 font-bold uppercase">Avg/Mesin</p>
                           <p className="text-[11px] font-black text-emerald-700">{statsBS.summary.averageOutput.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
                        <span className="relative flex h-5 w-5 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20 animate-ping"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                        Detail Per Mesin
                    </h2>
                    <span className="text-[10px] sm:text-xs text-slate-500 font-bold bg-[#f8fafc] border border-slate-200/60 shadow-sm rounded-lg px-3 py-1.5 uppercase tracking-wide">
                        Update: {lastUpdate}
                    </span>
                </div>

                <div className="overflow-x-auto border border-slate-200/80 rounded-[24px] mt-3 shadow-sm bg-white no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1000px] text-sm">
                        <thead className="bg-[#f8fafc] border-b border-slate-100 text-[11px] sm:text-xs text-[#475569] font-extrabold uppercase tracking-wider">
                            <tr>
                                <th className="py-5 px-4 font-extrabold text-[#475569] text-center uppercase tracking-wider w-16 hidden sm:table-cell">NO</th>
                                <th className="py-5 px-6 font-extrabold text-[#475569] text-left uppercase tracking-wider">MESIN</th>
                                <th className="py-5 px-4 font-extrabold text-[#475569] text-center uppercase tracking-wider leading-tight">INPUT<br/><span className="text-[10px] text-slate-400 font-semibold">(M³)</span></th>
                                <th className="py-5 px-4 font-extrabold text-[#475569] text-center uppercase tracking-wider leading-tight">UTAMA<br/><span className="text-[10px] text-slate-400 font-semibold">(M³)</span></th>
                                <th className="py-5 px-4 font-extrabold text-[#475569] text-center uppercase tracking-wider leading-tight">RENDEMEN<br/>UTAMA (%)</th>
                                <th className="py-5 px-4 font-extrabold text-[#475569] text-center uppercase tracking-wider leading-tight">RENDEMEN UTAMA<br/>NON PILOT LADDER (%)</th>
                                <th className="py-5 px-4 font-extrabold text-[#475569] text-right uppercase tracking-wider">TURUNAN (M³)</th>
                                <th className="py-5 px-4 font-extrabold text-[#475569] text-center uppercase tracking-wider">RENDEMEN<br/>TURUNAN (%)</th>
                                <th className="py-5 px-4 font-extrabold text-[#475569] text-right uppercase tracking-wider">LOKAL (M³)</th>
                                <th className="py-5 px-4 font-extrabold text-[#475569] text-right uppercase tracking-wider">TOTAL<br/>OUTPUT (M³)</th>
                                <th className="py-5 px-4 font-extrabold text-[#475569] text-center uppercase tracking-wider">RENDEMEN<br/>TOTAL (%)</th>
                                <th className="py-5 px-4 font-extrabold text-[#475569] text-right uppercase tracking-wider">AVG<br/>OUTPUT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                        {statsBS.details.map((m: any, idx: number) => {
                            let statusClassesU = 'bg-rose-50 text-rose-700 border border-rose-100';
                            if (m.yieldUtama >= 30) statusClassesU = 'bg-[#e6f4ea] text-[#137333] border border-emerald-100/60';
                            else if (m.yieldUtama >= 25) statusClassesU = 'bg-amber-50 text-amber-700 border border-amber-100';

                            let statusClassesUNon = 'bg-rose-50 text-rose-700 border border-rose-100';
                            if (m.yieldUtamaNonPilot >= 30) statusClassesUNon = 'bg-emerald-50 text-emerald-700 border border-emerald-100/60';
                            else if (m.yieldUtamaNonPilot >= 25) statusClassesUNon = 'bg-amber-50 text-amber-700 border border-amber-100';

                            return (
                                <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                                    <td className="py-5 px-4 font-bold text-slate-500 text-center hidden sm:table-cell">{idx + 1}</td>
                                    <td className="py-5 px-6 font-black text-slate-950 text-left text-sm sm:text-base">{m.name}</td>
                                    <td className="py-5 px-4 font-black text-slate-900 text-center text-sm sm:text-base">{m.input.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                                    <td className="py-5 px-4 font-black text-slate-900 text-center text-sm sm:text-base">{m.utama.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                                    <td className="py-5 px-4 text-center">
                                        <span className={cn("inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black tracking-wide min-w-[70px] sm:min-w-[80px] shadow-sm", statusClassesU)}>
                                            {m.yieldUtama.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                                        </span>
                                    </td>
                                    <td className="py-5 px-4 text-center">
                                        {m.yieldUtamaNonPilot > 0 ? (
                                           <span className={cn("inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black tracking-wide min-w-[70px] sm:min-w-[80px] shadow-sm", statusClassesUNon)}>
                                              {m.yieldUtamaNonPilot.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                                           </span>
                                        ) : (
                                           <span className="font-extrabold text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="py-5 px-4 font-bold text-slate-800 text-right text-sm sm:text-base">{m.turunan.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                                    <td className="py-5 px-4 text-center font-bold text-slate-800 text-sm sm:text-base">
                                        {m.yieldTurunan.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                                    </td>
                                    <td className="py-5 px-4 font-bold text-slate-800 text-right text-sm sm:text-base">{m.lokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                                    <td className="py-5 px-4 font-black text-slate-900 text-right text-sm sm:text-base">{m.totalOutput.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                                    <td className="py-5 px-4 font-black text-slate-900 text-center text-sm sm:text-base">{m.yieldTotal.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td>
                                    <td className="py-5 px-4 font-bold text-slate-800 text-right text-sm sm:text-base">{m.averageOutput.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
}
