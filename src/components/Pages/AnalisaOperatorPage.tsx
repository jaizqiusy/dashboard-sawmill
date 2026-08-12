import React, { useState, useMemo, useEffect } from 'react';
import { ProductionData } from '../../types';
import { normalizeMachineName } from '../../services/dataService';
import { ChevronDown, ChevronRight, User } from 'lucide-react';

interface AnalisaOperatorPageProps {
  data: ProductionData[];
}

interface ProcessedData {
  tanggal: string;
  mesin: string;
  yieldUtama: number;
  yieldTotal: number;
  catatan: string;
  akumulasiUtama: number;
  akumulasiTotal: number;
}

export function AnalisaOperatorPage({ data }: AnalisaOperatorPageProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [selectedMachine, setSelectedMachine] = useState<string>('all');

  const months = useMemo(() => {
    const m = new Set<number>();
    data.forEach(d => {
      if (d.month && !isNaN(d.month)) m.add(d.month);
    });
    return Array.from(m).sort((a, b) => b - a); // descending
  }, [data]);

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const { processedData, availableDates, availableMachines } = useMemo(() => {
    const monthData = data.filter(d => {
      if (d.month !== selectedMonth || !d.mesin || d.input <= 0) return false;
      const name = normalizeMachineName(d.mesin);
      return name.match(/^BS [1-8]$/);
    });
    
    // Sort by date then machine
    const sortedData = [...monthData].sort((a, b) => {
      const dateCmp = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      if (dateCmp !== 0) return dateCmp;
      const numA = parseInt(a.mesin.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.mesin.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    const accumulators: Record<string, { sumUtama: number; sumTotal: number; sumInput: number }> = {};

    const processed: ProcessedData[] = sortedData.map(row => {
      const mesin = normalizeMachineName(row.mesin);
      if (!accumulators[mesin]) {
        accumulators[mesin] = { sumUtama: 0, sumTotal: 0, sumInput: 0 };
      }
      
      accumulators[mesin].sumInput += row.input;
      accumulators[mesin].sumUtama += row.utama;
      accumulators[mesin].sumTotal += row.total;

      return {
        tanggal: row.tanggal,
        mesin: mesin,
        yieldUtama: row.input > 0 ? (row.utama / row.input) : 0,
        yieldTotal: row.input > 0 ? (row.total / row.input) : 0,
        catatan: row.downtime || '',
        akumulasiUtama: accumulators[mesin].sumInput > 0 ? (accumulators[mesin].sumUtama / accumulators[mesin].sumInput) : 0,
        akumulasiTotal: accumulators[mesin].sumInput > 0 ? (accumulators[mesin].sumTotal / accumulators[mesin].sumInput) : 0,
      };
    });
    
    const dates = Array.from(new Set(processed.map(r => r.tanggal))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const machines = Array.from(new Set(processed.map(r => r.mesin))).sort((a,b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    return { processedData: processed, availableDates: dates, availableMachines: machines };
  }, [data, selectedMonth]);

  useEffect(() => {
    setSelectedDate('all');
    setSelectedMachine('all');
  }, [selectedMonth]);

  const filteredData = useMemo(() => {
    return processedData.filter(row => {
      if (selectedDate !== 'all' && row.tanggal !== selectedDate) return false;
      if (selectedMachine !== 'all' && row.mesin !== selectedMachine) return false;
      return true;
    });
  }, [processedData, selectedDate, selectedMachine]);

  const formatPercent = (val: number) => (val * 100).toFixed(2) + '%';

  return (
    <div className="min-h-full p-5 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-100/20 border border-indigo-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <User className="w-8 h-8 text-indigo-600" />
              Analisa Operator
            </h1>
            
            <div className="flex flex-row gap-4 mt-1">
              <div className="flex flex-col gap-1 w-full sm:w-48">
                <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="all">Semua Tanggal</option>
                  {availableDates.map(d => {
                    const fd = new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ /g, '-');
                    return <option key={d} value={d}>{fd}</option>
                  })}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-48">
                <label className="text-xs font-semibold text-slate-500 uppercase">Mesin</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="all">Semua Mesin</option>
                  {availableMachines.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            {months.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all shadow-sm ${
                  selectedMonth === m
                    ? 'bg-indigo-600 text-white shadow-indigo-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {monthNames[m - 1]}
              </button>
            ))}
          </div>
        </div>



        {/* Data Table */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/20 border border-indigo-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Mesin</th>
                  <th className="px-6 py-4 font-bold tracking-wider">% Utama</th>
                  <th className="px-6 py-4 font-bold tracking-wider">% Total</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Catatan</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Akumulasi % Utama</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Akumulasi % Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? (
                  filteredData.map((row, i) => {
                    const formatDate = new Date(row.tanggal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ /g, '-');
                    return (
                      <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-slate-700 whitespace-nowrap">{formatDate}</td>
                        <td className="px-6 py-3 font-bold text-slate-800">{row.mesin}</td>
                        <td className={`px-6 py-3 font-medium ${row.yieldUtama > 0 && row.yieldUtama < 0.28 ? 'bg-red-100 text-red-800' : 'text-slate-700'}`}>
                          {formatPercent(row.yieldUtama)}
                        </td>
                        <td className={`px-6 py-3 font-medium ${row.yieldTotal > 0 && row.yieldTotal <= 0.64 ? 'bg-yellow-100 text-yellow-800' : 'text-slate-700'}`}>
                          {formatPercent(row.yieldTotal)}
                        </td>
                        <td className="px-6 py-3 text-slate-600 max-w-xs truncate" title={row.catatan}>{row.catatan}</td>
                        <td className="px-6 py-3 font-medium text-indigo-700">{formatPercent(row.akumulasiUtama)}</td>
                        <td className="px-6 py-3 font-medium text-teal-700">{formatPercent(row.akumulasiTotal)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Tidak ada data untuk bulan ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
