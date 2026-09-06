import { readFileSync, writeFileSync } from 'fs';

const file = 'src/components/Pages/LogPage.tsx';
let content = readFileSync(file, 'utf-8');

const stateAnchor = "  const [selectedMesin, setSelectedMesin] = useState<string>('ALL');";
const stateCode = "  const [visibleRows, setVisibleRows] = useState<number>(30);\n" +
                  "  // Reset pagination on filter change\n" +
                  "  useEffect(() => {\n" +
                  "    setVisibleRows(30);\n" +
                  "  }, [selectedDate, selectedShift, selectedMesin, selectedLine]);";

content = content.replace(stateAnchor, stateAnchor + "\n" + stateCode);

content = content.replace(
  "filteredData.map((log, i) => (",
  "filteredData.slice(0, visibleRows).map((log, i) => ("
);

const tableEnd = "            </tbody>\n          </table>\n        </div>\n      </div>";
const tableButton = "            </tbody>\n          </table>\n" +
                    "          {filteredData.length > visibleRows && (\n" +
                    "            <div className=\"p-4 text-center border-t border-slate-100\">\n" +
                    "              <button onClick={() => setVisibleRows(v => v + 50)} className=\"px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors\">\n" +
                    "                Tampilkan Lebih Banyak\n" +
                    "              </button>\n" +
                    "            </div>\n" +
                    "          )}\n" +
                    "        </div>\n      </div>";

content = content.replace(tableEnd, tableButton);

writeFileSync(file, content);
