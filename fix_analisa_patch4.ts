import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/AnalisaOperatorPage.tsx';
let content = readFileSync(file, 'utf-8');

const mapHook = "  const detailDataMap = useMemo(() => {\n" +
                "    const map = new Map<string, any>();\n" +
                "    filteredDetailData.forEach(d => map.set(`${d.tanggal}_${d.mesin}`, d));\n" +
                "    return map;\n" +
                "  }, [filteredDetailData]);\n\n";

// We want to insert it AFTER filteredDetailData block
// Find the end of filteredDetailData hook.
// It ends with: "  }, [detailData, matrixWeekData.dates, selectedWeek, selectedMonth, selectedDate, selectedMachine]);"

const anchor = "  }, [detailData, matrixWeekData.dates, selectedWeek, selectedMonth, selectedDate, selectedMachine]);\n";

content = content.replace(anchor, anchor + "\n" + mapHook);

writeFileSync(file, content);
