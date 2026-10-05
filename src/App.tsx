import React, { useMemo, useState, useEffect, Suspense, lazy } from 'react';
import { MobileLayout } from './components/MobileLayout';
import { auth, db, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { 
  fetchProductionData, 
  fetchSupplierData,
  fetchMonthlyLogData,
  fetchOperatorData,
  fetchAnalisaOperatorDetailData,
  fetchAnalisaOperatorData,
  fetchLogDikerjakan,
  getSummaryStats,
  getTodayMachineStats,
  normalizeMachineName,
  autoSyncSpreadsheetUpdates
} from './services/dataService';
import { MonthlyLogData, ProductionData, SupplierData, OperatorData, AnalisaOperatorDetailData, LogDikerjakanData } from './types';


// Lazy loading pages for a lightweight initial load
const HomePage = lazy(() => import('./components/Pages/HomePage').then(module => ({ default: module.HomePage })));
const PlanPage = lazy(() => import('./components/Pages/PlanPage').then(module => ({ default: module.PlanPage })));
const AIPage = lazy(() => import('./components/Pages/AIPage').then(module => ({ default: module.AIPage })));
const AnalisaOperatorPage = lazy(() => import('./components/Pages/AnalisaOperatorPage').then(module => ({ default: module.AnalisaOperatorPage })));
const OverviewPage = lazy(() => import('./components/Pages/OverviewPage').then(module => ({ default: module.OverviewPage })));
const AnalyticsPage = lazy(() => import('./components/Pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));
const RankingPage = lazy(() => import('./components/Pages/RankingPage').then(module => ({ default: module.RankingPage })));
const OrderPage = lazy(() => import('./components/Pages/OrderPage').then(module => ({ default: module.OrderPage })));
const OperatorProfilePage = lazy(() => import('./components/Pages/OperatorProfilePage').then(module => ({ default: module.OperatorProfilePage })));
const ProductionPage = lazy(() => import('./components/Pages/ProductionPage').then(module => ({ default: module.ProductionPage })));
const LogPage = lazy(() => import('./components/Pages/LogPage').then(module => ({ default: module.LogPage })));
const RecapPage = lazy(() => import('./components/Pages/RecapPage').then(module => ({ default: module.RecapPage })));
const DowntimePage = lazy(() => import('./components/Pages/DowntimePage').then(module => ({ default: module.DowntimePage })));
const HistoryPage = lazy(() => import('./components/Pages/HistoryPage').then(module => ({ default: module.HistoryPage })));
const PerformancePage = lazy(() => import('./components/Pages/PerformancePage').then(module => ({ default: module.PerformancePage })));

const CACHE_VERSION = 'v1.3'; // Increment to force cache invalidation & clean unused caches

// Set of active and valid cache keys used across the app
export const ACTIVE_CACHE_KEYS = new Set([
  'app_cache_version',
  'cache_data_prod',
  'cache_data_supp',
  'cache_data_month',
  'cache_data_op',
  'cache_data_analisa',
  'cache_data_log',
  'cache_data_analisaOpData',
  'operator_avatars',
  'operator_avatar_locks'
]);

// Clean unused, orphaned, or obsolete caches to free localStorage space and ensure fast loading
export function cleanUnusedCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      // Remove any cache_data_ key that is not in ACTIVE_CACHE_KEYS (e.g. cache_data_order_urgent, old keys)
      if (key.startsWith('cache_data_') && !ACTIVE_CACHE_KEYS.has(key)) {
        keysToRemove.push(key);
      } else if (key.startsWith('temp_') || key.startsWith('old_') || key.includes('test') || key === 'cache_data_order_urgent') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
    if (keysToRemove.length > 0) {
      console.log(`[Cache Cleanup] Removed ${keysToRemove.length} unused or orphaned cache keys.`);
    }
  } catch (err) {
    console.warn('[Cache Cleanup] Error scanning unused cache:', err);
  }
}

// Automatically clear old caches to prevent stale data bugs and remove unused keys
try {
  const currentVersion = localStorage.getItem('app_cache_version');
  if (currentVersion !== CACHE_VERSION) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_data_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem('app_cache_version', CACHE_VERSION);
    console.log('Old cache successfully cleared for new version.');
  }
  cleanUnusedCache();
} catch (e) {
  console.warn('Failed to verify cache version:', e);
}

// Helper to get cached data from localStorage for instant zero-delay render
function getLocalCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`cache_data_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Ignore empty arrays from cache so we force a fresh fetch
    if (Array.isArray(parsed) && parsed.length === 0) return null;
    return parsed;
  } catch (e) {
    // Clean up corrupted cache
    localStorage.removeItem(`cache_data_${key}`);
    return null;
  }
}

function setLocalCache<T>(key: string, data: T): void {
  try {
    // Prevent overwriting valid cache with empty data arrays (e.g. during a network glitch)
    if (Array.isArray(data) && data.length === 0) return;
    localStorage.setItem(`cache_data_${key}`, JSON.stringify(data));
  } catch (e) {
    // If quota is exceeded, clear unused and older caches to free space, then try saving again
    console.warn('Storage quota exceeded. Clearing unused and older caches to free space...');
    cleanUnusedCache();
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cache_data_') && k !== `cache_data_${key}` && k !== 'cache_data_prod') {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem(`cache_data_${key}`, JSON.stringify(data));
    } catch(err) {
      console.error('Storage full. Unable to cache new data.', err);
    }
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [data, setData] = useState<ProductionData[]>(() => getLocalCache<ProductionData[]>('prod') || []);
  const [supplierData, setSupplierData] = useState<SupplierData[]>(() => getLocalCache<SupplierData[]>('supp') || []);
  const [monthlyLogData, setMonthlyLogData] = useState<MonthlyLogData[]>(() => getLocalCache<MonthlyLogData[]>('month') || []);
  const [operatorData, setOperatorData] = useState<OperatorData[]>(() => getLocalCache<OperatorData[]>('op') || []);
  const [analisaOperatorDetailData, setAnalisaOperatorDetailData] = useState<AnalisaOperatorDetailData[]>(() => {
    const cached = getLocalCache<AnalisaOperatorDetailData[]>('analisa');
    if (cached && cached.length > 0) return cached;
    return [];
  });
  const [analisaOperatorData, setAnalisaOperatorData] = useState<ProductionData[]>(() => {
    const cached = getLocalCache<ProductionData[]>('analisaOpData');
    if (cached && cached.length > 0) return cached;
    return [];
  });
  const [logDikerjakanData, setLogDikerjakanData] = useState<LogDikerjakanData[]>(() => getLocalCache<LogDikerjakanData[]>('log') || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If we have cached production data, do not block the UI with a full-screen loading spinner
    return !getLocalCache<ProductionData[]>('prod');
  });

  // Firebase state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);

  // Listen to Auth changes & test Firestore connectivity
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });

    getDocFromServer(doc(db, 'test', 'connection'))
      .then(() => {
        setFirebaseConnected(true);
      })
      .catch((err) => {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          setFirebaseConnected(false);
        } else {
          // Response came back, meaning we are online and firebase is accessible!
          setFirebaseConnected(true);
        }
      });

    return () => unsubscribe();
  }, []);

  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoginError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Firebase Login error:", err);
      setLoginError(err.message || String(err));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase Logout error:", err);
    }
  };

  // Handle back button natively
  useEffect(() => {
    window.history.replaceState({ page: 'Home' }, '', '/');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        setActiveTab(event.state.page);
      } else {
        setActiveTab('Home');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab !== activeTab) {
      window.history.pushState({ page: tab }, '', `/${tab}`);
      setActiveTab(tab);
    }
  };

  const latestDataRef = React.useRef({ data, supplierData, monthlyLogData, operatorData, analisaOperatorDetailData, logDikerjakanData, analisaOperatorData });
  useEffect(() => {
    latestDataRef.current = { data, supplierData, monthlyLogData, operatorData, analisaOperatorDetailData, logDikerjakanData, analisaOperatorData };
  }, [data, supplierData, monthlyLogData, operatorData, analisaOperatorDetailData, logDikerjakanData, analisaOperatorData]);

  useEffect(() => {
    let isMounted = true;
    let autoSyncTimeout: NodeJS.Timeout;
    
    const performBackgroundSync = () => {
      const { data: d, supplierData: s, monthlyLogData: m, operatorData: o, analisaOperatorDetailData: a, logDikerjakanData: ld, analisaOperatorData: aod } = latestDataRef.current;
      autoSyncSpreadsheetUpdates(
        d, s, m, o, a, ld, aod,
        (newProd, newSupp, newMonth, newOp, newAnalisaDetail, newLogDikerjakan, newAnalisaOpData) => {
          if (isMounted) {
            setData(newProd);
            setSupplierData(newSupp);
            setMonthlyLogData(newMonth);
            setOperatorData(newOp);
            setAnalisaOperatorDetailData(newAnalisaDetail);
            setLogDikerjakanData(newLogDikerjakan);
            setAnalisaOperatorData(newAnalisaOpData);

            setLocalCache('prod', newProd);
            setLocalCache('supp', newSupp);
            setLocalCache('month', newMonth);
            setLocalCache('op', newOp);
            setLocalCache('analisa', newAnalisaDetail);
            setLocalCache('log', newLogDikerjakan);
            setLocalCache('analisaOpData', newAnalisaOpData);
          }
        }
      );
    };

    const loadDataFromFirestore = async () => {
      try {
        // 1. Fetch critical data first to unblock UI immediately
        const prodData = await fetchProductionData();
        if (isMounted) {
          setData(prodData);
          setLocalCache('prod', prodData);
          setIsLoading(false); // Unblock UI early!
        }
        
        // 2. Fetch the rest sequentially to avoid request jam (bottleneck) on Firebase
        if (isMounted) {
          const suppData = await fetchSupplierData();
          setSupplierData(suppData);
          setLocalCache('supp', suppData);
          
          const monthlyLog = await fetchMonthlyLogData();
          setMonthlyLogData(monthlyLog);
          setLocalCache('month', monthlyLog);
          
          const opData = await fetchOperatorData();
          setOperatorData(opData);
          setLocalCache('op', opData);
          
          const analisaDetailData = await fetchAnalisaOperatorDetailData();
          setAnalisaOperatorDetailData(analisaDetailData);
          setLocalCache('analisa', analisaDetailData);
          
          const logDikerjakan = await fetchLogDikerjakan();
          setLogDikerjakanData(logDikerjakan);
          setLocalCache('log', logDikerjakan);
          
          const analisaOpData = await fetchAnalisaOperatorData();
          setAnalisaOperatorData(analisaOpData);
          setLocalCache('analisaOpData', analisaOpData);

          // Schedule background auto-sync check after initial load stabilizes
          autoSyncTimeout = setTimeout(() => {
            if (isMounted) performBackgroundSync();
          }, 5000);
        }
      } catch (err) {
        console.warn("Initial load network issue. Proceeding with cache/fallback.");
        if (isMounted) setIsLoading(false);
      }
    };

    // Fast-path: if we already have local cache, skip the heavy 48 parallel Firestore reads
    // and just do a lightweight background sync from Google Sheets a few seconds later.
    const hasCache = !!getLocalCache('prod');
    if (hasCache) {
      setIsLoading(false);
      const cachedOp = getLocalCache<ProductionData[]>('analisaOpData');
      if (!cachedOp || !cachedOp.some(d => d.month === 10)) {
        fetchAnalisaOperatorData().then(opData => {
          if (isMounted && opData && opData.length > 0) {
            setAnalisaOperatorData(opData);
            setLocalCache('analisaOpData', opData);
          }
        });
      }
      const cachedDetail = getLocalCache<AnalisaOperatorDetailData[]>('analisa');
      if (!cachedDetail || !cachedDetail.some(d => (d.tanggal || '').includes('2026-10'))) {
        fetchAnalisaOperatorDetailData().then(detail => {
          if (isMounted && detail && detail.length > 0) {
            setAnalisaOperatorDetailData(detail);
            setLocalCache('analisa', detail);
          }
        });
      }
      autoSyncTimeout = setTimeout(() => {
        if (isMounted) performBackgroundSync();
      }, 3000);
    } else {
      loadDataFromFirestore();
    }

    // Auto-sync every 3 minutes (180000ms) to detect changes in Google Sheets
    const intervalId = setInterval(() => {
      if (isMounted) performBackgroundSync();
    }, 180000);

    return () => {
      isMounted = false;
      clearTimeout(autoSyncTimeout);
      clearInterval(intervalId);
    };
  }, []);

  const stats = useMemo(() => getSummaryStats(data), [data]);
  const todayStats = useMemo(() => getTodayMachineStats(data), [data]);

  // Generate trendData for Overview
  const monthPerformance = useMemo(() => {
    const validData = data.filter(d => {
      if (!d.tanggal || d.input <= 0 || !d.mesin) return false;
      const name = normalizeMachineName(d.mesin);
      return name.match(/^BS [1-8]$/);
    });
    if (validData.length === 0) return null;
    
    // Find the latest month
    const latestDateStr = validData.reduce((max, d) => d.tanggal > max ? d.tanggal : max, validData[0].tanggal);
    const latestDate = new Date(latestDateStr);
    const latestMonth = latestDate.getMonth();
    const latestYear = latestDate.getFullYear();

    const monthData = validData.filter(d => {
      const dDate = new Date(d.tanggal);
      return dDate.getMonth() === latestMonth && dDate.getFullYear() === latestYear;
    });

    const totals = monthData.reduce((acc, d) => {
      acc.input += d.input;
      acc.utama += d.utama;
      acc.turunan += d.turunan;
      acc.lokal += d.lokal;
      acc.total += d.total;
      return acc;
    }, { input: 0, utama: 0, turunan: 0, lokal: 0, total: 0 });

    const totalDays = new Set(monthData.map(d => d.tanggal)).size;
    const divisor = totalDays > 0 ? totalDays : 1; 

    return {
      totals: {
        input: totals.input,
        utama: totals.utama,
        turunan: totals.turunan,
        lokal: totals.lokal,
        total: totals.total,
        rendemenUtama: totals.input > 0 ? (totals.utama / totals.input) * 100 : 0,
        rendemenTurunan: totals.input > 0 ? (totals.turunan / totals.input) * 100 : 0,
        rendemenTotal: totals.input > 0 ? (totals.total / totals.input) * 100 : 0,
      },
      averages: { 
        input: totals.input / divisor,
        utama: totals.utama / divisor,
        turunan: totals.turunan / divisor,
        lokal: totals.lokal / divisor,
        total: totals.total / divisor,
      },
      days: totalDays,
      monthName: latestDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()
    };
  }, [data]);

  const combinedAnalisaOperatorData = useMemo(() => {
    const map = new Map<string, ProductionData>();
    // 1. Seed with data from DATABASE APPSCRIPT (which contains latest October data)
    data.forEach(d => {
      if (d.tanggal && d.mesin) {
        const key = `${d.tanggal.trim()}_${normalizeMachineName(d.mesin)}`;
        map.set(key, d);
      }
    });
    // 2. Overlay any specialized records from analisaOperatorData
    if (analisaOperatorData && analisaOperatorData.length > 0) {
      analisaOperatorData.forEach(d => {
        if (d.tanggal && d.mesin) {
          const key = `${d.tanggal.trim()}_${normalizeMachineName(d.mesin)}`;
          map.set(key, d);
        }
      });
    }
    return Array.from(map.values());
  }, [data, analisaOperatorData]);

  const combinedAnalisaDetailData = useMemo(() => {
    const map = new Map<string, AnalisaOperatorDetailData>();
    if (analisaOperatorDetailData) {
      analisaOperatorDetailData.forEach(d => {
        const key = `${(d.tanggal || '').trim()}_${normalizeMachineName(d.mesin)}`;
        map.set(key, d);
      });
    }
    // Ensure all machines for each active date in data have an entry in detailData
    data.forEach(d => {
      if (d.tanggal && d.mesin && d.input > 0) {
        const key = `${d.tanggal.trim()}_${normalizeMachineName(d.mesin)}`;
        if (!map.has(key)) {
          map.set(key, {
            tanggal: d.tanggal.trim(),
            mesin: normalizeMachineName(d.mesin),
            rkOrderan: '',
            komposisiLog: '',
            komposisiDiameterLog: '',
            komposisiPanjangLog: '',
            potUjung: '0',
            fotoBahanBaku1: '',
            fotoBahanBaku2: '',
            fotoBahanBaku3: ''
          });
        }
      }
    });
    return Array.from(map.values());
  }, [data, analisaOperatorDetailData]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#6970f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white font-bold animate-pulse tracking-widest text-xs uppercase">Connecting Database...</p>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout 
      activeTab={activeTab} 
      setActiveTab={handleTabChange} 
      title={activeTab}
      user={user}
      firebaseConnected={firebaseConnected}
      onLogin={handleLogin}
      onLogout={handleLogout}
      loginError={loginError}
    >
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      }>
        {activeTab === 'Home' && <HomePage setActiveTab={handleTabChange} />}
        {activeTab === 'Overview' && <OverviewPage stats={stats} todayStats={todayStats} monthPerformance={monthPerformance} monthlyLogData={monthlyLogData} />}
        {activeTab === 'Analytics' && <AnalyticsPage data={data} monthlyLogData={monthlyLogData} />}
        {activeTab === 'Ranking' && <RankingPage data={data} operatorData={operatorData} />}
        {activeTab === 'Order' && <OrderPage />}
        {activeTab === 'OperatorProfile' && <OperatorProfilePage data={data} operatorData={operatorData} />}
        {activeTab === 'Production' && <ProductionPage todayStats={todayStats} />}
        {activeTab === 'Log' && (
          <LogPage 
            logDikerjakanData={logDikerjakanData} 
            onUpdateLogData={(newData) => {
              setLogDikerjakanData(newData);
              setLocalCache('log', newData);
            }} 
          />
        )}
        {activeTab === 'Recap' && <RecapPage data={data} supplierData={supplierData} />}
        {activeTab === 'Downtime' && <DowntimePage data={data} />}
        {activeTab === 'History' && <HistoryPage data={data} monthlyLogData={monthlyLogData} />}
        {activeTab === 'Performance' && <PerformancePage data={data} />}
        {activeTab === 'Plan' && <PlanPage todayStats={todayStats} data={data} />}
        {activeTab === 'AI' && <AIPage data={data} />}
        {activeTab === 'AnalisaOperator' && (
          <AnalisaOperatorPage 
            data={combinedAnalisaOperatorData.length > 0 ? combinedAnalisaOperatorData : data} 
            detailData={combinedAnalisaDetailData} 
          />
        )}
      </Suspense>
    </MobileLayout>
  );
}
