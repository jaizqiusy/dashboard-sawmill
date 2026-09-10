import fetch from 'node-fetch';
import Papa from 'papaparse';

const SPREADSHEET_ID = '1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ';
const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=order%20urgent`;

fetch(url)
  .then(res => res.text())
  .then(csv => {
    const parsed = Papa.parse(csv.trim(), { skipEmptyLines: true });
    const rows = parsed.data;
    if (rows.length < 2) return;
    
    const headers = rows[1];
    let dateCols = [];
    for (let i = 5; i < headers.length; i++) {
      if (headers[i] && headers[i].trim() !== '') {
        dateCols.push({ index: i, title: headers[i].trim() });
      } else {
        break; // Hit empty header (Total Realisasi)
      }
    }
    
    const hariIniCol = dateCols.length > 0 ? dateCols[dateCols.length - 1] : null;
    const h1Col = dateCols.length > 1 ? dateCols[dateCols.length - 2] : null;
    
    console.log('Hari Ini:', hariIniCol);
    console.log('H-1:', h1Col);
    
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
    
    console.log(mapped.slice(0, 10));
  })
  .catch(console.error);
