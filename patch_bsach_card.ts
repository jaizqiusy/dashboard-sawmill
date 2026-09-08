import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/BsAchievementUpdate.tsx';
let content = readFileSync(file, 'utf-8');

const oldCard = `<div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:bg-slate-100/50 transition-colors flex flex-col justify-between">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Lokal</p>
                        <p className="text-2xl font-black text-slate-800">{statsBS.summary.lokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs text-slate-400 font-bold">M³</span></p>
                    </div>`;

const newCard = `<div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:bg-slate-100/50 transition-colors flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-full blur-xl -mr-8 -mt-8" />
                        <div className="flex justify-between items-start mb-2 relative z-10">
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Lokal</p>
                           <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">{!isNaN(statsBS.summary.yieldLokal) ? statsBS.summary.yieldLokal.toFixed(1) : "0.0"}%</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800 relative z-10">{statsBS.summary.lokal.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs text-slate-400 font-bold">M³</span></p>
                    </div>`;

content = content.replace(oldCard, newCard);

writeFileSync(file, content);
