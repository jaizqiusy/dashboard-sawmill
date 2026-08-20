import fs from 'fs';

const path = 'src/services/dataService.ts';
let code = fs.readFileSync(path, 'utf8');

// Add to syncSpreadsheetToFirestore
code = code.replace(
  "await saveInChunks('monthlyLog', monthly, onProgress);",
  "await saveInChunks('monthlyLog', monthly, onProgress);\n\n    if (onProgress) onProgress('Fetching Analisa Operator Detail from Sheet...');\n    const analisaDetail = await fetchAnalisaOperatorDetailDataFromSheet();\n    await saveInChunks('analisaOperatorDetail', analisaDetail, onProgress);"
);

fs.writeFileSync(path, code);
