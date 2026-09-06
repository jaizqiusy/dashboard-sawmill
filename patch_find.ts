import { readFileSync, writeFileSync } from 'fs';

const file = 'src/components/Pages/AnalisaOperatorPage.tsx';
let content = readFileSync(file, 'utf-8');

// Replace find with Map lookup
const hookAnchor = "  const filteredData = useMemo(() => {";
const mapHook = "  const detailDataMap = useMemo(() => {\n" +
                "    const map = new Map<string, any>();\n" +
                "    filteredDetailData.forEach(d => map.set(`${d.tanggal}_${d.mesin}`, d));\n" +
                "    return map;\n" +
                "  }, [filteredDetailData]);\n\n";

content = content.replace(hookAnchor, mapHook + hookAnchor);

content = content.replace(
  "const d = filteredDetailData.find(detail => detail.tanggal === row.tanggal && detail.mesin === row.mesin);",
  "const d = detailDataMap.get(`${row.tanggal}_${row.mesin}`);"
);

writeFileSync(file, content);
