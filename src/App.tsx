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
  Package,
  Home,
  BarChart2,
  ClipboardCheck,
  Menu,
  ChevronRight,
  Search,
  Bell,
  ArrowUpRight,
  Calendar,
  Zap,
  ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

// Colors based on the blue theme in the image
const THEME_COLORS = {
  primary: '#2563eb',
  secondary: '#3b82f6',
  accent: '#60a5fa',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  muted: '#64748b'
};

const DONUT_COLORS = [
  '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', 
  '#bfdbfe', '#22c55e', '#10b981', '#f59e0b', 
  '#f97316', '#ef4444', '#8b5cf6', '#d946ef'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState<ProductionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [rankingPeriodType, setRankingPeriodType] = useState<'weekly' | 'monthly'>('monthly');
  const [rankingPeriodValue, setRankingPeriodValue] = useState<number>(0);
  
  useEffect(() => {
    fetchProductionData().then(fetchedData => {
      setData(fetchedData);
      setIsLoading(false);
      
      const periods = getAvailablePeriods(fetchedData);
      if (periods.months.length > 0) {
        setRankingPeriodValue(periods.months[0]);
      }
    });
  }, []);

  const stats = useMemo(() => getSummaryStats(data), [data]);
  const machinePerformance = useMemo(() => getPerformanceByMachine(data), [data]);

  const topMachineName = machinePerformance.length > 0 ? machinePerformance[0].name : 'BS 1';
  const progressData = useMemo(() => 
    data.filter(d => normalizeMachineName(d.mesin || '') === topMachineName && d.input > 0).slice(-15),
    [data, topMachineName]
  );
  
  const rankings = useMemo(() => getMachineRankings(data, rankingPeriodType, rankingPeriodValue), [data, rankingPeriodType, rankingPeriodValue]);
  const todayStats = useMemo(() => getTodayMachineStats(data), [data]);

  const filteredDowntimeData = useMemo(() => {
    return data.filter(d => 
      d.downtime && 
      d.downtime.replace(/,/g, '').trim().length > 0 &&
      d.downtime.toLowerCase().trim() !== 'libur'
    ).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 50);
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full" />
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
          </div>
          <div className="text-center">
            <p className="text-slate-800 font-bold text-lg">Sawmill Buana</p>
            <p className="text-slate-400 text-sm font-medium">Memuat data operasional...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-32"
    >
      <header className="flex justify-between items-center pt-6">
        <div>
          <h1 className="text-[26px] font-extrabold text-slate-800 leading-tight">Sawmill Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[13px] font-bold text-blue-600">{stats.totalMachines} Mesin Aktif</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full z-10" />
          <button className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all">
            <Bell className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      <section className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-extrabold text-slate-800 text-[15px]">Ringkasan Hari Ini</h2>
          <span className="text-[11px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg">13 Mei 2026</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatMiniCard 
            title="Total Mesin" 
            value={stats.totalMachines.toString()} 
            subtitle="AKTIF" 
            icon={<Zap className="w-4 h-4 text-blue-500" />}
            color="bg-blue-50"
          />
          <StatMiniCard 
            title="Rata-rata Yield" 
            value={`${(stats.avgYield * 100).toFixed(1)}%`} 
            subtitle="EFISIENSI" 
            icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
            color="bg-emerald-50"
          />
          <StatMiniCard 
            title="Total Output" 
            value={`${stats.totalUtama.toLocaleString()}`} 
            unit="m³"
            subtitle="UTAMA" 
            icon={<Package className="w-4 h-4 text-amber-500" />}
            color="bg-amber-50"
          />
          <StatMiniCard 
            title="Total Input" 
            value={`${stats.totalInput.toLocaleString()}`} 
            unit="m³"
            subtitle="RAW MATERIAL" 
            icon={<BarChart3 className="w-4 h-4 text-indigo-500" />}
            color="bg-indigo-50"
          />
          <StatMiniCard 
            title="Total Output" 
            value={`${stats.totalAllOutput.toLocaleString()}`} 
            unit="m³"
            subtitle="SELURUH OUTPUT" 
            icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
            color="bg-blue-100"
          />
          <StatMiniCard 
            title="Total Downtime" 
            value={`${stats.totalDowntimeMinutes}`} 
            unit="mnt"
            subtitle="AKUMULASI" 
            icon={<Clock className="w-4 h-4 text-rose-500" />}
            color="bg-rose-50"
          />
        </div>
      </section>

      <section className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
        <h2 className="font-extrabold text-slate-800 text-[15px] mb-6 flex items-center justify-between">
          Top Machine Output <span className="text-[10px] font-bold text-slate-400">(m³)</span>
        </h2>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={machinePerformance.slice(0, 8)}
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="output"
                nameKey="name"
                cx="50%"
                cy="50%"
                stroke="none"
              >
                {machinePerformance.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -4px rgba(0,0,0,0.1)', padding: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                iconType="circle"
                formatter={(value, entry: any) => (
                  <span className="text-[11px] text-slate-600 font-bold ml-1">
                    {value} <span className="text-slate-400 font-medium ml-1">{entry.payload.output} m³</span>
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </motion.div>
  );

  const renderAnalytics = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-32"
    >
      <header className="flex justify-between items-center pt-6">
        <h1 className="text-[26px] font-extrabold text-slate-800">Analytics</h1>
        <button className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all text-slate-600">
          <Calendar className="w-5 h-5" />
        </button>
      </header>

      <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-[15px] text-slate-800">Daily Performance</h3>
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500">Harian</span>
          </div>
        </div>
        <div className="h-[200px] w-full relative">
          <div className="absolute top-2 right-10 bg-blue-600 text-white p-2 rounded-xl text-[10px] font-bold shadow-lg shadow-blue-200 z-10 flex items-center gap-1">
            98 m³ <ArrowUpRight className="w-3 h-3" />
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progressData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="tanggal" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }}
                tickFormatter={(v) => v.split('-').slice(2).join('/')}
              />
              <YAxis hide />
              <Area 
                type="monotone" 
                dataKey="yield_primary" 
                stroke="#2563eb" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorBlue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-blue-50/50 rounded-3xl p-4 border border-blue-100/50">
            <p className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest mb-1">Rata-rata Efisiensi</p>
            <p className="text-xl font-black text-slate-800 tracking-tight">33.8%</p>
          </div>
          <div className="bg-indigo-50/50 rounded-3xl p-4 border border-indigo-100/50">
            <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest mb-1">Total Output</p>
            <p className="text-xl font-black text-slate-800 tracking-tight">2.537,53 m³</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-[15px] text-slate-800">Weekly Performance</h3>
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500">Mingguan</span>
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progressData.slice(-8)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="tanggal" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }}
                tickFormatter={(v, i) => `W${i+1}`}
              />
              <YAxis hide />
              <Bar dataKey="utama" fill="#3b82f6" radius={[6,6,0,0]} barSize={22}>
                 {progressData.slice(-8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#93c5fd'} />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-emerald-50/50 rounded-3xl p-4 border border-emerald-100/50">
            <p className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest mb-1">Avg Efficiency</p>
            <p className="text-xl font-black text-slate-800 tracking-tight">34.5%</p>
          </div>
          <div className="bg-blue-50/50 rounded-3xl p-4 border border-blue-100/50">
            <p className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest mb-1">Total Output</p>
            <p className="text-xl font-black text-slate-800 tracking-tight">2.537,57 m³</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderRanking = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-32"
    >
      <header className="flex justify-between items-center pt-6">
        <h1 className="text-[26px] font-extrabold text-slate-800">Ranking Mesin</h1>
        <button className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all text-slate-600">
          <Bell className="w-5 h-5" />
        </button>
      </header>

      <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
        <div className="flex flex-col gap-1 mb-6">
          <h3 className="font-extrabold text-[15px] text-slate-800">Leaderboard Mesin</h3>
          <p className="text-[11px] text-slate-400 font-medium">Peringkat efisiensi dan output per periode</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl mb-6">
          <button className="flex-1 py-1.5 text-[11px] font-bold text-slate-500">Bulanan</button>
          <button className="flex-1 py-1.5 text-[11px] font-bold text-slate-500">Mingguan</button>
          <button className="flex-1 py-1.5 text-[11px] bg-white rounded-xl shadow-sm text-blue-600 font-bold border border-slate-100">Mei</button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center px-4 py-2 text-[9px] font-extrabold text-slate-300 uppercase tracking-[0.15em]">
            <span className="w-10">#</span>
            <span className="flex-1">MESIN</span>
            <span className="w-20 text-right">YIELD</span>
            <span className="w-20 text-right">OUTPUT (m³)</span>
          </div>
          {rankings.map((machine, index) => (
            <div key={machine.name} className="flex items-center px-4 py-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-10 flex justify-start">
                <span className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-full text-xs font-black",
                  index === 0 ? "bg-amber-100 text-amber-600 ring-2 ring-amber-50" :
                  index === 1 ? "bg-slate-100 text-slate-500 ring-2 ring-slate-50" :
                  index === 2 ? "bg-orange-100 text-orange-600 ring-2 ring-orange-50" :
                  "text-slate-400 font-bold"
                )}>
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-800 text-[13px] tracking-tight">{machine.name}</p>
              </div>
              <div className="w-20 text-right">
                <span className="text-emerald-500 font-black text-[13px]">{(machine.avgYield * 100).toFixed(1)}%</span>
              </div>
              <div className="w-20 text-right">
                <span className="text-slate-700 font-extrabold text-[13px]">{machine.totalOutput.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderUpdate = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-32"
    >
      <header className="flex justify-between items-center pt-6">
        <h1 className="text-[26px] font-extrabold text-slate-800 leading-tight">Update Today</h1>
        <button className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all text-slate-600">
          <Bell className="w-5 h-5" />
        </button>
      </header>

      <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-[15px] text-slate-800">Update Performa Hari Ini</h3>
          <span className="text-[11px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg">13 Mei 2026</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {todayStats.stats.slice(0, 8).map((machine, idx) => (
            <div key={machine.mesin} className="bg-white border border-slate-100 rounded-[28px] p-4 shadow-sm relative group hover:border-blue-200 transition-all">
               <div className="flex items-center gap-3 mb-5">
                 <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-100">
                   {idx + 1}
                 </div>
                 <div className="min-w-0">
                   <h4 className="font-black text-slate-800 text-[13px] tracking-tight truncate">{machine.mesin}</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{machine.line}</p>
                 </div>
                 <div className="absolute top-2 right-2">
                   {machine.yield_total < 0.35 && (
                     <motion.span 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black rounded-lg ring-1 ring-rose-100 shadow-sm"
                     >
                        UNDER
                     </motion.span>
                   )}
                 </div>
               </div>
               <div className="space-y-2.5">
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Output</span>
                   <span className="text-[11px] font-black text-slate-700 tracking-tight">{machine.total.toFixed(1)} m³</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Yield</span>
                   <span className={cn(
                     "text-[11px] font-black tracking-tight",
                     machine.yield_total >= 0.4 ? "text-emerald-500" : "text-amber-500"
                   )}>{(machine.yield_total * 100).toFixed(1)}%</span>
                 </div>
               </div>
               <div className="mt-4 pt-4 border-t border-slate-50">
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(machine.yield_total * 200, 100)}%` }}
                    className="h-full bg-blue-500 rounded-full" 
                   />
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderDowntime = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-32"
    >
      <header className="flex justify-between items-center pt-6">
        <h1 className="text-[26px] font-extrabold text-slate-800">Downtime</h1>
        <button className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all text-slate-600">
          <Bell className="w-5 h-5" />
        </button>
      </header>

      <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-[15px] text-slate-800">Log Downtime</h3>
          <span className="text-[11px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg">13 Mei 2026</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl mb-6">
          <button className="flex-1 py-1.5 text-[11px] bg-white rounded-xl shadow-sm text-blue-600 font-bold border border-slate-100">Harian</button>
          <button className="flex-1 py-1.5 text-[11px] font-bold text-slate-500">Mingguan</button>
          <button className="flex-1 py-1.5 text-[11px] font-bold text-slate-500">Bulanan</button>
        </div>

        <div className="space-y-4">
          {filteredDowntimeData.slice(0, 10).map((item, idx) => {
            const parts = item.downtime.split(/[;,]/).filter(p => p.trim().length > 0);
            return (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border-b border-slate-100 pb-5 last:border-none last:pb-0"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm tracking-tight">{item.mesin}</h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold tracking-tight uppercase">{item.line}</span>
                        <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] text-blue-500 font-black">09:15</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black rounded-lg ring-1 ring-rose-100 uppercase tracking-tighter">1 EVENT</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 ml-12">
                  {parts.map((p, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                       <span className="text-[11px] text-slate-500 font-bold tracking-tight bg-slate-50 p-1 px-2 rounded-lg">
                        {p.replace('=', ': ').trim()}
                       </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
          <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95 mt-4">
            Lihat Semua Log
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-100/50 font-sans text-slate-900 flex justify-center selection:bg-blue-500/10">
      {/* Container - Vibe mobile dashboard but scales for desktop */}
      <div className="w-full max-w-lg bg-[#f8fafc] min-h-screen relative overflow-hidden flex flex-col border-x border-slate-100/50">
        
        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto px-6 custom-scrollbar pb-10">
          <AnimatePresence mode="wait">
            {activeTab === 'Overview' && renderOverview()}
            {activeTab === 'Analytics' && renderAnalytics()}
            {activeTab === 'Ranking' && renderRanking()}
            {activeTab === 'Update' && renderUpdate()}
            {activeTab === 'Menu' && renderDowntime()}
          </AnimatePresence>
        </main>

        {/* Bottom Tab Bar Container */}
        <div className="sticky bottom-0 left-0 right-0 w-full px-6 py-6 pb-10 pointer-events-none">
          <nav className="w-full bg-white/90 backdrop-blur-xl border border-slate-100 px-4 py-3 pb-4 flex justify-between items-center pointer-events-auto rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
            <NavIcon 
              active={activeTab === 'Overview'} 
              onClick={() => setActiveTab('Overview')} 
              icon={<Home className="w-5 h-5" />} 
              label="Overview" 
            />
            <NavIcon 
              active={activeTab === 'Analytics'} 
              onClick={() => setActiveTab('Analytics')} 
              icon={<BarChart2 className="w-5 h-5" />} 
              label="Analytics" 
            />
            <NavIcon 
              active={activeTab === 'Ranking'} 
              onClick={() => setActiveTab('Ranking')} 
              icon={<Trophy className="w-5 h-5" />} 
              label="Ranking" 
            />
            <NavIcon 
              active={activeTab === 'Update'} 
              onClick={() => setActiveTab('Update')} 
              icon={<ClipboardCheck className="w-5 h-5" />} 
              label="Update" 
            />
            <NavIcon 
              active={activeTab === 'Menu'} 
              onClick={() => setActiveTab('Menu')} 
              icon={<Menu className="w-5 h-5" />} 
              label="Menu" 
            />
          </nav>
        </div>
      </div>
    </div>
  );
}

function StatMiniCard({ title, value, unit, subtitle, icon, color }: { title: string, value: string, unit?: string, subtitle: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white border border-slate-50 rounded-[28px] p-4 shadow-sm flex flex-col justify-between hover:border-blue-100 transition-all hover:shadow-md active:scale-[0.98]">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-2xl shadow-sm", color)}>
          {icon}
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-[22px] font-black text-slate-800 tracking-tighter leading-none">{value}</span>
          {unit && <span className="text-[10px] font-black text-slate-400 lowercase">{unit}</span>}
        </div>
        <div className="mt-1.5 flex flex-col items-start gap-0.5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{title.split(' ')[0]}</p>
          <p className="text-[8px] font-extrabold text-blue-500/80 uppercase tracking-tight leading-none truncate max-w-full">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function NavIcon({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 transition-all flex-1 py-1",
        active ? "text-blue-600" : "text-slate-400"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
        active ? "bg-blue-600 text-white shadow-lg shadow-blue-200 -translate-y-1.5" : "bg-transparent text-slate-400"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[10px] font-black tracking-tighter transition-all duration-300",
        active ? "opacity-100 -translate-y-1" : "opacity-0 translate-y-2 pointer-events-none"
      )}>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-glow"
          className="absolute -bottom-2 w-8 h-1.5 bg-blue-600 rounded-full blur-[2px] opacity-20" 
        />
      )}
    </button>
  );
}
