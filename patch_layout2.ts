import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// We currently have:
//               </table>
//             </div>
//           </div>
// 
//           {/* New Data Detail Box on the right */}
//           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-4 w-full xl:w-[350px] shrink-0 flex flex-col gap-3 h-full">

// The user wants a new tab, so we don't display the "Data Detail" box when in 'table' mode. Instead we show it in 'detail' mode.

const oldDetailBox = `          {/* New Data Detail Box on the right */}
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
          </div>`;

code = code.replace(oldDetailBox, '');

code = code.replace(
  '<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-4 flex-1 w-full xl:w-auto">',
  '<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-4">'
);

code = code.replace(
  '/* View Mode 2: Detailed Line-By-Line Table View */\n          <div className="flex flex-col xl:flex-row items-start gap-4">',
  '/* View Mode 2: Detailed Line-By-Line Table View */'
);

const newDetailView = `          </div>
        ) : viewMode === 'detail' ? (
          /* View Mode 3: Data Detail View */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-4">
            <div className="grid grid-cols-2 gap-2.5 w-full sm:flex sm:flex-row sm:w-auto">
              <div className="flex flex-col gap-1 w-full sm:w-44">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="all">Semua Tanggal</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>{formatDateShort(d)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-44">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Mesin</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="all">Semua Mesin</option>
                  {availableMachines.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            </div>
`;

code = code.replace('          </div>\n        )}', newDetailView + '          </div>\n        )}');

fs.writeFileSync(path, code);
