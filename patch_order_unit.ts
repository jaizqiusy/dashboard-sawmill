import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/OrderPage.tsx';
let content = readFileSync(file, 'utf-8');

// First insert the getUnit helper inside the map
const oldMap = `(activeTab === 'TERKINI' ? filteredData.slice(0, 35) : filteredData).map((row, idx) => (`;
const oldMapAlt = `filteredData.map((row, idx) => (`

// Let's check which map it uses
const isAlt = content.includes('filteredData.map((row, idx) => (');
const targetMap = isAlt ? oldMapAlt : oldMap;

const newMap = `filteredData.map((row, idx) => {
                    const unit = row.jo.toUpperCase().startsWith('FJ-') || row.jo.toUpperCase().includes('FJ-') ? 'M³' : 'BTG';
                    return (`;

if (content.includes(targetMap)) {
    content = content.replace(targetMap, newMap);
}

// Then replace BTG strings
content = content.replace(/>BTG<\/span>/g, '>{unit}</span>');

// And we need to close the curly brace at the end of the map.
// The end of the map is:
//                 ))
//               )}
// Let's replace the ending.

const oldEnd = `                    </tr>
                  ))
                )}`;
const newEnd = `                    </tr>
                  );
                })
                )}`;

if (content.includes(oldEnd)) {
    content = content.replace(oldEnd, newEnd);
} else {
    // try slightly different spacing
    const oldEnd2 = `                    </tr>
                  ))
                )}
              </tbody>`;
    const newEnd2 = `                    </tr>
                  );
                })
                )}
              </tbody>`;
    content = content.replace(oldEnd2, newEnd2);
}

writeFileSync(file, content);
