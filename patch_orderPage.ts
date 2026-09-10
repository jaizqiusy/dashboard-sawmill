import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/OrderPage.tsx';
let content = readFileSync(file, 'utf-8');

const oldHeader = `<th className="py-4 px-4 font-black text-indigo-900 text-xs text-center">REALISASI</th>`;
const newHeader = `<th className="py-4 px-4 font-black text-indigo-900 text-xs border-r border-indigo-100/50 text-center">REALISASI</th>
                  <th className="py-4 px-4 font-black text-indigo-900 text-xs text-center">KEKURANGAN</th>`;
content = content.replace(oldHeader, newHeader);

const oldCell = `<td className="py-3 px-4 text-center">
                        <span className="font-black text-[#059669] text-base">{row.realisasi} <span className="text-[9px] text-[#6ee7b7]">BTG</span></span>
                      </td>`;
const newCell = `<td className="py-3 px-4 border-r border-indigo-50 text-center">
                        <span className="font-black text-[#059669] text-base">{row.realisasi} <span className="text-[9px] text-[#6ee7b7]">BTG</span></span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-rose-600 text-base">{row.kekurangan} <span className="text-[9px] text-rose-300">BTG</span></span>
                      </td>`;
content = content.replace(oldCell, newCell);

// Also need to update the colspan for loading/empty states
content = content.replace(`colSpan={7}`, `colSpan={8}`);
content = content.replace(`colSpan={7}`, `colSpan={8}`); // There are two instances

writeFileSync(file, content);
