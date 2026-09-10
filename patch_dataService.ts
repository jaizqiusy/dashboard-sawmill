import { readFileSync, writeFileSync } from 'fs';
const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

// I will add the function fetchOrderUrgentDataFromSheet at the end of the file.

const newLogic = `
export async function fetchOrderUrgentDataFromSheet(): Promise<{data: any[], dateH1: string, dateHariIni: string}> {
  const url = \`https://docs.google.com/spreadsheets/d/\${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=order%20urgent\`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch order urgent data');
    const csvData = await response.text();
    
    // Parse using Papa since it's already imported in dataService
    const parsed = Papa.parse<string[]>(csvData.trim(), { skipEmptyLines: true });
    const rows = parsed.data;
    if (rows.length < 2) return { data: [], dateH1: '', dateHariIni: '' };
    
    const headers = rows[1];
    let dateCols: {index: number, title: string}[] = [];
    for (let i = 5; i < headers.length; i++) {
      if (headers[i] && headers[i].trim() !== '') {
        dateCols.push({ index: i, title: headers[i].trim() });
      } else {
        break; // Hit empty header (Total Realisasi)
      }
    }
    
    const hariIniCol = dateCols.length > 0 ? dateCols[dateCols.length - 1] : null;
    const h1Col = dateCols.length > 1 ? dateCols[dateCols.length - 2] : null;
    
    const dataRows = rows.slice(2).filter(row => row[1] && row[1].trim() !== '');
    const mapped = dataRows.map(row => {
      const ukuran = row[1];
      const panjang = row[2] || '-';
      const jo = row[3];
      const target = parseInt(row[4] || '0', 10);
      const h1 = h1Col && row[h1Col.index] ? parseInt(row[h1Col.index], 10) : null;
      const hariIni = hariIniCol && row[hariIniCol.index] ? parseInt(row[hariIniCol.index], 10) : null;
      
      const realisasiIdx = dateCols.length > 0 ? dateCols[dateCols.length - 1].index + 1 : 9;
      const statusIdx = realisasiIdx + 1;
      
      const realisasi = parseInt(row[realisasiIdx] || '0', 10);
      const statusVal = parseInt(row[statusIdx] || '0', 10);
      const status = statusVal >= 0 ? 'selesai' : 'kurang';
      
      return { ukuran, panjang, jo, target, h1, hariIni, realisasi, status };
    });
    
    return {
      data: mapped,
      dateH1: h1Col ? h1Col.title : 'H-1',
      dateHariIni: hariIniCol ? hariIniCol.title : 'Hari Ini'
    };
  } catch (error) {
    console.warn('Network offline or fetch blocked for order urgent data. Using empty array.');
    return { data: [], dateH1: '', dateHariIni: '' };
  }
}
`;

if (!content.includes('fetchOrderUrgentDataFromSheet')) {
  content += '\n' + newLogic + '\n';
  writeFileSync(file, content);
}
