import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { AlertCircle, RefreshCw, Download, Search, Loader2, FileSearch } from 'lucide-react';

interface OrderData {
  ukuran: string;
  panjang: string;
  jo: string;
  kebutuhan: string;
  kemarin: string;
  hariIni: string;
  total: string;
  kekurangan: string;
  satuan: string;
}

export function OrderUrgentUpdate() {
  const [data, setData] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('-');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTodayOnly, setShowTodayOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayColName, setTodayColName] = useState('Hari Ini');
  const [yesterdayColName, setYesterdayColName] = useState('Kemarin');

  const sheetUrl = "https://docs.google.com/spreadsheets/d/1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ/edit?gid=1352797868#gid=1352797868";

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

  const processRawData = (csvData: any[][]): OrderData[] => {
    const cleanedData: OrderData[] = [];
    
    // Find header row (usually row 2 which has 'Ukuran' in column 1)
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(10, csvData.length); i++) {
        if (csvData[i] && csvData[i][1] && csvData[i][1].toString().trim() === 'Ukuran') {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) {
        throw new Error("Format header tidak ditemukan.");
    }

    const headers = csvData[headerRowIdx].map((h: any) => (h || '').toString().trim());
    
    const formatVariants = (dateObj: Date) => {
      const getMonthNames = (m: number) => {
         return [
            ['Jan', 'Januari'], ['Feb', 'Februari'], ['Mar', 'Maret'],
            ['Apr', 'April'], ['Mei', 'Mei'], ['Jun', 'Juni'],
            ['Jul', 'Juli'], ['Agt', 'Agustus'], ['Sep', 'September'],
            ['Okt', 'Oktober'], ['Nov', 'November'], ['Des', 'Desember']
         ][m];
      };
      
      const pad = (n: number) => n.toString().padStart(2, '0');
      const d = pad(dateObj.getDate());
      const dNoPad = dateObj.getDate().toString();
      const y2 = dateObj.getFullYear().toString().substring(2);
      
      const vars: string[] = [];
      for (const m of getMonthNames(dateObj.getMonth())) {
         vars.push(`${d} ${m} ${y2}`);
         vars.push(`${dNoPad} ${m} ${y2}`);
      }
      return vars;
    };
    
    // Find today's date column
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayVars = formatVariants(today);
    const yesterdayVars = formatVariants(yesterday);
    
    let todayIdx = headers.findIndex(h => todayVars.some(v => v.toLowerCase() === h.trim().toLowerCase()));
    let yesterdayIdx = headers.findIndex(h => yesterdayVars.some(v => v.toLowerCase() === h.trim().toLowerCase()));

    if (todayIdx !== -1) {
        setTodayColName(headers[todayIdx]);
        if (yesterdayIdx !== -1) {
            setYesterdayColName(headers[yesterdayIdx]);
        } else {
            // fallback for yesterday to the previous column
            yesterdayIdx = todayIdx - 1;
            if (yesterdayIdx > 5 && headers[yesterdayIdx]) {
                setYesterdayColName(headers[yesterdayIdx]);
            }
        }
    } else {
        // Fallback: look for exactly matching date or just generic 'Hari Ini' column if not found
        // By user requirement, matching existing dates
        // Let's try to match existing dates, if not found we might fall back to the last available date column before 'Total'
        let totalIdx = headers.findIndex(h => h === 'Total');
        if (totalIdx > 5) {
            todayIdx = totalIdx - 1; // get the last date column if today not found
            if (headers[todayIdx]) {
                setTodayColName(headers[todayIdx]);
            }
            yesterdayIdx = todayIdx - 1;
            if (yesterdayIdx > 5 && headers[yesterdayIdx]) {
                setYesterdayColName(headers[yesterdayIdx]);
            }
        }
    }

    const colUkuran = headers.indexOf('Ukuran');
    const colPanjang = headers.indexOf('Panjang');
    const colJO = headers.indexOf('JO');
    const colKebutuhan = headers.indexOf('Kebutuhan');
    const colTotal = headers.indexOf('Total');
    const colKekurangan = headers.indexOf('Kekurangan');
    const colSatuan = headers.indexOf('Satuan');

    for (let i = headerRowIdx + 1; i < csvData.length; i++) {
        const row = csvData[i];
        if (!row || row.length === 0) continue;

        const ukuran = (row[colUkuran] || '').toString().trim();
        if (!ukuran) continue; // Skip empty rows

        if (ukuran.toLowerCase() === 'total' || ukuran === '*') continue;

        const panjang = colPanjang !== -1 ? (row[colPanjang] || '').toString().trim() : '';
        const jo = colJO !== -1 ? (row[colJO] || '').toString().trim() : '';
        const kebutuhan = colKebutuhan !== -1 ? (row[colKebutuhan] || '').toString().trim() : '';
        const hariIni = todayIdx !== -1 && todayIdx < row.length ? (row[todayIdx] || '').toString().trim() : '';
        const kemarin = yesterdayIdx !== -1 && yesterdayIdx < row.length ? (row[yesterdayIdx] || '').toString().trim() : '';
        const total = colTotal !== -1 ? (row[colTotal] || '').toString().trim() : '';
        const kekurangan = colKekurangan !== -1 ? (row[colKekurangan] || '').toString().trim() : '';
        const satuan = colSatuan !== -1 ? (row[colSatuan] || '').toString().trim() : '';

        // Ignore rows that are completely empty in the main metrics
        if (!kebutuhan && !total && !kekurangan) continue;

        cleanedData.push({
            ukuran,
            panjang,
            jo,
            kebutuhan,
            kemarin,
            hariIni,
            total,
            kekurangan,
            satuan
        });
    }

    return cleanedData;
  };

  const loadFallback = () => {
    const fallbackData = [
        { ukuran: "52X52", panjang: "", jo: "S-SW", kebutuhan: "928", kemarin: "0", hariIni: "0", total: "1131", kekurangan: "1131", satuan: "BTG" },
        { ukuran: "47x215", panjang: "3150-3760", jo: "S-WBI008603", kebutuhan: "200", kemarin: "50", hariIni: "0", total: "81", kekurangan: "-119", satuan: "BTG" }
    ];
    setData(fallbackData);
    const now = new Date();
    setLastUpdate(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' }) + ' (Luring)');
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
          const processed = processRawData(results.data as any[][]);
          setData(processed);
          const now = new Date();
          setLastUpdate(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' }));
        } catch (err: any) {
          console.error(err);
          setError("Gagal memilah data. " + err.message);
          loadFallback();
        } finally {
          setLoading(false);
        }
      },
      error: function(err) {
        console.error("PapaParse error:", err);
        setError("Gagal mengunduh. Tampilkan data offline.");
        loadFallback();
        setLoading(false);
      }
    });
  }, [sheetUrl]);

  useEffect(() => {
    syncData();
  }, [syncData]);

  const filteredData = useMemo(() => {
    const sTerm = searchTerm.toLowerCase();
    return data.filter(row => {
      const matchesSearch = row.ukuran.toLowerCase().includes(sTerm) || 
             row.panjang.toLowerCase().includes(sTerm) || 
             row.jo.toLowerCase().includes(sTerm);

      if (showTodayOnly) {
         const hasHariIni = row.hariIni && row.hariIni.trim() !== '' && row.hariIni.trim() !== '0' && row.hariIni.trim() !== '-';
         const hasKemarin = row.kemarin && row.kemarin.trim() !== '' && row.kemarin.trim() !== '0' && row.kemarin.trim() !== '-';
         return matchesSearch && (hasHariIni || hasKemarin);
      }
      return matchesSearch;
    });
  }, [data, searchTerm, showTodayOnly]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" /> Order Urgent
          </h1>
          <p className="text-xs text-slate-500 mt-1">Pemantauan Ukuran Urgent & Kekurangan</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            disabled={loading}
            onClick={syncData} 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menarik...' : 'Sinkronkan'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-xs font-medium text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari ukuran, panjang, JO..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
            <input 
              type="checkbox" 
              checked={showTodayOnly} 
              onChange={(e) => setShowTodayOnly(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 accent-rose-600 w-4 h-4"
            />
            <span>Hanya Update Terbaru</span>
          </label>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left border-collapse relative min-w-[700px]">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold bg-slate-50">
                <th className="px-4 py-3 bg-slate-50">Ukuran</th>
                <th className="px-4 py-3 bg-slate-50">Panjang</th>
                <th className="px-4 py-3 bg-slate-50">JO</th>
                <th className="px-4 py-3 text-right bg-slate-50">Kebutuhan</th>
                <th className="px-4 py-3 text-right text-rose-600 bg-slate-50 border-l border-slate-200">1 Hr Lalu ({yesterdayColName})</th>
                <th className="px-4 py-3 text-right text-rose-600 bg-slate-50 border-r border-slate-200">Hr Ini ({todayColName})</th>
                <th className="px-4 py-3 text-right bg-slate-50">Total</th>
                <th className="px-4 py-3 text-right bg-slate-50">Kekurangan</th>
                <th className="px-4 py-3 bg-slate-50">Sat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                      <p className="text-xs">Memuat data "Order Urgent"...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileSearch className="w-6 h-6 text-slate-300" />
                      <p className="text-xs">Tidak ada data ditemukan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isNegative = row.kekurangan.startsWith('-');
                  return (
                    <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 font-bold text-slate-800 align-top whitespace-nowrap">{row.ukuran}</td>
                      <td className="px-4 py-2 text-slate-600 font-mono text-[11px] align-top whitespace-nowrap">{row.panjang || '-'}</td>
                      <td className="px-4 py-2 font-medium text-slate-700 align-top whitespace-nowrap">{row.jo || '-'}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-600 align-top">{row.kebutuhan || '0'}</td>
                      <td className="px-4 py-2 text-right font-black text-rose-500 align-top bg-rose-50/10 border-l border-slate-200">{row.kemarin || '-'}</td>
                      <td className="px-4 py-2 text-right font-black text-rose-600 align-top bg-rose-50/40 border-r border-slate-200">{row.hariIni || '-'}</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-700 align-top">{row.total || '0'}</td>
                      <td className="px-4 py-2 text-right align-top">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-bold ${isNegative ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {row.kekurangan || '0'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-500 text-[10px] font-bold align-top">{row.satuan}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <span>Pembaruan: <span className="text-slate-800">{lastUpdate}</span></span>
          <span>Item: <span className="text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded">{filteredData.length}</span></span>
        </div>
      </div>
    </div>
  );
}
