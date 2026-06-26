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
  getSummaryStats,
  getTodayMachineStats,
  normalizeMachineName
} from './services/dataService';
import { MonthlyLogData, ProductionData, SupplierData, OperatorData } from './types';

// Lazy loading pages for a lightweight initial load
const HomePage = lazy(() => import('./components/Pages/HomePage').then(module => ({ default: module.HomePage })));
const PlanPage = lazy(() => import('./components/Pages/PlanPage').then(module => ({ default: module.PlanPage })));
const AIPage = lazy(() => import('./components/Pages/AIPage').then(module => ({ default: module.AIPage })));
const OverviewPage = lazy(() => import('./components/Pages/OverviewPage').then(module => ({ default: module.OverviewPage })));
const AnalyticsPage = lazy(() => import('./components/Pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));
const RankingPage = lazy(() => import('./components/Pages/RankingPage').then(module => ({ default: module.RankingPage })));
const OperatorProfilePage = lazy(() => import('./components/Pages/OperatorProfilePage').then(module => ({ default: module.OperatorProfilePage })));
const ProductionPage = lazy(() => import('./components/Pages/ProductionPage').then(module => ({ default: module.ProductionPage })));
const RecapPage = lazy(() => import('./components/Pages/RecapPage').then(module => ({ default: module.RecapPage })));
const DowntimePage = lazy(() => import('./components/Pages/DowntimePage').then(module => ({ default: module.DowntimePage })));
const HistoryPage = lazy(() => import('./components/Pages/HistoryPage').then(module => ({ default: module.HistoryPage })));

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [data, setData] = useState<ProductionData[]>([]);
  const [supplierData, setSupplierData] = useState<SupplierData[]>([]);
  const [monthlyLogData, setMonthlyLogData] = useState<MonthlyLogData[]>([]);
  const [operatorData, setOperatorData] = useState<OperatorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Firebase Login error:", err);
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

  useEffect(() => {
    Promise.all([
      fetchProductionData(),
      fetchSupplierData(),
      fetchMonthlyLogData(),
      fetchOperatorData()
    ]).then(([prodData, suppData, monthlyLog, opData]) => {
      setData(prodData);
      setSupplierData(suppData);
      setMonthlyLogData(monthlyLog);
      setOperatorData(opData);
      setIsLoading(false);
    });
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
        {activeTab === 'OperatorProfile' && <OperatorProfilePage data={data} operatorData={operatorData} />}
        {activeTab === 'Production' && <ProductionPage todayStats={todayStats} />}
        {activeTab === 'Recap' && <RecapPage data={data} supplierData={supplierData} />}
        {activeTab === 'Downtime' && <DowntimePage data={data} />}
        {activeTab === 'History' && <HistoryPage data={data} monthlyLogData={monthlyLogData} />}
        {activeTab === 'Plan' && <PlanPage todayStats={todayStats} data={data} />}
        {activeTab === 'AI' && <AIPage data={data} />}
      </Suspense>
    </MobileLayout>
  );
}
