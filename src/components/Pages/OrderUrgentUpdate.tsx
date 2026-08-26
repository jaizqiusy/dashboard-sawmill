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

export function OrderUrgentUpdate() {
  const [data, setData] = useState<OrderUrgentItem[]>([]);
  const [dateCols, setDateCols] = useState<DateColInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('-');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unfulfilled' | 'fulfilled' | 'recent'>('all');
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
      const dateMatch = headerCombined.match(/(\d{1,2}\s+[A-Za-z]{3}(?:\s+\d{2,4})?)/);
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
    setLastUpdate(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (Luring)');
  };

  const syncData = useCallback((force = false) => {
    if (!force && cachedOrderData && cachedOrderData.length > 0) {
      setData(cachedOrderData);
      setDateCols(cachedDateCols);
      setLastUpdate(cachedOrderLastUpdate);
      return;
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
          cachedOrderLastUpdate = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastUpdate(cachedOrderLastUpdate);
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

  // Recent 3 active dates with production
  const recentActiveDateCols = useMemo(() => {
    return dateCols.filter(d => d.sum > 0).slice(-3);
  }, [dateCols]);

  // Summary KPIs
  const stats = useMemo(() => {
    let totalItems = data.length;
    let unfulfilledCount = 0;
    let fulfilledCount = 0;
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
    });

    const overallPct = totalKebutuhan > 0 ? ((totalRealisasi / totalKebutuhan) * 100).toFixed(1) : '0';

    return {
      totalItems,
      unfulfilledCount,
      fulfilledCount,
      totalKebutuhan,
      totalRealisasi,
      totalKekuranganPcs,
      overallPct
    };
  }, [data]);

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
        // Items with production in recent active dates
        return recentActiveDateCols.some(dc => (item.dailyProd[dc.date] || 0) > 0);
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
  }, [data, searchTerm, statusFilter, sortConfig, recentActiveDateCols]);

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
    <div id="order-urgent-container" className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl shadow-md shadow-rose-500/20 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Order Urgent
              </h2>
              <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200/60">
                Live Spreadsheets
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Pemantauan target kebutuhan, alokasi Job Order (JO), serta status pemenuhan material urgent.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Pembaruan Terakhir</p>
            <p className="text-xs font-bold text-slate-700 font-mono">{lastUpdate}</p>
          </div>

          <button
            id="sync-order-urgent-btn"
            disabled={loading}
            onClick={() => syncData(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={cn('w-4 h-4', loading ? 'animate-spin text-rose-400' : '')} />
            <span>{loading ? 'Menarik Data...' : 'Sinkronkan'}</span>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Item */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Item</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalItems}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Ukuran & JO Terdaftar</div>
          </div>
        </div>

        {/* Belum Terpenuhi (Kurang) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'unfulfilled' ? 'all' : 'unfulfilled')}
          className={cn(
            "border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all",
            statusFilter === 'unfulfilled'
              ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20"
              : "bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/60"
          )}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className={statusFilter === 'unfulfilled' ? "text-rose-100" : "text-rose-700"}>Belum Terpenuhi</span>
            <AlertCircle className={cn("w-4 h-4", statusFilter === 'unfulfilled' ? "text-white" : "text-rose-600")} />
          </div>
          <div className="mt-2">
            <div className={cn("text-2xl sm:text-3xl font-black", statusFilter === 'unfulfilled' ? "text-white" : "text-rose-700")}>
              {stats.unfulfilledCount} <span className="text-xs font-bold opacity-80 font-normal">item</span>
            </div>
            <div className={cn("text-[11px] mt-0.5 font-medium", statusFilter === 'unfulfilled' ? "text-rose-100" : "text-rose-600")}>
              Kurang {stats.totalKekuranganPcs.toLocaleString('id-ID')} Pcs
            </div>
          </div>
        </div>

        {/* Sudah Terpenuhi */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'fulfilled' ? 'all' : 'fulfilled')}
          className={cn(
            "border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all",
            statusFilter === 'fulfilled'
              ? "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20"
              : "bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/60"
          )}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className={statusFilter === 'fulfilled' ? "text-emerald-100" : "text-emerald-700"}>Sudah Terpenuhi</span>
            <CheckCircle2 className={cn("w-4 h-4", statusFilter === 'fulfilled' ? "text-white" : "text-emerald-600")} />
          </div>
          <div className="mt-2">
            <div className={cn("text-2xl sm:text-3xl font-black", statusFilter === 'fulfilled' ? "text-white" : "text-emerald-700")}>
              {stats.fulfilledCount} <span className="text-xs font-bold opacity-80 font-normal">item</span>
            </div>
            <div className={cn("text-[11px] mt-0.5 font-medium", statusFilter === 'fulfilled' ? "text-emerald-100" : "text-emerald-600")}>
              Target telah tercapai
            </div>
          </div>
        </div>

        {/* Akumulasi Produksi */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Akumulasi Produksi</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalRealisasi.toLocaleString('id-ID')}
              <span className="text-xs font-normal text-slate-500 ml-1">/ {stats.totalKebutuhan.toLocaleString('id-ID')}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium flex items-center gap-1.5">
              <span>Pencapaian:</span>
              <span className="font-bold text-slate-800">{stats.overallPct}%</span>
            </div>
          </div>
        </div>
      </div>

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
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs font-bold shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap",
              statusFilter === 'all'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Semua ({data.length})
          </button>
          <button
            onClick={() => setStatusFilter('unfulfilled')}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
              statusFilter === 'unfulfilled'
                ? "bg-rose-500 text-white shadow-sm"
                : "text-rose-700 hover:bg-rose-100/50"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block animate-pulse"></span>
            Kurang ({stats.unfulfilledCount})
          </button>
          <button
            onClick={() => setStatusFilter('fulfilled')}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap",
              statusFilter === 'fulfilled'
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-700 hover:bg-emerald-100/50"
            )}
          >
            Selesai ({stats.fulfilledCount})
          </button>
          {recentActiveDateCols.length > 0 && (
            <button
              onClick={() => setStatusFilter('recent')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1",
                statusFilter === 'recent'
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-sky-700 hover:bg-sky-100/50"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Produksi Terkini</span>
            </button>
          )}
        </div>

        {/* Toggle View Daily Columns */}
        {recentActiveDateCols.length > 0 && (
          <button
            onClick={() => setShowDailyCols(!showDailyCols)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>{showDailyCols ? 'Sembunyikan Kolom Harian' : 'Tampilkan Kolom Harian'}</span>
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white relative">
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto table-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap min-w-[900px] border-collapse">
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

                {/* Optional Recent Daily Columns */}
                {showDailyCols &&
                  recentActiveDateCols.map((dc) => (
                    <th
                      key={dc.date}
                      className="px-3 py-3.5 text-center font-semibold text-slate-300 border-r border-slate-800 bg-slate-900/90 min-w-[85px]"
                    >
                      <div className="text-[10px] text-rose-400 font-bold">Produksi</div>
                      <div className="text-xs">{dc.date}</div>
                    </th>
                  ))}

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
                  <td colSpan={7 + (showDailyCols ? recentActiveDateCols.length : 0)} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                      <p className="text-sm font-semibold text-slate-700">Menghubungkan ke Spreadsheet Order Urgent...</p>
                      <p className="text-xs text-slate-400">Mengambil data ukuran, target, dan realisasi harian terbaru</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7 + (showDailyCols ? recentActiveDateCols.length : 0)} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                      <FileSearch className="w-10 h-10 text-slate-300 mb-1" />
                      <p className="text-base font-bold text-slate-800">Tidak ada data yang cocok</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Coba sesuaikan kata kunci pencarian atau ganti filter status untuk menampilkan data order lainnya.
                      </p>
                      {(searchTerm || statusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                          }}
                          className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-colors"
                        >
                          Reset Semua Filter
                        </button>
                      )}
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
                        <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-800 border border-slate-200/60">
                          {row.jo || '-'}
                        </span>
                      </td>

                      {/* Kebutuhan */}
                      <td className="px-4 py-3 text-right font-bold text-slate-800 border-r border-slate-100">
                        {row.kebutuhan > 0 ? (
                          <span>{row.kebutuhan.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">Pcs</span></span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Daily Production Columns */}
                      {showDailyCols &&
                        recentActiveDateCols.map((dc) => {
                          const val = row.dailyProd[dc.date] || 0;
                          return (
                            <td
                              key={dc.date}
                              className={cn(
                                "px-3 py-3 text-center font-mono text-xs border-r border-slate-100 font-semibold",
                                val > 0 ? "bg-rose-50/40 text-rose-700 font-bold" : "text-slate-300"
                              )}
                            >
                              {val > 0 ? val.toLocaleString('id-ID') : '-'}
                            </td>
                          );
                        })}

                      {/* Total Realisasi */}
                      <td className="px-4 py-3 text-right font-black text-slate-900 border-r border-slate-100 text-sm">
                        {row.total.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">Pcs</span>
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
                <p className="text-lg font-black text-slate-800">{selectedItemForDetail.kebutuhan} Pcs</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Tercapai</p>
                <p className="text-lg font-black text-slate-800">{selectedItemForDetail.total} Pcs</p>
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
                        +{qty} Pcs
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
