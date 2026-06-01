const fetch = require('node-fetch');
async function run() {
    const res = await fetch('https://docs.google.com/spreadsheets/d/1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ/gviz/tq?tqx=out:csv&sheet=log%20per%20bulan');
    const text = await res.text();
    console.log(text.substring(0, 500));
}
run();
