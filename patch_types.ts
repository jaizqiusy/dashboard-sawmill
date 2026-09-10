import { readFileSync, writeFileSync } from 'fs';
const file = 'src/types.ts';
let content = readFileSync(file, 'utf-8');

const oldType = `export interface OrderUrgentData {
  ukuran: string;
  panjang: string;
  jo: string;
  target: number;
  h1: number | null;
  hariIni: number | null;
  realisasi: number;
  status: 'selesai' | 'kurang';
}`;

const newType = `export interface OrderUrgentData {
  ukuran: string;
  panjang: string;
  jo: string;
  target: number;
  h1: number | null;
  hariIni: number | null;
  realisasi: number;
  kekurangan: number;
  status: 'selesai' | 'kurang';
}`;

content = content.replace(oldType, newType);
writeFileSync(file, content);
