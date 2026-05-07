import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XSquare, 
  Stethoscope, 
  Clock, 
  AlertTriangle,
  Factory,
  BarChart3,
  TrendingUp,
  History,
  Trophy,
  Package
} from 'lucide-react';
import { Header, TabBar } from './components/Navigation';
import { StatCard } from './components/StatCard';
import { RankingTable } from './components/RankingTable';
import { cn } from './lib/utils';
import { 
  fetchProductionData, 
  getSummaryStats, 
  getPerformanceByMachine,
  getPerformanceByTimeframe,
  getAvailablePeriods,
  getMachineRankings,
  getTodayMachineStats,
  normalizeMachineName
} from './services/dataService';
import { ProductionData } from './types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend
} from 'recharts';

// Colors for the donut chart
const DONUT_COLORS = [
  '#4f46e5', '#3b82f6', '#0ea5e9', '#06b6d4', 
  '#14b8a6', '#10b981', '#84cc16', '#eab308', 
  '#f59e0b', '#f97316', '#ef4444', '#ec4899'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState<ProductionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [rankingPeriodType, setRankingPeriodType] = useState<'weekly' | 'monthly'>('monthly');
  const [rankingPeriodValue, setRankingPeriodValue] = useState<number>(0);
  
  const [downtimePeriodType, setDowntimePeriodType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [downtimePeriodValue, setDowntimePeriodValue] = useState<string | number>('');
  
  useEffect(() => {
    fetchProductionData().then(fetchedData => {
      setData(fetchedData);
      setIsLoading(false);
      
      const periods = getAvailablePeriods(fetchedData);
      if (periods.months.length > 0) {
        setRankingPeriodValue(periods.months[0]);
      }
      if (periods.dates.length > 0) {
        setDowntimePeriodValue(periods.dates[0]);
      }
    });
  }, []);

  const stats = useMemo(() => getSummaryStats(data), [data]);
  const machinePerformance = useMemo(() => getPerformanceByMachine(data), [data]);

  // Update progress chart to use rendemen utama (yield_primary) for the Breakdown machine
  const topMachineName = 'Breakdown';
  const progressData = useMemo(() => 
    data.filter(d => normalizeMachineName(d.mesin || '') === 'Breakdown' && d.input > 0).slice(-15),
    [data]
  );
  
  const periods = useMemo(() => getAvailablePeriods(data), [data]);
  const rankings = useMemo(() => getMachineRankings(data, rankingPeriodType, rankingPeriodValue), [data, rankingPeriodType, rankingPeriodValue]);
  const todayStats = useMemo(() => getTodayMachineStats(data), [data]);

  const filteredDowntimeData = useMemo(() => {
    let filtered = data.filter(d => 
      d.downtime && 
      d.downtime.replace(/,/g, '').trim().length > 0 &&
      d.downtime.toLowerCase().trim() !== 'libur'
    );
    
    if (downtimePeriodType === 'daily') {
      filtered = filtered.filter(d => d.tanggal === downtimePeriodValue);
    } else if (downtimePeriodType === 'weekly') {
      filtered = filtered.filter(d => d.week === Number(downtimePeriodValue));
    } else if (downtimePeriodType === 'monthly') {
      filtered = filtered.filter(d => d.month === Number(downtimePeriodValue));
    }

    const grouped: Record<string, typeof filtered> = {};
    filtered.forEach(d => {
      const m = d.mesin;
      if (!grouped[m]) grouped[m] = [];
      grouped[m].push(d);
    });

    return grouped;
  }, [data, downtimePeriodType, downtimePeriodValue]);

  const historyExtremes = useMemo(() => {
    const bsData = data.filter(d => {
      if (!d.mesin || d.input <= 0) return false;
      const lowerMesin = d.mesin.toLowerCase().trim();
      return lowerMesin.startsWith('bs');
    });

    const daily = getPerformanceByTimeframe(bsData, 'daily');
    const weekly = getPerformanceByTimeframe(bsData, 'weekly');
    const monthly = getPerformanceByTimeframe(bsData, 'monthly');

    const getExtremes = (perf: ReturnType<typeof getPerformanceByTimeframe>) => {
      if (!perf || perf.length === 0) return null;
      let highest = perf[0];
      let lowest = perf[0];
      for (const p of perf) {
        if (p.yield > highest.yield) highest = p;
        if (p.yield < lowest.yield) lowest = p;
      }
      return { highest, lowest };
    };

    return {
      daily: getExtremes(daily),
      weekly: getExtremes(weekly),
      monthly: getExtremes(monthly),
    };
  }, [data]);

  const tabs = ['Overview', 'Analytics', 'Ranking', 'Update Today', 'Downtime', 'History'];


  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Syncing with database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 font-sans">
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <Header 
          title="Dashboard Produksi" 
          subtitle="SAWMILL BUANA 2026"
          machineCount={stats.totalMachines}
        />

        <TabBar 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {activeTab === 'Overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              <StatCard 
                title="Total Mesin Aktif" 
                value={stats.totalMachines} 
                subtitle="unit operasional" 
                icon={Factory} 
                iconBgColor="bg-blue-500"
              />
              <StatCard 
                title="Rata-rata Yield" 
                value={`${(stats.avgYield * 100).toFixed(1)}%`}
                subtitle="efisiensi produksi" 
                icon={CheckCircle} 
                iconBgColor="bg-emerald-500"
              />
              <StatCard 
                title="Total Output Utama" 
                value={`${stats.totalUtama.toLocaleString()} m³`}
                subtitle="volume produk" 
                icon={TrendingUp} 
                iconBgColor="bg-indigo-500"
              />
              <StatCard 
                title="Total Input Bahan" 
                value={`${stats.totalInput.toLocaleString()} m³`}
                subtitle="raw material logs" 
                icon={BarChart3} 
                iconBgColor="bg-amber-500"
              />
              <StatCard 
                title="Total Downtime" 
                value={`${stats.totalDowntimeMinutes} mnt`}
                subtitle="akumulasi hambatan" 
                icon={Clock} 
                iconBgColor="bg-rose-500"
              />
              <StatCard 
                title="Total Output" 
                value={`${stats.totalAllOutput.toLocaleString()} m³`}
                subtitle="total seluruh output" 
                icon={Package} 
                iconBgColor="bg-purple-500"
              />
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-indigo-500/15 transition-colors duration-500 pointer-events-none" />
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2 tracking-tight drop-shadow-sm relative z-10">
                  <TrendingUp className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  Top Machine Output <span className="text-zinc-500 font-normal text-sm ml-1">(m³)</span>
                </h3>
                <div className="h-[300px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={machinePerformance}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="output"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        stroke="none"
                        label={({ cx, cy, midAngle, outerRadius, name }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius * 1.15;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text 
                              x={x} 
                              y={y} 
                              fill="#d4d4d8" 
                              textAnchor={x > cx ? 'start' : 'end'} 
                              dominantBaseline="central" 
                              fontSize={11}
                            >
                              {name}
                            </text>
                          );
                        }}
                        labelLine={{ stroke: '#3f3f46', strokeWidth: 1 }}
                      >
                        {machinePerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a' }}
                        itemStyle={{ color: '#d4d4d8' }}
                        formatter={(value: number) => [`${value} m³`, 'Output']}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', color: '#a1a1aa', paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                  <History className="w-4 h-4 text-amber-500" />
                  Yield Progress: {topMachineName}
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressData}>
                      <defs>
                        <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis 
                        dataKey="tanggal" 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => val.split('-').slice(2).join('/')}
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a' }}
                        itemStyle={{ color: '#d4d4d8' }}
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Yield Utama']}
                        labelFormatter={(label) => `Tanggal: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="yield_primary" 
                        stroke="#6366f1" 
                        fillOpacity={1} 
                        fill="url(#colorYield)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Analytics' && (
          <div className="space-y-10 animate-in fade-in duration-500 pb-10">
            {(['daily', 'weekly', 'monthly', 'quarterly'] as const).map((type) => {
              const timeframeData = getPerformanceByTimeframe(data, type);
              if (timeframeData.length === 0) return null;

              return (
                <div key={type} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 tracking-tight capitalize">
                        {type} Performance
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">Production metrics grouped by {type} intervals</p>
                    </div>
                    <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/10">
                      <BarChart3 className="w-5 h-5 text-indigo-500" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={timeframeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis 
                            dataKey="label" 
                            stroke="#71717a" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#71717a" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a' }}
                            itemStyle={{ fontSize: '12px' }}
                          />
                          <Bar dataKey="utama" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Output Utama" />
                          <Bar dataKey="input" fill="#4f46e520" radius={[4, 4, 0, 0]} name="Raw Input" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white mx-auto p-4 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 text-center">Avg Efficiency ({type})</p>
                        <div className="text-2xl font-light text-slate-900 text-center">
                          {(timeframeData.reduce((acc, curr) => acc + curr.yield, 0) / timeframeData.length * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-white mx-auto p-4 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 text-center">Total Output</p>
                        <div className="text-2xl font-light text-slate-900 text-center">
                          {timeframeData.reduce((acc, curr) => acc + curr.utama, 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">m³</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'Ranking' && (
          <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" /> Leaderboard Mesin
                </h3>
                <p className="text-sm text-slate-500 mt-1">Peringkat efisiensi dan output per periode</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden p-1 shadow-sm">
                  <button 
                    onClick={() => {
                      setRankingPeriodType('monthly');
                      setRankingPeriodValue(periods.months[0] || 0);
                    }}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${rankingPeriodType === 'monthly' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Bulanan
                  </button>
                  <button 
                    onClick={() => {
                      setRankingPeriodType('weekly');
                      setRankingPeriodValue(periods.weeks[0] || 0);
                    }}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${rankingPeriodType === 'weekly' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Mingguan
                  </button>
                </div>
                
                <select 
                  className="bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2 outline-none appearance-none shadow-sm cursor-pointer min-w-[120px]"
                  value={rankingPeriodValue}
                  onChange={(e) => setRankingPeriodValue(parseInt(e.target.value))}
                >
                  {rankingPeriodType === 'monthly' 
                    ? periods.months.map(m => {
                        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                        return <option key={m} value={m}>{monthNames[m - 1]}</option>;
                      })
                    : periods.weeks.map(w => (
                        <option key={w} value={w}>Minggu {w}</option>
                      ))
                  }
                </select>
              </div>
            </div>

            <RankingTable 
              data={rankings} 
              periodLabel={rankingPeriodType === 'monthly' 
                ? ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][rankingPeriodValue - 1] || 'Bulan' 
                : `Minggu ${rankingPeriodValue}`
              } 
            />
          </div>
        )}

        {activeTab === 'Update Today' && (
          <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-colors">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  <Factory className="w-5 h-5 text-indigo-500" /> Update Today
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Performa harian per mesin pada <span className="font-medium text-slate-600">{todayStats.date.split('-').reverse().join('/') || 'Hari Ini'}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {todayStats.stats.map((stat, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-300 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-125" />
                  
                  <div className="flex items-center justify-between mb-6 relative">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-500/20">
                        {stat.mesin.startsWith('BS') ? stat.mesin.replace(/\D/g, '') : 
                         stat.mesin === 'Poni A' ? 'PA' : 
                         stat.mesin === 'Poni B' ? 'PB' : 
                         stat.mesin === 'Breakdown' ? 'BD' : 
                         stat.mesin.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{stat.mesin}</h4>
                        <span className="text-xs text-slate-500 font-medium mt-1 inline-block">{stat.line}</span>
                      </div>
                    </div>
                    {stat.achievement >= 0.8 ? (
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wider rounded border border-emerald-500/20 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Target
                      </span>
                    ) : stat.achievement >= 0.6 ? (
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-wider rounded border border-amber-500/20">
                        Warning
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 text-xs font-bold uppercase tracking-wider rounded border border-rose-500/20">
                        Under
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 relative">
                    <div>
                      <div className="flex justify-between text-sm py-1.5 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">Input Log</span>
                        <span className="text-slate-600 font-mono">{stat.input.toFixed(1)} <span className="text-xs text-slate-400">m³</span></span>
                      </div>
                      <div className="flex justify-between text-sm py-1.5 border-b border-slate-200">
                        <span className="text-emerald-700 font-medium">Utama</span>
                        <span className="text-emerald-600 font-mono font-medium">{stat.utama.toFixed(1)} <span className="text-xs text-emerald-600">m³</span></span>
                      </div>
                      <div className="flex justify-between text-sm py-1.5 border-b border-slate-200">
                        <span className="text-blue-700 font-medium">Turunan</span>
                        <span className="text-blue-600 font-mono font-medium">{stat.turunan.toFixed(1)} <span className="text-xs text-blue-600">m³</span></span>
                      </div>
                      <div className="flex justify-between text-sm py-1.5 border-b border-slate-200">
                        <span className="text-amber-700 font-medium">Lokal</span>
                        <span className="text-amber-600 font-mono font-medium">{stat.lokal.toFixed(1)} <span className="text-xs text-amber-600">m³</span></span>
                      </div>
                      <div className="flex justify-between text-sm py-1.5">
                        <span className="text-slate-500 font-bold">Output</span>
                        <span className="text-slate-900 font-mono font-bold">{stat.total.toFixed(1)} <span className="text-xs text-slate-500">m³</span></span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="block text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Rendemen Utama</span>
                        <span className={cn("text-xl font-bold font-mono tracking-tight", stat.yield >= 0.35 ? "text-emerald-600" : stat.yield >= 0.30 ? "text-amber-600" : "text-rose-600")}>
                          {(stat.yield * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Rendemen Total</span>
                        <span className="text-xl font-bold text-slate-900 font-mono tracking-tight">
                          {((stat.input > 0 ? stat.total / stat.input : 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    {stat.downtime && stat.downtime.length > 0 && (
                       <div className="pt-4 border-t border-slate-200">
                         <span className="block text-xs text-slate-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> Log Downtime
                         </span>
                         <div className="flex flex-wrap gap-1.5">
                           {stat.downtime.map((dt, idx) => (
                             <span key={idx} className="bg-rose-500/10 text-rose-600 text-xs font-medium px-2 py-0.5 rounded border border-rose-500/10 whitespace-nowrap">
                               {dt}
                             </span>
                           ))}
                         </div>
                       </div>
                    )}
                  </div>
                </div>
              ))}

              {todayStats.stats.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 border border-slate-200 border-dashed rounded-2xl">
                  <Factory className="w-8 h-8 text-zinc-700 mb-3" />
                  <p className="font-medium">Tidak ada data operasional untuk hari ini</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'History' && (
          <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" /> Rekor Pencapaian
                </h3>
                <p className="text-sm text-slate-500 mt-1">Pencapaian tertinggi dan terendah berdasarkan periode</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {[
                { title: 'Harian', data: historyExtremes.daily, iconColor: "text-blue-500" },
                { title: 'Mingguan', data: historyExtremes.weekly, iconColor: "text-indigo-500" },
                { title: 'Bulanan', data: historyExtremes.monthly, iconColor: "text-amber-500" },
              ].map((section) => (
                <div key={section.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6 tracking-tight flex items-center gap-2">
                    <History className={cn("w-5 h-5", section.iconColor)} />
                    Pencapaian {section.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Highest */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-emerald-500/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 group-hover:bg-emerald-500/20 transition-all duration-500" />
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600">
                              <TrendingUp className="w-3.5 h-3.5" />
                            </span>
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Tertinggi</p>
                          </div>
                          <p className="text-base text-slate-600 font-medium">{section.data?.highest?.label || '-'}</p>
                        </div>
                        <div className="flex items-end flex-col relative z-10">
                          <p className="text-3xl font-mono font-bold text-slate-900 drop-shadow-sm">
                            {section.data?.highest ? (section.data.highest.yield * 100).toFixed(1) + '%' : '-'}
                          </p>
                          <p className="text-xs uppercase text-slate-500 font-bold tracking-widest mt-1">Rendemen Utama</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 relative z-10">
                         <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Input</p>
                            <p className="font-mono text-sm text-slate-600">{section.data?.highest?.input?.toFixed(1) || '-'} <span className="text-xs text-slate-400">m³</span></p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Output Utama</p>
                            <p className="font-mono text-sm text-emerald-600">{section.data?.highest?.utama?.toFixed(1) || '-'} <span className="text-xs text-emerald-600/50">m³</span></p>
                         </div>
                      </div>
                    </div>
                    
                    {/* Lowest */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-rose-500/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 group-hover:bg-rose-500/20 transition-all duration-500" />
                      <div className="flex justify-between items-start mb-6">
                        <div>
                           <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-600">
                              <TrendingUp className="w-3.5 h-3.5 transform rotate-180" />
                            </span>
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Terendah</p>
                          </div>
                          <p className="text-base text-slate-600 font-medium">{section.data?.lowest?.label || '-'}</p>
                        </div>
                        <div className="flex items-end flex-col relative z-10">
                          <p className="text-3xl font-mono font-bold text-slate-900 drop-shadow-sm">
                            {section.data?.lowest ? (section.data.lowest.yield * 100).toFixed(1) + '%' : '-'}
                          </p>
                          <p className="text-xs uppercase text-slate-500 font-bold tracking-widest mt-1">Rendemen Utama</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 relative z-10">
                         <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Input</p>
                            <p className="font-mono text-sm text-slate-600">{section.data?.lowest?.input?.toFixed(1) || '-'} <span className="text-xs text-slate-400">m³</span></p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Output Utama</p>
                            <p className="font-mono text-sm text-emerald-600">{section.data?.lowest?.utama?.toFixed(1) || '-'} <span className="text-xs text-emerald-600/50">m³</span></p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Downtime' && (
          <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" /> Log Downtime
                </h3>
                <p className="text-sm text-slate-500 mt-1">Rekap data downtime harian, mingguan, bulanan per mesin</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden p-1 shadow-sm w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      setDowntimePeriodType('daily');
                      setDowntimePeriodValue(periods.dates[0] || '');
                    }}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${downtimePeriodType === 'daily' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Harian
                  </button>
                  <button 
                    onClick={() => {
                      setDowntimePeriodType('weekly');
                      setDowntimePeriodValue(periods.weeks[0] || 0);
                    }}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${downtimePeriodType === 'weekly' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Mingguan
                  </button>
                  <button 
                    onClick={() => {
                      setDowntimePeriodType('monthly');
                      setDowntimePeriodValue(periods.months[0] || 0);
                    }}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${downtimePeriodType === 'monthly' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Bulanan
                  </button>
                </div>
                
                <select 
                  className="bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2 outline-none appearance-none shadow-sm cursor-pointer min-w-[140px] w-full sm:w-auto"
                  value={downtimePeriodValue}
                  onChange={(e) => setDowntimePeriodValue(downtimePeriodType === 'daily' ? e.target.value : parseInt(e.target.value))}
                >
                  {downtimePeriodType === 'monthly' && periods.months.map(m => {
                    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                    return <option key={m} value={m}>{monthNames[m - 1]}</option>;
                  })}
                  {downtimePeriodType === 'weekly' && periods.weeks.map(w => (
                    <option key={w} value={w}>Minggu {w}</option>
                  ))}
                  {downtimePeriodType === 'daily' && periods.dates.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {['Bs 1', 'Bs 2', 'Bs 3', 'Bs 4', 'Bs 5', 'Bs 6', 'Bs 7', 'Bs 8', 'Poni A', 'Poni B', 'Breakdown'].map(machineName => {
                const availableKey = Object.keys(filteredDowntimeData).find(k => k.replace(/\s+/g, '').toLowerCase() === machineName.replace(/\s+/g, '').toLowerCase());
                
                const rows = availableKey ? filteredDowntimeData[availableKey] : [];
                const hasDowntime = rows.length > 0;
                
                return (
                  <div key={machineName} className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-slate-900 tracking-tight">{machineName.replace('Bs ', 'Bs')}</h4>
                      {hasDowntime ? (
                        <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 text-xs font-bold uppercase tracking-wider rounded border border-rose-500/20">
                          {rows.length} {rows.length === 1 ? 'Event' : 'Events'}
                        </span>
                      ) : (
                         <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wider rounded border border-emerald-500/20 flex items-center gap-1">
                           <CheckCircle className="w-3 h-3" /> Area Clear
                         </span>
                      )}
                    </div>
                    
                    {hasDowntime ? (
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                        {rows.map((row, idx) => {
                          const downtimeParts = row.downtime.split(/[;,]/).filter(part => part.replace(/,/g, '').trim().length > 0);
                          
                          let rawTotalMins = 0;
                          const matches = row.downtime.match(/=(\d+)mnt/g);
                          if (matches) {
                            rawTotalMins = matches.reduce((acc, match) => {
                              const m = match.match(/\d+/);
                              return acc + (m ? parseInt(m[0]) : 0);
                            }, 0);
                          }
                          
                          return (
                            <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 flex justify-between items-center">
                                <span>{row.tanggal}</span>
                                {rawTotalMins > 0 && (
                                  <span className="text-rose-600/80 font-medium lowercase px-1.5 py-0.5 bg-rose-500/10 rounded">
                                    {rawTotalMins} mnt
                                  </span>
                                )}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {downtimeParts.map((down, downIdx) => (
                                  <span key={downIdx} className="bg-slate-100 border border-slate-300 px-2 py-1 rounded text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                    <Clock className="w-2.5 h-2.5 text-rose-500/50 cursor-pointer" />
                                    {down.replace('=', ': ').trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                        <CheckCircle className="w-8 h-8 text-emerald-500/20 mb-3" />
                        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Operasi Berjalan Normal</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
