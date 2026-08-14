import React, { useState, useMemo, useEffect } from 'react';
import { ProductionData } from '../../types';
import { normalizeMachineName } from '../../services/dataService';
import { User, Download, Table, LayoutList, Calendar, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, serverTimestamp } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const MACHINES = ['Bs1', 'Bs2', 'Bs3', 'Bs4', 'Bs5', 'Bs6', 'Bs7', 'Bs8'];
const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function normalizeMachineKey(m: string | undefined | null): string {
  if (!m) return '';
  return m.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeDateKey(d: string | undefined | null): string {
  if (!d) return '';
  const str = String(d).trim();
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const dt = new Date(str);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return str;
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function AnalisaOperatorPage({ data }: AnalisaOperatorPageProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');

  const [noteTanggal, setNoteTanggal] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [noteMesin, setNoteMesin] = useState('');
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState<any[]>([]);

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(auth.currentUser?.email || null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUserEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  const ALLOWED_EMAILS = ['jaizqiusy@gmail.com', 'chamdan918@gmail.com', 'jarmoyo121095@gmail.com'];

  // Real-time synchronization with Firestore operator_notes collection
  useEffect(() => {
    const q = query(collection(db, 'operator_notes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomNotes(notes);
    }, (error) => {
      console.error("Failed to listen to operator notes:", error);
    });
    return () => unsubscribe();
  }, []);

  const submitNote = async () => {
    if (!noteTanggal || !noteMesin || !noteText.trim()) {
      return alert('Mohon lengkapi Tanggal, Mesin, dan Catatan');
    }
    if (!auth.currentUser) {
      return alert('Silakan login terlebih dahulu untuk menambahkan catatan');
    }
    
    const userEmail = (auth.currentUser.email || '').toLowerCase();
    const isAllowed = ALLOWED_EMAILS.some(email => email.toLowerCase() === userEmail);
    if (!isAllowed) {
      return alert('Maaf, akun Anda tidak memiliki izin untuk menambahkan catatan.');
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'operator_notes'), {
        tanggal: normalizeDateKey(noteTanggal),
        mesin: noteMesin,
        note: noteText.trim(),
        author: auth.currentUser.email || 'Unknown',
        timestamp: serverTimestamp()
      });
      setNoteText('');
      setSavedSuccessMessage(`Catatan untuk ${noteMesin} (${formatDateShort(noteTanggal)}) berhasil disimpan!`);
      setTimeout(() => {
        setSavedSuccessMessage(null);
      }, 4000);
    } catch (e: any) {
      console.error(e);
      alert('Gagal menambahkan catatan: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const months = useMemo(() => {
    const m = new Set<number>();
    data.forEach(d => {
      if (d.month && !isNaN(d.month)) m.add(d.month);
    });
    return Array.from(m).sort((a, b) => b - a);
  }, [data]);

  // Extract weeks for the selected month
  const availableWeeks = useMemo(() => {
    const weeksSet = new Set<number>();
    data.forEach(d => {
      if (d.month === selectedMonth && d.week && !isNaN(d.week)) {
        weeksSet.add(d.week);
      }
    });
    return Array.from(weeksSet).sort((a, b) => a - b);
  }, [data, selectedMonth]);

  useEffect(() => {
    if (availableWeeks.length > 0) {
      // Default to the latest week or 'all'
      setSelectedWeek(availableWeeks[availableWeeks.length - 1]);
    } else {
      setSelectedWeek('all');
    }
  }, [selectedMonth, availableWeeks]);

  // Flat processed data for detail table
  const { processedData, availableDates, availableMachines } = useMemo(() => {
    const monthData = data.filter(d => {
      if (d.month !== selectedMonth || !d.mesin || d.input <= 0) return false;
      const name = normalizeMachineName(d.mesin);
      return name.match(/^BS [1-8]$/i) || name.match(/^Bs[1-8]$/i);
    });

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

      const targetDateKey = normalizeDateKey(row.tanggal);
      const targetMachineKey = normalizeMachineKey(mesin);
      const matchedNotes = customNotes.filter((n: any) => 
        normalizeDateKey(n.tanggal) === targetDateKey && 
        normalizeMachineKey(n.mesin) === targetMachineKey
      );
      const customStr = matchedNotes.map((n: any) => n.note).filter(Boolean).join(' | ');

      return {
        tanggal: row.tanggal,
        mesin: mesin,
        yieldUtama: row.input > 0 ? (row.utama / row.input) : 0,
        yieldTotal: row.input > 0 ? (row.total / row.input) : 0,
        catatan: customStr,
        akumulasiUtama: accumulators[mesin].sumInput > 0 ? (accumulators[mesin].sumUtama / accumulators[mesin].sumInput) : 0,
        akumulasiTotal: accumulators[mesin].sumInput > 0 ? (accumulators[mesin].sumTotal / accumulators[mesin].sumInput) : 0,
      };
    });

    const dates = Array.from(new Set(processed.map(r => r.tanggal))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const machines = Array.from(new Set(processed.map(r => r.mesin))).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    return { processedData: processed, availableDates: dates, availableMachines: machines };
  }, [data, selectedMonth, customNotes]);

  const filteredData = useMemo(() => {
    return processedData.filter(row => {
      if (selectedDate !== 'all' && row.tanggal !== selectedDate) return false;
      if (selectedMachine !== 'all' && row.mesin !== selectedMachine) return false;
      return true;
    });
  }, [processedData, selectedDate, selectedMachine]);

  // Matrix calculation for 7 days of the selected week/month
  const matrixWeekData = useMemo(() => {
    let weekFiltered = data.filter(d => d.month === selectedMonth);
    if (selectedWeek !== 'all') {
      weekFiltered = weekFiltered.filter(d => d.week === selectedWeek);
    }

    // Get dates sorted
    const rawDates = Array.from(new Set(weekFiltered.map(d => d.tanggal)))
      .filter(Boolean)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let datesToUse: string[] = [];

    if (rawDates.length > 0) {
      // Find starting Monday of the earliest date
      const firstDate = new Date(rawDates[0]);
      const dayOfWeek = firstDate.getDay(); // 0 is Sun, 1 is Mon
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const mondayDate = new Date(firstDate);
      mondayDate.setDate(firstDate.getDate() + diffToMon);

      // Generate 7 days (Mon to Sun)
      for (let i = 0; i < 7; i++) {
        const cur = new Date(mondayDate);
        cur.setDate(mondayDate.getDate() + i);
        const yyyy = cur.getFullYear();
        const mm = String(cur.getMonth() + 1).padStart(2, '0');
        const dd = String(cur.getDate()).padStart(2, '0');
        datesToUse.push(`${yyyy}-${mm}-${dd}`);
      }
    } else {
      // Fallback empty 7 days
      datesToUse = ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16'];
    }

    // Build machine rows
    const machineRows = MACHINES.map(mName => {
      // Normalize machine matching e.g. Bs1 -> BS 1 or Bs1
      const normalizedTarget = mName.toLowerCase().replace(/\s/g, '');

      let sumInput = 0;
      let sumUtama = 0;
      let sumTurunan = 0;
      let sumTotal = 0;

      let countOrangeUtama = 0;
      let countHijauUtama = 0;
      let countOrangeTotal = 0;
      let countHijauTotal = 0;

      const dayCells = datesToUse.map(dStr => {
        const record = weekFiltered.find(d => {
          const normD = d.mesin ? d.mesin.toLowerCase().replace(/\s/g, '') : '';
          return (normD === normalizedTarget || normD === `bs${mName.replace(/\D/g, '')}`) && d.tanggal === dStr;
        });

        const input = record ? record.input : 0;
        const utama = record ? record.utama : 0;
        const turunan = record ? record.turunan : 0;
        const total = record ? record.total : 0;

        sumInput += input;
        sumUtama += utama;
        sumTurunan += turunan;
        sumTotal += total;

        const yieldUtama = input > 0 ? (utama / input) : 0;
        const yieldTurunan = input > 0 ? (turunan / input) : 0;
        const yieldTotal = input > 0 ? (total / input) : 0;

        if (input > 0) {
          if (yieldUtama < 0.30) countOrangeUtama++;
          else countHijauUtama++;

          if (yieldTotal < 0.65) countOrangeTotal++;
          else countHijauTotal++;
        }

        // Get notes from Firestore operator_notes
        const targetDateKey = normalizeDateKey(dStr);
        const matchedNotes = customNotes.filter((n: any) => 
          normalizeDateKey(n.tanggal) === targetDateKey && 
          normalizeMachineKey(n.mesin) === normalizedTarget
        );
        const noteCombined = matchedNotes.map((n: any) => n.note).filter(Boolean).join(' | ');

        return {
          tanggal: dStr,
          input,
          utama,
          turunan,
          total,
          yieldUtama,
          yieldTurunan,
          yieldTotal,
          noteCombined
        };
      });

      const akmUtama = sumInput > 0 ? (sumUtama / sumInput) : 0;
      const akmTurunan = sumInput > 0 ? (sumTurunan / sumInput) : 0;
      const akmTotal = sumInput > 0 ? (sumTotal / sumInput) : 0;

      const perfUtama = (akmUtama / 0.30) * 100;
      const perfTotal = (akmTotal / 0.65) * 100;

      return {
        mesin: mName,
        dayCells,
        akmUtama,
        akmTurunan,
        akmTotal,
        perfUtama,
        perfTotal,
        countOrangeUtama,
        countHijauUtama,
        countOrangeTotal,
        countHijauTotal
      };
    });

    return { dates: datesToUse, machineRows };
  }, [data, selectedMonth, selectedWeek, customNotes]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape');
    const title = `Laporan Analisa Operator - ${MONTH_NAMES[selectedMonth - 1]} 2026`;
    doc.setFontSize(14);
    doc.text(title, 14, 15);

    if (viewMode === 'matrix') {
      doc.setFontSize(10);
      doc.text(`Week: ${selectedWeek === 'all' ? 'Semua Week' : 'Week ' + selectedWeek}`, 14, 22);

      // Rendemen Utama Table
      const datesHeaders = matrixWeekData.dates.map(d => formatDateShort(d));
      const head1 = ["Mesin", ...datesHeaders, "Akumulasi", "Target Fix", "% Performance", "Ket Orange", "Ket Hijau"];

      const bodyUtama = matrixWeekData.machineRows.map(row => [
        row.mesin,
        ...row.dayCells.map(c => (c.yieldUtama * 100).toFixed(2) + '%'),
        (row.akmUtama * 100).toFixed(2) + '%',
        '30%',
        row.perfUtama.toFixed(2) + '%',
        row.countOrangeUtama ? `${row.countOrangeUtama} Hari` : '-',
        row.countHijauUtama ? `${row.countHijauUtama} Hari` : '-'
      ]);

      doc.setFontSize(11);
      doc.text("RENDEMEN UTAMA", 14, 28);

      autoTable(doc, {
        head: [head1],
        body: bodyUtama,
        startY: 32,
        theme: 'grid',
        headStyles: { fillColor: [6, 95, 70] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index >= 1 && data.column.index <= datesHeaders.length) {
            const raw = data.cell.raw as string;
            if (raw && raw !== '0.00%') {
              const val = parseFloat(raw.replace('%', ''));
              if (!isNaN(val)) {
                if (val < 30) {
                  data.cell.styles.fillColor = [253, 230, 138];
                  data.cell.styles.textColor = [120, 53, 15];
                  data.cell.styles.fontStyle = 'bold';
                } else {
                  data.cell.styles.fillColor = [220, 252, 231];
                  data.cell.styles.textColor = [20, 83, 45];
                  data.cell.styles.fontStyle = 'bold';
                }
              }
            }
          }
        }
      });

      // Rendemen Turunan Table
      const head2 = ["Mesin", ...datesHeaders, "Akumulasi"];
      const bodyTurunan = matrixWeekData.machineRows.map(row => [
        row.mesin,
        ...row.dayCells.map(c => (c.yieldTurunan * 100).toFixed(2) + '%'),
        (row.akmTurunan * 100).toFixed(2) + '%'
      ]);
      
      let finalY = (doc as any).lastAutoTable.finalY || 32;
      
      if (finalY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        finalY = 15;
      }
      
      doc.setFontSize(11);
      doc.text("RENDEMEN TURUNAN", 14, finalY + 10);

      autoTable(doc, {
        head: [head2],
        body: bodyTurunan,
        startY: finalY + 14,
        theme: 'grid',
        headStyles: { fillColor: [6, 95, 70] },
      });

      // Rendemen Total Table
      const head3 = ["Mesin", ...datesHeaders, "Akumulasi", "Target Fix", "% Performance", "Ket Orange", "Ket Hijau"];
      const bodyTotal = matrixWeekData.machineRows.map(row => [
        row.mesin,
        ...row.dayCells.map(c => (c.yieldTotal * 100).toFixed(2) + '%'),
        (row.akmTotal * 100).toFixed(2) + '%',
        '65%',
        row.perfTotal.toFixed(2) + '%',
        row.countOrangeTotal ? `${row.countOrangeTotal} Hari` : '-',
        row.countHijauTotal ? `${row.countHijauTotal} Hari` : '-'
      ]);

      finalY = (doc as any).lastAutoTable.finalY || finalY + 14;
      
      if (finalY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        finalY = 15;
      }

      doc.setFontSize(11);
      doc.text("RENDEMEN TOTAL", 14, finalY + 10);

      autoTable(doc, {
        head: [head3],
        body: bodyTotal,
        startY: finalY + 14,
        theme: 'grid',
        headStyles: { fillColor: [6, 95, 70] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index >= 1 && data.column.index <= datesHeaders.length) {
            const raw = data.cell.raw as string;
            if (raw && raw !== '0.00%') {
              const val = parseFloat(raw.replace('%', ''));
              if (!isNaN(val)) {
                if (val < 65) {
                  data.cell.styles.fillColor = [253, 230, 138];
                  data.cell.styles.textColor = [120, 53, 15];
                  data.cell.styles.fontStyle = 'bold';
                } else {
                  data.cell.styles.fillColor = [220, 252, 231];
                  data.cell.styles.textColor = [20, 83, 45];
                  data.cell.styles.fontStyle = 'bold';
                }
              }
            }
          }
        }
      });

      doc.save(`Analisa_Operator_Matrix_${MONTH_NAMES[selectedMonth - 1]}.pdf`);
    } else {
      const tableColumn = ["Tanggal", "Mesin", "% Utama", "% Total", "Catatan", "Akm % Utama", "Akm % Total"];
      const tableRows: any[] = [];

      filteredData.forEach(row => {
        const rowData = [
          formatDateShort(row.tanggal),
          row.mesin,
          formatPercent(row.yieldUtama),
          formatPercent(row.yieldTotal),
          row.catatan,
          formatPercent(row.akumulasiUtama),
          formatPercent(row.akumulasiTotal)
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 28,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      doc.save(`Analisa_Operator_Detail_${MONTH_NAMES[selectedMonth - 1]}.pdf`);
    }
  };

  const formatPercent = (val: number) => (val * 100).toFixed(2) + '%';

  return (
    <div className="min-h-full p-3 sm:p-6 lg:p-8 overflow-y-auto bg-slate-100 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-5">

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  SAWMILL {MONTH_NAMES[selectedMonth - 1]?.toUpperCase()} 2026
                </h1>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Matriks Evaluasi & Analisa Performa Operator
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'matrix'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Table className="w-4 h-4" />
                Tampilan Matriks (Spreadsheet)
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Tampilan Detail & Catatan
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Month Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {months.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedMonth === m
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {MONTH_NAMES[m - 1]}
                </button>
              ))}
            </div>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              title="Download PDF"
              className="flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Note Input Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col gap-3.5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Form Catatan Harian Operator</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5 w-full sm:flex sm:flex-row sm:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-48">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tgl Catatan</label>
              <input
                type="date"
                value={noteTanggal}
                onChange={e => setNoteTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
              />
            </div>
            <div className="flex flex-col gap-1 w-full sm:w-48">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mesin</label>
              <select
                value={noteMesin}
                onChange={e => setNoteMesin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
              >
                <option value="">Pilih Mesin</option>
                {MACHINES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Isi Catatan Harian</label>
            <textarea
              rows={2}
              placeholder="Ketik catatan di sini..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 w-full min-h-[64px] resize-y"
            />
          </div>

          {savedSuccessMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedSuccessMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={submitNote}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan'}
            </button>
            {customNotes.length > 0 && (
              <span className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
                {customNotes.length} catatan operator tersimpan di sistem
              </span>
            )}
          </div>
        </div>

        {/* View Mode 1: Spreadsheet Matrix View */}
        {viewMode === 'matrix' ? (
          <div className="space-y-6">

            {/* Week Tab Navigation */}
            {availableWeeks.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Week:
                </span>
                {availableWeeks.map(w => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeek(w)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedWeek === w
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-500'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    Evaluasi Week {w}
                  </button>
                ))}
              </div>
            )}

            {/* Matrix Section 1: RENDEMEN UTAMA */}
            <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
              <div className="bg-emerald-800 text-white font-extrabold text-sm uppercase tracking-wider px-4 py-2.5 flex items-center justify-between border-b border-emerald-900">
                <span>RENDEMEN UTAMA</span>
                <span className="text-xs text-emerald-200 font-semibold">(Target Fix: 30%)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    {/* Sub-Header Row 1: Hari */}
                    <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 min-w-[70px]">Mesin</th>
                      {matrixWeekData.dates.map((dStr, idx) => {
                        const dayName = DAY_NAMES[new Date(dStr).getDay()];
                        return (
                          <th key={idx} className="p-2 border-r border-slate-300 min-w-[85px]">
                            {dayName}
                          </th>
                        );
                      })}
                      <th className="p-2 border-r border-slate-300 bg-[#00b4d8] text-white min-w-[90px]">Akumulasi</th>
                      <th className="p-2 border-r border-slate-300 bg-[#10b981] text-white min-w-[80px]">Target Fix</th>
                      <th className="p-2 border-r border-slate-300 bg-[#00b4d8] text-white min-w-[95px]">% Performance</th>
                      <th className="p-2 border-r border-slate-300 bg-[#f97316] text-white min-w-[80px]">Ket Orange</th>
                      <th className="p-2 bg-[#22c55e] text-white min-w-[80px]">Ket Hijau</th>
                    </tr>

                    {/* Sub-Header Row 2: Tanggal */}
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                      <td className="p-1.5 border-r border-slate-300">Mesin</td>
                      {matrixWeekData.dates.map((dStr, idx) => (
                        <td key={idx} className="p-1.5 border-r border-slate-300 whitespace-nowrap">
                          {formatDateShort(dStr)}
                        </td>
                      ))}
                      <td className="p-1.5 border-r border-slate-300 bg-cyan-100 text-cyan-900 font-bold">Akumulasi</td>
                      <td className="p-1.5 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">30%</td>
                      <td className="p-1.5 border-r border-slate-300 bg-cyan-100 text-cyan-900 font-bold">% Performance</td>
                      <td className="p-1.5 border-r border-slate-300 bg-amber-100 text-amber-900 font-bold">&lt; 30%</td>
                      <td className="p-1.5 bg-emerald-100 text-emerald-900 font-bold">&gt;= 30%</td>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {matrixWeekData.machineRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 font-bold bg-slate-100 text-slate-800 border-r border-slate-300">{row.mesin}</td>
                        {row.dayCells.map((cell, cIdx) => {
                          const val = cell.yieldUtama;
                          const formatted = (val * 100).toFixed(2) + '%';
                          const isOrange = cell.input > 0 && val < 0.30;
                          const isGreen = cell.input > 0 && val >= 0.30;

                          return (
                            <td
                              key={cIdx}
                              title={cell.noteCombined || undefined}
                              className={`p-2 border-r border-slate-200 font-medium ${
                                isOrange
                                  ? 'bg-[#fde68a] text-[#78350f] font-bold border-amber-300'
                                  : isGreen
                                  ? 'bg-[#dcfce7] text-[#14532d] font-bold border-emerald-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              {cell.input > 0 ? formatted : '0.00%'}
                            </td>
                          );
                        })}
                        <td className="p-2 font-bold bg-[#e0f2fe] text-cyan-950 border-r border-slate-300">
                          {(row.akmUtama * 100).toFixed(2)}%
                        </td>
                        <td className="p-2 font-bold bg-emerald-50 text-emerald-900 border-r border-slate-300">
                          30%
                        </td>
                        <td className="p-2 font-bold bg-[#e0f2fe] text-cyan-950 border-r border-slate-300">
                          {row.perfUtama.toFixed(2)}%
                        </td>
                        <td className="p-2 font-bold bg-amber-50 text-amber-900 border-r border-slate-300">
                          {row.countOrangeUtama ? `${row.countOrangeUtama}` : '-'}
                        </td>
                        <td className="p-2 font-bold bg-emerald-50 text-emerald-900">
                          {row.countHijauUtama ? `${row.countHijauUtama}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matrix Section 2: RENDEMEN TURUNAN */}
            <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
              <div className="bg-emerald-800 text-white font-extrabold text-sm uppercase tracking-wider px-4 py-2.5 flex items-center justify-between border-b border-emerald-900">
                <span>RENDEMEN TURUNAN</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 min-w-[70px]">Mesin</th>
                      {matrixWeekData.dates.map((dStr, idx) => {
                        const dayName = DAY_NAMES[new Date(dStr).getDay()];
                        return (
                          <th key={idx} className="p-2 border-r border-slate-300 min-w-[85px]">
                            {dayName}
                          </th>
                        );
                      })}
                      <th className="p-2 bg-[#00b4d8] text-white min-w-[90px]">Akumulasi</th>
                    </tr>

                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                      <td className="p-1.5 border-r border-slate-300">Mesin</td>
                      {matrixWeekData.dates.map((dStr, idx) => (
                        <td key={idx} className="p-1.5 border-r border-slate-300 whitespace-nowrap">
                          {formatDateShort(dStr)}
                        </td>
                      ))}
                      <td className="p-1.5 bg-cyan-100 text-cyan-900 font-bold">Akumulasi</td>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {matrixWeekData.machineRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 font-bold bg-slate-100 text-slate-800 border-r border-slate-300">{row.mesin}</td>
                        {row.dayCells.map((cell, cIdx) => {
                          const formatted = (cell.yieldTurunan * 100).toFixed(2) + '%';
                          return (
                            <td key={cIdx} className="p-2 border-r border-slate-200 font-medium text-slate-700">
                              {cell.input > 0 ? formatted : '0.00%'}
                            </td>
                          );
                        })}
                        <td className="p-2 font-bold bg-[#e0f2fe] text-cyan-950">
                          {(row.akmTurunan * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matrix Section 3: RENDEMEN TOTAL */}
            <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
              <div className="bg-emerald-800 text-white font-extrabold text-sm uppercase tracking-wider px-4 py-2.5 flex items-center justify-between border-b border-emerald-900">
                <span>RENDEMEN TOTAL</span>
                <span className="text-xs text-emerald-200 font-semibold">(Target Fix: 65%)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 min-w-[70px]">Mesin</th>
                      {matrixWeekData.dates.map((dStr, idx) => {
                        const dayName = DAY_NAMES[new Date(dStr).getDay()];
                        return (
                          <th key={idx} className="p-2 border-r border-slate-300 min-w-[85px]">
                            {dayName}
                          </th>
                        );
                      })}
                      <th className="p-2 border-r border-slate-300 bg-[#00b4d8] text-white min-w-[90px]">Akumulasi</th>
                      <th className="p-2 border-r border-slate-300 bg-[#10b981] text-white min-w-[80px]">Target Fix</th>
                      <th className="p-2 border-r border-slate-300 bg-[#00b4d8] text-white min-w-[95px]">% Performance</th>
                      <th className="p-2 border-r border-slate-300 bg-[#f97316] text-white min-w-[80px]">Ket Orange</th>
                      <th className="p-2 bg-[#22c55e] text-white min-w-[80px]">Ket Hijau</th>
                    </tr>

                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                      <td className="p-1.5 border-r border-slate-300">Mesin</td>
                      {matrixWeekData.dates.map((dStr, idx) => (
                        <td key={idx} className="p-1.5 border-r border-slate-300 whitespace-nowrap">
                          {formatDateShort(dStr)}
                        </td>
                      ))}
                      <td className="p-1.5 border-r border-slate-300 bg-cyan-100 text-cyan-900 font-bold">Akumulasi</td>
                      <td className="p-1.5 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">65%</td>
                      <td className="p-1.5 border-r border-slate-300 bg-cyan-100 text-cyan-900 font-bold">% Performance</td>
                      <td className="p-1.5 border-r border-slate-300 bg-amber-100 text-amber-900 font-bold">&lt; 65%</td>
                      <td className="p-1.5 bg-emerald-100 text-emerald-900 font-bold">&gt;= 65%</td>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {matrixWeekData.machineRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 font-bold bg-slate-100 text-slate-800 border-r border-slate-300">{row.mesin}</td>
                        {row.dayCells.map((cell, cIdx) => {
                          const val = cell.yieldTotal;
                          const formatted = (val * 100).toFixed(2) + '%';
                          const isOrange = cell.input > 0 && val < 0.65;
                          const isGreen = cell.input > 0 && val >= 0.65;

                          return (
                            <td
                              key={cIdx}
                              title={cell.noteCombined || undefined}
                              className={`p-2 border-r border-slate-200 font-medium ${
                                isOrange
                                  ? 'bg-[#fde68a] text-[#78350f] font-bold border-amber-300'
                                  : isGreen
                                  ? 'bg-[#dcfce7] text-[#14532d] font-bold border-emerald-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              {cell.input > 0 ? formatted : '0.00%'}
                            </td>
                          );
                        })}
                        <td className="p-2 font-bold bg-[#e0f2fe] text-cyan-950 border-r border-slate-300">
                          {(row.akmTotal * 100).toFixed(2)}%
                        </td>
                        <td className="p-2 font-bold bg-emerald-50 text-emerald-900 border-r border-slate-300">
                          65%
                        </td>
                        <td className="p-2 font-bold bg-[#e0f2fe] text-cyan-950 border-r border-slate-300">
                          {row.perfTotal.toFixed(2)}%
                        </td>
                        <td className="p-2 font-bold bg-amber-50 text-amber-900 border-r border-slate-300">
                          {row.countOrangeTotal ? `${row.countOrangeTotal}` : '-'}
                        </td>
                        <td className="p-2 font-bold bg-emerald-50 text-emerald-900">
                          {row.countHijauTotal ? `${row.countHijauTotal}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          /* View Mode 2: Detailed Line-By-Line Table View */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-4">
            <div className="grid grid-cols-2 gap-2.5 w-full sm:flex sm:flex-row sm:w-auto">
              <div className="flex flex-col gap-1 w-full sm:w-44">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="all">Semua Tanggal</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>{formatDateShort(d)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-44">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Mesin</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="all">Semua Mesin</option>
                  {availableMachines.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="text-[11px] text-slate-600 uppercase bg-slate-100 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200">Tanggal</th>
                    <th className="px-4 py-3 border-r border-slate-200">Mesin</th>
                    <th className="px-4 py-3 border-r border-slate-200">% Utama</th>
                    <th className="px-4 py-3 border-r border-slate-200">% Total</th>
                    <th className="px-4 py-3 border-r border-slate-200">Catatan</th>
                    <th className="px-4 py-3 border-r border-slate-200">Akumulasi % Utama</th>
                    <th className="px-4 py-3">Akumulasi % Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length > 0 ? (
                    filteredData.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap border-r border-slate-100">
                          {formatDateShort(row.tanggal)}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-800 border-r border-slate-100">{row.mesin}</td>
                        <td className={`px-4 py-2.5 font-medium border-r border-slate-100 ${row.yieldUtama > 0 && row.yieldUtama < 0.28 ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-700'}`}>
                          {formatPercent(row.yieldUtama)}
                        </td>
                        <td className={`px-4 py-2.5 font-medium border-r border-slate-100 ${row.yieldTotal > 0 && row.yieldTotal <= 0.64 ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-700'}`}>
                          {formatPercent(row.yieldTotal)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 max-w-sm border-r border-slate-100" title={row.catatan}>
                          {row.catatan ? (
                            <div className="flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                              <span className="font-semibold text-slate-800 break-words">{row.catatan}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-indigo-700 border-r border-slate-100">{formatPercent(row.akumulasiUtama)}</td>
                        <td className="px-4 py-2.5 font-bold text-teal-700">{formatPercent(row.akumulasiTotal)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-medium">
                        Tidak ada data untuk filter yang dipilih
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
