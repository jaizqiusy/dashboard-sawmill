import { readFileSync, writeFileSync } from 'fs';

const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

content = content.replace(
`    if (detailData.length > 0) {
      const map = new Map<string, AnalisaOperatorDetailData>();
      STATIC_ANALISA_OPERATOR_DETAIL.forEach(d => {
        const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
        map.set(key, d);
      });
      detailData.forEach(d => {
        const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
        map.set(key, d);
      });
      return Array.from(map.values());
    }
  } catch (error) {
    console.error('Error fetching analisa operator detail:', error);
  }

  return STATIC_ANALISA_OPERATOR_DETAIL;`,
`    if (detailData.length > 0) {
      const { STATIC_ANALISA_OPERATOR_DETAIL } = await import('../data/staticAnalisaOperatorData');
      const map = new Map<string, AnalisaOperatorDetailData>();
      STATIC_ANALISA_OPERATOR_DETAIL.forEach((d: any) => {
        const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
        map.set(key, d);
      });
      detailData.forEach(d => {
        const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
        map.set(key, d);
      });
      return Array.from(map.values());
    }
  } catch (error) {
    console.error('Error fetching analisa operator detail:', error);
  }

  const { STATIC_ANALISA_OPERATOR_DETAIL } = await import('../data/staticAnalisaOperatorData');
  return STATIC_ANALISA_OPERATOR_DETAIL;`
);

content = content.replace(
`export async function fetchAnalisaOperatorDetailData(): Promise<AnalisaOperatorDetailData[]> {
  const fsData = await fetchChunkedData<AnalisaOperatorDetailData>('analisaOperatorDetail');
  if (fsData && fsData.length > 0 && fsData.some(d => (d.tanggal || '').includes('2026-08'))) {
    const map = new Map<string, AnalisaOperatorDetailData>();
    STATIC_ANALISA_OPERATOR_DETAIL.forEach(d => {
      const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
      map.set(key, d);
    });
    fsData.forEach(d => {
      const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
      map.set(key, d);
    });
    return Array.from(map.values());
  }
  return fetchAnalisaOperatorDetailDataFromSheet();
}`,
`export async function fetchAnalisaOperatorDetailData(): Promise<AnalisaOperatorDetailData[]> {
  const fsData = await fetchChunkedData<AnalisaOperatorDetailData>('analisaOperatorDetail');
  if (fsData && fsData.length > 0 && fsData.some(d => (d.tanggal || '').includes('2026-08'))) {
    const { STATIC_ANALISA_OPERATOR_DETAIL } = await import('../data/staticAnalisaOperatorData');
    const map = new Map<string, AnalisaOperatorDetailData>();
    STATIC_ANALISA_OPERATOR_DETAIL.forEach((d: any) => {
      const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
      map.set(key, d);
    });
    fsData.forEach(d => {
      const key = \`\${d.tanggal}_\${normalizeMachineName(d.mesin)}\`;
      map.set(key, d);
    });
    return Array.from(map.values());
  }
  return fetchAnalisaOperatorDetailDataFromSheet();
}`
);

writeFileSync(file, content);
