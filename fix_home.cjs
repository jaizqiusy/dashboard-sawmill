const fs = require('fs');
let code = fs.readFileSync('src/components/Pages/HomePage.tsx', 'utf8');

code = code.replace(
  /                  <button [\s\S]*?<\/button>\s*<\/div>/,
  ""
);

fs.writeFileSync('src/components/Pages/HomePage.tsx', code);
