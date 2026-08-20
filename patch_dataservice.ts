import fs from 'fs';

const path = 'src/services/dataService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "komposisiPanjangLog: values[17] || ''",
  "komposisiPanjangLog: values[17] || '',\n        potUjung: values[18] || '',\n        fotoBahanBaku1: values[19] || '',\n        fotoBahanBaku2: values[20] || '',\n        fotoBahanBaku3: values[21] || ''"
);

fs.writeFileSync(path, code);
