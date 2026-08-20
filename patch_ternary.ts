import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '          </div>\n        ) : (\n          /* View Mode 2: Detailed Line-By-Line Table View */',
  '          </div>\n        ) : viewMode === \\'table\\' ? (\n          /* View Mode 2: Detailed Line-By-Line Table View */'
);

fs.writeFileSync(path, code);
