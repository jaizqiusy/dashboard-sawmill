import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/BsAchievementUpdate.tsx';
let content = readFileSync(file, 'utf-8');

content = content.replace(
  "{m.yieldLokal.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%",
  "{!isNaN(m.yieldLokal) ? m.yieldLokal.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0'}%"
);

writeFileSync(file, content);
