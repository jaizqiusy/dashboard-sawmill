import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');",
  "const [viewMode, setViewMode] = useState<'matrix' | 'table' | 'detail'>('matrix');"
);

fs.writeFileSync(path, code);
