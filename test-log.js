const fetch = require('node-fetch');
async function checkLog() {
    const url = 'https://docs.google.com/spreadsheets/d/1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ/gviz/tq?tqx=out:csv&sheet=log%20per%20bulan';
    const response = await fetch(url);
    const text = await response.text();
    console.log(text.substring(0, 700));
}
checkLog();
