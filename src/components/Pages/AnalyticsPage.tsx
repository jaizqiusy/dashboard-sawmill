import React from 'react';
import { BarChart3, LineChart as LineIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getPerformanceByTimeframe } from '../../services/dataService';

export function AnalyticsPage({ data }) {
  const timeframes = ['daily', 'weekly', 'monthly'] as const;

  return (
    <div className="p-5 space-y-6">
      <div className="bg-[#1e293b] rounded-2xl p-5 border border-white/10 shadow-lg">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
          <BarChart3 className="w-5 h-5 text-sky-400" />
          Analytics
        </h2>
        <p className="text-[11px] text-slate-300 mt-1 uppercase tracking-widest font-bold">Trend & Performance Analysis</p>
      </div>

      <div className="space-y-6">
        {timeframes.map((type) => {
          const timeframeData = getPerformanceByTimeframe(data, type);
          if (timeframeData.length === 0) return null;

          return (
            <div key={type} className="bg-[#1e293b] rounded-2xl p-5 border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white tracking-wide capitalize flex items-center gap-2">
                  <LineIcon className="w-4 h-4 text-indigo-400" />
                  {type} Trend
                </h3>
              </div>
              
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeframeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#cbd5e1', fontWeight: 600 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#cbd5e1', fontWeight: 600 }} 
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Bar dataKey="utama" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Output Utama" />
                    <Bar dataKey="input" fill="#312e81" radius={[4, 4, 0, 0]} name="Input" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-[#0f172a] rounded-xl p-3 border border-white/10">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Avg Efficiency</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {(timeframeData.reduce((acc, curr) => acc + curr.yield, 0) / timeframeData.length * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-[#0f172a] rounded-xl p-3 border border-white/10 text-right">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Output</p>
                  <p className="text-lg font-bold text-sky-400">
                    {(timeframeData.reduce((acc, curr) => acc + curr.utama, 0)/1000).toFixed(1)}k <span className="text-[10px] text-sky-500/50">m³</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
