const fs = require('fs');
let code = fs.readFileSync('src/services/dataService.ts', 'utf8');

// Rename existing fetch functions to fetch...FromSheet
code = code.replace(/export async function fetchProductionData/g, 'export async function fetchProductionDataFromSheet');
code = code.replace(/export async function fetchOperatorData/g, 'export async function fetchOperatorDataFromSheet');
code = code.replace(/export async function fetchSupplierData/g, 'export async function fetchSupplierDataFromSheet');
code = code.replace(/export async function fetchMonthlyLogData/g, 'export async function fetchMonthlyLogDataFromSheet');

// Import firestore stuff
const imports = `
import { db } from '../firebase';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
`;

code = imports + code;

// Add new fetch... functions that read from Firestore
const firestoreFunctions = `
async function fetchChunkedData<T>(collectionName: string): Promise<T[] | null> {
  try {
    const infoDoc = await getDoc(doc(db, 'dashboard_data', collectionName + '_info'));
    if (!infoDoc.exists()) return null;
    
    const numChunks = infoDoc.data().numChunks;
    let allData: T[] = [];
    
    for (let i = 0; i < numChunks; i++) {
      const chunkDoc = await getDoc(doc(db, 'dashboard_data', collectionName + '_chunk_' + i));
      if (chunkDoc.exists()) {
        allData = allData.concat(chunkDoc.data().data);
      }
    }
    return allData.length > 0 ? allData : null;
  } catch (error) {
    console.error('Error reading from Firestore:', error);
    return null;
  }
}

export async function fetchOperatorData(): Promise<OperatorData[]> {
  const fsData = await fetchChunkedData<OperatorData>('operator');
  if (fsData) return fsData;
  return fetchOperatorDataFromSheet();
}

export async function fetchProductionData(): Promise<ProductionData[]> {
  const fsData = await fetchChunkedData<ProductionData>('production');
  if (fsData) return fsData;
  return fetchProductionDataFromSheet();
}

export async function fetchSupplierData(): Promise<SupplierData[]> {
  const fsData = await fetchChunkedData<SupplierData>('supplier');
  if (fsData) return fsData;
  return fetchSupplierDataFromSheet();
}

export async function fetchMonthlyLogData(): Promise<MonthlyLogData[]> {
  const fsData = await fetchChunkedData<MonthlyLogData>('monthlyLog');
  if (fsData) return fsData;
  return fetchMonthlyLogDataFromSheet();
}

export async function syncSpreadsheetToFirestore(onProgress?: (msg: string) => void) {
  const CHUNK_SIZE = 500;
  
  async function saveInChunks(collectionName: string, dataArray: any[]) {
    if (onProgress) onProgress('Saving ' + collectionName + ' (' + dataArray.length + ' rows)...');
    
    const numChunks = Math.ceil(dataArray.length / CHUNK_SIZE);
    
    // Save info doc
    await setDoc(doc(db, 'dashboard_data', collectionName + '_info'), { 
      numChunks, 
      lastUpdated: new Date().toISOString(),
      totalRows: dataArray.length
    });
    
    // We can use a batch for chunks since there are max ~8 chunks (4000 rows / 500)
    // Firestore batch limit is 500 operations. We are doing max 10 operations here.
    const batch = writeBatch(db);
    for (let i = 0; i < numChunks; i++) {
      const chunkData = dataArray.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkRef = doc(db, 'dashboard_data', collectionName + '_chunk_' + i);
      batch.set(chunkRef, { data: chunkData });
    }
    await batch.commit();
  }

  try {
    if (onProgress) onProgress('Fetching Production Data from Sheet...');
    const prod = await fetchProductionDataFromSheet();
    await saveInChunks('production', prod);

    if (onProgress) onProgress('Fetching Operator Data from Sheet...');
    const op = await fetchOperatorDataFromSheet();
    await saveInChunks('operator', op);

    if (onProgress) onProgress('Fetching Supplier Data from Sheet...');
    const supp = await fetchSupplierDataFromSheet();
    await saveInChunks('supplier', supp);

    if (onProgress) onProgress('Fetching Monthly Log Data from Sheet...');
    const monthly = await fetchMonthlyLogDataFromSheet();
    await saveInChunks('monthlyLog', monthly);

    if (onProgress) onProgress('Sync Complete!');
  } catch (error: any) {
    console.error("Sync Error:", error);
    if (onProgress) onProgress('Error: ' + error.message);
    throw error;
  }
}
`;

code = code + '\n' + firestoreFunctions;

fs.writeFileSync('src/services/dataService.ts', code);
