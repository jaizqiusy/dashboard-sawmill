const fs = require('fs');
let code = fs.readFileSync('src/components/Pages/AnalisaOperatorPage.tsx', 'utf8');

code = code.replace(
  /\{canEditNotes && \(\n\s*\{\/\* Note Input Bar \*\/\}\n\s*<div/g,
  "{canEditNotes && (\n                <div"
);

fs.writeFileSync('src/components/Pages/AnalisaOperatorPage.tsx', code);
