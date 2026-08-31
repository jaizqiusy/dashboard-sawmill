import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Server, 
  RefreshCw, 
  Search, 
  Calendar, 
  Filter, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ArrowUpDown, 
  ChevronDown, 
  User, 
  AlertCircle,
  Database,
  BarChart3
} from 'lucide-react';
import { LogDikerjakanData } from '../../types';
import { fetchLogDikerjakanFromSheet } from '../../services/dataService';
import { cn } from '../../lib/utils';

interface LogPageProps {
  logDikerjakanData: LogDikerjakanData[];
  onUpdateLogData?: (newData: LogDikerjakanData[]) => void;
}

// Block and filter duplicate log entries (same log number on the same date)
function deduplicateLogs(logs: LogDikerjakanData[]): LogDikerjakanData[] {
  if (!logs || !Array.isArray(logs)) return [];
  const seen = new Set<string>();
  return logs.filter(item => {
    if (!item || !item.nomer_log || !item.mesin) return false;
    const cleanLog = item.nomer_log.trim().toUpperCase();
    const cleanDate = (item.tanggal || '').trim();
    const key = cleanDate ? `${cleanDate}_${cleanLog}` : cleanLog;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Get today's ISO date string (YYYY-MM-DD) in Asia/Jakarta timezone
function getTodayISO(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Asia/Jakarta', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(new Date());
  } catch (e) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}

// Format ISO date (YYYY-MM-DD) to Indonesian readable date (e.g. 28 Agu 2026)
function formatIndoDate(isoDate: string): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${day} ${months[monthIdx] || ''} ${year}`;
}

export function LogPage({ logDikerjakanData, onUpdateLogData }: LogPageProps) {
  const [data, setData] = useState<LogDikerjakanData[]>(() => deduplicateLogs(logDikerjakanData || []));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  
  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('TODAY');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMesin, setSelectedMesin] = useState<string>('ALL');
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  
  // Sorting
  const [sortField, setSortField] = useState<'volume' | 'panjang' | 'diameter' | 'nomer_log' | 'mesin' | 'timestamp'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const todayISO = useMemo(() => getTodayISO(), []);

  // Update local data if props change
  useEffect(() => {
    if (logDikerjakanData && logDikerjakanData.length > 0) {
      setData(deduplicateLogs(logDikerjakanData));
    }
  }, [logDikerjakanData]);

  // Real-time synchronization function
  const handleSyncRealtime = useCallback(async (manual = true) => {
    try {
      setIsSyncing(true);
      const freshData = await fetchLogDikerjakanFromSheet();
      if (freshData && freshData.length > 0) {
        const cleanData = deduplicateLogs(freshData);
        setData(cleanData);
        if (onUpdateLogData) {
          onUpdateLogData(cleanData);
        }
      }
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(timeStr);
    } catch (err) {
      console.error('Failed to sync Log Dikerjakan data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [onUpdateLogData]);

  // Sync on initial mount once
  useEffect(() => {
    handleSyncRealtime(false);
  }, [handleSyncRealtime]);

  // Extract all unique dates available in the data
  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    data.forEach(item => {
      if (item.tanggal) {
        datesSet.add(item.tanggal);
      }
    });
    return Array.from(datesSet).sort().reverse();
  }, [data]);

  // Check if today has data
  const todayHasData = useMemo(() => {
    return data.some(item => item.tanggal === todayISO);
  }, [data, todayISO]);

  // Extract unique machines & lines for dropdowns
  const uniqueMachines = useMemo(() => {
    const machines = new Set<string>();
    data.forEach(item => {
      if (item.mesin) machines.add(item.mesin);
    });
    return Array.from(machines).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data]);

  const uniqueLines = useMemo(() => {
    const lines = new Set<string>();
    data.forEach(item => {
      if (item.subBagian) lines.add(item.subBagian);
    });
    return Array.from(lines).sort();
  }, [data]);

  // Filtered and Sorted Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. Date filter
      if (selectedDate === 'TODAY') {
        if (item.tanggal !== todayISO) return false;
      } else if (selectedDate !== 'ALL') {
        if (item.tanggal !== selectedDate) return false;
      }

      // 2. Machine filter
      if (selectedMesin !== 'ALL' && item.mesin !== selectedMesin) {
        return false;
      }

      // 3. Line filter
      if (selectedLine !== 'ALL' && item.subBagian !== selectedLine) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchLog = (item.nomer_log || '').toLowerCase().includes(query);
        const matchMesin = (item.mesin || '').toLowerCase().includes(query);
        const matchOp = (item.operator || '').toLowerCase().includes(query);
        const matchJenis = (item.jenisKayu || '').toLowerCase().includes(query);
        const matchCatatan = (item.catatan || '').toLowerCase().includes(query);
        const matchSub = (item.subBagian || '').toLowerCase().includes(query);
        if (!matchLog && !matchMesin && !matchOp && !matchJenis && !matchCatatan && !matchSub) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'volume') {
        valA = a.volume || 0;
        valB = b.volume || 0;
      } else if (sortField === 'diameter') {
        valA = parseFloat(a.diameter) || 0;
        valB = parseFloat(b.diameter) || 0;
      } else if (sortField === 'panjang') {
        valA = parseFloat(a.panjang) || 0;
        valB = parseFloat(b.panjang) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, selectedDate, todayISO, selectedMesin, selectedLine, searchQuery, sortField, sortOrder]);

  // Aggregate KPI metrics for the filtered view
  const stats = useMemo(() => {
    let totalCount = filteredData.length;
    let totalVolume = 0;
    let totalDiameter = 0;
    let totalPanjang = 0;
    const machinesSet = new Set<string>();

    filteredData.forEach(item => {
      totalVolume += (item.volume || 0);
      totalDiameter += (parseFloat(item.diameter) || 0);
      totalPanjang += (parseFloat(item.panjang) || 0);
      if (item.mesin) machinesSet.add(item.mesin);
    });

    const avgDiameter = totalCount > 0 ? (totalDiameter / totalCount).toFixed(1) : '0';
    const avgPanjang = totalCount > 0 ? (totalPanjang / totalCount).toFixed(1) : '0';

    return {
      totalCount,
      totalVolume,
      activeMachines: machinesSet.size,
      avgDiameter,
      avgPanjang
    };
  }, [filteredData]);

  // Aggregate Recap per Machine for the current view
  const recapPerMesin = useMemo(() => {
    const recap: Record<string, { 
      count: number; 
      totalVolume: number;
      operators: Set<string>;
      subBagian: Set<string>;
      panjangCounts: Record<string, number>;
      potonganCounts: Record<string, number>;
    }> = {};
    
    filteredData.forEach(log => {
      const mesin = log.mesin || "Tidak Diketahui";
      if (!recap[mesin]) {
        recap[mesin] = { 
          count: 0, 
          totalVolume: 0,
          operators: new Set<string>(),
          subBagian: new Set<string>(),
          panjangCounts: {},
          potonganCounts: {}
        };
      }
      recap[mesin].count += 1;
      recap[mesin].totalVolume += (log.volume || 0);
      if (log.operator) recap[mesin].operators.add(log.operator);
      if (log.subBagian) recap[mesin].subBagian.add(log.subBagian);

      const panjangStr = (log.panjang || "-").toString();
      recap[mesin].panjangCounts[panjangStr] = (recap[mesin].panjangCounts[panjangStr] || 0) + 1;

      const potonganStr = log.potongan || "-";
      recap[mesin].potonganCounts[potonganStr] = (recap[mesin].potonganCounts[potonganStr] || 0) + 1;
    });
    
    return Object.entries(recap).map(([mesin, d]) => ({
      mesin,
      count: d.count,
      totalVolume: d.totalVolume,
      operators: Array.from(d.operators),
      subBagian: Array.from(d.subBagian),
      panjangCounts: Object.entries(d.panjangCounts).sort((a, b) => b[1] - a[1]),
      potonganCounts: Object.entries(d.potonganCounts).sort((a, b) => a[0].localeCompare(b[0]))
    })).sort((a, b) => a.mesin.localeCompare(b.mesin, undefined, { numeric: true }));
  }, [filteredData]);

  // Handle Sort Toggle
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Get active date label for title
  const activeDateLabel = useMemo(() => {
    if (selectedDate === 'TODAY') {
      return `Hari Ini (${formatIndoDate(todayISO)})`;
    }
    if (selectedDate === 'ALL') {
      return 'Semua Tanggal';
    }
    return formatIndoDate(selectedDate);
  }, [selectedDate, todayISO]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md shadow-emerald-500/20 shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Log Dikerjakan Hari Ini
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Real-Time Sheet
              </span>
              {lastSyncTime && (
                <span className="text-[10px] font-medium text-slate-400 font-mono">
                  {lastSyncTime} WIB
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sync Controls (Icon Only) */}
        <div className="flex items-center gap-2">
          <button
            id="sync-log-dikerjakan-btn"
            onClick={() => handleSyncRealtime(true)}
            disabled={isSyncing}
            title="Sinkronkan data terbaru dari Google Sheets"
            aria-label="Perbarui Data"
            className="p-2.5 sm:p-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl transition-all shadow-xs disabled:opacity-60 cursor-pointer flex items-center justify-center"
          >
            <RefreshCw className={cn("w-4 h-4 text-emerald-400", isSyncing ? "animate-spin" : "")} />
          </button>
        </div>
      </div>

      {/* Date Filter Selection Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Filter Tanggal:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Today Button */}
            <button
              id="date-filter-today-btn"
              onClick={() => setSelectedDate('TODAY')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                selectedDate === 'TODAY'
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <span>Hari Ini ({formatIndoDate(todayISO)})</span>
              {todayHasData && (
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  selectedDate === 'TODAY' ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-800"
                )}>
                  Aktif
                </span>
              )}
            </button>

            {/* Other Available Dates */}
            {availableDates
              .filter(d => d !== todayISO)
              .slice(0, 3)
              .map(d => (
                <button
                  key={d}
                  id={`date-filter-${d}-btn`}
                  onClick={() => setSelectedDate(d)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    selectedDate === d
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {formatIndoDate(d)}
                </button>
              ))}

            {/* All Dates Button */}
            <button
              id="date-filter-all-btn"
              onClick={() => setSelectedDate('ALL')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                selectedDate === 'ALL'
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Semua Tanggal ({data.length})
            </button>
          </div>
        </div>
      </div>

      {/* Notice if Today has no data yet */}
      {selectedDate === 'TODAY' && !todayHasData && availableDates.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-900">Belum ada catatan log untuk hari ini ({formatIndoDate(todayISO)}).</p>
            <p className="mt-0.5 text-amber-700">
              Data log terakhir yang tersedia adalah tanggal <span className="font-bold">{formatIndoDate(availableDates[0])}</span>. Anda dapat beralih untuk melihat riwayat data terakhir.
            </p>
            <button
              id="view-latest-date-btn"
              onClick={() => setSelectedDate(availableDates[0])}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
            >
              Lihat Data Tanggal {formatIndoDate(availableDates[0])}
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Batang */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Total Log</p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats.totalCount.toLocaleString('id-ID')}
              <span className="text-xs font-semibold text-slate-400 ml-1.5">Batang</span>
            </p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">
              {activeDateLabel}
            </p>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Total Volume</p>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {stats.totalVolume.toFixed(2).replace('.', ',')}
              <span className="text-xs font-semibold text-slate-400 ml-1.5">m³</span>
            </p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">
              Akumulasi kubikasi kayu
            </p>
          </div>
        </div>

        {/* Mesin Aktif */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Mesin Beroperasi</p>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats.activeMachines}
              <span className="text-xs font-semibold text-slate-400 ml-1.5">Mesin BS</span>
            </p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">
              Aktif memotong log
            </p>
          </div>
        </div>

        {/* Rata-Rata Dimensi */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Rata-Rata Log</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
              Ø {stats.avgDiameter} <span className="text-xs text-slate-400 font-normal">cm</span> / {stats.avgPanjang} <span className="text-xs text-slate-400 font-normal">m</span>
            </p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">
              Rata-rata diameter & panjang
            </p>
          </div>
        </div>
      </div>

      {/* Recap per Mesin Cards */}
      {recapPerMesin.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Rekapitulasi per Mesin ({recapPerMesin.length} Mesin)</span>
            </h3>
            <span className="text-xs font-medium text-slate-400">{activeDateLabel}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recapPerMesin.map((recap, idx) => (
              <div 
                key={idx} 
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight block">
                          {recap.mesin}
                        </span>
                        {recap.operators.length > 0 && (
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {recap.operators.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/80 whitespace-nowrap">
                      {recap.count} Btg
                    </span>
                  </div>

                  <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-xl font-black text-emerald-600 tracking-tight">
                      {recap.totalVolume.toFixed(2).replace('.', ',')}
                      <span className="text-xs font-semibold text-slate-400 ml-1">m³</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total Volume Mesin</p>
                  </div>
                </div>
                
                <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Panjang (m)</p>
                    <div className="flex flex-wrap gap-1">
                      {recap.panjangCounts.map(([p, c]) => (
                        <span key={p} className="text-[10px] font-medium bg-white text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                          {p}m: <span className="font-bold text-slate-900">{c}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Potongan</p>
                    <div className="flex flex-wrap gap-1">
                      {recap.potonganCounts.map(([pot, c]) => (
                        <span key={pot} className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md border border-indigo-100">
                          {pot}: {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-log-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nomer Log, Operator, Mesin, Kayu..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Machine Filter */}
              <div className="relative">
                <select
                  id="filter-mesin-select"
                  value={selectedMesin}
                  onChange={(e) => setSelectedMesin(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs cursor-pointer"
                >
                  <option value="ALL">Semua Mesin</option>
                  {uniqueMachines.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Line Filter */}
              {uniqueLines.length > 0 && (
                <div className="relative">
                  <select
                    id="filter-line-select"
                    value={selectedLine}
                    onChange={(e) => setSelectedLine(e.target.value)}
                    className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="ALL">Semua Line</option>
                    {uniqueLines.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Reset Filters */}
              {(searchQuery || selectedMesin !== 'ALL' || selectedLine !== 'ALL') && (
                <button
                  id="reset-log-filter-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMesin('ALL');
                    setSelectedLine('ALL');
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredData.length}</strong> dari {data.length} data log
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              {activeDateLabel}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="bg-slate-50/90 text-slate-700 select-none">
              <tr>
                <th className="px-3.5 py-3 border-b border-r border-slate-200/80 font-bold uppercase tracking-wider text-[11px] w-12">
                  No
                </th>
                <th 
                  onClick={() => handleSort('mesin')}
                  className="px-3.5 py-3 border-b border-r border-slate-200/80 font-bold uppercase tracking-wider text-[11px] text-left cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Mesin & Operator</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3.5 py-3 border-b border-r border-slate-200/80 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Line / Sub
                </th>
                <th 
                  onClick={() => handleSort('nomer_log')}
                  className="px-3.5 py-3 border-b border-r border-slate-200/80 font-bold uppercase tracking-wider text-[11px] text-left cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Nomor Log</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3.5 py-3 border-b border-r border-slate-200/80 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Jenis Kayu
                </th>
                <th 
                  onClick={() => handleSort('diameter')}
                  className="px-3.5 py-3 border-b border-r border-slate-200/80 font-bold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Diameter (cm)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('panjang')}
                  className="px-3.5 py-3 border-b border-r border-slate-200/80 font-bold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Panjang (m)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('volume')}
                  className="px-3.5 py-3 border-b border-r border-slate-200/80 font-bold uppercase tracking-wider text-[11px] cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Volume (m³)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3.5 py-3 border-b border-r border-slate-200/80 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Potongan
                </th>
                <th className="px-3.5 py-3 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap text-left">
                  Waktu / Catatan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredData.length > 0 ? (
                filteredData.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    {/* No */}
                    <td className="px-3 py-2.5 border-r border-slate-100 font-mono text-slate-400 text-[11px]">
                      {i + 1}
                    </td>

                    {/* Mesin & Operator */}
                    <td className="px-3.5 py-2.5 border-r border-slate-100 text-left whitespace-nowrap">
                      <div className="font-bold text-slate-800">{log.mesin}</div>
                      {log.operator && (
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-slate-400" />
                          {log.operator}
                        </div>
                      )}
                    </td>

                    {/* Sub Bagian / Line */}
                    <td className="px-3 py-2.5 border-r border-slate-100 whitespace-nowrap">
                      {log.subBagian ? (
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                          log.subBagian.toLowerCase().includes('1')
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        )}>
                          {log.subBagian}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Nomor Log */}
                    <td className="px-3.5 py-2.5 border-r border-slate-100 text-left whitespace-nowrap font-mono">
                      <span className="bg-slate-100/80 px-2 py-1 rounded-md text-slate-800 font-bold border border-slate-200/60 text-xs">
                        {log.nomer_log}
                      </span>
                    </td>

                    {/* Jenis Kayu */}
                    <td className="px-3 py-2.5 border-r border-slate-100 font-medium text-slate-700 whitespace-nowrap">
                      {log.jenisKayu || 'Keruing'}
                    </td>

                    {/* Diameter */}
                    <td className="px-3 py-2.5 border-r border-slate-100 font-semibold text-slate-800 font-mono">
                      {log.diameter}
                    </td>

                    {/* Panjang */}
                    <td className="px-3 py-2.5 border-r border-slate-100 font-semibold text-slate-800 font-mono">
                      {log.panjang}
                    </td>

                    {/* Volume */}
                    <td className="px-3.5 py-2.5 border-r border-slate-100 font-black text-emerald-600 font-mono text-sm whitespace-nowrap">
                      {log.volume.toFixed(2).replace('.', ',')}
                    </td>

                    {/* Potongan */}
                    <td className="px-3 py-2.5 border-r border-slate-100 whitespace-nowrap">
                      {log.potongan ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 font-black text-xs border border-indigo-200/60">
                          {log.potongan}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Waktu / Catatan */}
                    <td className="px-3.5 py-2.5 text-left text-slate-600 text-xs whitespace-nowrap">
                      {log.timestamp && (
                        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {log.timestamp}
                        </div>
                      )}
                      {log.catatan && (
                        <div className="text-[11px] text-slate-600 italic mt-0.5">
                          {log.catatan}
                        </div>
                      )}
                      {!log.timestamp && !log.catatan && (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 font-medium">
                    <div className="max-w-sm mx-auto space-y-2">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-600">
                        Tidak ada data log yang sesuai dengan filter
                      </p>
                      <p className="text-xs text-slate-400">
                        Coba sesuaikan kata kunci pencarian atau pilih tanggal lain untuk menampilkan log.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {/* Table Footer with Sums */}
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-left uppercase text-[11px] tracking-wider text-slate-600">
                    Total ({filteredData.length} Batang)
                  </td>
                  <td className="px-3 py-3 font-mono text-center text-slate-700">
                    Ø {stats.avgDiameter}
                  </td>
                  <td className="px-3 py-3 font-mono text-center text-slate-700">
                    Ø {stats.avgPanjang}
                  </td>
                  <td className="px-3.5 py-3 font-mono text-emerald-600 text-sm font-black text-center">
                    {stats.totalVolume.toFixed(2).replace('.', ',')} m³
                  </td>
                  <td colSpan={2} className="px-3 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
