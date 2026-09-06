import { readFileSync, writeFileSync } from 'fs';

const file = 'src/App.tsx';
let content = readFileSync(file, 'utf-8');

// Remove static import
content = content.replace(
  "import { STATIC_ANALISA_OPERATOR_DATA, STATIC_ANALISA_OPERATOR_DETAIL } from './data/staticAnalisaOperatorData';",
  ""
);

// Modify useState initializers to just return cached or empty array
content = content.replace(
`  const [analisaOperatorDetailData, setAnalisaOperatorDetailData] = useState<AnalisaOperatorDetailData[]>(() => {
    const cached = getLocalCache<AnalisaOperatorDetailData[]>('analisa');
    if (cached && cached.length > 0 && cached.some(d => (d.tanggal || '').includes('2026-08'))) return cached;
    return STATIC_ANALISA_OPERATOR_DETAIL;
  });`,
`  const [analisaOperatorDetailData, setAnalisaOperatorDetailData] = useState<AnalisaOperatorDetailData[]>(() => {
    const cached = getLocalCache<AnalisaOperatorDetailData[]>('analisa');
    if (cached && cached.length > 0 && cached.some(d => (d.tanggal || '').includes('2026-08'))) return cached;
    return [];
  });`
);

content = content.replace(
`  const [analisaOperatorData, setAnalisaOperatorData] = useState<ProductionData[]>(() => {
    const cached = getLocalCache<ProductionData[]>('analisaOpData');
    if (cached && cached.length > 0 && cached.some(d => d.month === 8)) return cached;
    return STATIC_ANALISA_OPERATOR_DATA;
  });`,
`  const [analisaOperatorData, setAnalisaOperatorData] = useState<ProductionData[]>(() => {
    const cached = getLocalCache<ProductionData[]>('analisaOpData');
    if (cached && cached.length > 0 && cached.some(d => d.month === 8)) return cached;
    return [];
  });`
);

writeFileSync(file, content);
