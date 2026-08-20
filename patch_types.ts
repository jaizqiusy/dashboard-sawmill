import fs from 'fs';

const path = 'src/types.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '  komposisiPanjangLog: string;\n}',
  '  komposisiPanjangLog: string;\n  potUjung: string;\n  fotoBahanBaku1: string;\n  fotoBahanBaku2: string;\n  fotoBahanBaku3: string;\n}'
);

fs.writeFileSync(path, code);
