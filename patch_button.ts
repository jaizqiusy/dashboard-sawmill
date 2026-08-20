import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

const detailAndCatatanButton = `              <button
                onClick={() => setViewMode('table')}
                className={\`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all \${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }\`}
              >
                <LayoutList className="w-4 h-4" />
                Tampilan Detail & Catatan
              </button>`;

const newDataDetailButton = `
              <button
                onClick={() => setViewMode('detail')}
                className={\`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all \${
                  viewMode === 'detail'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }\`}
              >
                <LayoutList className="w-4 h-4" />
                Tampilan Data Detail
              </button>`;

code = code.replace(detailAndCatatanButton, detailAndCatatanButton + newDataDetailButton);

fs.writeFileSync(path, code);
