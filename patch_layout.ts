import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '/* View Mode 2: Detailed Line-By-Line Table View */',
  `/* View Mode 2: Detailed Line-By-Line Table View */
          <div className="flex flex-col xl:flex-row items-start gap-4">`
);

code = code.replace(
  '<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-4">',
  '<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-4 flex-1 w-full xl:w-auto">'
);

// We need to find the closing div of the table container.
// It ends with:
//               </table>
//             </div>
//           </div>
//         )}
//
//         {/* Dedicated Section: Riwayat & Galeri Foto Catatan Analisa Operator */}

const oldEnd = `              </table>
            </div>
          </div>
        )}

        {/* Dedicated Section: Riwayat & Galeri Foto Catatan Analisa Operator */}`;

const newEnd = `              </table>
            </div>
          </div>

          {/* New Data Detail Box on the right */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-4 w-full xl:w-[350px] shrink-0 flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <LayoutList className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Data Detail
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 max-h-[500px] xl:max-h-[calc(100vh-350px)]">
              {filteredDetailData.length > 0 ? (
                filteredDetailData.map((d, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{formatDateShort(d.tanggal)}</span>
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">{d.mesin}</span>
                    </div>
                    
                    {d.rkOrderan && (
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">RK / Orderan</span>
                        <span className="text-xs font-medium text-slate-700">{d.rkOrderan}</span>
                      </div>
                    )}
                    
                    {d.komposisiLog && (
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Komposisi Log</span>
                        <span className="text-xs font-medium text-slate-700">{d.komposisiLog}</span>
                      </div>
                    )}
                    
                    {d.komposisiDiameterLog && (
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Komposisi Diameter Log</span>
                        <span className="text-xs font-medium text-slate-700">{d.komposisiDiameterLog}</span>
                      </div>
                    )}
                    
                    {d.komposisiPanjangLog && (
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Komposisi Panjang Log</span>
                        <span className="text-xs font-medium text-slate-700">{d.komposisiPanjangLog}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <span className="text-slate-400 text-xs italic">Tidak ada data detail untuk filter yang dipilih</span>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {/* Dedicated Section: Riwayat & Galeri Foto Catatan Analisa Operator */}`;

if (code.includes(oldEnd)) {
  code = code.replace(oldEnd, newEnd);
  console.log("Replaced end successfully");
} else {
  console.log("Could not find oldEnd string exactly. Let me find a subset.");
}

fs.writeFileSync(path, code);
