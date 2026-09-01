import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Loader2, 
  FileSearch, 
  X, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Clock, 
  Layers, 
  TrendingUp, 
  Calendar, 
  ChevronRight,
  Eye,
  BarChart3,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DailyProductionMap {
  [date: string]: number;
}

export interface OrderUrgentItem {
  id: string;
  ukuran: string;
  panjang: string;
  jo: string;
  kebutuhan: number;
  total: number;
  kekurangan: number; // positive = masih kurang, negative = surplus/lebih
  pct: number;
  dailyProd: DailyProductionMap;
  latestProdDate: string;
  latestProdVal: number;
}

interface DateColInfo {
  index: number;
  date: string;
  sum: number;
}


let cachedOrderData: OrderUrgentItem[] | null = null;
let cachedDateCols: DateColInfo[] = [];
let cachedOrderLastUpdate: string = "-";

// LocalStorage helpers for instant zero-delay render
function getLocalOrderCache() {
  try {
    const raw = localStorage.getItem('cache_data_order_urgent');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setLocalOrderCache(data: OrderUrgentItem[], cols: DateColInfo[], lastUpdate: string) {
  try {
    localStorage.setItem('cache_data_order_urgent', JSON.stringify({ data, cols, lastUpdate }));
  } catch (e) {
    // ignore
  }
}

const getUnit = (jo: string) => {
  const normalizedJo = (jo || '').trim().toUpperCase();
  if (normalizedJo.startsWith('FJ')) return 'M³';
  return 'Pcs';
};

export function OrderUrgentUpdate() {
  const [data, setData] = useState<OrderUrgentItem[]>([]);
  const [dateCols, setDateCols] = useState<DateColInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('-');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unfulfilled' | 'fulfilled' | 'recent'>('recent');
  const [error, setError] = useState<string | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<OrderUrgentItem | null>(null);
  const [showDailyCols, setShowDailyCols] = useState<boolean>(true);
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof OrderUrgentItem | 'status', direction: 'asc' | 'desc' }>({
    key: 'kekurangan',
    direction: 'desc'
  });

  const spreadsheetId = "1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ";
  const sheetName = "Order urgent";
  const sheetGvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

  const processCsvData = (csvRows: string[][]): { items: OrderUrgentItem[]; cols: DateColInfo[] } => {
    if (!csvRows || csvRows.length < 2) {
      throw new Error("Format spreadsheet kosong atau tidak sesuai.");
    }

    const r0 = csvRows[0] || [];
    const r1 = csvRows[1] || [];
    const maxCols = Math.max(r0.length, r1.length);

    // 1. Identify date columns across header rows
    const detectedDateCols: DateColInfo[] = [];
    for (let c = 0; c < maxCols; c++) {
      const headerCombined = `${(r1[c] || '').trim()} ${(r0[c] || '').trim()}`.trim();
      const dateMatch = headerCombined.match(/(\d{1,2}\s+[A-Za-z]{3,9}(?:\s+\d{2,4})?)/i) ||
                         headerCombined.match(/(\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?)/);
      if (dateMatch) {
        let colSum = 0;
        for (let r = 2; r < csvRows.length; r++) {
          const rawVal = csvRows[r] && csvRows[r][c] ? csvRows[r][c] : '';
          const num = parseFloat(rawVal.replace(/[^0-9.-]/g, '')) || 0;
          colSum += num;
        }
        detectedDateCols.push({
          index: c,
          date: dateMatch[1],
          sum: colSum
        });
      }
    }

    // Sort active date columns
    const activeDateCols = detectedDateCols;

    // 2. Parse items
    const parsedItems: OrderUrgentItem[] = [];

    for (let i = 2; i < csvRows.length; i++) {
      const row = csvRows[i];
      if (!row || row.length === 0) continue;

      const ukuran = (row[1] || '').trim();
      if (
        !ukuran ||
        ukuran.toLowerCase() === 'ukuran' ||
        ukuran.toLowerCase().includes('total') ||
        ukuran === '*'
      ) {
        continue;
      }

      const panjang = (row[2] || '').trim();
      const jo = (row[3] || '').trim();
      const kebutuhan = parseFloat((row[4] || '0').replace(/[^0-9.-]/g, '')) || 0;

      // Extract daily production values
      const dailyProd: DailyProductionMap = {};
      let sumDaily = 0;
      let latestDate = '';
      let latestVal = 0;

      // Scan dates backwards to find latest production date
      for (let dcIdx = activeDateCols.length - 1; dcIdx >= 0; dcIdx--) {
        const dc = activeDateCols[dcIdx];
        const rawCell = row[dc.index] ? row[dc.index] : '';
        const v = parseFloat(rawCell.replace(/[^0-9.-]/g, '')) || 0;
        if (v > 0) {
          dailyProd[dc.date] = v;
          sumDaily += v;
          if (!latestDate) {
            latestDate = dc.date;
            latestVal = v;
          }
        }
      }

      // Total from last column or sum
      const lastCell = (row[row.length - 1] || '').trim();
      let total = parseFloat(lastCell.replace(/[^0-9.-]/g, '')) || 0;
      if (total === 0 && sumDaily > 0) {
        total = sumDaily;
      }

      // If total & kebutuhan are 0 and no production, skip empty rows
      if (kebutuhan === 0 && total === 0 && sumDaily === 0) {
        continue;
      }

      const kekurangan = kebutuhan - total;
      const pct = kebutuhan > 0 ? Math.min(999, (total / kebutuhan) * 100) : (total > 0 ? 100 : 0);

      parsedItems.push({
        id: `${ukuran}_${panjang}_${jo}_${i}`,
        ukuran,
        panjang,
        jo,
        kebutuhan,
        total,
        kekurangan,
        pct,
        dailyProd,
        latestProdDate: latestDate,
        latestProdVal: latestVal
      });
    }

    return { items: parsedItems, cols: activeDateCols };
  };

  const loadFallback = () => {
    const fallbackItems: OrderUrgentItem[] = [
      { id: '1', ukuran: '36x220', panjang: '2500', jo: 'S-TK', kebutuhan: 127, total: 243, kekurangan: -116, pct: 191.3, dailyProd: { '24 Aug 26': 19 }, latestProdDate: '24 Aug 26', latestProdVal: 19 },
      { id: '2', ukuran: '36x160', panjang: '3600', jo: 'S-TK', kebutuhan: 199, total: 1, kekurangan: 198, pct: 0.5, dailyProd: {}, latestProdDate: '', latestProdVal: 0 },
      { id: '3', ukuran: '25x155', panjang: '4000', jo: 'S-NI', kebutuhan: 700, total: 404, kekurangan: 296, pct: 57.7, dailyProd: { '24 Aug 26': 50 }, latestProdDate: '24 Aug 26', latestProdVal: 50 },
      { id: '4', ukuran: '36x160', panjang: '5800', jo: 'S-XL', kebutuhan: 425, total: 501, kekurangan: -76, pct: 117.8, dailyProd: { '22 Aug 26': 23 }, latestProdDate: '22 Aug 26', latestProdVal: 23 },
    ];
    setData(fallbackItems);
    setDateCols([
      { index: 49, date: '21 Aug 26', sum: 791 },
      { index: 50, date: '22 Aug 26', sum: 483 },
      { index: 51, date: '24 Aug 26', sum: 951 }
    ]);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastUpdate(`${formattedDate}, ${formattedTime} (Luring)`);
  };

  const syncData = useCallback((force = false) => {
    if (!force) {
      if (cachedOrderData && cachedOrderData.length > 0) {
        setData(cachedOrderData);
        setDateCols(cachedDateCols);
        setLastUpdate(cachedOrderLastUpdate);
        return;
      }
      
      const localCache = getLocalOrderCache();
      if (localCache) {
        cachedOrderData = localCache.data;
        cachedDateCols = localCache.cols;
        cachedOrderLastUpdate = localCache.lastUpdate;
        setData(localCache.data);
        setDateCols(localCache.cols);
        setLastUpdate(localCache.lastUpdate);
        
        // Background sync to keep data fresh without blocking UI
        setTimeout(() => syncData(true), 3000);
        return;
      }
    }

    setLoading(true);
    setError(null);

    Papa.parse(sheetGvizUrl, {
      download: true,
      skipEmptyLines: true,
      complete: function (results) {
        try {
          const { items, cols } = processCsvData(results.data as string[][]);
          cachedOrderData = items;
          cachedDateCols = cols;
          setData(items);
          setDateCols(cols);

          const now = new Date();
          const formattedDate = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          cachedOrderLastUpdate = `${formattedDate}, ${formattedTime}`;
          setLastUpdate(cachedOrderLastUpdate);
          
          setLocalOrderCache(items, cols, cachedOrderLastUpdate);
        } catch (err: any) {
          console.error("Order Urgent Parse Error:", err);
          setError("Gagal memproses data spreadsheet: " + (err.message || 'Error'));
          loadFallback();
        } finally {
          setLoading(false);
        }
      },
      error: function (err) {
        console.error("PapaParse error:", err);
        setError("Koneksi gagal saat mengunduh sheet 'Order urgent'. Menampilkan data cadangan.");
        loadFallback();
        setLoading(false);
      }
    });
  }, [sheetGvizUrl]);

  useEffect(() => {
    syncData();
  }, [syncData]);

  // Helper to parse date string like "26 Aug 26", "26 Agu", "26-Aug-2026", "26 Agt 26"
  const parseDateString = (str: string): { day: number; month: number; year?: number } | null => {
    if (!str) return null;
    const clean = str.trim().toLowerCase();
    
    // Pattern 1: Day Month Year (e.g. 26 Aug 26 or 26 Agu 2026 or 26 Agt 26)
    const matchAlpha = clean.match(/(\d{1,2})[\s\-_/]+([a-z]{3,9})(?:[\s\-_/]+(\d{2,4}))?/i);
    if (matchAlpha) {
      const day = parseInt(matchAlpha[1], 10);
      const mStr = matchAlpha[2].toLowerCase();
      const monthMap: Record<string, number> = {
        jan: 0, januari: 0,
        feb: 1, februari: 1,
        mar: 2, maret: 2,
        apr: 3, april: 3,
        may: 4, mei: 4,
        jun: 5, juni: 5,
        jul: 6, juli: 6,
        aug: 7, agu: 7, ags: 7, agt: 7, agustus: 7,
        sep: 8, sept: 8, september: 8,
        okt: 9, oct: 9, oktober: 9, october: 9,
        nov: 10, nop: 10, november: 10,
        des: 11, dec: 11, desember: 11, december: 11
      };
      const month = monthMap[mStr] !== undefined ? monthMap[mStr] : -1;
      let year = matchAlpha[3] ? parseInt(matchAlpha[3], 10) : undefined;
      if (year !== undefined && year < 100) year += 2000;
      if (month !== -1 && !isNaN(day)) {
        return { day, month, year };
      }
    }

    // Pattern 2: DD/MM/YYYY or DD-MM-YYYY
    const matchNum = clean.match(/(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?/);
    if (matchNum) {
      const day = parseInt(matchNum[1], 10);
      const month = parseInt(matchNum[2], 10) - 1;
      let year = matchNum[3] ? parseInt(matchNum[3], 10) : undefined;
      if (year !== undefined && year < 100) year += 2000;
      if (!isNaN(day) && !isNaN(month) && month >= 0 && month <= 11) {
        return { day, month, year };
      }
    }

    return null;
  };

  // Helper to format Date into standard header "DD MMM YY" (e.g. "01 Sep 26", "31 Aug 26")
  const formatDateHeader = (d: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = months[d.getMonth()];
    const yearStr = String(d.getFullYear()).slice(-2);
    return `${dayStr} ${monthStr} ${yearStr}`;
  };

  // Helper to get Jakarta date components
  const getJakartaDate = (): { day: number; month: number; year: number } => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      const parts = formatter.formatToParts(new Date());
      const year = parseInt(parts.find(p => p.type === 'year')?.value || '2026', 10);
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10) - 1;
      const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
      return { day, month, year };
    } catch (e) {
      const d = new Date();
      return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() };
    }
  };

  interface DisplayDateColInfo {
    index: number;
    date: string;
    label: string;
    sum: number;
    dateKey?: string;
    dateObj: Date;
  }

  // Get the 2 target date columns synced with today's date: 1 Hari Sebelumnya & Hari Ini
  const displayDateCols = useMemo<DisplayDateColInfo[]>(() => {
    const { day: todayDay, month: todayMonth, year: todayYear } = getJakartaDate();
    const todayDate = new Date(todayYear, todayMonth, todayDay);
    const prevDate = new Date(todayYear, todayMonth, todayDay - 1);

    const findMatch = (targetDate: Date) => {
      const targetDay = targetDate.getDate();
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();

      if (dateCols && dateCols.length > 0) {
        for (const col of dateCols) {
          const parsed = parseDateString(col.date);
          if (parsed) {
            const matchesDay = parsed.day === targetDay;
            const matchesMonth = parsed.month === targetMonth;
            const matchesYear = parsed.year ? parsed.year === targetYear : true;
            if (matchesDay && matchesMonth && matchesYear) {
              return col;
            }
          }
        }
      }
      return null;
    };

    const prevMatch = findMatch(prevDate);
    const todayMatch = findMatch(todayDate);

    const prevDateStr = formatDateHeader(prevDate);
    const todayDateStr = formatDateHeader(todayDate);

    const prevColInfo: DisplayDateColInfo = {
      index: prevMatch ? prevMatch.index : -1,
      date: prevDateStr,
      label: '1 Hari Sebelumnya',
      sum: prevMatch ? prevMatch.sum : 0,
      dateKey: prevMatch?.date,
      dateObj: prevDate
    };

    const todayColInfo: DisplayDateColInfo = {
      index: todayMatch ? todayMatch.index : -1,
      date: todayDateStr,
      label: 'Hari Ini',
      sum: todayMatch ? todayMatch.sum : 0,
      dateKey: todayMatch?.date,
      dateObj: todayDate
    };

    return [prevColInfo, todayColInfo];
  }, [dateCols]);

  // Helper to get daily production value for a row on a given display column
  const getColVal = useCallback((row: OrderUrgentItem, dc: DisplayDateColInfo): number => {
    if (dc.dateKey && row.dailyProd[dc.dateKey] !== undefined) {
      return row.dailyProd[dc.dateKey];
    }
    if (row.dailyProd[dc.date] !== undefined) {
      return row.dailyProd[dc.date];
    }
    const targetDay = dc.dateObj.getDate();
    const targetMonth = dc.dateObj.getMonth();
    const targetYear = dc.dateObj.getFullYear();
    for (const [key, val] of Object.entries(row.dailyProd)) {
      const p = parseDateString(key);
      if (p && p.day === targetDay && p.month === targetMonth && (p.year ? p.year === targetYear : true)) {
        return val;
      }
    }
    return 0;
  }, []);

  // Summary counts for filter badges
  const stats = useMemo(() => {
    let totalItems = data.length;
    let unfulfilledCount = 0;
    let fulfilledCount = 0;
    let recentDirectCount = 0;
    let totalKebutuhan = 0;
    let totalRealisasi = 0;
    let totalKekuranganPcs = 0;

    data.forEach(item => {
      totalKebutuhan += item.kebutuhan;
      totalRealisasi += item.total;
      if (item.kekurangan > 0) {
        unfulfilledCount++;
        totalKekuranganPcs += item.kekurangan;
      } else {
        fulfilledCount++;
      }

      if (displayDateCols.some(dc => getColVal(item, dc) > 0)) {
        recentDirectCount++;
      }
    });

    const fallbackRecentCount = data.filter(item => item.latestProdVal > 0).length;
    const recentCount = recentDirectCount > 0 ? recentDirectCount : fallbackRecentCount;
    const overallPct = totalKebutuhan > 0 ? ((totalRealisasi / totalKebutuhan) * 100).toFixed(1) : '0';

    return {
      totalItems,
      unfulfilledCount,
      fulfilledCount,
      recentCount,
      recentDirectCount,
      totalKebutuhan,
      totalRealisasi,
      totalKekuranganPcs,
      overallPct
    };
  }, [data, displayDateCols, getColVal]);

  // Filtering & Sorting
  const filteredData = useMemo(() => {
    const sTerm = searchTerm.toLowerCase().trim();

    let list = data.filter(item => {
      // Search text match
      const matchSearch =
        !sTerm ||
        item.ukuran.toLowerCase().includes(sTerm) ||
        item.panjang.toLowerCase().includes(sTerm) ||
        item.jo.toLowerCase().includes(sTerm);

      if (!matchSearch) return false;

      // Status filter
      if (statusFilter === 'unfulfilled') {
        return item.kekurangan > 0;
      }
      if (statusFilter === 'fulfilled') {
        return item.kekurangan <= 0;
      }
      if (statusFilter === 'recent') {
        if (stats.recentDirectCount > 0) {
          return displayDateCols.some(dc => getColVal(item, dc) > 0);
        }
        return item.latestProdVal > 0;
      }

      return true;
    });

    // Sorting
    if (sortConfig !== null) {
      list.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof OrderUrgentItem];
        let bVal: any = b[sortConfig.key as keyof OrderUrgentItem];

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toString().toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [data, searchTerm, statusFilter, sortConfig, displayDateCols, getColVal, stats.recentDirectCount]);

  const requestSort = (key: keyof OrderUrgentItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: keyof OrderUrgentItem) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-slate-300 inline group-hover:text-slate-500" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-rose-600 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-rose-600 inline" />
    );
  };

  return (
    <div id="order-urgent-container" className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 lg:p-7 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-xl shadow-md shadow-rose-500/20 shrink-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl font-black tracking-tight text-slate-900 truncate">
                Order Urgent
              </h2>
              <span className="bg-rose-100 text-rose-700 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border border-rose-200/60 shrink-0">
                Live Spreadsheets
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 ml-auto sm:ml-0 shrink-0">
          <div className="text-right">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400">Update Terakhir</p>
            <p className="text-[11px] sm:text-xs font-bold text-slate-700 font-mono whitespace-nowrap">{lastUpdate}</p>
          </div>

          <button
            id="sync-order-urgent-btn"
            disabled={loading}
            onClick={() => syncData(true)}
            title="Sinkronkan Data Spreadsheet"
            aria-label="Sinkronkan Data Spreadsheet"
            className="flex items-center justify-center bg-slate-900 hover:bg-slate-800 active:scale-95 text-white p-2 sm:p-2.5 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <RefreshCw className={cn('w-4 h-4', loading ? 'animate-spin text-rose-400' : '')} />
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="text-xs sm:text-sm font-medium text-rose-700 bg-rose-50/90 border border-rose-200 p-3.5 rounded-xl flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Filter, Search & Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="order-urgent-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan Ukuran, Panjang, atau JO..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
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

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs font-bold shrink-0">
          <button
            id="filter-recent-btn"
            onClick={() => setStatusFilter('recent')}
            className={cn(
              "px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
              statusFilter === 'recent'
                ? "bg-rose-600 text-white shadow-sm"
                : "text-rose-700 hover:bg-rose-100/50"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Produksi Terkini ({stats.recentCount})</span>
          </button>
          <button
            id="filter-all-btn"
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap",
              statusFilter === 'all'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Semua ({data.length})
          </button>
          <button
            id="filter-unfulfilled-btn"
            onClick={() => setStatusFilter('unfulfilled')}
            className={cn(
              "px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
              statusFilter === 'unfulfilled'
                ? "bg-amber-600 text-white shadow-sm"
                : "text-amber-700 hover:bg-amber-100/50"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse"></span>
            Kurang ({stats.unfulfilledCount})
          </button>
          <button
            id="filter-fulfilled-btn"
            onClick={() => setStatusFilter('fulfilled')}
            className={cn(
              "px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap",
              statusFilter === 'fulfilled'
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-700 hover:bg-emerald-100/50"
            )}
          >
            Selesai ({stats.fulfilledCount})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white relative">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto table-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap min-w-[860px] border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-900 text-white uppercase text-[11px] tracking-wider font-bold shadow-md">
              <tr>
                <th
                  onClick={() => requestSort('ukuran')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-800 transition-colors select-none group border-r border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <span>Ukuran (T x L)</span>
                    {renderSortIcon('ukuran')}
                  </div>
                </th>
                <th
                  onClick={() => requestSort('panjang')}
                  className="px-3.5 py-3.5 cursor-pointer hover:bg-slate-800 transition-colors select-none group border-r border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <span>Panjang</span>
                    {renderSortIcon('panjang')}
                  </div>
                </th>
                <th
                  onClick={() => requestSort('jo')}
                  className="px-3.5 py-3.5 cursor-pointer hover:bg-slate-800 transition-colors select-none group border-r border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <span>JO (Job Order)</span>
                    {renderSortIcon('jo')}
                  </div>
                </th>
                <th
                  onClick={() => requestSort('kebutuhan')}
                  className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-800 transition-colors select-none group border-r border-slate-800 bg-slate-900/95"
                >
                  <div className="flex items-center justify-end">
                    <span>Target Kebutuhan</span>
                    {renderSortIcon('kebutuhan')}
                  </div>
                </th>

                {/* 1 Hari Sebelumnya & Hari Ini Date Columns */}
                {displayDateCols.map((dc, dcIdx) => {
                  const isToday = dcIdx === displayDateCols.length - 1;
                  return (
                    <th
                      key={dc.date + '_' + dcIdx}
                      className={cn(
                        "px-3.5 py-3 text-center font-semibold border-r border-slate-800 min-w-[125px]",
                        isToday ? "bg-slate-900" : "bg-slate-900/95"
                      )}
                    >
                      <div className={cn(
                        "text-[10px] font-extrabold uppercase tracking-wider",
                        isToday ? "text-rose-400" : "text-sky-400"
                      )}>
                        {dc.label}
                      </div>
                      <div className="text-xs font-mono text-white mt-0.5 font-bold">{dc.date}</div>
                    </th>
                  );
                })}

                <th
                  onClick={() => requestSort('total')}
                  className="px-4 py-3.5 text-right cursor-pointer hover:bg-slate-800 transition-colors select-none group border-r border-slate-800 bg-slate-900/95"
                >
                  <div className="flex items-center justify-end">
                    <span>Total Realisasi</span>
                    {renderSortIcon('total')}
                  </div>
                </th>
                <th
                  onClick={() => requestSort('kekurangan')}
                  className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-800 transition-colors select-none group border-r border-slate-800 bg-slate-900"
                >
                  <div className="flex items-center justify-center">
                    <span>Status & Kekurangan</span>
                    {renderSortIcon('kekurangan')}
                  </div>
                </th>
                <th
                  onClick={() => requestSort('pct')}
                  className="px-4 py-3.5 text-center cursor-pointer hover:bg-slate-800 transition-colors select-none group bg-slate-900"
                >
                  <div className="flex items-center justify-center">
                    <span>Progress</span>
                    {renderSortIcon('pct')}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={6 + displayDateCols.length} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                      <p className="text-sm font-semibold text-slate-700">Menghubungkan ke Spreadsheet Order Urgent...</p>
                      <p className="text-xs text-slate-400">Mengambil data ukuran, target, dan realisasi harian terbaru</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6 + displayDateCols.length} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                      <FileSearch className="w-10 h-10 text-slate-300 mb-1" />
                      <p className="text-base font-bold text-slate-800">
                        {statusFilter === 'recent' 
                          ? 'Tidak ada order dengan produksi pada Hari Ini & 1 Hari Sebelumnya' 
                          : 'Tidak ada data yang cocok'}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {statusFilter === 'recent'
                          ? 'Pilih filter "Semua" untuk melihat seluruh daftar order urgent atau sesuaikan kata kunci pencarian.'
                          : 'Coba sesuaikan kata kunci pencarian atau ganti filter status untuk menampilkan data order lainnya.'}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        {statusFilter === 'recent' && (
                          <button
                            onClick={() => setStatusFilter('all')}
                            className="text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            Lihat Semua Order ({data.length})
                          </button>
                        )}
                        {(searchTerm || statusFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('all');
                            }}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            Reset Filter
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const isShortfall = row.kekurangan > 0;
                  const isZeroReq = row.kebutuhan === 0;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedItemForDetail(row)}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors group cursor-pointer",
                        isShortfall ? "bg-white" : "bg-emerald-50/15"
                      )}
                    >
                      {/* Ukuran */}
                      <td className="px-4 py-3 font-black text-slate-900 border-r border-slate-100 flex items-center gap-2">
                        <span className="font-mono text-sm tracking-tight">{row.ukuran}</span>
                        {isShortfall && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Belum terpenuhi"></span>
                        )}
                      </td>

                      {/* Panjang */}
                      <td className="px-3.5 py-3 text-slate-600 font-mono text-xs border-r border-slate-100">
                        {row.panjang || '-'}
                      </td>

                      {/* JO */}
                      <td className="px-3.5 py-3 font-semibold text-slate-700 border-r border-slate-100 text-xs">
                        <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-800 border border-slate-200/60 font-mono">
                          {row.jo || '-'}
                        </span>
                      </td>

                      {/* Kebutuhan */}
                      <td className="px-4 py-3 text-right font-bold text-slate-800 border-r border-slate-100">
                        {row.kebutuhan > 0 ? (
                          <span>{row.kebutuhan.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">{getUnit(row.jo)}</span></span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 1 Hari Sebelumnya & Hari Ini Data Columns */}
                      {displayDateCols.map((dc, dcIdx) => {
                        const val = getColVal(row, dc);
                        const isToday = dcIdx === displayDateCols.length - 1;
                        return (
                          <td
                            key={dc.date + '_' + dcIdx}
                            className={cn(
                              "px-3.5 py-3 text-center font-mono text-xs border-r border-slate-100 font-semibold",
                              val > 0 
                                ? (isToday ? "bg-rose-50/70 text-rose-700 font-bold" : "bg-sky-50/60 text-sky-700 font-bold")
                                : "text-slate-300"
                            )}
                          >
                            {val > 0 ? (
                              <span className={cn(
                                "inline-block px-2 py-0.5 rounded-md",
                                isToday ? "bg-rose-100/90 text-rose-800 font-bold border border-rose-200/60" : "bg-sky-100/80 text-sky-800 font-bold border border-sky-200/60"
                              )}>
                                {val.toLocaleString('id-ID')} {getUnit(row.jo)}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Realisasi */}
                      <td className="px-4 py-3 text-right font-black text-slate-900 border-r border-slate-100 text-sm">
                        {row.total.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">{getUnit(row.jo)}</span>
                      </td>

                      {/* Status / Kekurangan Badge */}
                      <td className="px-4 py-3 text-center border-r border-slate-100">
                        {isShortfall ? (
                          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200/80 shadow-xs">
                            <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                            Kurang {row.kekurangan.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/80 shadow-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            Terpenuhi {row.kekurangan < 0 ? `(+${Math.abs(row.kekurangan).toLocaleString('id-ID')})` : ''}
                          </span>
                        )}
                      </td>

                      {/* Progress Bar & % */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1 min-w-[90px]">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                row.pct >= 100
                                  ? "bg-emerald-500"
                                  : row.pct >= 50
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              )}
                              style={{ width: `${Math.min(100, Math.max(2, row.pct))}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[11px] font-bold font-mono",
                              row.pct >= 100
                                ? "text-emerald-700"
                                : row.pct >= 50
                                ? "text-amber-700"
                                : "text-rose-600"
                            )}
                          >
                            {isZeroReq && row.total > 0 ? '100%' : `${row.pct.toFixed(0)}%`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2 font-medium">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredData.length}</strong> dari{' '}
              <strong className="text-slate-800">{data.length}</strong> baris order urgent
            </span>
            {statusFilter !== 'all' && (
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                Filter: {statusFilter === 'unfulfilled' ? 'Kurang' : statusFilter === 'fulfilled' ? 'Selesai' : 'Terkini'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Kurang: {stats.unfulfilledCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Selesai: {stats.fulfilledCount}
            </span>
          </div>
        </div>
      </div>

      {/* Modal Detail Produksi Harian */}
      {selectedItemForDetail && (
        <div 
          id="order-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedItemForDetail(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  Rincian Riwayat Produksi
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {selectedItemForDetail.ukuran} {selectedItemForDetail.panjang ? `(P: ${selectedItemForDetail.panjang})` : ''}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Job Order: <strong className="text-slate-700">{selectedItemForDetail.jo || '-'}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedItemForDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics summary */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Target</p>
                <p className="text-lg font-black text-slate-800">{selectedItemForDetail.kebutuhan} {getUnit(selectedItemForDetail.jo)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Tercapai</p>
                <p className="text-lg font-black text-slate-800">{selectedItemForDetail.total} {getUnit(selectedItemForDetail.jo)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                <p className={cn("text-xs font-black mt-1", selectedItemForDetail.kekurangan > 0 ? "text-rose-600" : "text-emerald-600")}>
                  {selectedItemForDetail.kekurangan > 0 ? `Kurang ${selectedItemForDetail.kekurangan}` : 'Terpenuhi'}
                </p>
              </div>
            </div>

            {/* History Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Histori Pemotongan per Tanggal</span>
              </h4>

              {Object.keys(selectedItemForDetail.dailyProd).length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs font-medium">
                  Belum ada catatan rincian harian untuk item ini di spreadsheet.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 table-scrollbar">
                  {Object.entries(selectedItemForDetail.dailyProd).map(([date, qty]) => (
                    <div key={date} className="flex justify-between items-center px-4 py-2.5 hover:bg-slate-50 text-xs">
                      <span className="font-semibold text-slate-700">{date}</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        +{qty} {getUnit(selectedItemForDetail.jo)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedItemForDetail(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
