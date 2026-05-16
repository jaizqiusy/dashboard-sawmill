import React, { useMemo, useState, useEffect } from 'react';
import { MobileLayout } from './components/MobileLayout';
import { OverviewPage } from './components/Pages/OverviewPage';
import { AnalyticsPage } from './components/Pages/AnalyticsPage';
import { RankingPage } from './components/Pages/RankingPage';
import { ProductionPage } from './components/Pages/ProductionPage';
import { DowntimePage } from './components/Pages/DowntimePage';
import { HistoryPage } from './components/Pages/HistoryPage';
import { 
  fetchProductionData, 
  getSummaryStats,
  getTodayMachineStats,
  normalizeMachineName
} from './services/dataService';
import { ProductionData } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState<ProductionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProductionData().then(fetchedData => {
      setData(fetchedData);
      setIsLoading(false);
    });
  }, []);

  const stats = useMemo(() => getSummaryStats(data), [data]);
  const todayStats = useMemo(() => getTodayMachineStats(data), [data]);

  // Generate trendData for Overview
  const trendData = useMemo(() => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const summary: Record<string, { v1: number, v2: number, count: number }> = {};
    
    // Process last 7 days of data roughly
    const recentData = data.slice(-500); // Approximate recent data
    
    recentData.forEach(d => {
      if (d.input > 0 && d.tanggal) {
        // Try parsing date assuming dd MMMM yyyy or similar based on parsing strategy
        // Simplified approach for aesthetics - aggregate by day of week
        let dateObj = new Date(d.tanggal);
        if (isNaN(dateObj.getTime())) {
          dateObj = new Date(); // fallback
        }
        const w = days[dateObj.getDay()];
        if (!summary[w]) summary[w] = { v1: 0, v2: 0, count: 0 };
        summary[w].v1 += d.utama;
        summary[w].v2 += d.total;
        summary[w].count += 1;
      }
    });
    
    // Sort logic to order Mon to Sun
    const sortedDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    return sortedDays.map(d => ({
      w: d,
      v1: summary[d]?.v1 || 0,
      v2: summary[d]?.v2 || 0
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />
          <p className="text-sky-400 font-medium animate-pulse tracking-widest text-xs uppercase">Connecting Database...</p>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout activeTab={activeTab} setActiveTab={setActiveTab} title={activeTab}>
      {activeTab === 'Overview' && <OverviewPage stats={stats} todayStats={todayStats} trendData={trendData} />}
      {activeTab === 'Analytics' && <AnalyticsPage data={data} />}
      {activeTab === 'Ranking' && <RankingPage data={data} />}
      {activeTab === 'Production' && <ProductionPage todayStats={todayStats} />}
      {activeTab === 'Downtime' && <DowntimePage data={data} />}
      {activeTab === 'History' && <HistoryPage data={data} />}
    </MobileLayout>
  );
}
