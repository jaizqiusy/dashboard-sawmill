import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/BsAchievementUpdate.tsx';
let content = readFileSync(file, 'utf-8');

// 1. Add yieldLokal calculation
content = content.replace(
  "const yieldTurunan = totalInput > 0 ? (totalTurunan / totalInput) * 100 : 0;",
  "const yieldTurunan = totalInput > 0 ? (totalTurunan / totalInput) * 100 : 0;\n    const yieldLokal = totalInput > 0 ? (totalLokal / totalInput) * 100 : 0;"
);

// 2. Add to summary object
content = content.replace(
  "lokal: totalLokal,",
  "lokal: totalLokal,\n        yieldLokal: yieldLokal,"
);

// 3. Add to detail calculation
content = content.replace(
  "const yieldT = m.input > 0 ? (m.turunan / m.input) * 100 : 0;",
  "const yieldT = m.input > 0 ? (m.turunan / m.input) * 100 : 0;\n        const yieldL = m.input > 0 ? (m.lokal / m.input) * 100 : 0;"
);

// 4. Add to detail return object
content = content.replace(
  "yieldTurunan: yieldT,",
  "yieldTurunan: yieldT,\n            yieldLokal: yieldL,"
);

// 5. Add Table Header
content = content.replace(
  '<th className="py-5 px-4 font-extrabold text-[#475569] text-right uppercase tracking-wider">LOKAL (M³)</th>',
  '<th className="py-5 px-4 font-extrabold text-[#475569] text-right uppercase tracking-wider">LOKAL (M³)</th>\n                                <th className="py-5 px-4 font-extrabold text-[#475569] text-center uppercase tracking-wider">RENDEMEN<br/>LOKAL (%)</th>'
);

// 6. Add Table Cell
content = content.replace(
  '<td className="py-5 px-4 font-bold text-slate-800 text-right text-sm sm:text-base">{m.lokal.toLocaleString(\'id-ID\', { maximumFractionDigits: 1 })}</td>',
  '<td className="py-5 px-4 font-bold text-slate-800 text-right text-sm sm:text-base">{m.lokal.toLocaleString(\'id-ID\', { maximumFractionDigits: 1 })}</td>\n                                    <td className="py-5 px-4 text-center font-bold text-slate-800 text-sm sm:text-base">\n                                        {m.yieldLokal.toLocaleString(\'id-ID\', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%\n                                    </td>'
);

writeFileSync(file, content);
