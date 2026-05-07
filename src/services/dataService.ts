import { RAW_CSV_DATA } from '../data/raw_data';
import { ProductionData, SummaryStats } from '../types';

export async function fetchProductionData(): Promise<ProductionData[]> {
  const SPREADSHEET_ID = '1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ';
  const GID = '0'; // Assuming first sheet, or you can specify GID
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch data');
    const csvData = await response.text();
    return parseCSV(csvData);
  } catch (error) {
    console.error('Error fetching production data:', error);
    // Fallback to static data on error
    return parseCSV(RAW_CSV_DATA);
  }
}

function parseCSV(csv: string): ProductionData[] {
  const lines = csv.trim().split('\n');
  
  const parseLine = (line: string) => {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      if (line[i] === ',' && !inQuotes) {
        result.push(line.substring(start, i));
        start = i + 1;
      }
    }
    result.push(line.substring(start));
    return result.map(v => v.replace(/^"|"$/g, '').trim());
  };

  return lines.slice(1).map(line => {
    const values = parseLine(line);
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
      jam: parseFloat(values[18]) || 0,
      downtime: values[19] || '',
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
  } else if (lowerMesin.startsWith('poni a')) {
    return 'Poni A';
  } else if (lowerMesin.startsWith('poni b')) {
    return 'Poni B';
  } else if (lowerMesin === 'breakdown') {
    return 'Breakdown';
  }
  return mesin;
}

export function getSummaryStats(data: ProductionData[]): SummaryStats {
  const filtered = data.filter(d => {
    if (!d.mesin || d.input <= 0) return false;
    const lowerMesin = d.mesin.toLowerCase().trim();
    return (lowerMesin.startsWith('bs') || lowerMesin.startsWith('poni') || lowerMesin === 'breakdown');
  });
  
  const totalInput = filtered.reduce((sum, d) => sum + d.input, 0);
  const totalUtama = filtered.reduce((sum, d) => sum + d.utama, 0);
  const totalAllOutput = filtered.reduce((sum, d) => sum + d.total, 0);
  
  // Real Yield = Total Utama / Total Input
  const avgYield = totalInput > 0 ? (totalUtama / totalInput) : 0;
  
  // Real Achievement = Total Actual / Total Target
  const totalTarget = filtered.reduce((sum, d) => sum + d.target_total, 0);
  const avgAchievement = totalTarget > 0 ? (totalUtama / totalTarget) : 0;
  
  const uniqueMachines = 11; // Hardcoded total operational machines in the factory
  
  let totalDowntimeMinutes = 0;
  data.forEach(d => {
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
    'BS 8': { totalUtama: 0, count: 0 },
    'Poni A': { totalUtama: 0, count: 0 },
    'Poni B': { totalUtama: 0, count: 0 },
    'Breakdown': { totalUtama: 0, count: 0 }
  };
  
  data.forEach(d => {
    if (d.mesin) {
      const lowerMesin = d.mesin.toLowerCase().trim();
      if (lowerMesin.startsWith('bs') || lowerMesin.startsWith('poni') || lowerMesin === 'breakdown') {
        const normalizedMesin = normalizeMachineName(d.mesin);
        if (machines[normalizedMesin] !== undefined) {
          machines[normalizedMesin].totalUtama += d.utama;
          machines[normalizedMesin].count += 1;
        } else {
          // If we somehow get a new valid machine not in our list
          machines[normalizedMesin] = { totalUtama: d.utama, count: 1 };
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
  return {
    weeks: Array.from(weeks).sort((a, b) => b - a),
    months: Array.from(months).sort((a, b) => b - a),
    dates: Array.from(dates).sort((a, b) => b.localeCompare(a))
  };
}

export function getTodayMachineStats(data: ProductionData[]): { date: string, stats: MachineRanking[] } {
  const validData = data.filter(d => {
    if (!d.mesin || d.input <= 0) return false;
    const lowerMesin = d.mesin.toLowerCase().trim();
    return lowerMesin.startsWith('bs') || lowerMesin.startsWith('poni') || lowerMesin === 'breakdown';
  });
  if (validData.length === 0) return { date: '', stats: [] };
  
  const latestDate = validData.reduce((max, d) => d.tanggal > max ? d.tanggal : max, validData[0].tanggal);
  const todayData = validData.filter(d => d.tanggal === latestDate);
  
  const statsMap = new Map<string, any>();
  const ALL_MACHINES = ['BS 1', 'BS 2', 'BS 3', 'BS 4', 'BS 5', 'BS 6', 'BS 7', 'BS 8', 'Poni A', 'Poni B', 'Breakdown'];
  ALL_MACHINES.forEach(machine => {
    statsMap.set(machine, {
      mesin: machine,
      line: machine.startsWith('BS') ? `Line ${machine.replace('BS ', '')}` : '-',
      input: 0,
      utama: 0,
      turunan: 0,
      lokal: 0,
      total: 0,
      yield: 0,
      achievement: 0,
      target_total: 0,
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
      if (m === 'Poni A') return 100;
      if (m === 'Poni B') return 101;
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
    const lowerMesin = d.mesin.toLowerCase().trim();
    if (!lowerMesin.startsWith('bs')) return false;

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

  return Object.entries(machines).map(([mesin, stats]) => ({
    mesin,
    line: stats.line,
    input: Math.round(stats.input * 100) / 100,
    utama: Math.round(stats.utama * 100) / 100,
    turunan: Math.round(stats.turunan * 100) / 100,
    lokal: Math.round(stats.lokal * 100) / 100,
    total: Math.round(stats.total * 100) / 100,
    yield: stats.input > 0 ? stats.utama / stats.input : 0,
    achievement: stats.target > 0 ? stats.utama / stats.target : 0
  })).sort((a, b) => b.utama - a.utama);
}

export function getPerformanceByTimeframe(data: ProductionData[], type: 'daily' | 'weekly' | 'monthly' | 'quarterly'): TimeframePerformance[] {
  const filtered = data.filter(d => {
    if (!d.mesin || d.input <= 0) return false;
    const lowerMesin = d.mesin.toLowerCase().trim();
    return (lowerMesin.startsWith('bs') || lowerMesin.startsWith('poni') || lowerMesin === 'breakdown');
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
