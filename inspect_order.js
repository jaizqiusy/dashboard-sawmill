import fetch from 'node-fetch';
import Papa from 'papaparse';

const SPREADSHEET_ID = '1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ';
const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=order%20urgent`;

fetch(url)
  .then(res => res.text())
  .then(csv => {
    const parsed = Papa.parse(csv.trim(), { skipEmptyLines: true });
    console.log('Total rows:', parsed.data.length);
    console.log('Row 0:', parsed.data[0]?.slice(0, 15));
    console.log('Row 1 (Headers):', parsed.data[1]?.slice(0, 15));
    console.log('Row 2:', parsed.data[2]?.slice(0, 15));
    console.log('Row 3:', parsed.data[3]?.slice(0, 15));
    console.log('Row 4:', parsed.data[4]?.slice(0, 15));
    console.log('Row 5:', parsed.data[5]?.slice(0, 15));
  })
  .catch(console.error);
