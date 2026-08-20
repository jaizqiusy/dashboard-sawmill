import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

const thOriginal = '<th className="px-3 py-2 font-bold text-slate-700 border border-slate-300 text-center min-w-[200px]">Komposisi Panjang Log</th>';
const thReplacement = `<th className="px-3 py-2 font-bold text-slate-700 border border-slate-300 text-center min-w-[200px]">Komposisi Panjang Log</th>
                    <th className="px-3 py-2 font-bold text-slate-700 border border-slate-300 text-center min-w-[120px]">Pot Ujung (pot C sd G)</th>
                    <th className="px-3 py-2 font-bold text-slate-700 border border-slate-300 text-center min-w-[150px]">Foto Bahan Baku</th>
                    <th className="px-3 py-2 font-bold text-slate-700 border border-slate-300 text-center min-w-[150px]">Foto Bahan Baku</th>
                    <th className="px-3 py-2 font-bold text-slate-700 border border-slate-300 text-center min-w-[150px]">Foto Bahan Baku</th>`;

const tdOriginal = `<td className="px-3 py-2 text-slate-700 border border-slate-300 whitespace-pre-line text-[11px]">
                            {d?.komposisiPanjangLog || '-'}
                          </td>`;
const tdReplacement = `<td className="px-3 py-2 text-slate-700 border border-slate-300 whitespace-pre-line text-[11px]">
                            {d?.komposisiPanjangLog || '-'}
                          </td>
                          <td className="px-3 py-2 text-slate-700 border border-slate-300 text-center text-[11px]">
                            {d?.potUjung || '-'}
                          </td>
                          <td className="px-3 py-2 border border-slate-300 text-center align-middle">
                            {d?.fotoBahanBaku1 && d.fotoBahanBaku1.startsWith('http') ? <img src={d.fotoBahanBaku1} alt="Bahan Baku 1" className="h-20 w-auto object-cover mx-auto rounded shadow-sm border border-slate-200" referrerPolicy="no-referrer" /> : (d?.fotoBahanBaku1 || '-')}
                          </td>
                          <td className="px-3 py-2 border border-slate-300 text-center align-middle">
                            {d?.fotoBahanBaku2 && d.fotoBahanBaku2.startsWith('http') ? <img src={d.fotoBahanBaku2} alt="Bahan Baku 2" className="h-20 w-auto object-cover mx-auto rounded shadow-sm border border-slate-200" referrerPolicy="no-referrer" /> : (d?.fotoBahanBaku2 || '-')}
                          </td>
                          <td className="px-3 py-2 border border-slate-300 text-center align-middle">
                            {d?.fotoBahanBaku3 && d.fotoBahanBaku3.startsWith('http') ? <img src={d.fotoBahanBaku3} alt="Bahan Baku 3" className="h-20 w-auto object-cover mx-auto rounded shadow-sm border border-slate-200" referrerPolicy="no-referrer" /> : (d?.fotoBahanBaku3 || '-')}
                          </td>`;

code = code.replace(thOriginal, thReplacement);
code = code.replace(tdOriginal, tdReplacement);

fs.writeFileSync(path, code);
