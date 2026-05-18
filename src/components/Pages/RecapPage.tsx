import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Trees, 
  Package, 
  TrendingUp, 
  Globe, 
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '../../lib/utils';

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#64748b'];

export function RecapPage({ data, supplierData }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Aggregate KPI for Supplier view
  const supplierKPI = useMemo(() => {
    let totalInput = 0;
    let totalOutput = 0;
    let totalExport = 0;
    let totalLokal = 0;

    supplierData.forEach(row => {
      totalInput += row.input;
      totalOutput += row.total;
      totalExport += row.export;
      totalLokal += row.totalLokal;
    });

    const avgYield = totalInput > 0 ? ((totalOutput / totalInput) * 100).toFixed(2) : 0;
    const exportRatio = totalOutput > 0 ? ((totalExport / totalOutput) * 100).toFixed(1) : 0;

    return {
      totalInput: totalInput.toFixed(2),
      totalOutput: totalOutput.toFixed(2),
      avgYield,
      exportRatio,
      pieData: [
        { name: 'Export', value: Number(totalExport.toFixed(2)) },
        { name: 'Lokal Super', value: Number(supplierData.reduce((acc, curr) => acc + curr.lokalSuper, 0).toFixed(2)) },
        { name: 'Lokal Biasa', value: Number(supplierData.reduce((acc, curr) => acc + curr.lokal, 0).toFixed(2)) }
      ]
    };
  }, [supplierData]);

  const filteredSupplierData = supplierData.filter(item => 
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.kode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans text-slate-800 pb-20">
      
      {/* Header */}
      <div className="mb-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
        <h2 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2 relative z-10">
          <FileSpreadsheet className="text-emerald-600 w-6 h-6" />
          Rekapitulasi Log Supplier
        </h2>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold relative z-10">Data Histori & Performa Supplier</p>
      </div>

      {/* KPI Cards Supplier */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard title="Total Input Log" value={supplierKPI.totalInput} icon={<Trees size={20} className="text-emerald-600" />} color="bg-emerald-50" />
        <KpiCard title="Total Output" value={supplierKPI.totalOutput} icon={<Package size={20} className="text-blue-600" />} color="bg-blue-50" />
        <KpiCard title="Rata-rata Yield" value={`${supplierKPI.avgYield}%`} icon={<TrendingUp size={20} className="text-amber-600" />} color="bg-amber-50" />
        <KpiCard title="Porsi Ekspor" value={`${supplierKPI.exportRatio}%`} icon={<Globe size={20} className="text-indigo-600" />} color="bg-indigo-50" />
      </div>

      {/* Charts Section Supplier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider mb-4 text-slate-700 flex items-center gap-2">
            <TrendingUp size={16} /> Input vs Output per Supplier
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="kode" tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} axisLine={{stroke: '#f1f5f9'}} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '10px', fontSize: '10px'}}/>
                <Bar dataKey="input" name="Input Log" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Total Output" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider mb-4 text-slate-700 flex items-center gap-2">
            <Package size={16} /> Distribusi Produk Supplier
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={supplierKPI.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {PIE_COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `${value} M³`} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Supplier Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">Detail Log Supplier</h2>
          <FilterInput value={searchTerm} onChange={setSearchTerm} placeholder="Cari Supplier..." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 uppercase tracking-widest font-black border-b border-slate-100">
                <th className="p-3">Kode</th>
                <th className="p-3">Supplier</th>
                <th className="p-3 text-right">Input</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Yield</th>
              </tr>
            </thead>
            <tbody>
              {filteredSupplierData.map((row, index) => (
                <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{row.kode}</td>
                  <td className="p-3 text-slate-600 truncate max-w-[150px]">{row.supplier}</td>
                  <td className="p-3 text-right font-mono">{row.input.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-600">{row.total.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-black",
                      row.yieldTotal > 60 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {row.yieldTotal.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterInput({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:w-64">
      <input 
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-all"
      />
      <Search className="absolute left-3 top-2 text-slate-400" size={14} />
    </div>
  );
}

function KpiCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shadow-sm shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{title}</p>
        <h3 className="text-base font-black text-slate-900 mt-0.5 leading-none">{value}</h3>
      </div>
    </div>
  );
}

