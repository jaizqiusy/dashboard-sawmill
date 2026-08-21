import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// We need to replace the mapping of dates in the headers, and the mapping of dayCells in the body.
// To do this safely, we can replace instances of `matrixWeekData.dates.map` with `selectedWeek !== 'all' && matrixWeekData.dates.map` 
// and `row.dayCells.map` with `selectedWeek !== 'all' && row.dayCells.map`
// Wait, we need to be careful about JSX wrapping.
// Actually, it's already inside `{ ... }`, so `{selectedWeek !== 'all' && matrixWeekData.dates.map(...)}` will work.
// Let's do string replacement.

code = code.replace(
  /\\{matrixWeekData\\.dates\\.map\\(\\(dStr, idx\\) => \\{/g, 
  '{selectedWeek !== \\'all\\' && matrixWeekData.dates.map((dStr, idx) => {'
);

code = code.replace(
  /\\{matrixWeekData\\.dates\\.map\\(\\(dStr, idx\\) => \\(/g, 
  '{selectedWeek !== \\'all\\' && matrixWeekData.dates.map((dStr, idx) => ('
);

code = code.replace(
  /\\{row\\.dayCells\\.map\\(\\(cell, cIdx\\) => \\{/g, 
  '{selectedWeek !== \\'all\\' && row.dayCells.map((cell, cIdx) => {'
);

fs.writeFileSync(path, code);
