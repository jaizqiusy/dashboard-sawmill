
import { db } from '../firebase';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import Papa from 'papaparse';
import { RAW_CSV_DATA } from '../data/raw_data';
import { ProductionData, SummaryStats, SupplierData, MonthlyLogData, OperatorData } from '../types';

const SPREADSHEET_ID = '1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ';

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
  const staticData = parseCSV(RAW_CSV_DATA);
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

  return parsed.data.slice(1).map(values => {
    return {
      tanggal: values[0] || '',
      mesin: values[1] || '',
      line: values[2] || '',
      input: parseFloat(values[3]) || 0,
      utama: parseFloat(values[4]) || 0,
      yield_primary: parseFloat(values[5]) || 0,
      turunan: parseFloat(values[6]) || 0,
      yield_secondary: parseFloat(values[7]) || 0,
      lokal: parseFloat(values[8]) || 0,
      total: parseFloat(values[9]) || 0,
      yield_total: parseFloat(values[10]) || 0,
      target_total: parseFloat(values[11]) || 0,
      achievement: parseFloat(values[12]) || 0,
      week: parseInt(values[13]) || 0,
      month: parseInt(values[14]) || 0,
      quartal: parseInt(values[15]) || 0,
      point: parseInt(values[16]) || 0,
      durasi: parseFloat(values[17]) || 0,
      pilotLadder: parseFloat(values[18]) || 0,
      utamaNonPilotLadder: parseFloat(values[19]) || 0,
      jam: parseFloat(values[21]) || 0,
      downtime: values[22] || '',
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
    // perhitungan bobot rendemen utama x 40%
    const scoreUtama = (m.yield * 100) * 0.4;
    
    // perhitungan bobot rendemen total x 30%
    const yieldTotalPercent = m.input > 0 ? (m.total / m.input) * 100 : 0;
    const scoreYTotal = yieldTotalPercent * 0.3;
    
    // perhitungan bobot output total x 30%
    const scoreOutput = m.total * 0.3;
    
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
    
    const numChunks = infoDoc.data().numChunks;
    let allData: T[] = [];
    
    for (let i = 0; i < numChunks; i++) {
      const chunkDoc = await getDoc(doc(db, 'dashboard_data', collectionName + '_chunk_' + i));
      if (chunkDoc.exists()) {
        allData = allData.concat(chunkDoc.data().data);
      }
    }
    return allData.length > 0 ? allData : null;
  } catch (error) {
    console.error('Error reading from Firestore:', error);
    return null;
  }
}


export async function fetchAnalisaOperatorDetailDataFromSheet(): Promise<import('../types').AnalisaOperatorDetailData[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=analisa%20operator`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch analisa operator detail');
    const csvData = await response.text();
    const parsed = Papa.parse(csvData, { skipEmptyLines: true });
    if (!parsed.data || parsed.data.length < 3) return [];
    
    // mapping Indonesian month abbreviation to number
    const monthMap: Record<string, string> = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Mei': '05',
      'Jun': '06', 'Jul': '07', 'Aug': '08', 'Agu': '08', 'Sep': '09', 'Oct': '10', 'Okt': '10',
      'Nov': '11', 'Dec': '12', 'Des': '12'
    };

    return parsed.data.slice(2).map((values: any) => {
      // Date format is DD-MMM-YYYY e.g., 27-Jul-2026
      let formattedDate = values[1] || '';
      if (formattedDate) {
        const parts = formattedDate.split('-');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const monthStr = parts[1];
          const year = parts[2];
          const monthNum = monthMap[monthStr] || '01';
          formattedDate = `${year}-${monthNum}-${day}`;
        }
      }
      
      return {
        tanggal: formattedDate,
        mesin: normalizeMachineName(values[2] || ''),
        rkOrderan: values[14] || '',
        komposisiLog: values[15] || '',
        komposisiDiameterLog: values[16] || '',
        komposisiPanjangLog: values[17] || '',
        potUjung: values[18] || '',
        fotoBahanBaku1: values[19] || '',
        fotoBahanBaku2: values[20] || '',
        fotoBahanBaku3: values[21] || ''
      };
    }).filter((r: any) => r.tanggal && r.mesin);
  } catch (error) {
    console.error('Error fetching analisa operator detail:', error);
    return [];
  }
}

export async function fetchAnalisaOperatorDetailData(): Promise<import('../types').AnalisaOperatorDetailData[]> {
  const fsData = await fetchChunkedData<import('../types').AnalisaOperatorDetailData>('analisaOperatorDetail');
  if (fsData) return fsData;
  return fetchAnalisaOperatorDetailDataFromSheet();
}

export async function fetchOperatorData(): Promise<OperatorData[]> {
  const fsData = await fetchChunkedData<OperatorData>('operator');
  if (fsData) return fsData;
  return fetchOperatorDataFromSheet();
}

export async function fetchProductionData(): Promise<ProductionData[]> {
  const staticData = parseCSV(RAW_CSV_DATA);
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
  onUpdateDetected: (prod: ProductionData[], supp: SupplierData[], month: MonthlyLogData[], op: OperatorData[], analisaDetail: import('../types').AnalisaOperatorDetailData[]) => void
) {
  try {
    const [newProd, newSupp, newMonth, newOp, newAnalisaDetail] = await Promise.all([
      fetchProductionDataFromSheet(),
      fetchSupplierDataFromSheet(),
      fetchMonthlyLogDataFromSheet(),
      fetchOperatorDataFromSheet(),
      fetchAnalisaOperatorDetailDataFromSheet()
    ]);

    // Fast stringify check
    const isDifferent = 
      JSON.stringify(currentProd) !== JSON.stringify(newProd) ||
      JSON.stringify(currentSupp) !== JSON.stringify(newSupp) ||
      JSON.stringify(currentMonth) !== JSON.stringify(newMonth) ||
      JSON.stringify(currentOp) !== JSON.stringify(newOp) ||
      JSON.stringify(currentAnalisaDetail) !== JSON.stringify(newAnalisaDetail);

    if (isDifferent) {
      console.log('Update detected in spreadsheet! Updating UI and syncing to Firestore...');
      // Update UI state immediately for responsive experience
      onUpdateDetected(newProd, newSupp, newMonth, newOp, newAnalisaDetail);

      // Now save the new data to Firestore in chunks in the background
      await saveInChunks('production', newProd);
      await saveInChunks('operator', newOp);
      await saveInChunks('supplier', newSupp);
      await saveInChunks('monthlyLog', newMonth);
      await saveInChunks('analisaOperatorDetail', newAnalisaDetail);
      
      console.log('Auto-sync to Firestore complete.');
    } else {
      console.log('Spreadsheet is up-to-date.');
    }
  } catch (error) {
    console.error('Auto-sync background check failed:', error);
  }
}
