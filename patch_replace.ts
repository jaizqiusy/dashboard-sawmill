import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes(') : viewMode === \\'detail\\' ? ('));
if (startIdx !== -1) {
    // Find the first </table> before it
    let tableEndIdx = startIdx;
    while(tableEndIdx > 0 && !lines[tableEndIdx].includes('</table>')) {
        tableEndIdx--;
    }
    // So between tableEndIdx and startIdx we should just have `</div></div>) : viewMode === 'detail' ? (`
    const newLines = lines.slice(0, tableEndIdx + 1);
    newLines.push('            </div>');
    newLines.push('          </div>');
    newLines.push("        ) : viewMode === 'detail' ? (");
    newLines.push(...lines.slice(startIdx + 1));
    fs.writeFileSync(path, newLines.join('\n'));
} else {
    // find ') : viewMode === "detail" ? ('
    const startIdx2 = lines.findIndex(l => l.includes(") : viewMode === 'detail' ? ("));
    if (startIdx2 !== -1) {
        let tableEndIdx = startIdx2;
        while(tableEndIdx > 0 && !lines[tableEndIdx].includes('</table>')) {
            tableEndIdx--;
        }
        const newLines = lines.slice(0, tableEndIdx + 1);
        newLines.push('            </div>');
        newLines.push('          </div>');
        newLines.push("        ) : viewMode === 'detail' ? (");
        newLines.push(...lines.slice(startIdx2 + 1));
        fs.writeFileSync(path, newLines.join('\n'));
    }
}
