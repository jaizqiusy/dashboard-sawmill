import fs from 'fs';
fetch('https://docs.google.com/spreadsheets/d/1G7x3dtE2KFF338w6qdd4jrMkz-yrbThlzx5Vi0I8AqQ/export?format=csv&gid=0')
  .then(res => res.text())
  .then(text => console.log(text.substring(0, 1000)));
