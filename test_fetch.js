const SPREADSHEET_ID = '1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ';
const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=order%20urgent`;
fetch(url)
  .then(res => res.text())
  .then(csv => console.log(csv.substring(0, 500)))
  .catch(console.error);
