import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/AnalisaOperatorPage.tsx';
let content = readFileSync(file, 'utf-8');

const mapHook = "  const detailDataMap = useMemo(() => {\n" +
                "    const map = new Map<string, any>();\n" +
                "    filteredDetailData.forEach(d => map.set(`${d.tanggal}_${d.mesin}`, d));\n" +
                "    return map;\n" +
                "  }, [filteredDetailData]);\n\n";

content = content.replace(mapHook, ""); // remove it from current position

const targetHook = "  const filteredData = useMemo(() => {";
content = content.replace(targetHook, mapHook + targetHook);

writeFileSync(file, content);
