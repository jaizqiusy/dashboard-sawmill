import { readFileSync, writeFileSync } from 'fs';
const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

const oldReturn = "return { ukuran, panjang, jo, target, h1, hariIni, realisasi, status };";
const newReturn = "const kekurangan = target > realisasi ? target - realisasi : 0;\n      return { ukuran, panjang, jo, target, h1, hariIni, realisasi, kekurangan, status };";

content = content.replace(oldReturn, newReturn);
writeFileSync(file, content);
