import fs from 'fs';

const path = 'src/services/dataService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `export async function autoSyncSpreadsheetUpdates(
  currentProd: ProductionData[], 
  currentSupp: SupplierData[], 
  currentMonth: MonthlyLogData[], 
  currentOp: OperatorData[],
  onUpdateDetected: (prod: ProductionData[], supp: SupplierData[], month: MonthlyLogData[], op: OperatorData[]) => void
)`,
  `export async function autoSyncSpreadsheetUpdates(
  currentProd: ProductionData[], 
  currentSupp: SupplierData[], 
  currentMonth: MonthlyLogData[], 
  currentOp: OperatorData[],
  currentAnalisaDetail: import('../types').AnalisaOperatorDetailData[],
  onUpdateDetected: (prod: ProductionData[], supp: SupplierData[], month: MonthlyLogData[], op: OperatorData[], analisaDetail: import('../types').AnalisaOperatorDetailData[]) => void
)`
);

code = code.replace(
  `const [newProd, newSupp, newMonth, newOp] = await Promise.all([
      fetchProductionDataFromSheet(),
      fetchSupplierDataFromSheet(),
      fetchMonthlyLogDataFromSheet(),
      fetchOperatorDataFromSheet()
    ]);`,
  `const [newProd, newSupp, newMonth, newOp, newAnalisaDetail] = await Promise.all([
      fetchProductionDataFromSheet(),
      fetchSupplierDataFromSheet(),
      fetchMonthlyLogDataFromSheet(),
      fetchOperatorDataFromSheet(),
      fetchAnalisaOperatorDetailDataFromSheet()
    ]);`
);

code = code.replace(
  `JSON.stringify(currentOp) !== JSON.stringify(newOp);`,
  `JSON.stringify(currentOp) !== JSON.stringify(newOp) ||
      JSON.stringify(currentAnalisaDetail) !== JSON.stringify(newAnalisaDetail);`
);

code = code.replace(
  `onUpdateDetected(newProd, newSupp, newMonth, newOp);`,
  `onUpdateDetected(newProd, newSupp, newMonth, newOp, newAnalisaDetail);`
);

code = code.replace(
  `await saveInChunks('monthlyLog', newMonth);`,
  `await saveInChunks('monthlyLog', newMonth);
      await saveInChunks('analisaOperatorDetail', newAnalisaDetail);`
);

fs.writeFileSync(path, code);
