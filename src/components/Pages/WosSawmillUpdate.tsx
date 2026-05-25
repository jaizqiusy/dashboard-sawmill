import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { LayoutDashboard, RefreshCw, Download, Globe, Search, Calendar, ChevronDown, Loader2, FileSearch } from 'lucide-react';

interface WosData {
  bulan: string;
  no: string;
  buyer: string;
  st: string;
  m3: string;
}

export function WosSawmillUpdate() {
  const [data, setData] = useState<WosData[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('-');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const sheetUrl = "https://docs.google.com/spreadsheets/d/1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ/edit?gid=1120389821#gid=1120389821";

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

  const processRawData = (csvData: any[]): WosData[] => {
    const cleanedData: WosData[] = [];
    const months = new Set<string>();
    let currentMonth = "";
    let isDataSection = false;

    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        if (!row || row.length === 0) continue;

        const cleanRow = row.map((cell: any) => (cell || '').toString().trim());
        
        const col0 = cleanRow[0]; // No / Bulan
        const col1 = cleanRow[1]; // Nama Buyer
        const col2 = cleanRow[2]; // ST
        const col3 = cleanRow[3]; // M3

        // Skip main headers
        if (col0 === 'BULAN' && col1 === 'NAMA BUYER') {
            isDataSection = true;
            continue;
        }

        // Detect Month Header
        if (col0 && !col1 && !col2 && !col3 && isNaN(parseInt(col0)) && col0.length > 3) {
            if (!col0.toLowerCase().includes("tanggal")) {
                currentMonth = col0;
                months.add(currentMonth);
                continue;
            }
        }

        // Data row
        if (isDataSection && (col1 !== "" || col2 !== "")) {
            if (col0 === '*' || col0.toLowerCase().includes('total')) continue;
            
            cleanedData.push({
                bulan: currentMonth || "Tanpa Bulan",
                no: col0 || "",
                buyer: col1 || "",
                st: col2 || "",
                m3: col3 || ""
            });
            
            if(!currentMonth) months.add("Tanpa Bulan");
        }
    }
    
    setAvailableMonths(Array.from(months));
    return cleanedData;
  };

  const loadFallback = () => {
    const fallbackData = [
        { bulan: "January 2026", no: "1", buyer: "SC015602 10 MTR", st: "OK 07/10", m3: "" },
        { bulan: "January 2026", no: "2", buyer: "NK014603 LAMINA", st: "OK 16/11", m3: "" },
        { bulan: "January 2026", no: "3", buyer: "PI009306", st: "OK", m3: "" },
        { bulan: "January 2026", no: "7", buyer: "TK016701 (CT)", st: "OK 06/12", m3: "" },
        { bulan: "October 2026", no: "1", buyer: "TK016705 (CT)", st: "50X215X5200= 300 BTG", m3: "16.77" },
        { bulan: "October 2026", no: "", buyer: "", st: "50X215X5700 = 300 BTG", m3: "18.38" },
        { bulan: "October 2026", no: "", buyer: "", st: "50X215X6300 = 260 BTG", m3: "17.61" },
        { bulan: "October 2026", no: "2", buyer: "XL016212", st: "36X160X1000-4000", m3: "20.00" },
        { bulan: "October 2026", no: "", buyer: "", st: "36X220X1000-4000", m3: "36.00" }
    ];
    setData(fallbackData);
    setAvailableMonths(["January 2026", "October 2026"]);
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
          const processed = processRawData(results.data);
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

  const exportTableToCSV = () => {
    if (filteredData.length === 0) return;
    let csv = [];
    // headers
    csv.push(["Bulan", "No", "Nama Buyer", "ST", "M3"].join(","));
    for (const row of filteredData) {
      const rowArr = [
        `"${row.bulan}"`,
        `"${row.no}"`,
        `"${row.buyer.replace(/"/g, '""')}"`,
        `"${row.st.replace(/"/g, '""')}"`,
        `"${row.m3}"`
      ];
      csv.push(rowArr.join(","));
    }
    const csvFile = new Blob([csv.join("\n")], {type: "text/csv"});
    const downloadLink = document.createElement("a");
    downloadLink.download = "WOS_Sawmill.csv";
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const filteredData = useMemo(() => {
    const sTerm = searchTerm.toLowerCase();
    let lastParentMatched = false;
    
    return data.filter(row => {
      const isSubRow = row.buyer.trim() === "";
      const searchMatch = (
        row.buyer.toLowerCase().includes(sTerm) || 
        row.st.toLowerCase().includes(sTerm) || 
        row.m3.toLowerCase().includes(sTerm)
      );
      const monthMatch = selectedMonth === 'all' || row.bulan === selectedMonth;

      if (!isSubRow) lastParentMatched = searchMatch; 

      return monthMatch && (searchMatch || (isSubRow && lastParentMatched && sTerm !== ''));
    });
  }, [data, searchTerm, selectedMonth]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" /> WOS Sawmill
          </h1>
          <p className="text-xs text-slate-500 mt-1">Pemantauan Status & Kebutuhan Buyer</p>
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
          <button 
            onClick={exportTableToCSV} 
            className="flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 p-1.5 rounded-lg text-sm font-medium transition-colors" 
            title="Ekspor CSV"
          >
            <Download className="w-4 h-4" />
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
            placeholder="Cari nama buyer, ST, atau M3..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="sm:w-48 relative">
          <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all"
          >
            <option value="all">Semua Bulan</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left border-collapse relative min-w-[600px]">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-4 py-3 w-32">Bulan</th>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">Nama Buyer</th>
                <th className="px-4 py-3">ST (Status/Ukuran)</th>
                <th className="px-4 py-3 text-right">M3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                      <p className="text-xs">Memuat data "WOS Sawmill"...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileSearch className="w-6 h-6 text-slate-300" />
                      <p className="text-xs">Tidak ada data ditemukan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isSubRow = row.buyer.trim() === "";
                  return (
                    <tr key={idx} className={isSubRow ? "bg-slate-50/40 hover:bg-slate-100 transition-colors" : "bg-white hover:bg-slate-50 transition-colors"}>
                      <td className="px-4 py-2 whitespace-nowrap align-top">
                        {!isSubRow && <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wide">{row.bulan}</span>}
                      </td>
                      <td className="px-4 py-2 text-slate-500 font-bold align-top text-center text-xs">{row.no}</td>
                      <td className="px-4 py-2 font-bold text-slate-800 align-top max-w-[150px] truncate" title={row.buyer}>{row.buyer}</td>
                      <td className="px-4 py-2 text-slate-600 font-mono text-[11px] align-top">{row.st || '-'}</td>
                      <td className="px-4 py-2 text-indigo-700 font-black align-top text-right text-xs whitespace-nowrap">{row.m3 || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <span>Pembaruan: <span className="text-slate-800">{lastUpdate}</span></span>
          <span>Total Item: <span className="text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded">{filteredData.length}</span></span>
        </div>
      </div>
    </div>
  );
}
