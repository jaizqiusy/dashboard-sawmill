import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.split("${getColorClass(row.yieldUtama, 'utama')}").join("${row.yieldUtama >= 0.30 ? 'bg-green-500 text-white' : row.yieldUtama > 0 ? 'bg-red-200 text-red-900' : 'text-slate-700'}");
code = code.split("${getColorClass(row.yieldTotal, 'total')}").join("${row.yieldTotal >= 0.70 ? 'bg-emerald-200 text-emerald-900' : row.yieldTotal > 0 ? 'bg-orange-200 text-orange-900' : 'text-slate-700'}");

fs.writeFileSync(path, code);
