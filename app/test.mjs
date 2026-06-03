import fs from 'fs';
async function run() {
    const res = await fetch('https://docs.google.com/spreadsheets/d/1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ/export?format=csv&gid=1352797868');
    const text = await res.text();
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        console.log(`Line ${i}:`, lines[i].substring(0, 500));
    }
}
run();
