import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDetailData.length > 0 ? (
                filteredDetailData.map((d, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs hover:border-sky-300 transition-colors">
                    <div className="flex justify-between items-center mb-1 border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDateShort(d.tanggal)}</span>
                      <span className="text-[11px] font-bold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full shadow-xs">{d.mesin}</span>
                    </div>
                    
                    {d.rkOrderan && (
                      <div className="flex flex-col mt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">RK / Orderan</span>
                        <span className="text-sm font-semibold text-slate-700">{d.rkOrderan}</span>
                      </div>
                    )}
                    
                    {d.komposisiLog && (
                      <div className="flex flex-col mt-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Komposisi Log</span>
                        <span className="text-xs font-medium text-slate-600 bg-white p-2 rounded-lg border border-slate-100">{d.komposisiLog}</span>
                      </div>
                    )}
                    
                    {d.komposisiDiameterLog && (
                      <div className="flex flex-col mt-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Komposisi Diameter Log</span>
                        <span className="text-xs font-medium text-slate-600 bg-white p-2 rounded-lg border border-slate-100">{d.komposisiDiameterLog}</span>
                      </div>
                    )}
                    
                    {d.komposisiPanjangLog && (
                      <div className="flex flex-col mt-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Komposisi Panjang Log</span>
                        <span className="text-xs font-medium text-slate-600 bg-white p-2 rounded-lg border border-slate-100">{d.komposisiPanjangLog}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 col-span-full text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                  <span className="text-slate-400 text-sm font-medium">Tidak ada data detail untuk filter yang dipilih</span>
                </div>
              )}
            </div>`;

const newTable = `            <div className="overflow-x-auto w-full border border-slate-300">
              <table className="w-full text-xs text-left border-collapse min-w-[1500px]">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300 text-center whitespace-nowrap">Tanggal</th>
                    <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300 text-center whitespace-nowrap">Mesin</th>
                    <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300 text-center whitespace-nowrap">% Utama</th>
                    <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300 text-center whitespace-nowrap">% Total</th>
                    <th className="px-3 py-2 font-bold text-slate-700 border border-slate-300 text-center min-w-[200px]">Catatan</th>
                    <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300 text-center whitespace-nowrap">Akumulasi % Utama</th>
                    <th className="px-2 py-2 font-bold text-slate-700 border border-slate-300 text-center whitespace-nowrap">Akumulasi % Total</th>
                    <th className="px-3 py-2 font-bold text-slate-700 border border-slate-300 text-center min-w-[150px]">RK / Orderan</th>
                    <th className="px-3 py-2 font-bold text-slate-700 border border-slate-300 text-center min-w-[150px]">Komposisi Log</th>
                    <th className="px-3 py-2 font-bold text-slate-700 border border-slate-300 text-center min-w-[200px]">Komposisi Diameter Log</th>
                    <th className="px-3 py-2 font-bold text-slate-700 border border-slate-300 text-center min-w-[200px]">Komposisi Panjang Log</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredData.length > 0 ? (
                    filteredData.map((row, idx) => {
                      const d = filteredDetailData.find(detail => detail.tanggal === row.tanggal && detail.mesin === row.mesin);
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-2 py-2 text-slate-600 font-medium border border-slate-300 text-center whitespace-nowrap">
                            {formatDateShort(row.tanggal)}
                          </td>
                          <td className="px-2 py-2 text-slate-700 font-bold border border-slate-300 text-center whitespace-nowrap">
                            {row.mesin}
                          </td>
                          <td className={\`px-2 py-2 font-bold text-center border border-slate-300 \${getColorClass(row.yieldUtama, 'utama')}\`}>
                            {formatPercent(row.yieldUtama)}
                          </td>
                          <td className={\`px-2 py-2 font-bold text-center border border-slate-300 \${getColorClass(row.yieldTotal, 'total')}\`}>
                            {formatPercent(row.yieldTotal)}
                          </td>
                          <td className="px-3 py-2 text-slate-600 border border-slate-300 whitespace-pre-line text-[11px]">
                            {row.catatan || '-'}
                          </td>
                          <td className="px-2 py-2 font-bold text-indigo-700 text-center border border-slate-300">
                            {formatPercent(row.akumulasiUtama)}
                          </td>
                          <td className="px-2 py-2 font-bold text-teal-700 text-center border border-slate-300">
                            {formatPercent(row.akumulasiTotal)}
                          </td>
                          <td className="px-3 py-2 text-slate-700 border border-slate-300 whitespace-pre-line text-[11px]">
                            {d?.rkOrderan || '-'}
                          </td>
                          <td className="px-3 py-2 text-slate-700 border border-slate-300 whitespace-pre-line text-[11px]">
                            {d?.komposisiLog || '-'}
                          </td>
                          <td className="px-3 py-2 text-slate-700 border border-slate-300 whitespace-pre-line text-[11px]">
                            {d?.komposisiDiameterLog || '-'}
                          </td>
                          <td className="px-3 py-2 text-slate-700 border border-slate-300 whitespace-pre-line text-[11px]">
                            {d?.komposisiPanjangLog || '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="px-6 py-8 text-center text-slate-500 font-medium border border-slate-300">
                        Tidak ada data untuk filter yang dipilih
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newTable);
  fs.writeFileSync(path, code);
  console.log('Patched successfully');
} else {
  console.log('Target string not found, falling back to regex replacement');
  // Fallback if formatting doesn't exactly match
  const fallbackMatch = /<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">[\s\S]*?<\/div>\s*<\/div>\s*\)\s*:\s*null}/;
  if(code.match(fallbackMatch)) {
      console.log('Found with fallback');
      code = code.replace(fallbackMatch, newTable + '\n          </div>\n        ) : null}');
      fs.writeFileSync(path, code);
  } else {
      console.log('Still not found');
  }
}
