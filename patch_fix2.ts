import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// replace </div></div></div> with </div></div>
code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\)\s*:\s*viewMode\s*===\s*'detail'\s*\?\s*\(/, '</div>\n          </div>\n        ) : viewMode === \\'detail\\' ? (');

fs.writeFileSync(path, code);
