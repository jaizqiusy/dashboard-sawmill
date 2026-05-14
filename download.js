const https = require('https');
const fs = require('fs');

const url = 'https://docs.google.com/spreadsheets/d/1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ/export?format=csv&gid=0';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res2) => {
      let data = '';
      res2.on('data', (chunk) => { data += chunk; });
      res2.on('end', () => {
        fs.writeFileSync('/src/data/raw_data.ts', 'export const RAW_CSV_DATA = `\\n' + data.replace(/`/g, '\\`') + '\\n`;\\n');
        console.log('Done downloading');
      });
    });
  } else {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      fs.writeFileSync('/src/data/raw_data.ts', 'export const RAW_CSV_DATA = `\\n' + data.replace(/`/g, '\\`') + '\\n`;\\n');
      console.log('Done downloading');
    });
  }
});
