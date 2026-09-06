import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/LogPage.tsx';
let content = readFileSync(file, 'utf-8');

const stateBlock = "  const [visibleRows, setVisibleRows] = useState<number>(30);\n" +
                   "  // Reset pagination on filter change\n" +
                   "  useEffect(() => {\n" +
                   "    setVisibleRows(30);\n" +
                   "  }, [selectedDate, selectedMesin, selectedLine, searchQuery]);";

content = content.replace(stateBlock, ""); // remove from top

const afterLine = "  const [selectedLine, setSelectedLine] = useState<string>('ALL');";
content = content.replace(afterLine, afterLine + "\n\n" + stateBlock);

writeFileSync(file, content);
