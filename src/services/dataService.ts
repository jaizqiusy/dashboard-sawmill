
import { db } from '../firebase';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import Papa from 'papaparse';
import { RAW_CSV_DATA } from '../data/raw_data';
import { ProductionData, SummaryStats, SupplierData, MonthlyLogData, OperatorData, LogDikerjakanData, AnalisaOperatorDetailData } from '../types';
import { STATIC_ANALISA_OPERATOR_DATA, STATIC_ANALISA_OPERATOR_DETAIL } from '../data/staticAnalisaOperatorData';

const SPREADSHEET_ID = '1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ';

// Cached baseline data
let memoizedStaticBaseline: ProductionData[] | null = null;
function getStaticBaselineData(): ProductionData[] {
  if (!memoizedStaticBaseline) {
    memoizedStaticBaseline = parseCSV(RAW_CSV_DATA);
  }
  return memoizedStaticBaseline;
}

// Ultra-fast dataset comparison (bypasses heavy JSON.stringify of thousands of objects)
export function isDatasetEqual<T extends Record<string, any>>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (!itemA || !itemB) return false;
    for (const key in itemA) {
      if (itemA[key] !== itemB[key]) return false;
    }
  }
  return true;
}

export async function fetchOperatorDataFromSheet(): Promise<OperatorData[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Operstor%20bs`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch data');
    const csvData = await response.text();
    return parseOperatorCSV(csvData);
  } catch (error) {
    console.error('Error fetching operator data:', error);
    return [];
  }
}

function parseOperatorCSV(csv: string): OperatorData[] {
  const parsed = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true });
  if (!parsed.data || parsed.data.length <= 1) return [];

  return parsed.data.slice(1).map(values => {
      let urlFoto = values[7] || '';
      if (urlFoto.includes('drive.google.com')) {
        const idMatch = urlFoto.match(/id=([a-zA-Z0-9_-]+)/) || 
                        urlFoto.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                        urlFoto.match(/\/open\?.+?id=([a-zA-Z0-9_-]+)/);
        if (idMatch) {
          urlFoto = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
        }
      }

      return {
        id_operator: values[0] || '',
        nama_lengkap: values[1] || '',
        inisial: values[2] || '',
        kode_bs: values[3] || '',
        tanggal_mulai: values[4] || '',
        masa_kerja_tahun: values[5] || '',
        status_aktif: values[6] === 'TRUE',
        url_foto: urlFoto,
        status_upload: values[8] === 'TRUE',
        avg_yield_alltime: values[9] ? parseFloat(values[9]) : null,
        volume_alltime: values[10] ? parseFloat(values[10]) : null,
      };
  }).filter(row => row.id_operator);
}

export async function fetchProductionDataFromSheet(): Promise<ProductionData[]> {
  const staticData = getStaticBaselineData();
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DATABASE%20APPSCRIPT`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch data');
    const csvData = await response.text();
    const liveData = parseCSV(csvData);
    
    // Merge live data with static baseline data (live overrides identical date + machine)
    const map = new Map<string, ProductionData>();
    staticData.forEach(d => {
      const key = `${(d.tanggal || '').trim()}_${normalizeMachineName(d.mesin)}`;
      map.set(key, d);
    });
    liveData.forEach(d => {
      const key = `${(d.tanggal || '').trim()}_${normalizeMachineName(d.mesin)}`;
      map.set(key, d);
    });
    return Array.from(map.values());
  } catch (error) {
    console.error('Error fetching production data:', error);
    // Fallback to static data on error
    return staticData;
  }
}

export async function fetchSupplierDataFromSheet(): Promise<SupplierData[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=LOG%20SUPPLIER`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch data');
    const csvData = await response.text();
    return parseSupplierCSV(csvData);
  } catch (error) {
    console.error('Error fetching supplier data:', error);
    return getMockSupplierData();
  }
}

function parseSupplierCSV(csv: string): SupplierData[] {
  const parsed = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true });
  if (!parsed.data || parsed.data.length <= 1) return [];

  return parsed.data.slice(1).map(values => {
    return {
      kode: values[0] || '',
      supplier: values[1] || '',
      input: parseFloat(values[2]) || 0,
      utama: parseFloat(values[3]) || 0,
      yieldUtama: parseFloat(values[4]) || 0,
      turunan: parseFloat(values[5]) || 0,
      yieldTurunan: parseFloat(values[6]) || 0,
      export: parseFloat(values[7]) || 0,
      yieldExport: parseFloat(values[8]) || 0,
      lokalSuper: parseFloat(values[9]) || 0,
      yieldLokalSuper: parseFloat(values[10]) || 0,
      lokal: parseFloat(values[11]) || 0,
      yieldLokal: parseFloat(values[12]) || 0,
      totalLokal: parseFloat(values[13]) || 0,
      yieldTotalLokal: parseFloat(values[14]) || 0,
      total: parseFloat(values[15]) || 0,
      yieldTotal: parseFloat(values[16]) || 0,
    };
  }).filter(row => row.kode && row.kode.trim() !== '' && row.supplier.toLowerCase() !== 'total');
}

export async function fetchMonthlyLogDataFromSheet(): Promise<MonthlyLogData[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=log%20per%20bulan`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch data');
    const csvData = await response.text();
    return parseMonthlyLogCSV(csvData);
  } catch (error) {
    console.error('Error fetching monthly log data:', error);
    return [];
  }
}

function parseMonthlyLogCSV(csv: string): MonthlyLogData[] {
  const parsed = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true });
  if (!parsed.data || parsed.data.length <= 1) return [];

  return parsed.data.slice(1).map(values => {
    return {
      bulan: parseInt(values[0]) || 0,
      kode: values[1] || '',
      supplier: values[2] || '',
      input: parseFloat(values[3]) || 0,
      utama: parseFloat(values[4]) || 0,
      yieldUtama: parseFloat(values[5]) || 0,
      turunan: parseFloat(values[6]) || 0,
      yieldTurunan: parseFloat(values[7]) || 0,
      export: parseFloat(values[8]) || 0,
      yieldExport: parseFloat(values[9]) || 0,
      lokalSuper: parseFloat(values[10]) || 0,
      yieldLokalSuper: parseFloat(values[11]) || 0,
      lokal: parseFloat(values[12]) || 0,
      yieldLokal: parseFloat(values[13]) || 0,
      totalLokal: parseFloat(values[14]) || 0,
      yieldTotalLokal: parseFloat(values[15]) || 0,
      total: parseFloat(values[16]) || 0,
      yieldTotal: parseFloat(values[17]) || 0,
      pilotLadder: parseFloat(values[18]) || 0,
      utamaTanpaPilotLadder: parseFloat(values[19]) || 0,
    };
  }).filter(row => row.supplier && row.supplier.trim() !== '' && row.supplier.toLowerCase() !== 'total');
}

export function getMockSupplierData(): SupplierData[] {
  return [
    { kode: '25AZ', supplier: '25 AKI 15 (LOG END)', input: 27.8833, utama: 9.9834, yieldUtama: 35.80, turunan: 0, yieldTurunan: 0.00, export: 9.9834, yieldExport: 35.80, lokalSuper: 0.8529, yieldLokalSuper: 3.06, lokal: 6.4583, yieldLokal: 23.16, totalLokal: 7.3112, yieldTotalLokal: 26.22, total: 17.2946, yieldTotal: 62.02 },
    { kode: '25AAA', supplier: '25 WAI O5 (LOG END)', input: 15.9855, utama: 4.4162, yieldUtama: 27.63, turunan: 0, yieldTurunan: 0.00, export: 4.4162, yieldExport: 27.63, lokalSuper: 0.1812, yieldLokalSuper: 1.13, lokal: 4.3648, yieldLokal: 27.30, totalLokal: 4.546, yieldTotalLokal: 28.44, total: 8.9622, yieldTotal: 56.06 },
    { kode: '25AAB', supplier: '25 JSI 01 (MRT)', input: 8.7331, utama: 0, yieldUtama: 0.00, turunan: 5.8723, yieldTurunan: 67.24, export: 5.8723, yieldExport: 67.24, lokalSuper: 0, yieldLokalSuper: 0.00, lokal: 0.0828, yieldLokal: 0.95, totalLokal: 0.0828, yieldTotalLokal: 0.95, total: 5.9551, yieldTotal: 68.19 },
    { kode: '25AAC', supplier: '25 KMI 08 (MRT)', input: 9.4319, utama: 0, yieldUtama: 0.00, turunan: 5.2100, yieldTurunan: 55.24, export: 5.2100, yieldExport: 55.24, lokalSuper: 1.100, yieldLokalSuper: 11.66, lokal: 0.500, yieldLokal: 5.30, totalLokal: 1.600, yieldTotalLokal: 16.96, total: 6.8100, yieldTotal: 72.20 }
  ];
}

function parseCSV(csv: string): ProductionData[] {
  const parsed = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true });
  if (!parsed.data || parsed.data.length <= 1) return [];

  const headers = parsed.data[0].map(h => (h || '').trim().toLowerCase());
  const idxTanggal = headers.indexOf('tanggal') !== -1 ? headers.indexOf('tanggal') : 0;
  const idxMesin = headers.findIndex(h => h.includes('mesin') && !h.includes('setting') && !h.includes('bersih')) !== -1 
    ? headers.findIndex(h => h.includes('mesin') && !h.includes('setting') && !h.includes('bersih')) : 1;
  const idxLine = headers.indexOf('line') !== -1 ? headers.indexOf('line') : 2;
  const idxInput = headers.indexOf('input') !== -1 ? headers.indexOf('input') : 3;
  const idxUtama = headers.indexOf('utama') !== -1 ? headers.indexOf('utama') : 4;
  const idxYieldPrimary = headers.indexOf('yield_primary') !== -1 ? headers.indexOf('yield_primary') : 5;
  const idxTurunan = headers.indexOf('turunan') !== -1 ? headers.indexOf('turunan') : 6;
  const idxYieldSecondary = headers.indexOf('yield_secondary') !== -1 ? headers.indexOf('yield_secondary') : 7;
  const idxLokal = headers.findIndex(h => h.includes('lokal')) !== -1 ? headers.findIndex(h => h.includes('lokal')) : 8;
  const idxTotal = headers.indexOf('total') !== -1 ? headers.indexOf('total') : 9;
  const idxYieldTotal = headers.indexOf('yield_total') !== -1 ? headers.indexOf('yield_total') : 10;
  const idxTargetTotal = headers.findIndex(h => h.includes('target total') || h === 'target_total') !== -1 
    ? headers.findIndex(h => h.includes('target total') || h === 'target_total') : 11;
  const idxAchievement = headers.indexOf('achievement') !== -1 ? headers.indexOf('achievement') : 12;
  const idxWeek = headers.indexOf('week') !== -1 ? headers.indexOf('week') : 13;
  const idxMonth = headers.indexOf('month') !== -1 ? headers.indexOf('month') : 14;
  const idxQuartal = headers.indexOf('quartal') !== -1 ? headers.indexOf('quartal') : 15;
  const idxPoint = headers.indexOf('point') !== -1 ? headers.indexOf('point') : 16;
  const idxDurasi = headers.findIndex(h => h.includes('durasi')) !== -1 ? headers.findIndex(h => h.includes('durasi')) : 17;
  const idxPilotLadder = headers.findIndex(h => h.includes('pilot ladder')) !== -1 ? headers.findIndex(h => h.includes('pilot ladder')) : -1;
  const idxUtamaNonPilot = headers.findIndex(h => h.includes('utama non pilot')) !== -1 ? headers.findIndex(h => h.includes('utama non pilot')) : -1;
  const idxJam = headers.indexOf('jam') !== -1 ? headers.indexOf('jam') : 18;
  const idxDowntime = headers.indexOf('downtime') !== -1 ? headers.indexOf('downtime') : 19;

  return parsed.data.slice(1).map(values => {
    return {
      tanggal: (values[idxTanggal] || '').trim(),
      mesin: (values[idxMesin] || '').trim(),
      line: (values[idxLine] || '').trim(),
      input: parseFloat(values[idxInput]) || 0,
      utama: parseFloat(values[idxUtama]) || 0,
      yield_primary: parseFloat(values[idxYieldPrimary]) || 0,
      turunan: parseFloat(values[idxTurunan]) || 0,
      yield_secondary: parseFloat(values[idxYieldSecondary]) || 0,
      lokal: parseFloat(values[idxLokal]) || 0,
      total: parseFloat(values[idxTotal]) || 0,
      yield_total: parseFloat(values[idxYieldTotal]) || 0,
      target_total: parseFloat(values[idxTargetTotal]) || 0,
      achievement: parseFloat(values[idxAchievement]) || 0,
      week: parseInt(values[idxWeek]) || 0,
      month: parseInt(values[idxMonth]) || 0,
      quartal: parseInt(values[idxQuartal]) || 0,
      point: parseInt(values[idxPoint]) || 0,
      durasi: parseFloat(values[idxDurasi]) || 0,
      pilotLadder: idxPilotLadder !== -1 ? (parseFloat(values[idxPilotLadder]) || 0) : 0,
      utamaNonPilotLadder: idxUtamaNonPilot !== -1 ? (parseFloat(values[idxUtamaNonPilot]) || 0) : 0,
      jam: parseFloat(values[idxJam]) || 0,
      downtime: values[idxDowntime] || '',
    };
  });
}

export function parseProductionData(): ProductionData[] {
  return parseCSV(RAW_CSV_DATA);
}

export function normalizeMachineName(mesin: string): string {
  if (!mesin) return '';
  const lowerMesin = mesin.toLowerCase().trim();
  if (lowerMesin.startsWith('bs')) {
    const numMatch = mesin.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0]) : 0;
    if (num >= 1 && num <= 8) return `BS ${num}`;
  } else if (lowerMesin.startsWith('poni a') || lowerMesin.startsWith('pony a')) {
    return 'Pony A';
  } else if (lowerMesin.startsWith('poni b') || lowerMesin.startsWith('pony b')) {
    return 'Pony B';
  } else if (lowerMesin === 'breakdown') {
    return 'Breakdown';
  }
  return mesin;
}

export function getSummaryStats(data: ProductionData[]): SummaryStats {
  const filteredBsOnly = data.filter(d => {
    if (!d.mesin || d.input <= 0) return false;
    const name = normalizeMachineName(d.mesin);
    return name.match(/^BS [1-8]$/);
  });
  
  const totalInput = filteredBsOnly.reduce((sum, d) => sum + d.input, 0);
  const totalUtama = filteredBsOnly.reduce((sum, d) => sum + d.utama, 0);
  const totalAllOutput = filteredBsOnly.reduce((sum, d) => sum + d.total, 0);
  
  // Real Yield = Total Utama / Total Input
  const avgYield = totalInput > 0 ? (totalUtama / totalInput) : 0;
  
  // Real Achievement = Total Actual / Total Target
  const totalTarget = filteredBsOnly.reduce((sum, d) => sum + d.target_total, 0);
  const avgAchievement = totalTarget > 0 ? (totalUtama / totalTarget) : 0;
  
  const uniqueMachines = 8; // Only counting BS 1 to BS 8
  
  let totalDowntimeMinutes = 0;
  filteredBsOnly.forEach(d => {
    if (d.downtime) {
      // Improved parsing for fragmented downtime strings
      const parts = d.downtime.split(/[;,]/);
      parts.forEach(part => {
        const match = part.match(/=(\d+)mnt/);
        if (match && match[1]) {
          totalDowntimeMinutes += parseInt(match[1]);
        }
      });
    }
  });

  return {
    totalInput: Math.round(totalInput * 100) / 100,
    totalUtama: Math.round(totalUtama * 100) / 100,
    totalAllOutput: Math.round(totalAllOutput * 100) / 100,
    avgYield: avgYield,
    avgAchievement: avgAchievement,
    totalMachines: uniqueMachines,
    totalDowntimeMinutes
  };
}

export function getPerformanceByMachine(data: ProductionData[]) {
  const machines: Record<string, { totalUtama: number; count: number }> = {
    'BS 1': { totalUtama: 0, count: 0 },
    'BS 2': { totalUtama: 0, count: 0 },
    'BS 3': { totalUtama: 0, count: 0 },
    'BS 4': { totalUtama: 0, count: 0 },
    'BS 5': { totalUtama: 0, count: 0 },
    'BS 6': { totalUtama: 0, count: 0 },
    'BS 7': { totalUtama: 0, count: 0 },
    'BS 8': { totalUtama: 0, count: 0 }
  };
  
  data.forEach(d => {
    if (d.mesin) {
      const name = normalizeMachineName(d.mesin);
      if (name.match(/^BS [1-8]$/)) {
        if (machines[name] !== undefined) {
          machines[name].totalUtama += d.utama;
          machines[name].count += 1;
        }
      }
    }
  });

  return Object.entries(machines).map(([name, stats]) => ({
    name,
    output: Math.round(stats.totalUtama * 100) / 100
  })).sort((a, b) => {
    // Sort logic to keep consistent: high output first, but for tie, by original machine name order
    if (b.output !== a.output) return b.output - a.output;
    return a.name.localeCompare(b.name);
  });
}

export interface TimeframePerformance {
  label: string;
  input: number;
  utama: number;
  yield: number;
}

export interface MachineRanking {
  mesin: string;
  line: string;
  input: number;
  utama: number;
  turunan: number;
  lokal: number;
  total: number;
  yield: number;
  achievement: number;
  downtime?: string[];
  score?: number;
  pilotLadder?: number;
  utamaNonPilotLadder?: number;
  yieldTotal?: number;
}

export function getAvailablePeriods(data: ProductionData[]) {
  const weeks = new Set<number>();
  const months = new Set<number>();
  const dates = new Set<string>();
  data.forEach(d => {
    const hasValidDowntime = d.downtime && d.downtime.replace(/,/g, '').trim().length > 0 && d.downtime.toLowerCase().trim() !== 'libur';
    if (d.input > 0 || hasValidDowntime) {
      if (d.week) weeks.add(d.week);
      if (d.month) months.add(d.month);
      if (d.tanggal) dates.add(d.tanggal);
    }
  });

  // Ensure all active months (Bulan 1 s.d. Bulan 8, including Bulan 6 and Bulan 7)
  // and all weeks (Minggu 1 s.d. Minggu 33+) are present and selectable in filters
  const maxMonth = Math.max(8, ...Array.from(months));
  for (let m = 1; m <= maxMonth; m++) {
    months.add(m);
  }

  const maxWeek = Math.max(33, ...Array.from(weeks));
  for (let w = 1; w <= maxWeek; w++) {
    weeks.add(w);
  }

  return {
    weeks: Array.from(weeks).sort((a, b) => b - a),
    months: Array.from(months).sort((a, b) => b - a),
    dates: Array.from(dates).sort((a, b) => b.localeCompare(a))
  };
}

export function getTodayMachineStats(data: ProductionData[]): { date: string, stats: MachineRanking[] } {
  const validData = data.filter(d => {
    if (!d.mesin || d.input <= 0) return false;
    const name = normalizeMachineName(d.mesin);
    return name.match(/^BS [1-8]$/) || 
           name === 'Pony A' || name === 'Pony B' || name === 'Breakdown';
  });
  if (validData.length === 0) return { date: '', stats: [] };
  
  const latestDate = validData.reduce((max, d) => d.tanggal > max ? d.tanggal : max, validData[0].tanggal);
  const todayData = validData.filter(d => d.tanggal === latestDate);
  
  const statsMap = new Map<string, any>();
  const ALL_MACHINES = ['BS 1', 'BS 2', 'BS 3', 'BS 4', 'BS 5', 'BS 6', 'BS 7', 'BS 8', 'Pony A', 'Pony B', 'Breakdown'];
  ALL_MACHINES.forEach(machine => {
    statsMap.set(machine, {
      mesin: machine,
      line: machine.startsWith('BS') ? `Line ${machine.replace('BS ', '')}` : machine,
      input: 0,
      utama: 0,
      turunan: 0,
      lokal: 0,
      total: 0,
      yield: 0,
      achievement: 0,
      target_total: 0,
      pilotLadder: 0,
      utamaNonPilotLadder: 0,
      downtime: []
    });
  });
  
  todayData.forEach(d => {
    const normalizedMesin = normalizeMachineName(d.mesin);
    
    if (!statsMap.has(normalizedMesin)) {
      statsMap.set(normalizedMesin, {
        mesin: normalizedMesin,
        line: d.line,
        input: 0,
        utama: 0,
        turunan: 0,
        lokal: 0,
        total: 0,
        yield: 0,
        achievement: 0,
        target_total: 0,
        pilotLadder: 0,
        utamaNonPilotLadder: 0,
        downtime: []
      });
    }
    
    const stat = statsMap.get(normalizedMesin);
    stat.input += d.input || 0;
    stat.utama += d.utama || 0;
    stat.turunan += d.turunan || 0;
    stat.lokal += d.lokal || 0;
    stat.total += d.total || 0;
    stat.target_total += d.target_total || 0;
    stat.pilotLadder += d.pilotLadder || 0;
    stat.utamaNonPilotLadder += d.utamaNonPilotLadder || 0;
    // Assume yield/achievement are recalculated or taken from totals
    stat.yield = stat.input > 0 ? (stat.utama / stat.input) : 0;
    // For achievement, use sum of target if it exists, otherwise keep average/last
    stat.achievement = stat.target_total > 0 ? (stat.utama / stat.target_total) : (stat.achievement || d.achievement);
    
    if (d.downtime && d.downtime.replace(/,/g, '').trim().length > 0 && d.downtime.toLowerCase().trim() !== 'libur') {
      const parts = d.downtime.split(/[;,]/).filter(p => p.replace(/,/g, '').trim().length > 0);
      stat.downtime.push(...parts.map(p => p.replace('=', ': ').trim()));
    }
  });
  
  const stats = Array.from(statsMap.values()).sort((a, b) => {
    const getOrder = (m: string) => {
      if (m.startsWith('BS')) {
        return parseInt(m.replace(/\D/g, '')) || 0;
      }
      if (m === 'Pony A' || m === 'Poni A') return 100;
      if (m === 'Pony B' || m === 'Poni B') return 101;
      if (m === 'Breakdown') return 102;
      return 200;
    };
    return getOrder(a.mesin) - getOrder(b.mesin);
  });
  
  return { date: latestDate, stats };
}

export function getMachineRankings(data: ProductionData[], periodType: 'weekly' | 'monthly', periodValue: number): MachineRanking[] {
  const filtered = data.filter(d => {
    if (!d.mesin || d.input <= 0) return false;
    const name = normalizeMachineName(d.mesin);
    if (!name.match(/^BS [1-8]$/)) return false;

    return (periodType === 'weekly' && d.week === periodValue) || 
           (periodType === 'monthly' && d.month === periodValue);
  });

  const machines: Record<string, { line: string, input: number; utama: number, turunan: number, lokal: number, total: number, target: number }> = {
    'BS 1': { line: 'Line 1', input: 0, utama: 0, turunan: 0, lokal: 0, total: 0, target: 0 },
    'BS 2': { line: 'Line 2', input: 0, utama: 0, turunan: 0, lokal: 0, total: 0, target: 0 },
    'BS 3': { line: 'Line 3', input: 0, utama: 0, turunan: 0, lokal: 0, total: 0, target: 0 },
    'BS 4': { line: 'Line 4', input: 0, utama: 0, turunan: 0, lokal: 0, total: 0, target: 0 },
    'BS 5': { line: 'Line 5', input: 0, utama: 0, turunan: 0, lokal: 0, total: 0, target: 0 },
    'BS 6': { line: 'Line 6', input: 0, utama: 0, turunan: 0, lokal: 0, total: 0, target: 0 },
    'BS 7': { line: 'Line 7', input: 0, utama: 0, turunan: 0, lokal: 0, total: 0, target: 0 },
    'BS 8': { line: 'Line 8', input: 0, utama: 0, turunan: 0, lokal: 0, total: 0, target: 0 }
  };

  filtered.forEach(d => {
    const normalizedMesin = normalizeMachineName(d.mesin);
    if (!machines[normalizedMesin]) machines[normalizedMesin] = { line: d.line, input: 0, utama: 0, turunan: 0, lokal: 0, total: 0, target: 0 };
    machines[normalizedMesin].input += d.input || 0;
    machines[normalizedMesin].utama += d.utama || 0;
    machines[normalizedMesin].turunan += d.turunan || 0;
    machines[normalizedMesin].lokal += d.lokal || 0;
    machines[normalizedMesin].total += d.total || 0;
    machines[normalizedMesin].target += d.target_total || 0;
  });

  const parsed = Object.entries(machines).map(([mesin, stats]) => ({
    mesin,
    line: stats.line,
    input: Math.round(stats.input * 100) / 100,
    utama: Math.round(stats.utama * 100) / 100,
    turunan: Math.round(stats.turunan * 100) / 100,
    lokal: Math.round(stats.lokal * 100) / 100,
    total: Math.round(stats.total * 100) / 100,
    target: stats.target,
    yield: stats.input > 0 ? stats.utama / stats.input : 0,
    achievement: stats.target > 0 ? stats.utama / stats.target : 0
  }));

  return parsed.map(m => {
    // perhitungan bobot rendemen utama (target 30%) x 40%
    const scoreUtama = ((m.yield * 100) / 30) * 40;
    
    // perhitungan bobot rendemen total (target 65%) x 30%
    const yieldTotalPercent = m.input > 0 ? (m.total / m.input) * 100 : 0;
    const scoreYTotal = (yieldTotalPercent / 65) * 30;
    
    // perhitungan bobot output total (target 225) x 30%
    const scoreOutput = (m.total / 225) * 30;
    
    const score = scoreUtama + scoreYTotal + scoreOutput;
    return { ...m, yieldTotal: yieldTotalPercent, score };
  }).sort((a, b) => (b.score || 0) - (a.score || 0));
}

export function getPerformanceByTimeframe(data: ProductionData[], type: 'daily' | 'weekly' | 'monthly' | 'quarterly'): TimeframePerformance[] {
  const filtered = data.filter(d => {
    if (!d.mesin || d.input <= 0) return false;
    const name = normalizeMachineName(d.mesin);
    return name.match(/^BS [1-8]$/);
  });
  const groups: Record<string, { input: number; utama: number }> = {};

  filtered.forEach(d => {
    let key = '';
    if (type === 'daily') {
      key = d.tanggal;
    } else if (type === 'weekly') {
      key = `Week ${d.week}`;
    } else if (type === 'monthly') {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      key = monthNames[d.month - 1] || `Month ${d.month}`;
    } else if (type === 'quarterly') {
      key = `Q${d.quartal}`;
    }

    if (!groups[key]) groups[key] = { input: 0, utama: 0 };
    groups[key].input += d.input;
    groups[key].utama += d.utama;
  });

  return Object.entries(groups).map(([label, stats]) => ({
    label,
    input: Math.round(stats.input * 100) / 100,
    utama: Math.round(stats.utama * 100) / 100,
    yield: stats.input > 0 ? (stats.utama / stats.input) : 0
  })).sort((a, b) => {
    if (type === 'daily') return new Date(a.label).getTime() - new Date(b.label).getTime();
    if (type === 'monthly') {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return monthNames.indexOf(a.label) - monthNames.indexOf(b.label);
    }
    const numA = parseInt(a.label.replace(/[^\d]/g, '')) || 0;
    const numB = parseInt(b.label.replace(/[^\d]/g, '')) || 0;
    return numA - numB;
  });
}


async function fetchChunkedData<T>(collectionName: string): Promise<T[] | null> {
  try {
    const infoDoc = await getDoc(doc(db, 'dashboard_data', collectionName + '_info'));
    if (!infoDoc.exists()) return null;
    
    const numChunks = infoDoc.data().numChunks || 0;
    if (numChunks === 0) return null;

    // Fetch all chunks in parallel for maximum speed
    const chunkPromises = [];
    for (let i = 0; i < numChunks; i++) {
      chunkPromises.push(getDoc(doc(db, 'dashboard_data', collectionName + '_chunk_' + i)));
    }
    
    const chunkDocs = await Promise.all(chunkPromises);
    let allData: T[] = [];
    for (const chunkDoc of chunkDocs) {
      if (chunkDoc.exists()) {
        const chunkData = chunkDoc.data()?.data;
        if (Array.isArray(chunkData)) {
          allData = allData.concat(chunkData);
        }
      }
    }
    return allData.length > 0 ? allData : null;
  } catch (error) {
    console.error('Error reading from Firestore:', error);
    return null;
  }
}


export function parseAnalisaOperatorSheet(csvData: string): { prodData: ProductionData[], detailData: AnalisaOperatorDetailData[] } {
  const parsed = Papa.parse<string[]>(csvData.trim(), { skipEmptyLines: true });
  if (!parsed.data || parsed.data.length <= 1) {
    return { prodData: [], detailData: [] };
  }

  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', mei: '05',
    jun: '06', jul: '07', aug: '08', agu: '08', sep: '09', oct: '10', okt: '10',
    nov: '11', dec: '12', des: '12'
  };

  function getISOWeek(d: Date): number {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  }

  const prodList: ProductionData[] = [];
  const detailList: AnalisaOperatorDetailData[] = [];

  for (let i = 1; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rawDate = (row[1] || '').trim();
    if (!rawDate) continue;
    let formattedDate = rawDate;
    const parts = rawDate.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const m = monthMap[parts[1].toLowerCase()] || parts[1].padStart(2, '0');
        formattedDate = `${parts[0]}-${m}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        const m = monthMap[parts[1].toLowerCase()] || parts[1].padStart(2, '0');
        formattedDate = `${parts[2]}-${m}-${parts[0].padStart(2, '0')}`;
      }
    }
    const mesin = (row[2] || '').trim();
    if (!mesin) continue;

    const dtParts = formattedDate.split('-');
    let m = parseInt(row[0]) || 8;
    let w = 31;
    if (dtParts.length === 3) {
      const yr = parseInt(dtParts[0]);
      const mo = parseInt(dtParts[1]);
      const dy = parseInt(dtParts[2]);
      if (!isNaN(yr) && !isNaN(mo) && !isNaN(dy)) {
        m = mo;
        w = getISOWeek(new Date(yr, mo - 1, dy));
      }
    }

    const yUtama = parseFloat((row[3] || '').replace('%', '')) / 100 || 0;
    const yTotal = parseFloat((row[4] || '').replace('%', '')) / 100 || 0;
    const hariKerja = parseInt(row[12]) || 0;

    let vol = 0;
    const pPanjang = row[17] || '';
    const mPanjang = pPanjang.match(/=\s*([0-9.]+)/g);
    if (mPanjang) {
      mPanjang.forEach(x => { vol += parseFloat(x.replace('=', '').trim()) || 0; });
    }
    if (vol === 0) {
      const pDia = row[16] || '';
      const mDia = pDia.match(/=\s*([0-9.]+)/g);
      if (mDia) {
        mDia.forEach(x => { vol += parseFloat(x.replace('=', '').trim()) || 0; });
      }
    }
    if (hariKerja > 0 && vol === 0) {
      vol = (yUtama > 0 || yTotal > 0) ? 6.0 : 0;
    }
    if (hariKerja === 0 && yUtama === 0 && yTotal === 0) {
      vol = 0;
    }

    const input = Math.round(vol * 10000) / 10000;
    const utama = Math.round(input * yUtama * 10000) / 10000;
    const total = Math.round(input * yTotal * 10000) / 10000;
    const turunan = Math.round(Math.max(0, total - utama) * 10000) / 10000;

    prodList.push({
      tanggal: formattedDate,
      mesin: mesin,
      line: parseInt(mesin.replace(/\D/g, '')) <= 4 ? 'Line 1' : 'Line 2',
      input: input,
      utama: utama,
      yield_primary: yUtama,
      turunan: turunan,
      yield_secondary: input > 0 ? Math.round((turunan / input) * 10000) / 10000 : 0,
      lokal: 0,
      total: total,
      yield_total: yTotal,
      target_total: 9,
      achievement: 9 > 0 ? Math.round((utama / 9) * 10000) / 10000 : 0,
      week: w,
      month: m,
      quartal: Math.ceil(m / 3),
      point: 0,
      durasi: 0,
      pilotLadder: 0,
      utamaNonPilotLadder: 0,
      jam: 0,
      downtime: row[5] || ''
    });

    detailList.push({
      tanggal: formattedDate,
      mesin: normalizeMachineName(mesin),
      rkOrderan: row[14] || '',
      komposisiLog: row[15] || '',
      komposisiDiameterLog: row[16] || '',
      komposisiPanjangLog: row[17] || '',
      potUjung: row[18] || '',
      fotoBahanBaku1: row[19] || '',
      fotoBahanBaku2: row[20] || '',
      fotoBahanBaku3: row[21] || ''
    });
  }

  return { prodData: prodList, detailData: detailList };
}

export async function fetchAnalisaOperatorDataFromSheet(): Promise<ProductionData[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("Analisa Operator ")}`;
  const fallbackUrl = `https://docs.google.com/spreadsheets/d/18utqaTIADTvxx2jEErSMXNozvmdogaBh3z-0Myc1Hzs/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("Analisa Operator")}`;

  try {
    let response = await fetch(url);
    if (!response.ok) {
      response = await fetch(fallbackUrl);
    }
    if (!response.ok) throw new Error('Failed to fetch analisa operator data');
    const csvData = await response.text();
    const { prodData } = parseAnalisaOperatorSheet(csvData);

    if (prodData.length > 0) {
      const map = new Map<string, ProductionData>();
      STATIC_ANALISA_OPERATOR_DATA.forEach(d => {
        const key = `${d.tanggal}_${normalizeMachineName(d.mesin)}`;
        map.set(key, d);
      });
      prodData.forEach(d => {
        const key = `${d.tanggal}_${normalizeMachineName(d.mesin)}`;
        map.set(key, d);
      });
      return Array.from(map.values());
    }
  } catch (error) {
    console.error('Error fetching analisa operator data:', error);
  }

  return STATIC_ANALISA_OPERATOR_DATA;
}

export async function fetchAnalisaOperatorData(): Promise<ProductionData[]> {
  const fsData = await fetchChunkedData<ProductionData>('analisaOperatorData');
  if (fsData && fsData.length > 0 && fsData.some(d => d.month === 8)) {
    const map = new Map<string, ProductionData>();
    STATIC_ANALISA_OPERATOR_DATA.forEach(d => {
      const key = `${d.tanggal}_${normalizeMachineName(d.mesin)}`;
      map.set(key, d);
    });
    fsData.forEach(d => {
      const key = `${d.tanggal}_${normalizeMachineName(d.mesin)}`;
      map.set(key, d);
    });
    return Array.from(map.values());
  }
  return fetchAnalisaOperatorDataFromSheet();
}

export async function fetchAnalisaOperatorDetailDataFromSheet(): Promise<AnalisaOperatorDetailData[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("Analisa Operator ")}`;
  const fallbackUrl = `https://docs.google.com/spreadsheets/d/18utqaTIADTvxx2jEErSMXNozvmdogaBh3z-0Myc1Hzs/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("Analisa Operator")}`;

  try {
    let response = await fetch(url);
    if (!response.ok) {
      response = await fetch(fallbackUrl);
    }
    if (!response.ok) throw new Error('Failed to fetch analisa operator detail');
    const csvData = await response.text();
    const { detailData } = parseAnalisaOperatorSheet(csvData);

    if (detailData.length > 0) {
      const map = new Map<string, AnalisaOperatorDetailData>();
      STATIC_ANALISA_OPERATOR_DETAIL.forEach(d => {
        const key = `${d.tanggal}_${normalizeMachineName(d.mesin)}`;
        map.set(key, d);
      });
      detailData.forEach(d => {
        const key = `${d.tanggal}_${normalizeMachineName(d.mesin)}`;
        map.set(key, d);
      });
      return Array.from(map.values());
    }
  } catch (error) {
    console.error('Error fetching analisa operator detail:', error);
  }

  return STATIC_ANALISA_OPERATOR_DETAIL;
}

export async function fetchAnalisaOperatorDetailData(): Promise<AnalisaOperatorDetailData[]> {
  const fsData = await fetchChunkedData<AnalisaOperatorDetailData>('analisaOperatorDetail');
  if (fsData && fsData.length > 0 && fsData.some(d => (d.tanggal || '').includes('2026-08'))) {
    const map = new Map<string, AnalisaOperatorDetailData>();
    STATIC_ANALISA_OPERATOR_DETAIL.forEach(d => {
      const key = `${d.tanggal}_${normalizeMachineName(d.mesin)}`;
      map.set(key, d);
    });
    fsData.forEach(d => {
      const key = `${d.tanggal}_${normalizeMachineName(d.mesin)}`;
      map.set(key, d);
    });
    return Array.from(map.values());
  }
  return fetchAnalisaOperatorDetailDataFromSheet();
}

export async function fetchOperatorData(): Promise<OperatorData[]> {
  const fsData = await fetchChunkedData<OperatorData>('operator');
  if (fsData) return fsData;
  return fetchOperatorDataFromSheet();
}

export async function fetchProductionData(): Promise<ProductionData[]> {
  const staticData = getStaticBaselineData();
  const fsData = await fetchChunkedData<ProductionData>('production');
  if (fsData && fsData.length > 0) {
    const map = new Map<string, ProductionData>();
    staticData.forEach(d => {
      const key = `${(d.tanggal || '').trim()}_${normalizeMachineName(d.mesin)}`;
      map.set(key, d);
    });
    fsData.forEach(d => {
      const key = `${(d.tanggal || '').trim()}_${normalizeMachineName(d.mesin)}`;
      map.set(key, d);
    });
    return Array.from(map.values());
  }
  return fetchProductionDataFromSheet();
}

export async function fetchSupplierData(): Promise<SupplierData[]> {
  const fsData = await fetchChunkedData<SupplierData>('supplier');
  if (fsData) return fsData;
  return fetchSupplierDataFromSheet();
}

export async function fetchMonthlyLogData(): Promise<MonthlyLogData[]> {
  const fsData = await fetchChunkedData<MonthlyLogData>('monthlyLog');
  if (fsData) return fsData;
  return fetchMonthlyLogDataFromSheet();
}

const CHUNK_SIZE = 500;

async function saveInChunks(collectionName: string, dataArray: any[], onProgress?: (msg: string) => void) {
  if (onProgress) onProgress('Saving ' + collectionName + ' (' + dataArray.length + ' rows)...');
  
  const numChunks = Math.ceil(dataArray.length / CHUNK_SIZE);
  
  // Save info doc
  await setDoc(doc(db, 'dashboard_data', collectionName + '_info'), { 
    numChunks, 
    lastUpdated: new Date().toISOString(),
    totalRows: dataArray.length
  });
  
  // We can use a batch for chunks since there are max ~8 chunks (4000 rows / 500)
  // Firestore batch limit is 500 operations. We are doing max 10 operations here.
  const batch = writeBatch(db);
  for (let i = 0; i < numChunks; i++) {
    const chunkData = dataArray.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkRef = doc(db, 'dashboard_data', collectionName + '_chunk_' + i);
    batch.set(chunkRef, { data: chunkData });
  }
  await batch.commit();
}

export async function syncSpreadsheetToFirestore(onProgress?: (msg: string) => void) {
  try {
    if (onProgress) onProgress('Fetching Production Data from Sheet...');
    const prod = await fetchProductionDataFromSheet();
    await saveInChunks('production', prod, onProgress);

    if (onProgress) onProgress('Fetching Operator Data from Sheet...');
    const op = await fetchOperatorDataFromSheet();
    await saveInChunks('operator', op, onProgress);

    if (onProgress) onProgress('Fetching Supplier Data from Sheet...');
    const supp = await fetchSupplierDataFromSheet();
    await saveInChunks('supplier', supp, onProgress);

    if (onProgress) onProgress('Fetching Monthly Log Data from Sheet...');
    const monthly = await fetchMonthlyLogDataFromSheet();
    await saveInChunks('monthlyLog', monthly, onProgress);

    if (onProgress) onProgress('Fetching Analisa Operator Detail from Sheet...');
    const analisaDetail = await fetchAnalisaOperatorDetailDataFromSheet();
    await saveInChunks('analisaOperatorDetail', analisaDetail, onProgress);

    if (onProgress) onProgress('Fetching Log Dikerjakan from Sheet...');
    const logDikerjakan = await fetchLogDikerjakanFromSheet();
    await saveInChunks('logDikerjakan', logDikerjakan, onProgress);

    if (onProgress) onProgress('Fetching Analisa Operator Data from Sheet...');
    const analisaOpData = await fetchAnalisaOperatorDataFromSheet();
    await saveInChunks('analisaOperatorData', analisaOpData, onProgress);

    if (onProgress) onProgress('Sync Complete!');
  } catch (error: any) {
    console.error("Sync Error:", error);
    if (onProgress) onProgress('Error: ' + error.message);
    throw error;
  }
}

export async function autoSyncSpreadsheetUpdates(
  currentProd: ProductionData[], 
  currentSupp: SupplierData[], 
  currentMonth: MonthlyLogData[], 
  currentOp: OperatorData[],
  currentAnalisaDetail: import('../types').AnalisaOperatorDetailData[],
  currentLogDikerjakan: import('../types').LogDikerjakanData[],
  currentAnalisaOpData: ProductionData[],
  onUpdateDetected: (prod: ProductionData[], supp: SupplierData[], month: MonthlyLogData[], op: OperatorData[], analisaDetail: import('../types').AnalisaOperatorDetailData[], logDikerjakan: import('../types').LogDikerjakanData[], analisaOpData: ProductionData[]) => void
) {
  try {
    const [newProd, newSupp, newMonth, newOp, newAnalisaDetail, newLogDikerjakan, newAnalisaOpData] = await Promise.all([
      fetchProductionDataFromSheet(),
      fetchSupplierDataFromSheet(),
      fetchMonthlyLogDataFromSheet(),
      fetchOperatorDataFromSheet(),
      fetchAnalisaOperatorDetailDataFromSheet(),
      fetchLogDikerjakanFromSheet(),
      fetchAnalisaOperatorDataFromSheet()
    ]);

    // Ultra fast dataset comparison
    const isDifferent = 
      !isDatasetEqual(currentProd, newProd) ||
      !isDatasetEqual(currentSupp, newSupp) ||
      !isDatasetEqual(currentMonth, newMonth) ||
      !isDatasetEqual(currentOp, newOp) ||
      !isDatasetEqual(currentAnalisaDetail, newAnalisaDetail) ||
      !isDatasetEqual(currentLogDikerjakan, newLogDikerjakan) ||
      !isDatasetEqual(currentAnalisaOpData, newAnalisaOpData);

    if (isDifferent) {
      console.log('Update detected in spreadsheet! Updating UI and syncing to Firestore...');
      // Update UI state immediately for responsive experience
      onUpdateDetected(newProd, newSupp, newMonth, newOp, newAnalisaDetail, newLogDikerjakan, newAnalisaOpData);

      // Now save the new data to Firestore in chunks in the background
      await saveInChunks('production', newProd);
      await saveInChunks('operator', newOp);
      await saveInChunks('supplier', newSupp);
      await saveInChunks('monthlyLog', newMonth);
      await saveInChunks('analisaOperatorDetail', newAnalisaDetail);
      await saveInChunks('logDikerjakan', newLogDikerjakan);
      await saveInChunks('analisaOperatorData', newAnalisaOpData);
      
      console.log('Auto-sync to Firestore complete.');
    } else {
      console.log('Spreadsheet is up-to-date.');
    }
  } catch (error) {
    console.error('Auto-sync background check failed:', error);
  }
}

export async function fetchLogDikerjakanFromSheet(): Promise<LogDikerjakanData[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Log_Dikerjakan`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch data');
    const csvData = await response.text();
    return parseLogDikerjakanCSV(csvData);
  } catch (error) {
    console.error('Error fetching Log_dikerjakan data:', error);
    return [];
  }
}

function parseLogDikerjakanCSV(csv: string): LogDikerjakanData[] {
  const parsed = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true });
  if (!parsed.data || parsed.data.length <= 1) return [];
  
  // Find column indices based on possible headers
  const headers = parsed.data[0].map(h => h.trim().toLowerCase());
  const idxSubBagian = headers.findIndex(h => h.includes('sub'));
  const idxTanggal = headers.findIndex(h => h.includes('tanggal'));
  const idxNomerLog = headers.findIndex(h => h.includes('nomor') || h.includes('nomer'));
  const idxJenisKayu = headers.findIndex(h => h.includes('jenis'));
  const idxDiameter = headers.findIndex(h => h.includes('diameter'));
  const idxPanjang = headers.findIndex(h => h.includes('panjang'));
  const idxVolume = headers.findIndex(h => h.includes('volume'));
  const idxMesin = headers.findIndex(h => h.includes('mesin'));
  const idxCatatan = headers.findIndex(h => h.includes('catatan'));
  const idxFoto = headers.findIndex(h => h.includes('foto'));
  const idxTimestamp = headers.findIndex(h => h.includes('timestamp') || h.includes('waktu'));

  return parsed.data.slice(1).map(values => {
    // Extract raw strings
    const rawSubBagian = idxSubBagian !== -1 ? (values[idxSubBagian] || '') : (values[0] || '');
    const rawTanggal = idxTanggal !== -1 ? (values[idxTanggal] || '') : (values[1] || '');
    const mNomerLog = idxNomerLog !== -1 ? (values[idxNomerLog] || '') : (values[2] || '');
    const mJenisKayu = idxJenisKayu !== -1 ? (values[idxJenisKayu] || '') : (values[3] || '');
    const mDiameter = idxDiameter !== -1 ? (values[idxDiameter] || '') : (values[4] || '');
    const mPanjang = idxPanjang !== -1 ? (values[idxPanjang] || '') : (values[5] || '');
    const rawVolume = idxVolume !== -1 ? (values[idxVolume] || '0') : (values[6] || '0');
    const rawMesin = idxMesin !== -1 ? (values[idxMesin] || '') : (values[7] || '');
    const mCatatan = idxCatatan !== -1 ? (values[idxCatatan] || '') : (values[8] || '');
    const mFotoLog = idxFoto !== -1 ? (values[idxFoto] || '') : (values[9] || '');
    const mTimestamp = idxTimestamp !== -1 ? (values[idxTimestamp] || '') : (values[10] || '');
    
    // Clean Mesin & parse Operator (e.g. "Mesin BS 5 / Sello Kencono" -> machine: "Mesin BS 5", operator: "Sello Kencono")
    let mMesin = rawMesin.trim();
    let mOperator = '';
    if (mMesin.includes('/')) {
      const parts = mMesin.split('/');
      mMesin = parts[0].trim();
      mOperator = parts.slice(1).join('/').trim();
    }
    
    // Fix comma decimals if any, then parse
    const mVolume = parseFloat(rawVolume.replace(',', '.')) || 0;
    
    // Potongan logic: letter at the end of nomer log
    const match = mNomerLog.match(/([a-zA-Z])$/);
    const mPotongan = match ? match[1].toUpperCase() : '';

    // Standardize date to YYYY-MM-DD
    let normalizedDate = '';
    if (rawTanggal && rawTanggal.trim()) {
      const s = rawTanggal.trim();
      const parts = s.split(/[\/\-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          normalizedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          let d = parts[0].padStart(2, '0');
          let m = parts[1].padStart(2, '0');
          let y = parts[2];
          if (y.length === 2) y = '20' + y;
          normalizedDate = `${y}-${m}-${d}`;
        }
      }
    }
    if (!normalizedDate && mTimestamp && mTimestamp.trim()) {
      const datePart = mTimestamp.trim().split(' ')[0];
      const parts = datePart.split(/[\/\-]/);
      if (parts.length === 3) {
        let m = parts[0].padStart(2, '0');
        let d = parts[1].padStart(2, '0');
        let y = parts[2];
        if (y.length === 2) y = '20' + y;
        normalizedDate = `${y}-${m}-${d}`;
      }
    }

    return {
      mesin: mMesin,
      operator: mOperator,
      nomer_log: mNomerLog.trim(),
      tanggal: normalizedDate,
      rawTanggal: rawTanggal.trim(),
      subBagian: rawSubBagian.trim(),
      jenisKayu: mJenisKayu.trim(),
      panjang: mPanjang.trim(),
      diameter: mDiameter.trim(),
      volume: mVolume,
      potongan: mPotongan,
      catatan: mCatatan.trim(),
      fotoLog: mFotoLog.trim(),
      timestamp: mTimestamp.trim()
    };
  }).filter(row => {
    return Boolean(row.mesin && row.nomer_log);
  }).filter((row, idx, self) => {
    // Block / filter duplicate log numbers (exact same nomer_log on the same date or same log entry)
    const key = row.tanggal
      ? `${row.tanggal}_${row.nomer_log.toUpperCase()}`
      : `${row.mesin.toUpperCase()}_${row.nomer_log.toUpperCase()}`;
    return self.findIndex(r => {
      const rKey = r.tanggal
        ? `${r.tanggal}_${r.nomer_log.toUpperCase()}`
        : `${r.mesin.toUpperCase()}_${r.nomer_log.toUpperCase()}`;
      return rKey === key;
    }) === idx;
  });
}

export async function fetchLogDikerjakan(): Promise<import('../types').LogDikerjakanData[]> {
  const fsData = await fetchChunkedData<import('../types').LogDikerjakanData>('logDikerjakan');
  if (fsData && fsData.length > 0) return fsData;
  return fetchLogDikerjakanFromSheet();
}
