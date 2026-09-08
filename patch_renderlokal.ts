import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/PerformancePage.tsx';
let content = readFileSync(file, 'utf-8');

// The issue is that local output might be zero, or we might be displaying NaN if periodYieldLokal is somehow NaN
// The patch changes row.periodYieldLokal to show cleanly if it's a number, or 0%

content = content.replace(
  '<td className="py-4 px-4 text-center text-slate-600">{row.periodYieldLokal.toFixed(1)}%</td>',
  '<td className="py-4 px-4 text-center text-slate-600">{!isNaN(row.periodYieldLokal) ? row.periodYieldLokal.toFixed(1) : "0.0"}%</td>'
);

writeFileSync(file, content);
