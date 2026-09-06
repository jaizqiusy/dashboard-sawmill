import { readFileSync, writeFileSync } from 'fs';

const file = 'src/components/Pages/AnalisaOperatorPage.tsx';
let content = readFileSync(file, 'utf-8');

// I'll add a state for visible rows.
// And a button to load more.

const stateAnchor = "  const [selectedMachine, setSelectedMachine] = useState<string>('all');";
const stateCode = "  const [visibleRows, setVisibleRows] = useState<number>(30);\n" +
                  "  const [visibleDetailRows, setVisibleDetailRows] = useState<number>(30);\n" +
                  "  // Reset pagination on filter change\n" +
                  "  useEffect(() => {\n" +
                  "    setVisibleRows(30);\n" +
                  "    setVisibleDetailRows(30);\n" +
                  "  }, [selectedMonth, selectedWeek, selectedDate, selectedMachine]);";

content = content.replace(stateAnchor, stateAnchor + "\n" + stateCode);

// Table 1: line 1396
content = content.replace(
  "filteredData.map((row, i) => (",
  "filteredData.slice(0, visibleRows).map((row, i) => ("
);

// Add button for Table 1
const table1End = "                </tbody>\n              </table>\n            </div>";
const table1Button = "                </tbody>\n              </table>\n" +
                     "              {filteredData.length > visibleRows && (\n" +
                     "                <div className=\"p-4 text-center border-t border-slate-100\">\n" +
                     "                  <button onClick={() => setVisibleRows(v => v + 50)} className=\"px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors\">\n" +
                     "                    Tampilkan Lebih Banyak\n" +
                     "                  </button>\n" +
                     "                </div>\n" +
                     "              )}\n" +
                     "            </div>";
content = content.replace(table1End, table1Button);


// Table 2: line 1515
content = content.replace(
  "filteredData.map((row, idx) => {",
  "filteredData.slice(0, visibleDetailRows).map((row, idx) => {"
);

const table2End = "                </tbody>\n              </table>\n            </div>\n          </div>\n        </div>";
const table2Button = "                </tbody>\n              </table>\n" +
                     "              {filteredData.length > visibleDetailRows && (\n" +
                     "                <div className=\"p-4 text-center border-t border-slate-200\">\n" +
                     "                  <button onClick={() => setVisibleDetailRows(v => v + 50)} className=\"px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors\">\n" +
                     "                    Tampilkan Lebih Banyak\n" +
                     "                  </button>\n" +
                     "                </div>\n" +
                     "              )}\n" +
                     "            </div>\n          </div>\n        </div>";

content = content.replace(table2End, table2Button);

writeFileSync(file, content);
