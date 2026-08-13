import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { Calendar, Loader2, Table, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PlaningRow {
  no: string;
  kodeOrder: string;
  ukuranPanjang: string;
  volumeTarget: number;
  dailyResults: { [date: string]: number };
  totalSelesai: number;
  kekurangan: number;
}

export function PlaningBulanan() {
  const [data, setData] = useState<PlaningRow[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const wosSheetUrl = "https://docs.google.com/spreadsheets/d/1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ/export?format=csv&gid=1120389821";
  const invSheetUrl = "https://docs.google.com/spreadsheets/d/1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ/export?format=csv&gid=1726776473";

  const fetchAndProcess = useCallback(async () => {
    setLoading(true);
    try {
      const [wosRes, invRes] = await Promise.all([
        new Promise<any>((resolve, reject) => {
          Papa.parse(wosSheetUrl, {
            download: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err)
          });
        }),
        new Promise<any>((resolve, reject) => {
          Papa.parse(invSheetUrl, {
            download: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err)
          });
        })
      ]);

      // Process WOS Sawmill (Target)
      const wosTargets: any[] = [];
      let isDataSection = false;
      for (let i = 0; i < wosRes.length; i++) {
        const row = wosRes[i];
        if (!row || row.length === 0) continue;
        const col0 = (row[0] || '').toString().trim();
        const col1 = (row[1] || '').toString().trim();
        const col2 = (row[2] || '').toString().trim();
        const col3 = (row[3] || '').toString().trim();

        if (col0 === 'BULAN' && col1 === 'NAMA BUYER') {
          isDataSection = true;
          continue;
        }

        if (isDataSection && (col1 !== "" || col2 !== "")) {
          if (col0 === '*' || col0.toLowerCase().includes('total')) continue;
          
          let vol = parseFloat(col3.replace(',', '.'));
          if (isNaN(vol)) vol = 0;

          wosTargets.push({
            no: col0,
            buyer: col1,
            st: col2,
            target: vol
          });
        }
      }

      // Process Inventory (Actual)
      const invData = invRes as any[][];
      let headerRowIndex = -1;
      let last7Dates: string[] = [];
      let dateColIndices: { [date: string]: number } = {};
      let colUkuran = -1;
      let colJO = -1;
      let colPanjang = -1;

      for (let i = 0; i < Math.min(20, invData.length); i++) {
        const row = invData[i];
        const hIndex = row.findIndex((cell: any) => {
          const c = (cell || '').toString().toLowerCase().trim();
          return c === 'ukuran' || c === 'ukuran ';
        });
        if (hIndex !== -1) {
          headerRowIndex = i;
          colUkuran = hIndex;
          for (let j = 0; j < row.length; j++) {
            const val = (row[j] || '').toString().toLowerCase().trim();
            if (val === 'jo') colJO = j;
            if (val === 'panjang') colPanjang = j;
          }
          break;
        }
      }

      // Find date columns in header
      if (headerRowIndex !== -1) {
        const headerRow = invData[headerRowIndex];
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agt', 'sep', 'okt', 'nov', 'des', 'aug', 'oct', 'dec', 'may'];
        const tempDates: { date: string, idx: number, time: number }[] = [];

        for (let j = 0; j < headerRow.length; j++) {
          const val = (headerRow[j] || '').toString().trim();
          const lowerVal = val.toLowerCase();
          const hasMonth = monthNames.some(m => lowerVal.includes(m));
          const hasYear = lowerVal.includes('25') || lowerVal.includes('26') || lowerVal.includes('27');
          
          if (hasMonth && hasYear) {
             const time = new Date(val).getTime();
             if (!isNaN(time)) {
               tempDates.push({ date: val, idx: j, time });
             }
          }
        }

        // Sort by time and take last 7
        tempDates.sort((a, b) => a.time - b.time);
        const last7 = tempDates.slice(-7);
        last7.forEach(d => {
          last7Dates.push(d.date);
          dateColIndices[d.date] = d.idx;
        });
      }

      // Read inventory rows
      const invMap = new Map<string, any>(); // Map buyer+ST to row data
      for (let i = headerRowIndex + 1; i < invData.length; i++) {
         const row = invData[i];
         const ukuran = (row[colUkuran] || '').toString().trim();
         if (!ukuran || ukuran === '*' || ukuran.toLowerCase() === 'total') continue;
         
         const jo = (row[colJO] || '').toString().trim();
         const panjang = (row[colPanjang] || '').toString().trim();

         const key = `${jo}-${ukuran}-${panjang}`.toLowerCase();
         invMap.set(key, row);
      }

      // Merge data
      const finalData: PlaningRow[] = wosTargets.map(wos => {
        // Try to match WOS to INV
        // WOS buyer usually TK011802, INV JO usually S-TK011802
        // WOS st usually 55X215X3400
        
        let dailyResults: { [date: string]: number } = {};
        last7Dates.forEach(d => dailyResults[d] = 0);
        let totalSelesai = 0;

        // Naive matching:
        // WOS: buyer="TK011802", st="55X215X3400"
        // parse T, L, P from st:
        let matchST = wos.st.match(/(\d+)X(\d+)(?:X|&)(\d+)/i) || wos.st.match(/(\d+)X(\d+)/i);
        let wosT = '', wosL = '', wosP = '';
        if (matchST) {
           wosT = matchST[1];
           wosL = matchST[2];
           if (matchST[3]) wosP = matchST[3];
        }

        let matchedRow: any = null;
        for (const [key, invRow] of invMap.entries()) {
           const jo = (invRow[colJO] || '').toString().trim();
           const ukuran = (invRow[colUkuran] || '').toString().trim();
           const panjang = (invRow[colPanjang] || '').toString().trim();

           // Check if JO matches (e.g. S-TK011802 contains TK011802)
           if (jo.includes(wos.buyer) || wos.buyer.includes(jo.replace('S-', ''))) {
              // check if ukuran matches (e.g. 55x215)
              let matchInvU = ukuran.match(/(\d+)x(\d+)/i);
              if (matchInvU && wosT && wosL && matchInvU[1] === wosT && matchInvU[2] === wosL) {
                 // check panjang if available
                 if (!wosP || wosP === panjang || panjang.includes(wosP) || wos.st.includes(panjang)) {
                    matchedRow = invRow;
                    break;
                 }
              }
           }
        }

        if (matchedRow) {
           // Calculate conversion factor BTG to M3
           // Assuming it's in BTG for now, but wait, maybe the user just wants the exact values.
           // Actually, let's just use the exact values from INV (it might be BTG, but user says 'mengurangi beban M3 atau BTG')
           // We should try to convert to M3 if possible. T * L * P / 10^9
           const ukuran = (matchedRow[colUkuran] || '').toString().trim();
           const panjang = (matchedRow[colPanjang] || '').toString().trim();
           
           let factor = 1;
           let uMatch = ukuran.match(/(\d+)x(\d+)/i);
           let pVal = parseFloat(panjang);
           if (uMatch && !isNaN(pVal) && pVal > 0) {
              factor = (parseInt(uMatch[1]) * parseInt(uMatch[2]) * pVal) / 1000000000;
           }

           last7Dates.forEach(d => {
             const idx = dateColIndices[d];
             const rawVal = parseFloat((matchedRow[idx] || '').toString().replace(',', '.'));
             if (!isNaN(rawVal)) {
                // If it's BTG, convert to M3. Let's just assume factor conversion
                const m3Val = rawVal * factor;
                dailyResults[d] = m3Val;
                totalSelesai += m3Val;
             }
           });
        }

        return {
          no: wos.no,
          kodeOrder: wos.buyer,
          ukuranPanjang: wos.st,
          volumeTarget: wos.target,
          dailyResults,
          totalSelesai,
          kekurangan: Math.max(0, wos.target - totalSelesai)
        };
      });

      setDates(last7Dates);
      setData(finalData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndProcess();
  }, [fetchAndProcess]);

  const totalTarget = data.reduce((sum, r) => sum + r.volumeTarget, 0);
  const totalSelesaiAll = data.reduce((sum, r) => sum + r.totalSelesai, 0);

  const dailyTotals: { [date: string]: number } = {};
  dates.forEach(d => {
    dailyTotals[d] = data.reduce((sum, r) => sum + (r.dailyResults[d] || 0), 0);
  });

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-800">Planing Bulanan</h3>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Memuat data planning...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider border-y border-slate-200">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Kode Order</th>
                <th className="px-4 py-3">Ukuran & Panjang</th>
                <th className="px-4 py-3 text-right">Volume Target</th>
                {dates.map(d => (
                  <th key={d} className="px-4 py-3 text-right">{d}</th>
                ))}
                <th className="px-4 py-3 text-right text-emerald-600">Total Selesai</th>
                <th className="px-4 py-3 text-right text-rose-500">Kekurangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500">{row.no}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">{row.kodeOrder}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.ukuranPanjang}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700 text-right">{row.volumeTarget.toFixed(2)}</td>
                  {dates.map(d => (
                    <td key={d} className="px-4 py-3 text-sm font-mono text-slate-500 text-right">
                      {row.dailyResults[d] > 0 ? row.dailyResults[d].toFixed(2) : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm font-mono text-emerald-600 font-bold text-right">{row.totalSelesai > 0 ? row.totalSelesai.toFixed(2) : '0'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-rose-500 font-bold text-right">{row.kekurangan > 0 ? row.kekurangan.toFixed(2) : '0'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right text-xs uppercase tracking-widest text-slate-500">TOTAL HARIAN (m3)</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-800 text-right">{totalTarget.toFixed(2)}</td>
                {dates.map(d => (
                  <td key={d} className="px-4 py-3 text-sm font-mono text-blue-600 text-right">{dailyTotals[d] > 0 ? dailyTotals[d].toFixed(2) : '0.00'}</td>
                ))}
                <td className="px-4 py-3 text-sm font-mono text-emerald-600 text-right">{totalSelesaiAll.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm font-mono text-rose-500 text-right">{(totalTarget - totalSelesaiAll).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
