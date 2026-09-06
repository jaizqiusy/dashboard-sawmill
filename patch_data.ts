import { readFileSync, writeFileSync } from 'fs';

const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

// Remove static import
content = content.replace(
  "import { STATIC_ANALISA_OPERATOR_DATA, STATIC_ANALISA_OPERATOR_DETAIL } from '../data/staticAnalisaOperatorData';",
  ""
);

content = content.replace(
`    if (prodData.length > 0) {
      const map = new Map<string, ProductionData>();
      STATIC_ANALISA_OPERATOR_DATA.forEach(d => {
        const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
        map.set(key, d);
      });
      prodData.forEach(d => {
        const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
        map.set(key, d);
      });
      return Array.from(map.values());
    }
  } catch (error) {
    console.error('Error fetching analisa operator data:', error);
  }

  return STATIC_ANALISA_OPERATOR_DATA;`,
`    if (prodData.length > 0) {
      const { STATIC_ANALISA_OPERATOR_DATA } = await import('../data/staticAnalisaOperatorData');
      const map = new Map<string, ProductionData>();
      STATIC_ANALISA_OPERATOR_DATA.forEach((d: any) => {
        const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
        map.set(key, d);
      });
      prodData.forEach(d => {
        const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
        map.set(key, d);
      });
      return Array.from(map.values());
    }
  } catch (error) {
    console.error('Error fetching analisa operator data:', error);
  }

  const { STATIC_ANALISA_OPERATOR_DATA } = await import('../data/staticAnalisaOperatorData');
  return STATIC_ANALISA_OPERATOR_DATA;`
);

content = content.replace(
`export async function fetchAnalisaOperatorData(): Promise<ProductionData[]> {
  const fsData = await fetchChunkedData<ProductionData>('analisaOperatorData');
  if (fsData && fsData.length > 0 && fsData.some(d => d.month === 8)) {
    const map = new Map<string, ProductionData>();
    STATIC_ANALISA_OPERATOR_DATA.forEach(d => {
      const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
      map.set(key, d);
    });
    fsData.forEach(d => {
      const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
      map.set(key, d);
    });
    return Array.from(map.values());
  }
  return fetchAnalisaOperatorDataFromSheet();
}`,
`export async function fetchAnalisaOperatorData(): Promise<ProductionData[]> {
  const fsData = await fetchChunkedData<ProductionData>('analisaOperatorData');
  if (fsData && fsData.length > 0 && fsData.some(d => d.month === 8)) {
    const { STATIC_ANALISA_OPERATOR_DATA } = await import('../data/staticAnalisaOperatorData');
    const map = new Map<string, ProductionData>();
    STATIC_ANALISA_OPERATOR_DATA.forEach((d: any) => {
      const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
      map.set(key, d);
    });
    fsData.forEach(d => {
      const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
      map.set(key, d);
    });
    return Array.from(map.values());
  }
  return fetchAnalisaOperatorDataFromSheet();
}`
);

writeFileSync(file, content);
