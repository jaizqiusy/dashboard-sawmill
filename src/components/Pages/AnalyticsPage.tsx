import React from 'react';
import { BarChart3, LineChart as LineIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getPerformanceByTimeframe } from '../../services/dataService';

export function AnalyticsPage({ data }) {
  const timeframes = ['daily', 'weekly', 'monthly', 'quarterly'] as const;

  return (
    <div className="p-5 space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
          <BarChart3 className="w-5 h-5 text-sky-500" />
          Analytics
        </h2>
        <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Trend & Performance Analysis</p>
      </div>

      <div className="space-y-6">
        {timeframes.map((type) => {
          const timeframeData = getPerformanceByTimeframe(data, type);
          if (timeframeData.length === 0) return null;

          return (
            <div key={type} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-800 tracking-wide capitalize flex items-center gap-2">
                  <LineIcon className="w-4 h-4 text-indigo-500" />
                  {type} Trend
                </h3>
              </div>
              
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeframeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} 
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#1e293b' }}
                      itemStyle={{ color: '#1e293b' }}
                    />
                    <Bar dataKey="utama" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Output Utama" />
                    <Bar dataKey="input" fill="#c7d2fe" radius={[4, 4, 0, 0]} name="Input" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Rendemen Utama</p>
                  <p className="text-lg font-bold text-emerald-500">
                    {(() => {
                      const totalInput = timeframeData.reduce((acc, curr) => acc + curr.input, 0);
                      const totalUtama = timeframeData.reduce((acc, curr) => acc + curr.utama, 0);
                      return totalInput > 0 ? ((totalUtama / totalInput) * 100).toFixed(1) : '0.0';
                    })()}%
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-right">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Output Utama</p>
                  <p className="text-lg font-bold text-sky-500">
                    {(() => {
                      const totalUtama = timeframeData.reduce((acc, curr) => acc + curr.utama, 0);
                      return totalUtama >= 1000 
                        ? `${(totalUtama / 1000).toFixed(1)}k` 
                        : totalUtama.toLocaleString('id-ID', { maximumFractionDigits: 1 });
                    })()} <span className="text-[10px] text-sky-400">m³</span>
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
