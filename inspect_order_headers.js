import fetch from 'node-fetch';
import Papa from 'papaparse';

const SPREADSHEET_ID = '1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ';
const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=order%20urgent`;

fetch(url)
  .then(res => res.text())
  .then(csv => {
    const parsed = Papa.parse(csv.trim(), { skipEmptyLines: true });
    const headers = parsed.data[1];
    headers.forEach((h, idx) => {
      if (h) console.log(`${idx}: "${h}"`);
    });
    console.log('Sample data row 5:');
    parsed.data[5].forEach((val, idx) => {
      if (val) console.log(`${idx} (${headers[idx] || 'no header'}): "${val}"`);
    });
    console.log('Sample data row 6:');
    parsed.data[6].forEach((val, idx) => {
      if (val) console.log(`${idx} (${headers[idx] || 'no header'}): "${val}"`);
    });
    console.log('Sample data row 7:');
    parsed.data[7].forEach((val, idx) => {
      if (val) console.log(`${idx} (${headers[idx] || 'no header'}): "${val}"`);
    });
  })
  .catch(console.error);
