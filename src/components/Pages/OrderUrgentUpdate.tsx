import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { AlertCircle, RefreshCw, Search, Loader2, FileSearch, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../lib/utils';

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
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof OrderData, direction: 'asc' | 'desc' } | null>(null);

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
    let filtered = data.filter(row => {
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

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: string | number = a[sortConfig.key];
        let bValue: string | number = b[sortConfig.key];
        
        // Convert to numerals for specific columns
        if (['kebutuhan', 'kemarin', 'hariIni', 'total', 'kekurangan'].includes(sortConfig.key)) {
            aValue = parseFloat(aValue.toString().replace(/[^0-9.-]+/g,"")) || 0;
            bValue = parseFloat(bValue.toString().replace(/[^0-9.-]+/g,"")) || 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [data, searchTerm, showTodayOnly, sortConfig]);

  const requestSort = (key: keyof OrderData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof OrderData) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-400 inline" />;
    }
    if (sortConfig.direction === 'asc') {
        return <ArrowUp className="w-3 h-3 ml-1 text-sky-500 inline" />;
    }
    return <ArrowDown className="w-3 h-3 ml-1 text-sky-500 inline" />;
  };

  return (
    <div className="w-full mx-auto bg-white sm:rounded-xl shadow-sm sm:border border-slate-100 p-4 sm:p-6 lg:mt-6 mt-2 relative min-h-[calc(100vh-6rem)] sm:min-h-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-rose-500" />
            Order Urgent
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Pemantauan Ukuran Urgent & Kekurangan Material</p>
        </div>
        
        <button 
          disabled={loading}
          onClick={syncData} 
          className="w-full sm:w-auto justify-center bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <RefreshCw className={cn("w-4 h-4", loading ? 'animate-spin' : '')} />
          {loading ? 'MENARIK...' : 'SINKRONKAN'}
        </button>
      </div>

      {error && (
        <div className="mb-4 text-xs font-medium text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 flex items-start gap-2">
           <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> 
           <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm transition-shadow outline-none" 
            placeholder="Cari ukuran, panjang, JO..."
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <label className="flex items-center justify-between sm:justify-start cursor-pointer border border-slate-200 rounded-lg px-4 py-2.5 hover:bg-slate-50 transition-colors w-full sm:w-auto group select-none">
          <div className="text-sm font-medium text-slate-700 sm:mr-3 order-2 sm:order-1">
            Update Terbaru
          </div>
          <div className="relative order-1 sm:order-2">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={showTodayOnly} 
              onChange={(e) => setShowTodayOnly(e.target.checked)} 
            />
            <div className="block bg-slate-200 peer-checked:bg-sky-500 w-10 h-6 rounded-full transition-colors"></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
          </div>
        </label>
      </div>

      <div className="sm:border border-slate-200 sm:rounded-lg overflow-x-auto overflow-y-auto max-h-[65vh] shadow-inner sm:shadow-sm -mx-4 sm:mx-0 w-auto table-scrollbar relative">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="text-xs text-slate-500 bg-slate-50 border-y sm:border-t-0 border-slate-200 uppercase sticky top-0 z-20 shadow-sm">
            <tr>
              <th colSpan={3} className="px-4 py-3 text-center border-r border-slate-200 font-semibold tracking-wider bg-slate-50">Identifikasi Material</th>
              <th className="px-4 py-3 text-center border-r border-slate-200 font-semibold tracking-wider bg-slate-50">Target</th>
              <th colSpan={2} className="px-4 py-3 text-center border-r border-slate-200 font-semibold tracking-wider bg-slate-100">Produksi (Pcs)</th>
              <th colSpan={2} className="px-4 py-3 text-center font-semibold tracking-wider bg-slate-50">Status Pemenuhan</th>
            </tr>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors select-none bg-slate-50" onClick={() => requestSort('ukuran')}>
                Ukuran {getSortIcon('ukuran')}
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors select-none bg-slate-50" onClick={() => requestSort('panjang')}>
                Panjang {getSortIcon('panjang')}
              </th>
              <th className="px-4 py-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none bg-slate-50" onClick={() => requestSort('jo')}>
                JO {getSortIcon('jo')}
              </th>
              <th className="px-4 py-3 border-r border-slate-200 text-right cursor-pointer hover:bg-slate-200 transition-colors select-none bg-slate-50" onClick={() => requestSort('kebutuhan')}>
                Kebutuhan {getSortIcon('kebutuhan')}
              </th>
              <th className="px-4 py-3 text-center border-r border-white font-semibold cursor-pointer hover:bg-slate-200 transition-colors select-none bg-slate-100" onClick={() => requestSort('kemarin')}>
                1 Hr Lalu ({yesterdayColName}) {getSortIcon('kemarin')}
              </th>
              <th className="px-4 py-3 text-center border-r border-slate-200 text-sky-900 font-semibold cursor-pointer hover:bg-slate-200 transition-colors select-none bg-slate-100" onClick={() => requestSort('hariIni')}>
                Hr Ini ({todayColName}) {getSortIcon('hariIni')}
              </th>
              <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-200 transition-colors select-none bg-slate-50" onClick={() => requestSort('total')}>
                Total {getSortIcon('total')}
              </th>
              <th className="px-4 py-3 text-center cursor-pointer hover:bg-slate-200 transition-colors select-none bg-slate-50" onClick={() => requestSort('kekurangan')}>
                Kekurangan {getSortIcon('kekurangan')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && data.length === 0 ? (
              <tr>
                 <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                       <p className="text-sm font-medium mt-2">Memuat data Order Urgent...</p>
                    </div>
                 </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                 <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                       <FileSearch className="w-8 h-8 text-slate-300 mb-2" />
                       <p className="text-sm font-medium">Tidak ada data ditemukan.</p>
                       <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau matikan filter "Update Terbaru".</p>
                    </div>
                 </td>
              </tr>
            ) : (
                filteredData.map((row, idx) => {
                  const isNegative = row.kekurangan.startsWith('-');
                  // Decide visual priority based on negative number magnitude roughly
                  let rowOpacity = "opacity-100";
                  if (!isNegative && parseFloat(row.kekurangan.replace(/[^0-9.-]+/g,"")) >= 0) {
                      rowOpacity = "opacity-80 hover:opacity-100";
                  }

                  return (
                    <tr key={idx} className={cn("hover:bg-slate-50 transition-colors group", rowOpacity)}>
                      <td className="px-4 py-3 font-bold text-slate-900">
                         {row.ukuran}
                         <span className="text-[10px] text-slate-400 font-normal ml-1 hidden sm:inline-block">{row.satuan}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{row.panjang || '-'}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{row.jo || '-'}</td>
                      <td className="px-4 py-3 text-right text-slate-500 font-medium border-r border-slate-50">{row.kebutuhan || '0'}</td>
                      <td className="px-4 py-3 text-center text-slate-400 font-medium group-hover:text-slate-500 transition-colors">{row.kemarin || '0'}</td>
                      <td className="px-4 py-3 text-center font-bold text-sky-700 bg-sky-50/30 group-hover:bg-sky-50 transition-colors border-r border-slate-50/50">{row.hariIni || '0'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 text-base">{row.total || '0'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                            "inline-flex items-center justify-center px-2.5 py-1 rounded-md text-sm font-bold min-w-[60px] border",
                            isNegative 
                            ? "bg-rose-100 text-rose-700 border-rose-200" 
                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                        )}>
                          {row.kekurangan || '0'}
                        </span>
                      </td>
                    </tr>
                  )
                })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2 px-4 sm:px-0">
        <div>Menampilkan <span className="font-semibold text-slate-700">{filteredData.length}</span> baris data</div>
        <div>Terakhir disinkronkan: <span className="font-semibold text-slate-700">{lastUpdate}</span></div>
      </div>
    </div>
  );
}
