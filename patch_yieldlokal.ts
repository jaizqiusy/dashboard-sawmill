import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/PerformancePage.tsx';
let content = readFileSync(file, 'utf-8');

// Replace the division by periodInput calculation with one based strictly on data returned in parseCSV
// Because Lokal Super is 0 or undefined in ProductionData from database apps script.

const oldLine = "const periodYieldLokal = periodInput > 0 ? (periodData.reduce((sum, item) => sum + (item.lokalSuper + item.lokal), 0) / periodInput) * 100 : 0;";
const newLine = "const periodYieldLokal = periodInput > 0 ? (periodData.reduce((sum, item) => sum + (item.lokal || 0), 0) / periodInput) * 100 : 0;";

content = content.replace(oldLine, newLine);

writeFileSync(file, content);
