export interface ProductionData {
  tanggal: string;
  mesin: string;
  line: string;
  input: number;
  utama: number;
  yield_primary: number;
  turunan: number;
  yield_secondary: number;
  lokal: number;
  total: number;
  yield_total: number;
  target_total: number;
  achievement: number;
  week: number;
  month: number;
  quartal: number;
  point: number;
  durasi: number;
  jam: number;
  downtime: string;
}

export interface SummaryStats {
  totalInput: number;
  totalUtama: number;
  totalAllOutput: number;
  avgYield: number;
  avgAchievement: number;
  totalMachines: number;
  totalDowntimeMinutes: number;
}

export interface SupplierData {
  kode: string;
  supplier: string;
  input: number;
  utama: number;
  yieldUtama: number;
  turunan: number;
  yieldTurunan: number;
  export: number;
  yieldExport: number;
  lokalSuper: number;
  yieldLokalSuper: number;
  lokal: number;
  yieldLokal: number;
  totalLokal: number;
  yieldTotalLokal: number;
  total: number;
  yieldTotal: number;
}
