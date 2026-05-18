import React, { useMemo, useState, useEffect } from 'react';
import { MobileLayout } from './components/MobileLayout';
import { HomePage } from './components/Pages/HomePage';
import { AIPage } from './components/Pages/AIPage';
import { OverviewPage } from './components/Pages/OverviewPage';
import { AnalyticsPage } from './components/Pages/AnalyticsPage';
import { RankingPage } from './components/Pages/RankingPage';
import { ProductionPage } from './components/Pages/ProductionPage';
import { RecapPage } from './components/Pages/RecapPage';
import { DowntimePage } from './components/Pages/DowntimePage';
import { HistoryPage } from './components/Pages/HistoryPage';
import { 
  fetchProductionData, 
  fetchSupplierData,
  getSummaryStats,
  getTodayMachineStats,
  normalizeMachineName
} from './services/dataService';
import { ProductionData, SupplierData } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [data, setData] = useState<ProductionData[]>([]);
  const [supplierData, setSupplierData] = useState<SupplierData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      fetchSupplierData()
    ]).then(([prodData, suppData]) => {
      setData(prodData);
      setSupplierData(suppData);
      setIsLoading(false);
    });
  }, []);

  const stats = useMemo(() => getSummaryStats(data), [data]);
  const todayStats = useMemo(() => getTodayMachineStats(data), [data]);

  // Generate trendData for Overview
  const monthPerformance = useMemo(() => {
    const validData = data.filter(d => {
      if (!d.tanggal || d.input <= 0 || !d.mesin) return false;
      const lowerMesin = normalizeMachineName(d.mesin).toLowerCase().trim();
      return lowerMesin.replace(/\s+/g, '').match(/^bs[1-8]$/);
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
    <MobileLayout activeTab={activeTab} setActiveTab={handleTabChange} title={activeTab}>
      {activeTab === 'Home' && <HomePage setActiveTab={handleTabChange} />}
      {activeTab === 'Overview' && <OverviewPage stats={stats} todayStats={todayStats} monthPerformance={monthPerformance} />}
      {activeTab === 'Analytics' && <AnalyticsPage data={data} />}
      {activeTab === 'Ranking' && <RankingPage data={data} />}
      {activeTab === 'Production' && <ProductionPage todayStats={todayStats} />}
      {activeTab === 'Recap' && <RecapPage data={data} supplierData={supplierData} />}
      {activeTab === 'Downtime' && <DowntimePage data={data} />}
      {activeTab === 'History' && <HistoryPage data={data} />}
      {activeTab === 'AI' && <AIPage data={data} />}
    </MobileLayout>
  );
}
