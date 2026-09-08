import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/PerformancePage.tsx';
let content = readFileSync(file, 'utf-8');

// 1. Add periodYieldLokal calculation
content = content.replace(
  "const periodYieldSecondary = periodInput > 0 ? (periodTurunan / periodInput) * 100 : 0;",
  "const periodYieldSecondary = periodInput > 0 ? (periodTurunan / periodInput) * 100 : 0;\n      const periodYieldLokal = periodInput > 0 ? (periodData.reduce((sum, item) => sum + (item.lokalSuper + item.lokal), 0) / periodInput) * 100 : 0;"
);

// 2. Add it to return object
content = content.replace(
  "periodYieldSecondary,",
  "periodYieldSecondary,\n        periodYieldLokal,"
);

// 3. Add column header
content = content.replace(
  '<th className="py-4 px-4 font-semibold text-center">REND. TURUNAN</th>',
  '<th className="py-4 px-4 font-semibold text-center">REND. TURUNAN</th>\n                <th className="py-4 px-4 font-semibold text-center">REND. LOKAL</th>'
);

// 4. Add cell
content = content.replace(
  '<td className="py-4 px-4 text-center text-slate-600">{row.periodYieldSecondary.toFixed(1)}%</td>',
  '<td className="py-4 px-4 text-center text-slate-600">{row.periodYieldSecondary.toFixed(1)}%</td>\n                  <td className="py-4 px-4 text-center text-slate-600">{row.periodYieldLokal.toFixed(1)}%</td>'
);

writeFileSync(file, content);
