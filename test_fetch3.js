import fetch from 'node-fetch';
import Papa from 'papaparse';
const SPREADSHEET_ID = '1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ';
const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=order%20urgent`;
fetch(url)
  .then(res => res.text())
  .then(csv => {
    const parsed = Papa.parse(csv.trim(), { skipEmptyLines: true });
    console.log(JSON.stringify(parsed.data.slice(0, 10), null, 2));
  })
  .catch(console.error);
