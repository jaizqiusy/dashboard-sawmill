const fs = require('fs');
let code = fs.readFileSync('src/components/Pages/AnalisaOperatorPage.tsx', 'utf8');

code = code.replace(
  "{canEditNotes && (\n                {/* Note Input Bar */}\n                <div",
  "{canEditNotes && (\n                <div"
);

fs.writeFileSync('src/components/Pages/AnalisaOperatorPage.tsx', code);
