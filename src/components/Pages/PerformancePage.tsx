import React, { useMemo, useState } from 'react';
import { ProductionData } from '../../types';
import { Activity, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { normalizeMachineName } from '../../services/dataService';

interface PerformancePageProps {
  data: ProductionData[];
}

export function PerformancePage({ data }: PerformancePageProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);

  // Filter valid data
  const bsData = useMemo(() => {
    return data.filter(d => 
      d.mesin && 
      d.input > 0 && 
      d.mesin.toLowerCase().trim().startsWith('bs')
    );
  }, [data]);

  // Extract available months
  const availableMonths = useMemo(() => {
    const months = new Set<number>();
    bsData.forEach(d => {
      if (d.month > 0) months.add(d.month);
    });
    return Array.from(months).sort((a, b) => b - a);
  }, [bsData]);

  // Extract available weeks based on selected month
  const availableWeeksForMonth = useMemo(() => {
    if (!selectedMonth) return [];
    const monthData = bsData.filter(d => d.month === selectedMonth);
    const weeks = new Set<number>();
    monthData.forEach(d => {
      if (d.week > 0) weeks.add(d.week);
    });
    return Array.from(weeks).sort((a, b) => a - b);
  }, [bsData, selectedMonth]);

  // Set default month to latest
  React.useEffect(() => {
    if (availableMonths.length > 0 && selectedMonth === 0) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Reset selected week when month changes
  React.useEffect(() => {
    setSelectedWeek(0);
  }, [selectedMonth]);

  // Calculate analysis per machine
  const performanceData = useMemo(() => {
    if (!selectedMonth) return { analysis: [], weeks: [] };

    const monthData = bsData.filter(d => d.month === selectedMonth);
    const machines = ['BS 1', 'BS 2', 'BS 3', 'BS 4', 'BS 5', 'BS 6', 'BS 7', 'BS 8'];
    const allWeeks = Array.from(new Set<number>(monthData.map(d => d.week))).filter(w => w > 0).sort((a, b) => a - b);

    const analysis = machines.map(mesin => {
      // Data for the specific selected period (can be one week or all weeks)
      const periodData = monthData.filter(d => normalizeMachineName(d.mesin) === mesin && (selectedWeek > 0 ? d.week === selectedWeek : true));
      
      // Data for ALL weeks in this month (used for the Overall Averages and the individual week columns)
      const allPeriodData = monthData.filter(d => normalizeMachineName(d.mesin) === mesin);

      const periodInput = periodData.reduce((sum, item) => sum + item.input, 0);
      const periodUtama = periodData.reduce((sum, item) => sum + item.utama, 0);
      const periodTurunan = periodData.reduce((sum, item) => sum + item.turunan, 0);
      const periodOutput = periodData.reduce((sum, item) => sum + item.total, 0);
      
      const periodYieldPrimary = periodInput > 0 ? (periodUtama / periodInput) * 100 : 0;
      const periodYieldSecondary = periodInput > 0 ? (periodTurunan / periodInput) * 100 : 0;
      const periodYieldTotal = periodInput > 0 ? (periodOutput / periodInput) * 100 : 0;

      // Overall averages (across all weeks in the month)
      const totalMonthsInput = allPeriodData.reduce((sum, item) => sum + item.input, 0);
      const totalMonthsUtama = allPeriodData.reduce((sum, item) => sum + item.utama, 0);
      const totalMonthsOutput = allPeriodData.reduce((sum, item) => sum + item.total, 0);
      
      // Average per week (total output / number of active weeks)
      const activeWeeksCount = new Set(allPeriodData.map(d => d.week)).size || 1;
      const activeDaysCount = new Set(allPeriodData.map(d => d.tanggal)).size || 1;
      const avgOutput = totalMonthsOutput / activeWeeksCount;
      const avgOutputPerHari = totalMonthsOutput / activeDaysCount;
      const avgYieldPrimary = totalMonthsInput > 0 ? (totalMonthsUtama / totalMonthsInput) * 100 : 0;

      // Weekly breakdown for the right-side columns (like Q1, Q2, Q3 in image)
      const weeklyBreakdown = allWeeks.map(week => {
        const d = allPeriodData.filter(x => x.week === week);
        const wInput = d.reduce((sum, item) => sum + item.input, 0);
        const wUtama = d.reduce((sum, item) => sum + item.utama, 0);
        const wYield = wInput > 0 ? (wUtama / wInput) * 100 : 0;
        return { week, yield: wYield, input: wInput };
      });

      return {
        mesin,
        periodInput,
        periodUtama,
        periodTurunan,
        periodOutput,
        periodYieldPrimary,
        periodYieldSecondary,
        periodYieldTotal,
        avgOutput,
        avgOutputPerHari,
        avgYieldPrimary,
        weeklyBreakdown
      };
    });

    return { analysis, weeks: allWeeks };
  }, [bsData, selectedMonth, selectedWeek]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide">Performance Mesin</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Analisa BS 1 - BS 8</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>Bulan {m}</option>
            ))}
          </select>

          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5"
          >
            <option value={0}>Semua Week</option>
            {availableWeeksForMonth.map(w => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-4 px-4 font-semibold w-12 text-center">NO</th>
                <th className="py-4 px-4 font-semibold">MESIN</th>
                <th className="py-4 px-4 font-semibold text-right">INPUT</th>
                <th className="py-4 px-4 font-semibold text-right">UTAMA</th>
                <th className="py-4 px-4 font-semibold text-right">LOKAL</th>
                <th className="py-4 px-4 font-semibold text-right">TOTAL</th>
                <th className="py-4 px-4 font-semibold text-center">REND. UTAMA</th>
                <th className="py-4 px-4 font-semibold text-center">REND. TURUNAN</th>
                <th className="py-4 px-4 font-semibold text-center">REND. TOTAL</th>
                <th className="py-4 px-4 font-semibold text-right">AVG TOTAL PER HARI</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {performanceData.analysis?.map((row, idx) => (
                <tr key={row.mesin} className={cn("border-b border-slate-100 hover:bg-slate-50/50 transition-colors", idx === performanceData.analysis!.length - 1 ? "border-b-0" : "")}>
                  <td className="py-4 px-4 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-4 px-4 font-bold text-slate-800 whitespace-nowrap">{row.mesin}</td>
                  <td className="py-4 px-4 text-right text-slate-600">{row.periodInput.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                  <td className="py-4 px-4 text-right font-semibold text-slate-700">{row.periodUtama.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                  <td className="py-4 px-4 text-right font-semibold text-slate-700">{row.periodTurunan.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                  <td className="py-4 px-4 text-right font-semibold text-slate-800">{row.periodOutput.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                  <td className="py-4 px-4 text-center font-bold text-indigo-600">{row.periodYieldPrimary.toFixed(1)}%</td>
                  <td className="py-4 px-4 text-center text-slate-600">{row.periodYieldSecondary.toFixed(1)}%</td>
                  <td className="py-4 px-4 text-center">
                    {row.periodInput > 0 ? (
                      <span className={cn(
                        "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold min-w-[70px]",
                        row.periodYieldTotal >= 35 ? "bg-emerald-100 text-emerald-700" :
                        row.periodYieldTotal >= 25 ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      )}>
                        {row.periodYieldTotal.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-slate-700">{row.avgOutputPerHari.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

