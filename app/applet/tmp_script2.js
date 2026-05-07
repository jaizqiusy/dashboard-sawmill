import fs from 'fs';

const parseLine = (line) => {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuotes = !inQuotes;
        if (line[i] === ',' && !inQuotes) {
        result.push(line.substring(start, i));
        start = i + 1;
        }
    }
    result.push(line.substring(start));
    return result.map(v => v.replace(/^"|"$/g, '').trim());
};

fetch('https://docs.google.com/spreadsheets/d/1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ/export?format=csv&gid=0')
  .then(res => res.text())
  .then(text => {
    const firstLine = text.split('\n')[1]; // Data line 1
    console.log(firstLine);
    console.log(parseLine(firstLine));
  });
